/** One workspace: its settings, API keys, analytics and activity feed. */
import { Hono } from "hono";
import { z } from "zod";

import { latestActivity, getAnalytics } from "@core/analytics.server";
import { parseRange } from "@core/analytics";
import { createApiKey, listApiKeys, revokeApiKey } from "@core/api-keys.server";
import { listFiles } from "@core/files.server";
import { NAME_MAX, TAGLINE_MAX } from "@core/workspaces";
import { deleteWorkspace, findWorkspace, updateWorkspace } from "@core/workspaces.server";
import { requireKey } from "./auth";
import { ApiError, type WorkspaceEnv, notFound, queryInt, readJson } from "./http";

const workspacePatch = z.object({
  name: z.string().max(NAME_MAX).optional(),
  tagline: z.string().max(TAGLINE_MAX).optional(),
  /** One of the workspace's own image URLs, or null for none. */
  cover: z.string().nullable().optional(),
});

export const workspaceRoutes = new Hono<WorkspaceEnv>()
  .get("/", (c) => c.json({ workspace: c.get("workspace") }))
  .patch("/", requireKey, async (c) => {
    const id = c.get("workspaceId");
    const patch = await readJson(c, workspacePatch);
    if (patch.cover) {
      const images = await listFiles(id, "image");
      if (!images.some((image) => image.url === patch.cover)) {
        throw new ApiError(422, "The cover has to be one of the workspace's images.", { cover: "Pick one of the images." });
      }
    }
    await updateWorkspace(id, patch);
    return c.json({ workspace: await findWorkspace(id) });
  })
  .delete("/", requireKey, async (c) => {
    await deleteWorkspace(c.get("workspaceId"));
    return c.body(null, 204);
  })

  // Keys: a key can make and revoke others, so one can be rotated without the admin.
  .get("/keys", requireKey, async (c) => c.json({ keys: await listApiKeys(c.get("workspaceId")) }))
  .post("/keys", requireKey, async (c) => {
    const { name } = await readJson(c, z.object({ name: z.string("Give the key a name.") }));
    return c.json(await createApiKey(c.get("workspaceId"), name), 201);
  })
  .delete("/keys/:id", requireKey, async (c) => {
    if (!(await revokeApiKey(c.get("workspaceId"), c.req.param("id")))) throw notFound("Key");
    return c.body(null, 204);
  })

  // ?range=7d|30d|90d. Daily counts by source, totals, the funnel and the latest activity.
  .get("/analytics", async (c) =>
    c.json({ analytics: await getAnalytics(c.get("workspaceId"), parseRange(c.req.query("range") ?? null), new Date()) }),
  )
  // ?limit=1–100, ?experience=<slug>. Newest first, with names.
  .get("/activity", async (c) =>
    c.json({
      activity: await latestActivity(c.get("workspaceId"), queryInt(c, "limit", 20, 1, 100), c.req.query("experience")),
    }),
  );
