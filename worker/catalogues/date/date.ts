/**
 * The date: where it happens, when, and the four hours split into stops.
 * The `date` code step (steps/date.ts) builds a DatePlan for each run and
 * publishes it as its public data; the outcome's plan, map and cover read
 * it from there.
 *
 * Plain data and functions, no fetches: shared by the intake, the step and
 * the outcome. The Qloo calls live in the step.
 */
import { f } from "@core/catalogue/fields";
import type { PlaceCategory } from "@core/outcome/lookups";

export type Point = { lat: number; lng: number };

/** A neighbourhood they can pick on the intake. */
export type Area = { name: string; point: string; note: string };

/** The Area Picker's fields: the neighbourhoods on offer. */
export const areaFields = {
  options: f.list({
    label: "Neighbourhoods",
    itemLabel: "Neighbourhood",
    max: 12,
    fields: {
      name: f.text({ label: "Neighbourhood", placeholder: "West Village, New York" }),
      point: f.text({ label: "Point", placeholder: "40.7358, -74.0036", help: "Latitude, longitude: where the walk centres." }),
      note: f.text({ label: "Note", placeholder: "Bleecker, Perry and the side streets" }),
    },
  }),
};

/** One stop's place in the evening: when, how long, and what it's for. */
export type DateSlot = {
  /** Unique in the plan, e.g. "dinner". */
  id: string;
  /** "6 PM", "7:45 PM". */
  at: string;
  until: string;
  minutes: number;
  /** "A drink to start". */
  role: string;
  kinds: PlaceCategory[];
  /** Qloo place ids found for it, best first. */
  places: string[];
};

export type DatePlan = {
  /** "West Village, New York". */
  area: string;
  point: Point;
  /** "Saturday". */
  day: string;
  /** "October 24", when the answer gave a date. */
  date: string | null;
  from: string;
  to: string;
  hours: number;
  /** The four hours, in order. */
  slots: DateSlot[];
  /** For after: a late spot, and somewhere to duck into. Not part of the four hours. */
  extra: DateSlot | null;
  /** Their favourites Qloo matched, by whose they are: the match's, and the planner's. */
  theirs: string[];
  yours: string[];
};

