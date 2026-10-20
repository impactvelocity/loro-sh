/**
 * A code step for date plans: finds the places for four hours in one
 * neighbourhood, after Taste, so every stop is a real place Qloo picked
 * for the person they're taking out.
 *
 * 1. Where: a neighbourhood from the intake's Area Picker (its point is
 *    set there), or one they typed, found with OpenStreetMap's geocoder.
 * 2. When: the day and start time from the answer ("Saturday, from 6 PM",
 *    or an ISO time from an API). The hours split into stops by time of
 *    day and how they want to spend it (catalogues/date/date.ts).
 * 3. Whose taste: favourites from the answer about their match count
 *    three times the planner's own, so the places lean their way and land
 *    where the two lists meet.
 * 4. The places: Qloo places within a walk of the point for each stop,
 *    open that day, under their budget, and a spare stop for after.
 *
 * Every place is a candidate for the sections that pick this step; the
 * plan (area, times, which places are for which stop, whose favourites
 * are whose) is the page's public data and every section's context.
 */
import { HeartIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f, fieldsSchema } from "@core/catalogue/fields";
import { type PlaceCategory, parsePoint } from "@core/outcome/lookups";
import { sampleIds } from "@core/outcome/samples";
import type { TasteEntity } from "@core/outcome/state";
import {
  type DatePlan,
  type DateSlot,
  type Point,
  areaFields,
  extraSlot,
  haversine,
  noDrinks,
  paceOf,
  parseWhen,
  priceOf,
  samplePlan,
  shapeSlots,
} from "../catalogues/date/date";

const UA = { "user-agent": "Loro (https://github.com/loro-sh)", "accept-language": "en" };

