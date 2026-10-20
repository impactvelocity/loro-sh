/**
 * D1 access shared by the API, the admin and the public pages.
 *
 * One database holds every workspace. Every query is scoped by
 * workspace_id; take it as the first argument so it can't be forgotten.
 * Migrations live in migrations/ and are applied with `pnpm db:migrate`. Server-only (.server.ts), so React Router keeps it, and anything importing it, out of the client bundle.
 */
import { env } from "cloudflare:workers";

export function db() {
  return env.DB;
}

/** Unix seconds, matching the tables' defaults. */
export function now() {
  return Math.floor(Date.now() / 1000);
}

export function toJson(value: unknown) {
  return JSON.stringify(value);
}

/** JSON columns are written by Loro, so a parse failure is a bug worth seeing. */
export function fromJson<T>(text: string | null, fallback: T): T {
  return text === null ? fallback : (JSON.parse(text) as T);
}

/** Ids are used in R2 keys and Analytics Engine SQL, so keep them plain. */
export function isId(value: string) {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
