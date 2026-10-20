/**
 * A code step for road trips: plans the drive to the event, after Taste,
 * so every stop on the way is a real place Qloo picked for this person.
 *
 * 1. Where they start: a city from the intake's Origin Picker (its point
 *    is set there), or one they typed, found with Open-Meteo's geocoder.
 * 2. The road: a driving route from OSRM's public server, no key needed.
 *    If it doesn't answer, a straight line and a rough time stand in.
 * 3. The days: split by how long they'll drive a day, ending in towns
 *    worth a night (catalogues/roadtrip/trip.ts), with a break halfway
 *    on legs over 90 minutes. Days count back from when they roll in.
 * 4. The stops: Qloo places near each town, of the kinds they stop for.
 *    Every place is a candidate for the sections that pick this step; the
 *    trip (road, days, towns, which places are where) is the page's
 *    public data and every section's context.
 */
import { CarIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f, fieldsSchema } from "@core/catalogue/fields";
import type { PlaceCategory } from "@core/outcome/lookups";
import { parsePoint } from "@core/outcome/lookups";
import { sampleIds } from "@core/outcome/samples";
import type { TasteEntity } from "@core/outcome/state";
import {
  type Point,
  type Trip,
  type TripLeg,
  type TripStop,
  cumulative,
  dayOf,
  duration,
  haversine,
  miles,
  originFields,
  sampleTrip,
  slug,
  splitRoute,
  thin,
} from "../catalogues/roadtrip/trip";

/** OSRM's demo car profile runs about a fifth slower than real interstate driving; this matches Google's times on the example routes. */
const OSRM_PACE = 0.8;
const UA = { "user-agent": "Loro (https://github.com/loro-sh)", "accept-language": "en" };

type Geocoded = { name: string; admin1?: string; country_code: string; latitude: number; longitude: number };

/** A typed city to a point, e.g. "Boise, ID". */
async function geocode(text: string): Promise<{ name: string; point: Point } | null> {
  const [name, hint = ""] = text.split(",").map((part) => part.trim());
  const found = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`,
    { signal: AbortSignal.timeout(8_000) },
  )
    .then((r): Promise<{ results?: Geocoded[] }> => (r.ok ? r.json() : Promise.resolve({})))
    .catch(() => ({}) as { results?: Geocoded[] });
  const places = found.results ?? [];
  const h = hint.toLowerCase();
  const place = places.find((p) => h && [p.admin1, p.country_code].some((v) => v?.toLowerCase().startsWith(h))) ?? places[0];
  if (!place) return null;
  return {
    name: [place.name, place.admin1 ?? place.country_code].filter(Boolean).join(", "),
    point: { lat: place.latitude, lng: place.longitude },
  };
}

/** The nearest town's name for a point with no listed town near it. */
async function townAt(point: Point) {
  type Reverse = { address?: Record<string, string> };
  const found = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${point.lat}&lon=${point.lng}`,
    { headers: UA, signal: AbortSignal.timeout(8_000) },
  )
    .then((r): Promise<Reverse> => (r.ok ? r.json() : Promise.resolve({})))
    .catch(() => ({}) as Reverse);
  const a = found.address ?? {};
  const town = a.city ?? a.town ?? a.village ?? a.county;
  const region = a["ISO3166-2-lvl4"]?.split("-")[1] ?? a.state;
  return town ? [town, region].filter(Boolean).join(", ") : "On the road";
}

/** The road from OSRM, or a straight line with a guessed time. */
async function road(from: Point, to: Point): Promise<{ line: Point[]; km: number; hours: number; source: Trip["source"] }> {
  type Osrm = { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const found = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) })
    .then((r) => (r.ok ? r.json<Osrm>() : null))
    .catch(() => null);
  const route = found?.code === "Ok" ? found.routes?.[0] : undefined;
  if (route && route.geometry.coordinates.length > 1) {
    return {
      line: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      km: route.distance / 1000,
      hours: (route.duration / 3600) * OSRM_PACE,
      source: "osrm",
    };
  }
  // Roads wind about a quarter longer than the crow flies; 95 km/h with stops.
  const km = haversine(from, to) * 1.25;
  const line = Array.from({ length: 41 }, (_, i) => ({
    lat: from.lat + ((to.lat - from.lat) * i) / 40,
    lng: from.lng + ((to.lng - from.lng) * i) / 40,
  }));
  return { line, km, hours: km / 95, source: "estimate" };
}

