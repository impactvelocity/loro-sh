/**
 * Qloo's Taste AI, as the Taste step and code steps use it. The key goes
 * in `X-Api-Key` (the QLOO_API_KEY secret). /search is a GET; insights
 * are POSTed, since weighted favourites only go in a JSON body. The key
 * trips a rate limit after a burst, so calls wait a short gap and a 429
 * backs off and retries.
 *
 * What we learned calling it (see also the OffMarket notes):
 * - Named favourites are the signal that matters. Resolve names to ids
 *   with /search first, and keep a hit only if its name matches.
 * - Weights work: the same two favourites at 9 and 1 give very different
 *   results. In the body, entities are `[{ id, weight }]`; every other
 *   list (tags, ages, excluded ids) is a comma-separated string.
 * - Demographics shift rankings but are noisy alone; send them with entities.
 * - Audiences (`signal.demographics.audiences`) didn't steer anything on
 *   the hackathon key: two different ones gave the same results. Unused.
 * - Category tags work as hard filters (`filter.tags`), not as signals.
 * - `filter.location.query` takes a city name; a venue or hotel needs a
 *   point (/search returns one for places) and `filter.location.radius`.
 *
 * Responses are trimmed to TasteEntity: raw ones repeat every tag in ~40
 * languages and run to hundreds of KB. Not cached, at the user's request.
 */
import { env } from "cloudflare:workers";

import type { GeoPoint } from "../catalogue/workflow";
import type { EntityType, TasteEntity } from "../outcome/state";
import { signalTypes } from "../profiles";

type Params = Record<string, string | number | boolean | string[] | undefined>;

export class QlooError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function qlooConnected() {
  return Boolean(env.QLOO_API_KEY);
}

const GAP_MS = 250;
const RETRIES = 3;
let queue: Promise<unknown> = Promise.resolve();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function search(params: Params) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    out.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return out;
}

/** One call at a time per isolate, with a gap, so a run doesn't trip the rate limit. */
function request<T>(path: string, init: { query?: Params; body?: Record<string, unknown> }): Promise<T> {
  const url = `${env.QLOO_API_URL.replace(/\/$/, "")}${path}${init.query ? `?${search(init.query)}` : ""}`;
  const run = queue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, {
        method: init.body ? "POST" : "GET",
        headers: { "X-Api-Key": env.QLOO_API_KEY ?? "", ...(init.body && { "content-type": "application/json" }) },
        body: init.body && JSON.stringify(init.body),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 429 && attempt < RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (!response.ok) {
        throw new QlooError(`Qloo ${path} ${response.status}: ${(await response.text()).slice(0, 200)}`, response.status);
      }
      return (await response.json()) as T;
    }
  });
  queue = run.catch(() => {}).then(() => sleep(GAP_MS));
  return run;
}

type RawTag = { name: string; type?: string };
type RawEntity = {
  entity_id: string;
  name: string;
  types?: string[];
  location?: { lat?: number; lon?: number } | null;
  tags?: RawTag[] | null;
  properties?: {
    address?: string;
    neighborhood?: string;
    website?: string;
    price_level?: number;
    business_rating?: number;
    is_closed?: boolean;
    short_description?: string;
    description?: string;
    images?: { url?: string }[];
    image?: { url?: string };
    keywords?: { name: string; count: number }[];
  } | null;
  query?: {
    affinity?: number;
    explainability?: { "signal.interests.entities"?: { entity_id: string; score: number }[] };
  } | null;
};

// Tag types worth showing, in order. The rest (payments, parking, age ranges) is noise.
const TAG_TYPES = [
  "urn:tag:category:place",
  "urn:tag:genre:music",
  "urn:tag:genre:qloo",
  "urn:tag:ambience:qloo",
  "urn:tag:style:qloo",
  "urn:tag:culinary_style:qloo",
];

function readableTags(tags: RawTag[] | null | undefined, max = 6) {
  const list = tags ?? [];
  const picked = TAG_TYPES.flatMap((type) => list.filter((tag) => tag.type === type)).map((tag) => tag.name);
  return [...new Set(picked.filter((name) => name && !/^\d/.test(name)))].slice(0, max);
}

/** `names` turns explainability's entity ids back into the signals' names. */
function toEntity(raw: RawEntity, type: EntityType, names: Map<string, string> = new Map()): TasteEntity {
  const p = raw.properties ?? {};
  return {
    id: raw.entity_id,
    name: raw.name,
    type,
    image: p.images?.[0]?.url ?? p.image?.url ?? null,
    tags: readableTags(raw.tags),
    address: p.address ?? null,
    neighbourhood: p.neighborhood ?? null,
    website: p.website ?? null,
    priceLevel: p.price_level ?? null,
    rating: p.business_rating != null ? Math.round(p.business_rating * 10) / 10 : null,
    description: (p.short_description || p.description || null)?.slice(0, 400) ?? null,
    keywords: (p.keywords ?? [])
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((keyword) => keyword.name),
    affinity: raw.query?.affinity != null ? Math.round(raw.query.affinity * 1000) / 1000 : null,
    because: (raw.query?.explainability?.["signal.interests.entities"] ?? [])
      .toSorted((a, b) => b.score - a.score)
      .flatMap((x) => names.get(x.entity_id) ?? [])
      .slice(0, 3),
    location: raw.location?.lat != null && raw.location.lon != null ? { lat: raw.location.lat, lng: raw.location.lon } : null,
  };
}

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

