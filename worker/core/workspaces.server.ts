/** Workspaces in D1, with the counts the Workspaces page shows. */
import { db, now } from "./db.server";
import { deleteWorkspaceFiles } from "./files.server";
import { seedWorkspace } from "./seed.server";
import { type Workspace, NAME_MAX, TAGLINE_MAX, workspaceId } from "./workspaces";

/** The demo is public, so cap what visitors can make. */
export const MAX_CREATED = 25;

type WorkspaceRow = Omit<Workspace, "demo" | "updatedAt"> & { demo: number; updated_at: number };

const select = `
  SELECT w.id, w.name, w.tagline, w.vertical, w.location, w.host, w.cover, w.demo, w.updated_at,
    (SELECT count(*) FROM funnels f WHERE f.workspace_id = w.id) AS experiences,
    (SELECT count(*) FROM segments s WHERE s.workspace_id = w.id) AS segments,
    (SELECT count(*) FROM people p WHERE p.workspace_id = w.id) AS profiles
  FROM workspaces w`;

function toWorkspace({ demo, updated_at, ...row }: WorkspaceRow): Workspace {
  return { ...row, demo: demo === 1, updatedAt: updated_at };
}

/** Yours first, oldest to newest, then the demos. */
export async function listWorkspaces() {
  const { results } = await db().prepare(`${select} ORDER BY w.demo, w.created_at, w.id`).all<WorkspaceRow>();
  return results.map(toWorkspace);
}

export async function findWorkspace(id: string) {
  const row = await db().prepare(`${select} WHERE w.id = ?`).bind(id).first<WorkspaceRow>();
  return row ? toWorkspace(row) : null;
}

export class WorkspaceError extends Error {}

/**
 * Demo data is the events fixtures, so a seeded workspace is an events one.
 * An empty one has no vertical or location; only the demos set those.
 */
export async function createWorkspace(input: { name: string; tagline: string; seeded: boolean }) {
  const name = input.name.trim().slice(0, NAME_MAX);
  if (!name) throw new WorkspaceError("Give your workspace a name.");
  const created = await db().prepare("SELECT count(*) AS n FROM workspaces WHERE demo = 0").first<number>("n");
  if ((created ?? 0) >= MAX_CREATED) throw new WorkspaceError(`The demo holds up to ${MAX_CREATED} workspaces.`);

  const { results } = await db().prepare("SELECT id FROM workspaces").all<{ id: string }>();
  const id = workspaceId(name, results.map((r) => r.id));
  await db()
    .prepare(`INSERT INTO workspaces (id, name, tagline, vertical, host) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, name, input.tagline.trim().slice(0, TAGLINE_MAX), input.seeded ? "events" : "other", `${id}.loro.sh`)
    .run();
  if (input.seeded) await seedWorkspace(id);
  return id;
}

/** Demo workspaces are read-only, so every update skips them. */
export async function updateWorkspace(id: string, fields: { name?: string; tagline?: string; cover?: string | null }) {
  const name = fields.name?.trim().slice(0, NAME_MAX);
  if (name === "") throw new WorkspaceError("Give your workspace a name.");
  const row = await db()
    .prepare(
      `UPDATE workspaces SET
         name = coalesce(?1, name),
         tagline = coalesce(?2, tagline),
         cover = CASE WHEN ?3 THEN ?4 ELSE cover END,
         updated_at = ?5
       WHERE id = ?6 AND demo = 0 RETURNING id`,
    )
    .bind(
      name ?? null,
      fields.tagline?.trim().slice(0, TAGLINE_MAX) ?? null,
      fields.cover !== undefined ? 1 : 0,
      fields.cover ?? null,
      now(),
      id,
    )
    .first();
  if (!row) throw new WorkspaceError("Demo workspaces can't be changed.");
}

/** Everything in it goes too: rows by cascade, uploads from Images, Stream and R2. */
export async function deleteWorkspace(id: string) {
  const row = await db().prepare("SELECT demo FROM workspaces WHERE id = ?").bind(id).first<{ demo: number }>();
  if (!row) return false;
  if (row.demo) throw new WorkspaceError("Demo workspaces can't be deleted.");
  await deleteWorkspaceFiles(id);
  await db().prepare("DELETE FROM workspaces WHERE id = ?").bind(id).run();
  return true;
}
