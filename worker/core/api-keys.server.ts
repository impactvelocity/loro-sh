/**
 * API keys, per workspace. Keys are looked up by a SHA-256 hash, but kept
 * in full too, so the admin can show one again (this is demo-ware, not a
 * vault). The API needs one for anything that changes a workspace
 * (workers/api/auth.ts).
 *
 * Demo workspaces never get keys, so the API can't change them.
 */
import { db, now } from "./db.server";
import { KEY_NAME_MAX } from "./settings";

export const KEY_PREFIX = "loro_sk_";
const MAX_KEYS = 20;

export type ApiKeyRecord = {
  id: string;
  name: string;
  last4: string;
  /** The key itself; null for keys made before keys were kept. */
  secret: string | null;
  createdAt: number;
  lastUsedAt: number | null;
};

export class ApiKeyError extends Error {}

type KeyRow = {
  id: string;
  name: string;
  last4: string;
  secret: string | null;
  created_at: number;
  last_used_at: number | null;
};

const toKey = (row: KeyRow): ApiKeyRecord => ({
  id: row.id,
  name: row.name,
  last4: row.last4,
  secret: row.secret,
  createdAt: row.created_at,
  lastUsedAt: row.last_used_at,
});

async function hash(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function newSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `${KEY_PREFIX}${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Newest first. */
export async function listApiKeys(workspaceId: string) {
  const { results } = await db()
    .prepare(
      `SELECT id, name, last4, secret, created_at, last_used_at FROM api_keys
       WHERE workspace_id = ? ORDER BY created_at DESC, id`,
    )
    .bind(workspaceId)
    .all<KeyRow>();
  return results.map(toKey);
}

/** The new key's record, and the key itself. */
export async function createApiKey(workspaceId: string, name: string) {
  const clean = name.trim().slice(0, KEY_NAME_MAX);
  if (!clean) throw new ApiKeyError("Give the key a name.");
  const [workspace, count] = await db().batch<{ demo?: number; n?: number }>([
    db().prepare("SELECT demo FROM workspaces WHERE id = ?").bind(workspaceId),
    db().prepare("SELECT count(*) AS n FROM api_keys WHERE workspace_id = ?").bind(workspaceId),
  ]);
  if (!workspace.results[0]) throw new ApiKeyError("Workspace not found.");
  if (workspace.results[0].demo) throw new ApiKeyError("Demo workspaces are read-only, so they don't take keys.");
  if ((count.results[0]?.n ?? 0) >= MAX_KEYS) throw new ApiKeyError(`A workspace holds up to ${MAX_KEYS} keys.`);

  const secret = newSecret();
  const row = await db()
    .prepare(
      `INSERT INTO api_keys (workspace_id, id, name, hash, last4, secret) VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, name, last4, secret, created_at, last_used_at`,
    )
    .bind(workspaceId, `key-${crypto.randomUUID().slice(0, 8)}`, clean, await hash(secret), secret.slice(-4), secret)
    .first<KeyRow>();
  return { key: toKey(row!), secret };
}

export async function revokeApiKey(workspaceId: string, id: string) {
  const { meta } = await db().prepare("DELETE FROM api_keys WHERE workspace_id = ? AND id = ?").bind(workspaceId, id).run();
  return meta.changes > 0;
}

/** Marks a key used, at most once a minute. */
async function touch(workspaceId: string, row: { id: string; last_used_at: number | null }) {
  if (row.last_used_at && now() - row.last_used_at <= 60) return;
  await db()
    .prepare("UPDATE api_keys SET last_used_at = ? WHERE workspace_id = ? AND id = ?")
    .bind(now(), workspaceId, row.id)
    .run();
}

/** The key's id when the secret is one of this workspace's keys, else null. */
export async function verifyApiKey(workspaceId: string, secret: string) {
  if (!secret.startsWith(KEY_PREFIX)) return null;
  const row = await db()
    .prepare("SELECT id, last_used_at FROM api_keys WHERE workspace_id = ? AND hash = ?")
    .bind(workspaceId, await hash(secret))
    .first<{ id: string; last_used_at: number | null }>();
  if (!row) return null;
  await touch(workspaceId, row);
  return row.id;
}

/** The workspace a key belongs to, for clients that only send the key (the MCP server). */
export async function findApiKey(secret: string) {
  if (!secret.startsWith(KEY_PREFIX)) return null;
  const row = await db()
    .prepare("SELECT workspace_id, id, last_used_at FROM api_keys WHERE hash = ?")
    .bind(await hash(secret))
    .first<{ workspace_id: string; id: string; last_used_at: number | null }>();
  if (!row) return null;
  await touch(row.workspace_id, row);
  return { workspaceId: row.workspace_id, keyId: row.id };
}