/** /search always returns its closest guess. Keep it only if most of the asked-for words are in its name. */
function sameName(asked: string, found: string) {
  const want = words(asked);
  const have = new Set(words(found));
  return want.filter((w) => have.has(w)).length / Math.max(want.length, 1) >= 0.6;
}

const entityTypes = new Set(Object.keys(signalTypes));

/** A Qloo type urn to ours, if it's one we use. */
function typeOf(raw: RawEntity): EntityType | null {
  const type = raw.types?.map((urn) => urn.replace("urn:entity:", "")).find((t) => entityTypes.has(t));
  return (type as EntityType | undefined) ?? null;
}

/**
 * A name to its Qloo entity, or null when Qloo doesn't know it. Without a
 * type it takes the best match of any type we use (for names a lookup steers by).
 */
export async function resolveEntity(name: string, type: EntityType | null, location?: string | null) {
  const body = await request<{ results?: RawEntity[] }>("/search", {
    query: {
      query: (type === "place" || type === null) && location ? `${name} ${location}` : name,
      types: type ? `urn:entity:${type}` : undefined,
      take: type ? 3 : 5,
    },
  });
  for (const hit of body.results ?? []) {
    const found = type ?? typeOf(hit);
    if (found && sameName(name, hit.name)) return toEntity(hit, found);
  }
  return null;
}

/** Where to look: a city by name, or a point and how far around it. */
export type InsightLocation = { query: string } | { point: GeoPoint; radiusKm: number };

export type InsightQuery = {
  type: EntityType;
  /** Resolved favourite ids with their weights: the strongest signal. */
  entities: { id: string; weight: number }[];
  /** id → name, for "because you like …". */
  names: Map<string, string>;
  ages?: string[];
  gender?: "male" | "female" | null;
  /** Places: where to look. */
  location?: InsightLocation | null;
  /** Places: category tags, any of. */
  tags?: readonly string[];
  /** Without entities: rank by what's popular with people around here. */
  nearby?: string | null;
  /** Popularity percentile, 0–1. */
  popularity?: { min?: number; max?: number };
  /** Places: 1–4. */
  priceMax?: number | null;
  /** Places: open on this day, e.g. "saturday". */
  hours?: string | null;
  exclude?: string[];
  /** Rank only these ids (`filter.results.entities`). Qloo still leaves out the signals themselves. */
  only?: string[];
  take: number;
};

/** A comma-separated list, or nothing when it's empty. */
const list = (values?: readonly string[]) => (values?.length ? values.join(",") : undefined);

/** Entities of one type ranked for the person. Closed and poorly rated places are left out. */
export async function insights(query: InsightQuery) {
  const place = query.type === "place";
  const where = place ? query.location : null;
  const body: Record<string, unknown> = {
    "filter.type": `urn:entity:${query.type}`,
    "filter.location.query": where && "query" in where ? where.query : undefined,
    "filter.location": where && "point" in where ? `POINT(${where.point.lng} ${where.point.lat})` : undefined,
    "filter.location.radius": where && "point" in where ? Math.round(where.radiusKm * 1000) : undefined,
    "filter.tags": list(query.tags),
    "filter.results.entities": list(query.only),
    "filter.exclude.entities": list(query.exclude),
    "filter.popularity.min": query.popularity?.min,
    "filter.popularity.max": query.popularity?.max,
    "filter.price_level.max": place ? (query.priceMax ?? undefined) : undefined,
    "filter.hours": place ? (query.hours ?? undefined) : undefined,
    "signal.interests.entities": query.entities.length ? query.entities : undefined,
    "signal.location.query": query.entities.length === 0 && !place ? (query.nearby ?? undefined) : undefined,
    "signal.demographics.age": list(query.ages),
    "signal.demographics.gender": query.gender ?? undefined,
    "feature.explainability": query.entities.length ? true : undefined,
    // A few spare, since some get filtered out below. Qloo allows 50 at most.
    take: Math.min(50, query.take + 4),
  };
  const result = await request<{ results?: { entities?: RawEntity[] | null } | null }>("/v2/insights", {
    body: Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== "")),
  });
  return (result.results?.entities ?? [])
    .filter((raw) => !raw.properties?.is_closed)
    .map((raw) => toEntity(raw, query.type, query.names))
    .filter((entity) => entity.rating === null || entity.rating >= 4)
    .slice(0, query.take);
}
