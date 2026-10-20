/**
 * Taste: the fixed first step of every run. It works out what the person
 * is into, runs the experience's lookups in Qloo, and writes the brief
 * every section is written from.
 *
 * 1. Read: the model reads the profile and picks out named favourites
 *    (artists, places, brands…), the kinds of place that fit them, and a
 *    location when no lookup names a city.
 * 2. Match: each favourite, plus the person's and their segment's own,
 *    and any names a lookup steers by, is matched to a Qloo entity. Then
 *    each lookup is one Qloo query (one per kind of place, for a mix),
 *    ranked by those ids at the lookup's weights and the segment's
 *    demographics.
 * 3. Brief: the model writes a short read of their taste from the profile
 *    and what Qloo matched, plus a few angles for the sections.
 *
 * Each part is its own workflow step, so a retry doesn't repeat the others.
 * `recommend` is also what code steps call through `ctx.qloo`.
 */
import { Output, generateText } from "ai";
import { z } from "zod";

import { outcomeModel, outcomeOptions } from "../ai.server";
import type { Answers } from "../catalogue/define";
import type { QlooTools, RecommendQuery } from "../catalogue/workflow";
import type { TasteBrief, TasteSignal } from "../outcome/brief";
import {
  type LookupConfig,
  type PlaceCategory,
  defaultCity,
  parsePoint,
  placeCategories,
  placeCategoryIds,
  popularityRanges,
  weights,
} from "../outcome/lookups";
import { type EntityType, type TasteEntity } from "../outcome/state";
import { signalTypes } from "../profiles";
import type { RunContext } from "./context.server";
import { type InsightLocation, insights, qlooConnected, resolveEntity } from "./qloo.server";

const entityTypes = Object.keys(signalTypes) as [EntityType, ...EntityType[]];

export type TasteRead = {
  favourites: { name: string; type: EntityType }[];
  categories: PlaceCategory[];
  location: string;
};

/** Favourites matched per run. Each is a /search call, made one at a time for the rate limit. */
const MAX_SIGNALS = 12;
const DEFAULT_CATEGORIES: PlaceCategory[] = ["restaurant", "coffee", "bar", "culture"];

/** Step 1: favourites, place kinds and a location, from the profile text. */
export async function readTaste(profile: string, lookups: LookupConfig[]): Promise<TasteRead> {
  const city = defaultCity(lookups);
  // Kinds are only needed for place lookups that leave them open.
  const wantsKinds = lookups.some((lookup) => lookup.props.type === "place" && lookup.props.kinds.length === 0);
  const menu = placeCategoryIds.map((id) => `- ${id}: ${placeCategories[id].label}`).join("\n");

  const { output } = await generateText({
    ...outcomeOptions,
    model: outcomeModel(),
    output: Output.object({
      schema: z.object({
        favourites: z
          .array(z.object({ name: z.string(), type: z.enum(entityTypes) }))
          .describe(
            "Specific named artists, places, brands, films, TV shows, books, podcasts or destinations the person likes, " +
              "including ones the people they're planning for like (a partner, a sister who loves a band). " +
              "Only real names that appear in the profile. Empty if none.",
          ),
        categories: z
          .array(z.enum(placeCategoryIds as [PlaceCategory, ...PlaceCategory[]]))
          .describe("Two to four kinds of place from the list to look for, best fit first."),
        location: z
          .string()
          .describe(
            "Just the city or neighbourhood to look for places in, like 'Austin, TX'. Empty if there isn't one.",
          ),
      }),
    }),
    instructions:
      "You read a customer profile and pull out what a taste engine can match. List every artist, band, venue, " +
      "restaurant, brand, film, show, book or podcast the profile names as something they, or the people they're " +
      "with, like. A name in passing counts: 'we all love Khruangbin' gives Khruangbin. Don't invent names the " +
      "profile doesn't have, and don't list the brand, the experience or its location. Places they work, commute " +
      "to or need to reach (an airport, an office, a school) aren't favourites.",
    prompt: `${profile}\n\n${wantsKinds ? `Kinds of place available:\n${menu}\n\n` : "No kinds of place are needed.\n\n"}Default location: ${city || "none"}`,
  });

  return {
    favourites: output.favourites.slice(0, MAX_SIGNALS),
    // A model that picks nothing still gets a sensible spread.
    categories: !wantsKinds ? [] : output.categories.length ? output.categories.slice(0, 4) : DEFAULT_CATEGORIES,
    // A lookup's city wins; the model's is only for experiences without one.
    location: city || cleanLocation(output.location),
  };
}

