/**
 * Context: skills the workflow follows, and uploaded images, video and
 * audio. Uploads stay open, since the admin posts them from the browser
 * (app/lib/upload.ts); changing or deleting a file needs a key.
 */
import { Hono } from "hono";
import { z } from "zod";

import { DESCRIPTION_MAX, TITLE_MAX, deleteSkill, listSkills, saveSkill } from "@core/context.server";
import {
  type FileKind,
  deleteFile,
  finishVideoUpload,
  listFiles,
  saveAudio,
  saveImage,
  startVideoUpload,
  updateFile,
} from "@core/files.server";
import { requireKey } from "./auth";
import { ApiError, type WorkspaceEnv, notFound, readJson } from "./http";

const skillInput = z.object({
  title: z.string().trim().min(1, "Give the skill a title.").max(TITLE_MAX),
  description: z.string().trim().min(1, "Say what the skill does.").max(DESCRIPTION_MAX),
});

export const skillRoutes = new Hono<WorkspaceEnv>()
  .get("/", async (c) => c.json({ skills: await listSkills(c.get("workspaceId")) }))
  .post("/", requireKey, async (c) => {
    const skill = await saveSkill(c.get("workspaceId"), await readJson(c, skillInput));
    return c.json({ skill }, 201);
  })
  .patch("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const current = (await listSkills(ws)).find((skill) => skill.id === c.req.param("id"));
    if (!current) throw notFound("Skill");
    const patch = await readJson(c, skillInput.partial());
    const skill = await saveSkill(ws, { ...current, ...patch, id: current.id });
    return c.json({ skill });
  })
  .delete("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    if (!(await listSkills(ws)).some((skill) => skill.id === c.req.param("id"))) throw notFound("Skill");
    await deleteSkill(ws, c.req.param("id"));
    return c.body(null, 204);
  });

const kinds: FileKind[] = ["image", "video", "audio"];

export const fileRoutes = new Hono<WorkspaceEnv>()
  // ?kind=image|video|audio.
  .get("/", async (c) => {
    const kind = c.req.query("kind") as FileKind | undefined;
    if (kind && !kinds.includes(kind)) throw new ApiError(422, "kind is image, video or audio.");
    return c.json({ files: await listFiles(c.get("workspaceId"), kind) });
  })
  // Images and audio, as multipart `file` (plus `alt`, or `seconds` for audio).
  .post("/", async (c) => {
    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Attach a file as `file`.");
    const alt = form.get("alt");
    const seconds = Number(form.get("seconds")) || null;
    // Video goes browser-to-Stream through /videos.
    const workspaceId = c.get("workspaceId");
    const saved = file.type.startsWith("audio/")
      ? await saveAudio(workspaceId, file, seconds)
      : await saveImage(workspaceId, file, typeof alt === "string" ? alt : "");
    return c.json({ file: saved }, 201);
  })
  .patch("/:id", requireKey, async (c) => {
    const patch = await readJson(c, z.object({ name: z.string().trim().max(200).optional(), alt: z.string().trim().max(500).optional() }));
    const ws = c.get("workspaceId");
    const current = (await listFiles(ws)).find((file) => file.id === c.req.param("id"));
    if (!current) throw notFound("File");
    const file = await updateFile(ws, current.id, { name: patch.name || current.name, alt: patch.alt });
    return c.json({ file });
  })
  .delete("/:id", requireKey, async (c) => {
    if (!(await deleteFile(c.get("workspaceId"), c.req.param("id")))) throw notFound("File");
    return c.body(null, 204);
  });

// Video: get a one-time Stream URL, post the file to it from the browser, then say it's done.
export const videoRoutes = new Hono<WorkspaceEnv>()
  .post("/", async (c) => {
    const { name, type, bytes } = await readJson(
      c,
      z.object({ name: z.string(), type: z.string(), bytes: z.number() }, "Send the file's name, type and bytes."),
    );
    return c.json(await startVideoUpload(c.get("workspaceId"), { name, type, bytes }), 201);
  })
  .post("/:id/done", async (c) => {
    const file = await finishVideoUpload(c.get("workspaceId"), c.req.param("id"));
    if (!file) throw notFound("Video");
    return c.json({ file });
  });
