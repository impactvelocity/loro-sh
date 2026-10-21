/**
 * Loro's REST API, under /api. Everything a workspace holds is under
 * /workspaces/:workspace; the routes for each area are in api/. Writes
 * need an API key for that workspace (api/auth.ts); reads and the public
 * experience flow don't. The endpoint list in core/settings.ts mirrors
 * this file and is what Settings shows.
 */
import { Hono } from "hono";
import { z } from "zod";

import { createApiKey } from "@core/api-keys.server";
import { parseConfig } from "@core/catalogue/config";
import { type Catalogue, isGenerated, isInput, partIds } from "@core/catalogue/define";
import { getCatalogue, listCatalogues } from "@core/catalogue/registry";
import { getExperience, listExperiences } from "@core/experiences";
import { NAME_MAX, TAGLINE_MAX } from "@core/workspaces";
import { createWorkspace, findWorkspace, listWorkspaces } from "@core/workspaces.server";
import { agentRoutes } from "./api/agent";
import { adminGate, requireAdmin } from "./api/auth";
import { fileRoutes, skillRoutes, videoRoutes } from "./api/context";
import { experienceRoutes } from "./api/experiences";
import { type ApiEnv, type WorkspaceEnv, errorResponse, notFound, readJson } from "./api/http";
import { generationRoutes, peopleRoutes, segmentRoutes } from "./api/profiles";
import { workspaceRoutes } from "./api/workspace";

/** Routes under /workspaces/:workspace 404 unless the workspace exists. */
const workspace = new Hono<WorkspaceEnv>()
  .use(async (c, next) => {
    const found = await findWorkspace(c.req.param("workspace") ?? "");
    if (!found) throw notFound("Workspace");
    c.set("workspaceId", found.id);
    c.set("workspace", found);
    await next();
  })
  .use(adminGate)
  .route("/", workspaceRoutes)
  .route("/segments", segmentRoutes)
  .route("/people", peopleRoutes)
  .route("/generations", generationRoutes)
  .route("/skills", skillRoutes)
  .route("/files", fileRoutes)
  .route("/videos", videoRoutes)
  .route("/experiences", experienceRoutes)
  .route("/agent", agentRoutes);

/** What a catalogue offers, as data: each part's components and what kind they are. */
function catalogueSummary(catalogue: Catalogue) {
  return {
    id: catalogue.id,
    name: catalogue.name,
    description: catalogue.description,
    theme: catalogue.theme,
    parts: Object.fromEntries(
      partIds.map((part) => [
        part,
        catalogue.parts[part].components.map((definition) => ({
          type: definition.type,
          name: definition.name,
          description: definition.description ?? "",
          kind: isInput(definition) ? "input" : isGenerated(definition) ? "generated" : "static",
          props: Object.keys(definition.fields),
        })),
      ]),
    ),
  };
}

const workspaceInput = z.object({
  name: z.string("Give your workspace a name.").max(NAME_MAX),
  tagline: z.string().max(TAGLINE_MAX).default(""),
  /** Start with the sample profiles, skills, files and analytics. */
  demoData: z.boolean().default(false),
});

export const api = new Hono<ApiEnv>()
  .get("/health", (c) => c.json({ ok: true }))

  // Catalogues: what experiences are built from. One catalogue comes with its example config.
  .get("/catalogues", (c) => c.json({ catalogues: listCatalogues().map(catalogueSummary) }))
  .get("/catalogues/:id", (c) => {
    const catalogue = getCatalogue(c.req.param("id"));
    if (!catalogue) throw notFound("Catalogue");
    return c.json({ catalogue: { ...catalogueSummary(catalogue), example: parseConfig(catalogue, catalogue.example) } });
  })

  // Code experiences in experiences/, with their sample data.
  .get("/experiences", (c) => c.json({ experiences: listExperiences() }))
  .get("/experiences/:slug", (c) => {
    const experience = getExperience(c.req.param("slug"));
    if (!experience) throw notFound("Experience");
    return c.json({ meta: experience.meta, fixture: experience.fixture });
  })

  .get("/workspaces", requireAdmin, async (c) => c.json({ workspaces: await listWorkspaces() }))
  // Open, like the admin's New Workspace (unlocked, with ADMIN_PASSWORD set).
  // Returns its first API key.
  .post("/workspaces", requireAdmin, async (c) => {
    const input = await readJson(c, workspaceInput);
    const id = await createWorkspace({ name: input.name, tagline: input.tagline, seeded: input.demoData });
    const { key, secret } = await createApiKey(id, "Created with the API");
    return c.json({ workspace: await findWorkspace(id), key: { ...key, secret } }, 201);
  })
  .route("/workspaces/:workspace", workspace)

  .notFound((c) => c.json({ error: "Not found" }, 404))
  .onError(errorResponse);

export type Api = typeof api;
