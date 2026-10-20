/**
 * A code step for festivals: ranks the whole lineup for this person in
 * Qloo, after Taste, so the guide plans their days from real acts on the
 * bill, best fit first.
 *
 * 1. Read the lineup from the start page's Lineup component (the one
 *    source of truth for days, stages and set times).
 * 2. Acts without a Qloo id are found by name.
 * 3. One Qloo call scores every act against their taste
 *    (`filter.results.entities`). Qloo leaves out the acts they named
 *    themselves, so those are fetched by name: they're must-sees.
 * 4. Every act becomes a candidate (must-sees, then by match, then the
 *    rest), so a section can put any of them on the plan. The timetable
 *    goes to every section as context, and to the page as public data,
 *    which is how the guide shows set times.
 */
import { TicketIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f, fieldsSchema } from "@core/catalogue/fields";
import type { TasteEntity } from "@core/outcome/state";
import {
  type Timetable,
  type TimetableSet,
  byTime,
  clock,
  lineupFields,
  overlaps,
  sampleTimetable,
} from "../catalogues/festival/lineup";

/** Acts looked up by name per run, at most: each is a Qloo call. */
const MAX_SEARCHES = 16;

const bare = (id: string, name: string): TasteEntity => ({
  id,
  name,
  type: "artist",
  image: null,
  tags: [],
  address: null,
  neighbourhood: null,
  website: null,
  priceLevel: null,
  rating: null,
  description: null,
  keywords: [],
  affinity: null,
  because: [],
});

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const same = (a: string, b: string) => slug(a) === slug(b);

export default defineStep({
  type: "lineup",
  name: "Lineup",
  description: "Ranks a festival's lineup for this person in Qloo. The guide plans their days from it.",
  icon: TicketIcon,
  at: "after-taste",
  provides: "artist",
  fields: {
    lineup: f.text({ label: "Lineup", default: "lineup", help: "The id of the Lineup component on the start page." }),
    picks: f.text({ label: "Their picks", default: "excited", help: "The question where they pick the acts they're there for." }),
    notes: f.longText({
      label: "Getting around",
      help: "Given to every section with the timetable: walking times, gates, curfews.",
    }),
  },
  sample: () => sampleTimetable(),
  async run(props, ctx) {
    const blocks = ctx.config.parts.start.components;
    const block = blocks.find((b) => b.id === props.lineup) ?? blocks.find((b) => b.type === "lineup");
    if (!block) return { skipped: true, message: "No lineup on the start page" };
    const lineup = fieldsSchema(lineupFields).parse(block.props);
    const sets = lineup.sets.filter((set) => set.artist.trim());
    if (!sets.length) return { skipped: true, message: "The lineup is empty" };

    // Ids for every act: the lineup's own, or Qloo's by name.
    const entities = new Map<string, TasteEntity>();
    const ids = new Map(sets.map((set) => [set.artist, set.qloo.trim()]));
    const unknown = sets.filter((set) => !set.qloo.trim()).slice(0, MAX_SEARCHES);
    if (unknown.length && ctx.qloo.connected) await ctx.report(`Finding ${unknown.length} acts in Qloo`);
    for (const set of ctx.qloo.connected ? unknown : []) {
      const hit = await ctx.qloo.search(set.artist, "artist").catch(() => null);
      if (!hit) continue;
      ids.set(set.artist, hit.id);
      entities.set(hit.id, hit);
    }
    const idOf = (artist: string) => ids.get(artist) || `act-${slug(artist)}`;

    // Must-sees: what they picked, and any act Taste matched from their answers.
    const answer = ctx.answers[props.picks];
    const picked = Array.isArray(answer) ? answer : typeof answer === "string" ? answer.split(",") : [];
    const signals = ctx.brief?.signals ?? [];
    const named = new Set(
      sets
        .filter(
          (set) =>
            picked.some((name) => same(name, set.artist)) ||
            signals.some((s) => (s.id && s.id === ids.get(set.artist)) || same(s.name, set.artist)),
        )
        .map((set) => set.artist),
    );

    await ctx.report(`Ranking ${sets.length} acts against your taste`);
    const known = [...new Set(sets.map((set) => ids.get(set.artist)).filter((id): id is string => Boolean(id)))];
    const ranked = ctx.qloo.connected
      ? await ctx.qloo.recommend({ type: "artist", only: known.slice(0, 50), take: 50 }).catch(() => [])
      : [];
    for (const entity of ranked) entities.set(entity.id, entity);

    // Qloo doesn't rank what they named, so fetch those for their photos.
    for (const artist of named) {
      const id = idOf(artist);
      if (entities.has(id) || !ctx.qloo.connected) continue;
      const hit = await ctx.qloo.search(artist, "artist").catch(() => null);
      if (hit && (hit.id === id || !ids.get(artist))) entities.set(id, { ...hit, id });
    }

    // Named as the lineup spells them, not as Qloo does ("PEGGY GOU").
    const entityOf = (artist: string) => ({ ...(entities.get(idOf(artist)) ?? bare(idOf(artist), artist)), name: artist });
    const rank = new Map(ranked.map((entity, i) => [entity.id, i]));
    const order = (artist: string) => (named.has(artist) ? -1 : (rank.get(idOf(artist)) ?? Number.MAX_SAFE_INTEGER));
    const acts = [...new Set(sets.map((set) => set.artist))].toSorted((a, b) => order(a) - order(b));

    const timetable: Timetable = {
      days: lineup.days,
      stages: lineup.stages,
      sets: sets.map(
        (set): TimetableSet => ({
          id: idOf(set.artist),
          artist: set.artist,
          day: set.day,
          stage: set.stage,
          start: set.start,
          end: set.end,
          match: entities.get(idOf(set.artist))?.affinity ?? null,
          named: named.has(set.artist),
        }),
      ),
    };

    const dayOrder = (day: string) => lineup.days.findIndex((d) => d.name === day);
    return {
      candidates: acts.map(entityOf),
      data: timetable,
      output: {
        days: lineup.days.map((day) => `${day.name}, ${day.date}`),
        timetable: timetable.sets
          .toSorted((a, b) => dayOrder(a.day) - dayOrder(b.day) || byTime(a, b))
          .map((set) => ({
            day: set.day,
            stage: set.stage,
            time: `${clock(set.start, true)}–${clock(set.end, true)}`,
            act: set.artist,
            id: set.id,
            match: set.match,
            theyPicked: set.named,
            clashesWith: timetable.sets
              .filter((other) => other !== set && other.day === set.day && overlaps(other, set))
              .map((other) => other.artist),
          })),
        gettingAround: props.notes.trim() || undefined,
      },
      message: `Ranked ${ranked.length} acts for you${named.size ? ` · ${named.size} must-see${named.size === 1 ? "" : "s"}` : ""}`,
    };
  },
});