/** What they stop for, as kinds of place. */
function kindsFrom(answer: unknown) {
  const text = (Array.isArray(answer) ? answer.join(" ") : typeof answer === "string" ? answer : "").toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  return {
    coffee: has(/coffee|caf/),
    restaurant: has(/lunch|food|eat|meal|dinner|taco|bbq/),
    shopping: has(/record|vinyl|vintage|shop|book/),
    outdoors: has(/view|hike|outdoor|park|nature|swim|lake/),
    culture: has(/museum|art|gallery/),
    bar: has(/drink|bar|beer|wine|cocktail/),
    music: has(/music|show|gig|band/),
  } satisfies Partial<Record<PlaceCategory, boolean>>;
}

/** Qloo's restaurant and bar tags take in clubs, casinos and campus canteens: not a road trip stop. */
const notAStop = /country club|golf|casino|dining (hall|commons)|racquet|resort|hotel|starbucks/i;
const fitsTheRoad = (entity: TasteEntity) => !notAStop.test([entity.name, ...entity.tags].join(" "));

const firstNumber = (answer: unknown) => {
  const match = /(\d+(?:\.\d+)?)/.exec(Array.isArray(answer) ? answer.join(" ") : String(answer ?? ""));
  return match ? Number(match[1]) : null;
};