export function isDatePlan(value: unknown): value is DatePlan {
  return Boolean(value && typeof value === "object" && Array.isArray((value as DatePlan).slots) && (value as DatePlan).point);
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "6 PM", "7:45 PM", "Noon", from minutes after midnight. */
export function clock(minutes: number) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 12 && min === 0) return "Noon";
  if (h === 0 && min === 0) return "Midnight";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${min ? `:${String(min).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * When the date starts, from the answer: "Saturday, from 6 PM", "Friday
 * at 7:30pm", or an ISO time from an API ("2026-10-24T18:00"). Saturday
 * at 6 PM when it doesn't say.
 */
export function parseWhen(answer: unknown): { day: string; date: string | null; start: number } {
  const text = (Array.isArray(answer) ? answer.join(" ") : typeof answer === "string" ? answer : "").trim();
  const iso = /(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(text);
  if (iso) {
    const [, y, mo, d, h, mi] = iso;
    const when = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    const day = DAYS[when.getUTCDay()];
    return {
      day: day[0].toUpperCase() + day.slice(1),
      date: `${MONTHS[when.getUTCMonth()]} ${when.getUTCDate()}`,
      start: h ? Number(h) * 60 + Number(mi) : 18 * 60,
    };
  }
  const lower = text.toLowerCase();
  const day = DAYS.find((name) => lower.includes(name)) ?? "saturday";
  let start = 18 * 60;
  const time = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/.exec(lower);
  if (time) {
    const hour = Number(time[1]) % 12 + (time[3] === "pm" ? 12 : 0);
    start = hour * 60 + Number(time[2] ?? 0);
  } else if (/noon|lunch/.test(lower)) start = 12 * 60;
  else if (/morning|brunch/.test(lower)) start = 11 * 60;
  else if (/afternoon/.test(lower)) start = 14 * 60;
  else if (/night|evening|dinner/.test(lower)) start = 18 * 60;
  return { day: day[0].toUpperCase() + day.slice(1), date: null, start };
}

/** How they want to spend it: mostly talking, doing something side by side, or both. */
export type Pace = "talk" | "do" | "both";

export function paceOf(answer: unknown): Pace {
  const text = String(Array.isArray(answer) ? answer.join(" ") : (answer ?? "")).toLowerCase();
  if (/both|mix|bit of/.test(text)) return "both";
  if (/do|side by side|activity|show|look/.test(text)) return "do";
  if (/talk|table|food|drink/.test(text)) return "talk";
  return "both";
}

/** "Doesn't drink", "sober", "no alcohol": plan without bars. */
export function noDrinks(...answers: unknown[]) {
  const text = answers.map((a) => (Array.isArray(a) ? a.join(" ") : String(a ?? ""))).join(" ").toLowerCase();
  return /\b(do(es)?n'?t|not|never|no)\s+(really\s+)?(drink|drinking|alcohol|booze)\b|\bsober\b|teetotal|alcohol[- ]free|no alcohol/.test(text);
}

/** The most they'd pay a place, 1–4 like dollar signs. Undefined: no limit. */
export function priceOf(answer: unknown): number | undefined {
  const text = String(Array.isArray(answer) ? answer.join(" ") : (answer ?? "")).toLowerCase();
  const signs = (/\${1,4}/.exec(text)?.[0].length ?? 0) || (/casual|cheap|low/.test(text) ? 1 : /proper|mid/.test(text) ? 2 : /night|splash|treat/.test(text) ? 3 : 0);
  if (signs === 1) return 2;
  if (signs === 2) return 3;
  return undefined;
}

type SlotShape = { id: string; role: string; share: number; kinds: PlaceCategory[] };

/**
 * The four hours as stops, by the time of day: a coffee and something to
 * look at in the morning, a drink, dinner and something after at night.
 * Talkers get tables; doers get rooms to walk round. No bars for someone
 * who doesn't drink.
 */
export function shapeSlots(start: number, hours: number, pace: Pace, drinks: boolean): Omit<DateSlot, "places">[] {
  const bar = (fallback: PlaceCategory[]): PlaceCategory[] => (drinks ? ["bar"] : fallback);
  const look: PlaceCategory[] = pace === "talk" ? ["outdoors"] : pace === "do" ? ["culture", "shopping"] : ["culture", "outdoors"];
  const after: PlaceCategory[] = pace === "talk" ? bar(["coffee"]) : drinks ? ["music", "bar"] : ["music", "culture"];
  let shapes: SlotShape[];
  if (start < 11.5 * 60) {
    shapes = [
      { id: "coffee", role: "Coffee to start", share: 0.2, kinds: ["coffee"] },
      { id: "look", role: pace === "talk" ? "A walk" : "Something to look at", share: 0.3, kinds: look },
      { id: "browse", role: "A browse", share: 0.15, kinds: ["shopping"] },
      { id: "lunch", role: "A long lunch", share: 0.35, kinds: ["restaurant", "brunch"] },
    ];
  } else if (start < 16 * 60) {
    shapes = [
      { id: "coffee", role: "Coffee to start", share: 0.17, kinds: ["coffee"] },
      { id: "look", role: pace === "talk" ? "A walk" : "Something to look at", share: 0.33, kinds: look },
      { id: "browse", role: pace === "do" ? "A browse" : "Something sweet", share: 0.15, kinds: pace === "do" ? ["shopping"] : ["brunch"] },
      { id: "drink", role: drinks ? "An early drink" : "A late lunch", share: 0.35, kinds: bar(["restaurant"]) },
    ];
  } else {
    shapes = [
      { id: "drink", role: drinks ? "A drink to start" : "Tea or coffee to start", share: 0.2, kinds: bar(["coffee"]) },
      { id: "dinner", role: "Dinner", share: 0.42, kinds: ["restaurant"] },
      { id: "after", role: pace === "talk" ? "Somewhere quieter" : "Something after", share: 0.2, kinds: after },
      { id: "last", role: drinks ? "One more" : "Something sweet", share: 0.18, kinds: bar(["brunch"]) },
    ];
  }
  const total = hours * 60;
  let at = start;
  return shapes.map((shape, i) => {
    // Times on the quarter hour; the last stop takes what's left.
    const minutes = i === shapes.length - 1 ? start + total - at : Math.round((total * shape.share) / 15) * 15;
    const slot = { id: shape.id, at: clock(at), until: clock(at + minutes), minutes, role: shape.role, kinds: shape.kinds };
    at += minutes;
    return slot;
  });
}

/** The spot for after: late if it's evening, a long lunch's coffee if it's day. */
export function extraSlot(end: number, drinks: boolean): Omit<DateSlot, "places"> {
  const evening = end >= 19 * 60;
  return {
    id: "later",
    at: clock(end),
    until: clock(end + 60),
    minutes: 60,
    role: evening ? "If it runs late" : "If you keep going",
    kinds: evening ? (drinks ? ["bar", "music"] : ["coffee", "brunch"]) : drinks ? ["bar", "coffee"] : ["coffee", "culture"],
  };
}

// Geometry, in km on a sphere: plenty for a walk.

const rad = (deg: number) => (deg * Math.PI) / 180;

export function haversine(a: Point, b: Point) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Minutes on foot, allowing for streets not running straight there. */
export function walkMinutes(a: Point, b: Point) {
  return Math.max(1, Math.round(((haversine(a, b) * 1.3) / 5) * 60));
}

/** Walking directions through every stop, in Google Maps. */
export function walkingLink(stops: { name: string; address: string | null }[]) {
  const label = (stop: { name: string; address: string | null }) => [stop.name, stop.address].filter(Boolean).join(", ");
  if (stops.length === 0) return null;
  const [first, ...rest] = stops;
  const last = rest.pop();
  const params = new URLSearchParams({ api: "1", travelmode: "walking", origin: label(first), destination: label(last ?? first) });
  if (rest.length) params.set("waypoints", rest.map(label).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

/** Whose favourite a name is, for "because Maya likes …" and "because you like …". */
export function whose(name: string, plan: Pick<DatePlan, "theirs" | "yours"> | null): "theirs" | "yours" | null {
  const key = name.trim().toLowerCase();
  if (plan?.theirs.some((n) => n.toLowerCase() === key)) return "theirs";
  if (plan?.yours.some((n) => n.toLowerCase() === key)) return "yours";
  return null;
}

/** A believable plan for the editor preview, on the sample places. */
export function samplePlan(places: string[]): DatePlan {
  const at = (i: number) => places[i % Math.max(places.length, 1)] ?? "";
  const slots = shapeSlots(18 * 60, 4, "both", true).map((slot, i) => ({ ...slot, places: [at(i), at(i + 1)].filter(Boolean) }));
  return {
    area: "West Village, New York",
    point: { lat: 40.7358, lng: -74.0036 },
    day: "Saturday",
    date: null,
    from: "6 PM",
    to: "10 PM",
    hours: 4,
    slots,
    extra: { ...extraSlot(22 * 60, true), places: [at(4)].filter(Boolean) },
    theirs: ["Phoebe Bridgers", "In the Mood for Love"],
    yours: ["Khruangbin"],
  };
}
