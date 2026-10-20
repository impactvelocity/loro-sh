/**
 * A read-through cache in KV for what public pages load on every visit:
 * a funnel's start page and intake questions. It lets /f/:slug render
 * without a D1 round trip from wherever the visitor is.
 *
 * D1 stays the source of truth. Whatever saves the data must call
 * `invalidate` with the same key. KV is eventually consistent, so a save
 * can take up to a minute to show everywhere; the TTL bounds anything that
 * slips through. Keys always start with the workspace id.
 *
 * Qloo responses aren't cached here.
 */
import { env, waitUntil } from "cloudflare:workers";

const TTL_SECONDS = 60 * 60;

export const cacheKeys = {
  funnel: (workspaceId: string, slug: string) => `${workspaceId}:funnel:${slug}`,
};

export async function cached<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
  const hit = await env.CACHE.get<T>(key, "json");
  if (hit !== null) return hit;
  const value = await load();
  // Misses aren't stored, so a page that's created later shows straight away.
  if (value !== null) {
    waitUntil(env.CACHE.put(key, JSON.stringify(value), { expirationTtl: TTL_SECONDS }));
  }
  return value;
}

export function invalidate(key: string) {
  return env.CACHE.delete(key);
}