export default defineStep({
  type: "route",
  name: "Route",
  description: "Plans the drive to the event: the road, the days, and places to stop in each town, found in Qloo for this person.",
  icon: CarIcon,
  at: "after-taste",
  provides: "place",
  fields: {
    origin: f.text({ label: "Starting point", default: "origin", help: "The question where they say where they drive from." }),
    hours: f.text({
      label: "Hours a day",
      default: "hours",
      help: "The question on how long they'll drive a day. The first number in the answer counts.",
    }),
    stops: f.text({ label: "Stops", default: "stops", help: "The question on what they stop for." }),
    arrive: f.text({
      label: "Arrival",
      default: "arrive",
      help: "The question on when they roll in. An answer naming the first day means that morning; anything else, the night before.",
    }),
    destination: f.text({ label: "Destination", default: "Mirage Valley" }),
    point: f.text({ label: "Destination point", default: "33.6823, -116.2376", help: "Latitude, longitude of the gates." }),
    firstDay: f.text({ label: "First day", default: "2027-04-16", placeholder: "2027-04-16" }),
    perDay: f.number({ label: "Hours a day if unanswered", default: 7, min: 2, max: 14 }),
    take: f.number({ label: "Places per kind, per town", default: 3, min: 1, max: 6 }),
  },
  sample: () => sampleTrip(sampleIds.places),
  async run(props, ctx) {
    const to = parsePoint(props.point);
    if (!to) return { skipped: true, message: "No destination point set" };
    const answer = ctx.answers[props.origin];
    const typed = (Array.isArray(answer) ? answer[0] : typeof answer === "string" ? answer : "")?.trim() ?? "";
    if (!typed) return { skipped: true, message: "They didn't say where they're driving from" };

    // 1. Where they start: a listed city's point, or the one they typed.
    const picker = ctx.config.parts.intake.components.find((b) => b.id === props.origin);
    const listed = picker ? fieldsSchema(originFields).parse(picker.props).options : [];
    const known = listed.find((option) => option.name.toLowerCase() === typed.toLowerCase());
    const start = known && parsePoint(known.point) ? { name: known.name, point: parsePoint(known.point)! } : await geocode(typed);
    if (!start) return { skipped: true, message: `Couldn't find ${typed} on the map` };

    // 2. The road.
    await ctx.report(`Routing ${start.name} to ${props.destination}`);
    const route = await road(start.point, to);
    const total = cumulative(route.line).at(-1) ?? route.km;
    const kmScale = route.km / Math.max(total, 1);

    // 3. The days.
    const perDay = Math.min(14, Math.max(2, firstNumber(ctx.answers[props.hours]) ?? props.perDay));
    const { legs } = splitRoute(route.line, route.hours, perDay);
    const firstDayName = dayOf(props.firstDay, 0).day.toLowerCase();
    const arriveText = String(ctx.answers[props.arrive] ?? "").toLowerCase();
    const arrivalOffset = arriveText.includes(firstDayName) ? 0 : -1;
    const rollIn = arrivalOffset === 0 ? `the morning of ${dayOf(props.firstDay, 0).day}` : `${dayOf(props.firstDay, -1).day} evening`;

    // 4. The stops, and Qloo's places in each.
    const wants = kindsFrom(ctx.answers[props.stops]);
    const breakKinds = (["coffee", "restaurant", "shopping", "outdoors", "culture"] as const).filter((k) => wants[k]).slice(0, 2);
    const nightKinds: PlaceCategory[] = [
      "restaurant",
      ...(wants.music ? (["music"] as const) : wants.bar ? (["bar"] as const) : []),
      wants.coffee ? "coffee" : "brunch",
    ];
    const plans: { stop: TripStop; kinds: PlaceCategory[]; radiusKm: number }[] = [];
    const used = new Set<string>();
    const stopFor = async (town: { name: string; lat: number; lng: number }, role: TripStop["role"]) => {
      const name = town.name || (await townAt(town));
      let id = slug(name) || role;
      while (used.has(id)) id = `${id}-2`;
      used.add(id);
      return { id, town: name, lat: town.lat, lng: town.lng, role, places: [] } satisfies TripStop;
    };
    const origin: TripStop = { id: slug(start.name), town: start.name, ...start.point, role: "start", places: [] };
    used.add(origin.id);
    const destination: TripStop = { id: "arrive", town: props.destination, ...to, role: "arrive", places: [] };
    used.add(destination.id);

    const tripLegs: TripLeg[] = [];
    for (const [i, leg] of legs.entries()) {
      const stops: TripStop[] = [];
      if (leg.break) {
        const stop = await stopFor(leg.break, "break");
        stops.push(stop);
        plans.push({ stop, kinds: breakKinds.length ? [...breakKinds] : ["coffee", "restaurant"], radiusKm: 12 });
      }
      if (leg.end) {
        const stop = await stopFor(leg.end, "overnight");
        stops.push(stop);
        plans.push({ stop, kinds: nightKinds, radiusKm: 10 });
      } else {
        stops.push(destination);
      }
      const { day, date } = dayOf(props.firstDay, arrivalOffset - (legs.length - 1 - i));
      const km = (leg.to - leg.from) * kmScale;
      tripLegs.push({
        day,
        date,
        from: i === 0 ? origin.town : (tripLegs[i - 1].to ?? origin.town),
        to: stops.at(-1)!.town,
        km: Math.round(km),
        hours: Math.round(((leg.to - leg.from) / Math.max(total, 1)) * route.hours * 10) / 10,
        stops,
      });
    }
    // Rolling in the night before: dinner near the grounds.
    if (arrivalOffset < 0) plans.push({ stop: destination, kinds: ["restaurant", wants.music ? "music" : "bar"], radiusKm: 25 });

    const entities = new Map<string, TasteEntity>();
    if (ctx.qloo.connected) {
      for (const plan of plans) {
        await ctx.report(`Finding stops in ${plan.stop.town}`);
        const found = await ctx.qloo
          .recommend({
            type: "place",
            near: { lat: plan.stop.lat, lng: plan.stop.lng, radiusKm: plan.radiusKm },
            kinds: plan.kinds,
            // A few spare, for the ones fitsTheRoad drops.
            take: plan.kinds.length * props.take + 3,
          })
          .catch(() => []);
        // A place found for an earlier town stays there.
        const fresh = found.filter((e) => !entities.has(e.id) && fitsTheRoad(e));
        plan.stop.places = fresh.map((e) => e.id);
        for (const entity of fresh) entities.set(entity.id, entity);
      }
    }

    // Candidates by town in turn, so a section that takes the first N still gets every town.
    const lists = plans.map((plan) => plan.stop.places);
    const order: string[] = [];
    for (let i = 0; lists.some((list) => i < list.length); i++) for (const list of lists) if (list[i]) order.push(list[i]);

    const trip: Trip = {
      origin,
      destination,
      km: Math.round(route.km),
      hours: Math.round(route.hours * 10) / 10,
      line: thin(route.line),
      legs: tripLegs,
      perDay,
      source: route.source,
    };
    const stopsFound = entities.size;
    return {
      candidates: order.flatMap((id) => entities.get(id) ?? []),
      data: trip,
      output: {
        from: origin.town,
        to: props.destination,
        miles: miles(trip.km),
        driving: duration(trip.hours),
        hoursADay: perDay,
        rollIn,
        roughEstimate: route.source === "estimate" || undefined,
        days: tripLegs.map((leg) => ({
          day: leg.day,
          date: leg.date,
          startsIn: leg.from,
          endsIn: leg.to,
          drive: `${miles(leg.km)} mi, about ${duration(leg.hours)}`,
          stops: leg.stops.map((stop) => ({
            town: stop.town,
            role: { start: "start", break: "a break on the way", overnight: "where they sleep", arrive: "the festival" }[stop.role],
            places: stop.places,
          })),
        })),
        nightBefore: arrivalOffset < 0 ? { town: props.destination, places: destination.places } : undefined,
      },
      message:
        `${origin.town} to ${props.destination}: ${miles(trip.km).toLocaleString("en-US")} mi over ${tripLegs.length} ` +
        `${tripLegs.length === 1 ? "day" : "days"}${ctx.qloo.connected ? ` · ${stopsFound} places found` : ""}`,
    };
  },
});