/** A city or neighbourhood, or nothing: models sometimes answer with a paragraph. */
function cleanLocation(text: string) {
  const line = text.split(/[\n(–—]/)[0].trim();
  return line.length > 0 && line.length <= 60 ? line : "";
}

/** What every query for this person starts from. */
export type TasteBase = {
  signals: TasteSignal[];
  ages: string[];
  gender: "male" | "female" | null;
  /** The city places are found in when a query doesn't say. */
  location: string | null;
};

const ORIGIN_WEIGHT: Record<TasteSignal["from"], "person" | "segment" | null> = {
  answers: "person",
  person: "person",
  segment: "segment",
  // A lookup's own names are weighted by that lookup.
  lookup: null,
};
const DEFAULT_WEIGHTS = { person: "high", segment: "low" } as const;

/** The matched signals as Qloo weights. A favourite in two groups keeps the higher. */
function weighted(signals: TasteSignal[], chosen: RecommendQuery["weights"] = {}) {
  const levels = { ...DEFAULT_WEIGHTS, ...chosen };
  const out = new Map<string, number>();
  for (const signal of signals) {
    const origin = ORIGIN_WEIGHT[signal.from];
    const weight = origin ? weights[levels[origin]] : 0;
    if (!signal.id || weight === 0) continue;
    out.set(signal.id, Math.max(out.get(signal.id) ?? 0, weight));
  }
  return [...out].map(([id, weight]) => ({ id, weight }));
}

/** Round-robin through lists, skipping repeats, until `take`. */
function interleave(lists: TasteEntity[][], take: number) {
  const out = new Map<string, TasteEntity>();
  for (let i = 0; out.size < take && lists.some((list) => i < list.length); i++) {
    for (const list of lists) if (list[i] && out.size < take && !out.has(list[i].id)) out.set(list[i].id, list[i]);
  }
  return [...out.values()];
}

/** Things of one type ranked for this person: a lookup, or a code step's `ctx.qloo.recommend`. */
export async function recommend(query: RecommendQuery, base: TasteBase): Promise<TasteEntity[]> {
  if (!qlooConnected()) return [];
  const take = Math.min(50, Math.max(1, query.take ?? 10));
  const extra = (query.entities ?? []).filter((e) => e.weight > 0);
  const entities = [...weighted(base.signals, query.weights), ...extra.map(({ id, weight }) => ({ id, weight }))];
  const names = new Map([
    ...base.signals.flatMap((s) => (s.id ? [[s.id, s.name] as const] : [])),
    ...extra.flatMap((e) => (e.name ? [[e.id, e.name] as const] : [])),
  ]);
  const near = query.near ?? base.location;
  const location: InsightLocation | null =
    typeof near === "string"
      ? near
        ? { query: near }
        : null
      : near
        ? { point: near, radiusKm: near.radiusKm ?? 2 }
        : null;
  const kinds = query.type === "place" ? (query.kinds ?? []) : [];
  const shared = {
    type: query.type,
    entities,
    names,
    ages: base.ages,
    gender: base.gender,
    location,
    nearby: base.location,
    popularity: popularityRanges[query.popularity ?? "any"],
    priceMax: query.priceMax ?? null,
    hours: query.openOn ?? null,
    only: query.only,
    // Don't recommend what they already named.
    exclude: [
      ...new Set([...base.signals.flatMap((s) => s.id ?? []), ...extra.map((e) => e.id), ...(query.exclude ?? [])]),
    ],
  };
  // One query per kind, so a lookup for coffee and bars gets both.
  const groups = kinds.length ? kinds.map((kind) => placeCategories[kind].tags) : [undefined];
  const each = Math.ceil(take / groups.length) + 2;
  const lists: TasteEntity[][] = [];
  for (const tags of groups) lists.push(await insights({ ...shared, tags, take: each }));
  return interleave(lists, take);
}

/** A place lookup's "near": its city, or a point for a place or an answer. */
async function whereFor(lookup: LookupConfig, read: TasteRead, answers: Answers): Promise<RecommendQuery["near"]> {
  const { near, answer, place, radius } = lookup.props;
  if (near === "city") return place.trim() || read.location || undefined;
  const value = near === "answer" ? answers[answer] : place;
  const text = (Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : "").trim();
  if (!text) return read.location || undefined;
  const point = parsePoint(text);
  if (point) return { ...point, radiusKm: radius };
  const hit = await resolveEntity(text, "place", read.location).catch(() => null);
  // Qloo doesn't know it: the city is the next best thing.
  return hit?.location ? { ...hit.location, radiusKm: radius } : read.location || undefined;
}

export type TasteMatch = Pick<TasteBrief, "signals" | "pools" | "entities" | "qloo">;

function steerNames(lookup: LookupConfig) {
  return lookup.props.steer
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Step 2: match favourites in Qloo, then run every lookup. */
export async function matchTaste({
  read,
  context,
  lookups,
  answers,
  report,
}: {
  read: TasteRead;
  context: RunContext;
  lookups: LookupConfig[];
  answers: Answers;
  report: (message: string) => Promise<void>;
}): Promise<TasteMatch> {
  const raw: Omit<TasteSignal, "id">[] = [
    ...read.favourites.map((s) => ({ ...s, from: "answers" as const })),
    ...(context.person?.signals ?? []).map((s) => ({
      name: s.name,
      type: s.type as EntityType,
      from: "person" as const,
    })),
    ...(context.segment?.signals ?? []).map((s) => ({
      name: s.name,
      type: s.type as EntityType,
      from: "segment" as const,
    })),
  ];
  const seen = new Set<string>();
  const unique = raw.filter((s) => {
    const key = `${s.type}:${s.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // The person's own come first, so a big segment can't crowd them out.
  const wanted = unique.slice(0, MAX_SIGNALS);

  if (!qlooConnected()) {
    await report("Qloo isn't connected, so writing from the profile alone");
    return { signals: wanted.map((s) => ({ ...s, id: null })), pools: {}, entities: {}, qloo: false };
  }

  await report(
    wanted.length
      ? `Matching ${wanted.length} ${wanted.length === 1 ? "favourite" : "favourites"} in Qloo`
      : "No favourites to match, using the profile",
  );
  const signals: TasteSignal[] = [];
  for (const signal of wanted) {
    const hit = await resolveEntity(signal.name, signal.type, read.location).catch(() => null);
    signals.push({ ...signal, name: hit?.name ?? signal.name, id: hit?.id ?? null });
  }
  // Names lookups steer by: the band at the show, the brand of the product. Any type.
  const steered = new Map<string, TasteSignal | null>();
  for (const lookup of lookups) {
    if (lookup.props.steerWeight === "off") continue;
    for (const name of steerNames(lookup)) {
      if (steered.has(name.toLowerCase())) continue;
      const hit = await resolveEntity(name, null, read.location).catch(() => null);
      const signal = hit ? { name: hit.name, type: hit.type, from: "lookup" as const, id: hit.id } : null;
      steered.set(name.toLowerCase(), signal);
      if (signal) signals.push(signal);
    }
  }

  const base: TasteBase = {
    signals,
    ages: context.segment?.ages ?? [],
    gender: context.segment && context.segment.gender !== "any" ? context.segment.gender : null,
    location: read.location || null,
  };
  const pools: Record<string, string[]> = {};
  const entities: Record<string, TasteEntity> = {};
  for (const lookup of lookups) {
    const { props } = lookup;
    await report(`Finding ${(props.name || `${signalTypes[props.type]}s`).toLowerCase()}`);
    const place = props.type === "place";
    const found = await recommend(
      {
        type: props.type,
        near: place ? await whereFor(lookup, read, answers) : undefined,
        kinds: place ? (props.kinds.length ? props.kinds : read.categories) : undefined,
        take: props.take,
        popularity: props.popularity,
        priceMax: place && props.price !== "any" ? Number(props.price) : undefined,
        openOn: place && props.day !== "any" ? props.day : undefined,
        weights: { person: props.person, segment: props.segment },
        entities: steerNames(lookup).flatMap((name) => {
          const signal = steered.get(name.toLowerCase());
          return signal?.id ? [{ id: signal.id, weight: weights[props.steerWeight], name: signal.name }] : [];
        }),
      },
      base,
    ).catch((error) => {
      console.error("qloo lookup", lookup.id, error);
      return [];
    });
    for (const entity of found) entities[entity.id] ??= entity;
    pools[lookup.id] = found.map((entity) => entity.id);
  }
  return { signals, pools, entities, qloo: true };
}

/** Qloo for code steps, with this person's taste once Taste has run. */
export function qlooTools(base: TasteBase): QlooTools {
  return {
    connected: qlooConnected(),
    search: async (name, type, near) => (qlooConnected() ? resolveEntity(name, type, near) : null),
    recommend: (query) => recommend(query, base),
  };
}

/** Step 3: a short read of their taste, and angles for the sections. */
export async function writeBrief({ profile, match }: { profile: string; match: TasteMatch }) {
  const matched = match.signals.filter((s) => s.id).map((s) => `${s.name} (${s.type})`);
  const sample = Object.values(match.entities)
    .slice(0, 12)
    .map((e) => `${e.name} (${e.type}${e.tags.length ? `: ${e.tags.slice(0, 3).join(", ")}` : ""})`);

  const { output } = await generateText({
    ...outcomeOptions,
    model: outcomeModel(),
    output: Output.object({
      schema: z.object({
        summary: z
          .string()
          .describe(
            "Two or three plain sentences on what they're into and what they want from this, for the writers. Not shown to them.",
          ),
        angles: z
          .array(z.string())
          .describe(
            "Up to four specific threads the page could pull on, each one short line, e.g. 'slow mornings before a late night'.",
          ),
      }),
    }),
    instructions:
      "You brief writers who'll make a personalised page for one person. Ground every line in the profile or the taste matches. " +
      "No flattery, no marketing words. If the team's notes say something private, use it to steer but don't repeat it.",
    prompt: `${profile}\n\nMatched in Qloo: ${matched.join(", ") || "nothing"}\nWhat Qloo suggests for them: ${sample.join("; ") || "nothing yet"}`,
  });
  return { summary: output.summary, angles: output.angles.slice(0, 4) };
}