/** A typed neighbourhood to a point, e.g. "Mount Pleasant, Vancouver". */
async function geocode(text: string): Promise<{ name: string; point: Point } | null> {
  type Hit = { lat: string; lon: string; display_name: string };
  const hits = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(text)}`, {
    headers: UA,
    signal: AbortSignal.timeout(8_000),
  })
    .then((r): Promise<Hit[]> => (r.ok ? r.json() : Promise.resolve([])))
    .catch(() => [] as Hit[]);
  const hit = hits[0];
  if (!hit) return null;
  return { name: text, point: { lat: Number(hit.lat), lng: Number(hit.lon) } };
}

/** Chains, canteens and clubs: not where you take someone. */
const notADate = /starbucks|mcdonald|dunkin|tim hortons|subway|chipotle|pret a manger|7-eleven|country club|golf|casino|dining (hall|commons)|food court|cafeteria/i;
const fitsADate = (entity: TasteEntity) => !notADate.test([entity.name, ...entity.tags].join(" "));

/** Kinds of place Qloo prices. */
const priced = new Set<PlaceCategory>(["restaurant", "brunch", "coffee", "bar"]);

const text = (answer: unknown) => (Array.isArray(answer) ? answer.join(", ") : typeof answer === "string" ? answer : "").trim();

export default defineStep({
  type: "date",
  name: "Date Plan",
  description: "Finds places for a few hours in one neighbourhood, a walk apart, leaning to the taste of the person they're taking out.",
  icon: HeartIcon,
  at: "after-taste",
  provides: "place",
  fields: {
    where: f.text({ label: "Neighbourhood", default: "where", help: "The question where they say where the date is." }),
    when: f.text({ label: "Time", default: "when", help: "The question on when it starts. A day and a time, or an ISO date and time." }),
    theirs: f.text({ label: "Their taste", default: "their_taste", help: "The question on what the person they're taking out loves." }),
    yours: f.text({ label: "Your taste", default: "your_taste", help: "The question on what the planner loves." }),
    pace: f.text({ label: "Pace", default: "pace", help: "The question on talking or doing." }),
    budget: f.text({ label: "Budget", default: "budget", help: "The question on spend. The number of $ in the answer counts." }),
    avoid: f.text({ label: "Steer around", default: "avoid", help: "The question on what to avoid. Not drinking takes the bars out." }),
    hours: f.number({ label: "Hours", default: 4, min: 2, max: 8 }),
    radius: f.number({
      label: "Within (km)",
      default: 1,
      min: 0.3,
      max: 5,
      step: 0.1,
      help: "How far from the neighbourhood's centre. A stop that finds too little looks half as far again, never further.",
    }),
    take: f.number({ label: "Places per stop", default: 5, min: 2, max: 10 }),
  },
  sample: () => samplePlan(sampleIds.places),
  async run(props, ctx) {
    // 1. Where.
    const typed = text(ctx.answers[props.where]);
    if (!typed) return { skipped: true, message: "They didn't say where the date is" };
    const picker = ctx.config.parts.intake.components.find((b) => b.id === props.where);
    const listed = picker ? fieldsSchema(areaFields).parse(picker.props).options : [];
    const known = listed.find((option) => option.name.toLowerCase() === typed.toLowerCase());
    const area = known && parsePoint(known.point) ? { name: known.name, point: parsePoint(known.point)! } : await geocode(typed);
    if (!area) return { skipped: true, message: `Couldn't find ${typed} on the map` };

    // 2. When, and the stops.
    const when = parseWhen(ctx.answers[props.when]);
    const drinks = !noDrinks(ctx.answers[props.avoid], ctx.answers[props.theirs]);
    const shapes = shapeSlots(when.start, props.hours, paceOf(ctx.answers[props.pace]), drinks);
    const end = when.start + props.hours * 60;
    const priceMax = priceOf(ctx.answers[props.budget]);

    // 3. Whose taste: theirs counts three times yours.
    const theirText = text(ctx.answers[props.theirs]).toLowerCase();
    const yourText = text(ctx.answers[props.yours]).toLowerCase();
    const signals = (ctx.brief?.signals ?? []).filter((s) => s.id);
    const theirs = signals.filter((s) => theirText.includes(s.name.toLowerCase()));
    const yours = signals.filter((s) => !theirs.includes(s) && yourText.includes(s.name.toLowerCase()));
    const others = signals.filter((s) => !theirs.includes(s) && !yours.includes(s));
    const entities = [
      ...theirs.map((s) => ({ id: s.id!, weight: 9, name: s.name })),
      ...yours.map((s) => ({ id: s.id!, weight: 3, name: s.name })),
      ...others.map((s) => ({ id: s.id!, weight: 1, name: s.name })),
    ];

    // 4. The places, stop by stop. A place found for an earlier stop stays there.
    const found = new Map<string, TasteEntity>();
    const near = (radiusKm: number) => ({ ...area.point, radiusKm });
    const fill = async (shape: Omit<DateSlot, "places">): Promise<DateSlot> => {
      if (!ctx.qloo.connected) return { ...shape, places: [] };
      await ctx.report(`Finding ${shape.role.toLowerCase()} in ${area.name.split(",")[0]}`);
      const ask = (radiusKm: number, openOn?: string) =>
        ctx.qloo
          .recommend({
            type: "place",
            near: near(radiusKm),
            kinds: shape.kinds,
            take: props.take * 2 + 2,
            // Shops and galleries have no price level in Qloo: a budget would rule them all out.
            priceMax: shape.kinds.every((kind) => priced.has(kind)) ? priceMax : undefined,
            openOn,
            weights: { person: "off", segment: "low" },
            entities,
          })
          .catch(() => [] as TasteEntity[]);
      // Qloo's radius is loose: anything past a longer walk from the centre is dropped, so stops stay a walk apart.
      const reach = props.radius * 1.5;
      const walkable = (e: TasteEntity) => !e.location || haversine(area.point, e.location) <= reach;
      const fresh = (list: TasteEntity[]) => list.filter((e) => !found.has(e.id) && fitsADate(e) && walkable(e));
      let list = fresh(await ask(props.radius, when.day.toLowerCase()));
      // A quiet corner: look a little further, then stop asking about the day.
      if (list.length < 2) list = fresh(await ask(reach, when.day.toLowerCase()));
      if (list.length < 2) list = fresh(await ask(reach));
      const picked = list.slice(0, props.take);
      for (const entity of picked) found.set(entity.id, entity);
      return { ...shape, places: picked.map((e) => e.id) };
    };
    const slots: DateSlot[] = [];
    for (const shape of shapes) slots.push(await fill(shape));
    const extra = await fill(extraSlot(end, drinks));

    // Candidates stop by stop in turn, so a section that takes the first N still gets every stop.
    const lists = [...slots, extra].map((slot) => slot.places);
    const order: string[] = [];
    for (let i = 0; lists.some((list) => i < list.length); i++) for (const list of lists) if (list[i]) order.push(list[i]);

    const plan: DatePlan = {
      area: area.name,
      point: area.point,
      day: when.day,
      date: when.date,
      from: slots[0]?.at ?? "",
      to: extra.at,
      hours: props.hours,
      slots,
      extra,
      theirs: theirs.map((s) => s.name),
      yours: yours.map((s) => s.name),
    };
    return {
      candidates: order.flatMap((id) => found.get(id) ?? []),
      data: plan,
      output: {
        area: plan.area,
        day: plan.day,
        date: plan.date ?? undefined,
        from: plan.from,
        to: plan.to,
        drinks: drinks || undefined,
        noDrinks: !drinks || undefined,
        budget: priceMax ? "$".repeat(priceMax - 1) : "any",
        stops: slots.map((slot) => ({ slot: slot.id, at: slot.at, until: slot.until, for: slot.role, places: slot.places })),
        afterwards: { slot: extra.id, at: extra.at, for: extra.role, places: extra.places },
        theirFavourites: plan.theirs,
        yourFavourites: plan.yours,
      },
      message: `${area.name.split(",")[0]}, ${when.day} ${plan.from} to ${plan.to}${ctx.qloo.connected ? ` · ${found.size} places found` : ""}`,
    };
  },
});
