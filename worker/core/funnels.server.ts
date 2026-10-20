/** Experiences in D1. The public page reads them through the KV cache. */
import { type ExperienceConfig, parseConfig, slugifyId } from "./catalogue/config";
import { getCatalogue } from "./catalogue/registry";
import { cacheKeys, cached, invalidate } from "./cache.server";
import { isbot } from "isbot";

import { db, fromJson, isId, now, toJson } from "./db.server";
import { track } from "./events.server";
import { type Funnel, type FunnelStatus, NAME_MAX, funnelStatusLabels } from "./funnels";

export class FunnelError extends Error {}

type FunnelRow = {
  slug: string;
  name: string;
  catalogue: string;
  status: FunnelStatus;
  config: string;
  created_at: number;
  updated_at: number;
};

const columns = "slug, name, catalogue, status, config, created_at, updated_at";

/** Null when its catalogue folder is gone, so it can't render. */
function toFunnel(row: FunnelRow): Funnel | null {
  const catalogue = getCatalogue(row.catalogue);
  if (!catalogue) return null;
  const stored = fromJson<Record<string, unknown>>(row.config, {});
  return {
    slug: row.slug,
    name: row.name,
    catalogue: row.catalogue,
    status: row.status,
    config: parseConfig(catalogue, { ...stored, catalogue: row.catalogue, name: row.name }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Most recently edited first. */
export async function listFunnels(workspaceId: string) {
  const { results } = await db()
    .prepare(`SELECT ${columns} FROM funnels WHERE workspace_id = ? ORDER BY updated_at DESC, slug`)
    .bind(workspaceId)
    .all<FunnelRow>();
  return results.map(toFunnel).filter((funnel): funnel is Funnel => funnel !== null);
}

export async function getFunnel(workspaceId: string, slug: string) {
  const row = await db()
    .prepare(`SELECT ${columns} FROM funnels WHERE workspace_id = ? AND slug = ?`)
    .bind(workspaceId, slug)
    .first<FunnelRow>();
  return row ? toFunnel(row) : null;
}

/**
 * For /f/:workspace/:slug, which loads on every visit. The cache holds the
 * config as it was parsed when cached, so it's read again against today's
 * catalogue: a field added since (a deploy) gets its default, not undefined.
 */
export async function getPublicFunnel(workspaceId: string, slug: string) {
  const funnel = await cached(cacheKeys.funnel(workspaceId, slug), () => getFunnel(workspaceId, slug));
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue) return null;
  return { ...funnel, config: parseConfig(catalogue, funnel.config) };
}

async function takenSlugs(workspaceId: string) {
  const { results } = await db()
    .prepare("SELECT slug FROM funnels WHERE workspace_id = ?")
    .bind(workspaceId)
    .all<{ slug: string }>();
  return new Set(results.map((r) => r.slug));
}

function cleanName(name: string) {
  const clean = name.trim().slice(0, NAME_MAX);
  if (!clean) throw new FunnelError("Give it a name.");
  return clean;
}

/** Starts from the catalogue's example, so there's something to edit straight away. */
export async function createFunnel(workspaceId: string, input: { name: string; catalogue: string }) {
  const name = cleanName(input.name);
  const catalogue = getCatalogue(input.catalogue);
  if (!catalogue) throw new FunnelError("Pick a catalogue.");

  const taken = await takenSlugs(workspaceId);
  const base = slugifyId(name) || "experience";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

  const config = { ...parseConfig(catalogue, catalogue.example), name };
  await db().batch([
    db()
      .prepare("INSERT INTO funnels (workspace_id, slug, name, catalogue, config) VALUES (?, ?, ?, ?, ?)")
      .bind(workspaceId, slug, name, catalogue.id, toJson(config)),
    // The example's skills, so it reads the way it was written. Edited ones are left alone.
    ...(catalogue.skills ?? []).map((skill) =>
      db()
        .prepare("INSERT OR IGNORE INTO skills (workspace_id, id, title, description) VALUES (?, ?, ?, ?)")
        .bind(workspaceId, skill.id, skill.title, skill.description),
    ),
  ]);
  return slug;
}

/** Saves everything the editor holds. Returns the slug, which may have changed. */
export async function saveFunnel(
  workspaceId: string,
  slug: string,
  input: { name: string; slug: string; status: string; config: unknown },
) {
  const current = await getFunnel(workspaceId, slug);
  if (!current) throw new FunnelError("This experience no longer exists.");
  const catalogue = getCatalogue(current.catalogue)!;

  const name = cleanName(input.name);
  const nextSlug = slugifyId(input.slug);
  if (!isId(nextSlug)) throw new FunnelError("The link needs letters or numbers.");
  if (nextSlug !== slug && (await takenSlugs(workspaceId)).has(nextSlug)) {
    throw new FunnelError("Another experience uses this link.");
  }
  if (!(input.status in funnelStatusLabels)) throw new FunnelError("Pick a status.");
  const config: ExperienceConfig = { ...parseConfig(catalogue, input.config), name };

  await db()
    .prepare(
      `UPDATE funnels SET slug = ?, name = ?, status = ?, config = ?, updated_at = ?
       WHERE workspace_id = ? AND slug = ?`,
    )
    .bind(nextSlug, name, input.status, toJson(config), now(), workspaceId, slug)
    .run();
  // Everything recorded under the old link follows it.
  if (nextSlug !== slug) {
    await db().batch(
      ["submissions", "generations", "tests", "activity", "event_counts", "feedback"].map((table) =>
        db()
          .prepare(`UPDATE ${table} SET funnel_slug = ? WHERE workspace_id = ? AND funnel_slug = ?`)
          .bind(nextSlug, workspaceId, slug),
      ),
    );
  }
  await Promise.all([invalidate(cacheKeys.funnel(workspaceId, slug)), invalidate(cacheKeys.funnel(workspaceId, nextSlug))]);
  return nextSlug;
}

export async function deleteFunnel(workspaceId: string, slug: string) {
  await db().prepare("DELETE FROM funnels WHERE workspace_id = ? AND slug = ?").bind(workspaceId, slug).run();
  await invalidate(cacheKeys.funnel(workspaceId, slug));
}

/** A visit to a public page. Crawlers and link previews don't count. */
export function trackView(request: Request, workspaceId: string, slug: string) {
  if (isbot(request.headers.get("user-agent"))) return;
  track({ workspaceId, name: "view", funnel: slug });
}
