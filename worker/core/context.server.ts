/** Context in D1: skills, plus images and media through files.server.ts. */
import type { ImageAsset, MediaAsset, Skill } from "./context";
import { db, newId, now } from "./db.server";
import { type StoredFile, listFiles, streamEmbedUrl } from "./files.server";

export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 2000;

const daysSince = (seconds: number) => Math.max(0, Math.floor((now() - seconds) / 86_400));

const dateLabel = (seconds: number) =>
  new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type SkillRow = { id: string; title: string; description: string; updated_at: number };

const toSkill = (row: SkillRow): Skill => ({
  id: row.id,
  title: row.title,
  description: row.description,
  updated: dateLabel(row.updated_at),
});

/** Most recently edited first. */
export async function listSkills(workspaceId: string) {
  const { results } = await db()
    .prepare("SELECT id, title, description, updated_at FROM skills WHERE workspace_id = ? ORDER BY updated_at DESC, id")
    .bind(workspaceId)
    .all<SkillRow>();
  return results.map(toSkill);
}

/** Creates the skill when `id` is missing, otherwise updates it. */
export async function saveSkill(workspaceId: string, fields: { id?: string; title: string; description: string }) {
  const title = fields.title.trim().slice(0, TITLE_MAX);
  const description = fields.description.trim().slice(0, DESCRIPTION_MAX);
  if (!title || !description) return null;
  const row = await db()
    .prepare(
      `INSERT INTO skills (workspace_id, id, title, description) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (workspace_id, id) DO UPDATE SET title = ?3, description = ?4, updated_at = unixepoch()
       RETURNING id, title, description, updated_at`,
    )
    .bind(workspaceId, fields.id ?? newId("skill"), title, description)
    .first<SkillRow>();
  return row ? toSkill(row) : null;
}

export async function deleteSkill(workspaceId: string, id: string) {
  await db().prepare("DELETE FROM skills WHERE workspace_id = ? AND id = ?").bind(workspaceId, id).run();
}

function toImage(file: StoredFile): ImageAsset {
  return {
    id: file.id,
    name: file.name,
    url: file.url ?? "",
    alt: file.alt,
    width: file.width ?? 0,
    height: file.height ?? 0,
    bytes: file.bytes,
    addedDaysAgo: daysSince(file.createdAt),
  };
}

function toMedia(file: StoredFile): MediaAsset {
  return {
    id: file.id,
    name: file.name,
    kind: file.kind === "video" ? "video" : "audio",
    url: file.url,
    embed: file.kind === "video" && file.url ? streamEmbedUrl(file.url) : null,
    poster: file.poster,
    status: file.status,
    seconds: file.seconds ?? 0,
    bytes: file.bytes,
    addedDaysAgo: daysSince(file.createdAt),
  };
}

export async function listContextFiles(workspaceId: string) {
  const files = await listFiles(workspaceId);
  return {
    images: files.filter((f) => f.kind === "image").map(toImage),
    media: files.filter((f) => f.kind !== "image").map(toMedia),
  };
}
