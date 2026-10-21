/**
 * The venue's programme: every show in the next month, as the box office
 * lists it. The `programme` code step (steps/programme.ts) reads it from
 * the venue's events API, or from the demo programme below when there
 * isn't one, ranks every show for the person in Qloo and publishes the
 * month as its public data; the start page's What's On, the outcome's
 * picks and its calendar all read it.
 *
 * A show is about one thing Qloo knows: the band playing, the film on
 * screen, the podcast recording live, the artist a dance night is built
 * on. That's its `subject`, and how it gets ranked.
 *
 * Dates are the venue's local days ("2026-10-23"); times are 24-hour
 * local ("19:30"). Plain data and functions, no fetches.
 */
import { z } from "zod";

import type { EntityType } from "@core/outcome/state";

export const eventKinds = {
  gig: { label: "Gigs", one: "Gig" },
  film: { label: "Film nights", one: "Film" },
  comedy: { label: "Comedy", one: "Comedy" },
  dance: { label: "Dance nights", one: "Dance night" },
  podcast: { label: "Live podcasts", one: "Live podcast" },
} as const;
export type EventKind = keyof typeof eventKinds;
export const eventKindIds = Object.keys(eventKinds) as EventKind[];

export const eventStatuses = {
  "on-sale": "On sale",
  "few-left": "Last few",
  "sold-out": "Sold out",
} as const;
export type EventStatus = keyof typeof eventStatuses;

/** One show, as the venue's events API returns it. */
export const venueEvent = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(eventKindIds as [EventKind, ...EventKind[]]).catch("gig"),
  /** What Qloo ranks it by: the band, the film, the podcast. Defaults to the title. */
  subject: z.string().default(""),
  type: z.enum(["artist", "movie", "podcast", "tv_show", "book"]).catch("artist"),
  /** Qloo's id for the subject. Empty: the step finds it by name. */
  qloo: z.string().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doors: z.string().default(""),
  start: z.string(),
  /** The cheapest ticket, in dollars. Null: free or not set. */
  price: z.number().nullable().default(null),
  status: z.enum(["on-sale", "few-left", "sold-out"]).catch("on-sale"),
  /** How it's set up: "Seated", "35mm print", "Standing floor, seats upstairs". */
  format: z.string().default(""),
  age: z.string().default(""),
  url: z.string().default(""),
});
export type VenueEvent = Omit<z.infer<typeof venueEvent>, "type"> & { type: EntityType };

/** One show as the outcome gets it: the box office's facts, plus how it fits this person. */
export type ProgrammeEvent = VenueEvent & {
  /** 0–1, how well Qloo says the subject fits them. Null when Qloo wasn't asked. */
  match: number | null;
  /** They named the subject themselves, or saw it here before. */
  named: boolean;
  /** Their past tickets here name it. */
  seen: boolean;
  /** Fits what they said: the kinds of night, the nights they're free, what they'll spend. */
  fits: { kind: boolean; night: boolean; price: boolean };
  image: string | null;
  /** Their favourites that pulled it up. */
  because: string[];
};

export type Programme = {
  venue: string;
  /** Where the venue is: dates and times are local to it. */
  timeZone: string;
  /** First and last day, inclusive. */
  from: string;
  to: string;
  source: "demo" | "api";
  events: ProgrammeEvent[];
};

export function isProgramme(value: unknown): value is Programme {
  return Boolean(value && typeof value === "object" && Array.isArray((value as Programme).events) && (value as Programme).from);
}

// Dates and times.

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parts = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** Today where the venue is, as "2026-10-20". */
export function localToday(timeZone = "America/Vancouver", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, days: number) {
  const d = parts(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const weekday = (date: string) => parts(date).getUTCDay();
export const dayName = (date: string) => DAYS[weekday(date)];
export const monthName = (date: string) => MONTHS[parts(date).getUTCMonth()];
export const dayOfMonth = (date: string) => parts(date).getUTCDate();

/** "Thursday, October 23". With `short`, "Thu, Oct 23". */
export function dateLabel(date: string, short = false) {
  const d = parts(date);
  const day = DAYS[d.getUTCDay()];
  const month = MONTHS[d.getUTCMonth()];
  return short ? `${day.slice(0, 3)}, ${month.slice(0, 3)} ${d.getUTCDate()}` : `${day}, ${month} ${d.getUTCDate()}`;
}

/** "19:30" → "7:30 PM", "20:00" → "8 PM". */
export function clock(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const h = Number(match[1]) % 24;
  const m = Number(match[2]);
  if (h === 12 && m === 0) return "Noon";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/** "Oct 21 to Nov 19", or "October 21 to 30" in one month. */
export function rangeLabel(from: string, to: string) {
  const a = parts(from);
  const b = parts(to);
  if (a.getUTCMonth() === b.getUTCMonth()) return `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()} to ${b.getUTCDate()}`;
  return `${MONTHS[a.getUTCMonth()].slice(0, 3)} ${a.getUTCDate()} to ${MONTHS[b.getUTCMonth()].slice(0, 3)} ${b.getUTCDate()}`;
}

export const price = (event: Pick<VenueEvent, "price">) => (event.price == null ? "Free" : `$${event.price}`);

export const byDate = <T extends Pick<VenueEvent, "date" | "start">>(a: T, b: T) =>
  a.date.localeCompare(b.date) || a.start.localeCompare(b.start);

/** The weeks the programme spans, Monday first, each day as a date or null outside it. */
export function calendarWeeks(from: string, to: string) {
  const start = addDays(from, -((weekday(from) + 6) % 7));
  const weeks: (string | null)[][] = [];
  for (let day = start; day <= to; ) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++, day = addDays(day, 1)) week.push(day >= from && day <= to ? day : null);
    weeks.push(week);
  }
  return weeks;
}

// What they said, read loosely: an app can send its own words.

const flat = (answer: unknown) => (Array.isArray(answer) ? answer.join(" ") : typeof answer === "string" ? answer : "").toLowerCase();

/** The kinds of night they're after. None said: all of them. */
export function kindsOf(answer: unknown): EventKind[] {
  const text = flat(answer);
  const kinds = eventKindIds.filter((kind) =>
    ({
      gig: /gig|band|music|concert|live/,
      film: /film|cinema|movie|screening/,
      comedy: /comed|stand-?up/,
      dance: /danc|dj|club/,
      podcast: /podcast|talk|conversation/,
    })[kind].test(text),
  );
  return kinds.length ? kinds : eventKindIds;
}

/** The days of the week they can do (0 is Sunday). None said: every day. */
export function nightsOf(answer: unknown): number[] {
  const text = flat(answer);
  const days = new Set<number>();
  if (/week ?night|weekday|midweek/.test(text)) [1, 2, 3, 4].forEach((d) => days.add(d));
  DAYS.forEach((name, i) => new RegExp(`\\b${name.toLowerCase().slice(0, 3)}`).test(text) && days.add(i));
  if (/weekend/.test(text)) [5, 6, 0].forEach((d) => days.add(d));
  if (/any|whenever/.test(text) || days.size === 0) return [0, 1, 2, 3, 4, 5, 6];
  return [...days];
}

/** The most they'd pay for a ticket. Null: any price. */
export function budgetOf(answer: unknown): number | null {
  const text = flat(answer);
  const amount = /\$\s?(\d+)/.exec(text);
  if (amount) return Number(amount[1]);
  return null;
}

/** A show by the entity a section picked, or by title while the id streams in. */
export function findEvent(programme: Programme | null, entity: string | null | undefined) {
  if (!programme || !entity) return null;
  const key = entity.trim().toLowerCase();
  return programme.events.find((event) => event.id.toLowerCase() === key || event.title.toLowerCase() === key) ?? null;
}

/** The shows as a calendar file, at local times where the venue is. Three hours each unless they end later. */
export function calendarFile(events: VenueEvent[], venue: string, timeZone: string, address = "") {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const at = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "").padStart(4, "0")}00`;
  const escape = (text: string) => text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loro//Venue//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@loro.sh`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${timeZone}:${at(event.date, event.doors || event.start)}`,
      "DURATION:PT3H",
      `SUMMARY:${escape(`${event.title} at ${venue}`)}`,
      `DESCRIPTION:${escape([event.doors && event.doors !== event.start ? `Doors ${clock(event.doors)}, starts ${clock(event.start)}` : `Starts ${clock(event.start)}`, event.format, event.url].filter(Boolean).join("\n"))}`,
      ...(address ? [`LOCATION:${escape(address)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

/** A photo of the show's subject from Qloo, by its id, at a width Qloo serves (120, 240, 420, 640, 1080). */
export const qlooImage = (id: string, width = 420) => (id ? `https://images.qloo.com/i/${id}-${width}x-auto.jpg` : "");

// The demo programme: The Wren, a 1931 picture house on Main Street,
// Vancouver, now 650 seats of gigs, film nights, comedy and dance nights.
// Real artists, films and podcasts on a made-up month, laid out by week and
// weekday so it's always the four weeks from tomorrow.

type Row = {
  week: number;
  /** 0 is Sunday. */
  day: number;
  title: string;
  kind: EventKind;
  subject?: string;
  type: EntityType;
  qloo: string;
  doors?: string;
  start: string;
  price: number | null;
  status?: EventStatus;
  format: string;
  age: string;
};

const SEATED = "Seated";
const STANDING = "Standing floor, seats upstairs";
const PRINT = "35mm print";

const rows: Row[] = [
  // Week one.
  { week: 0, day: 3, title: "In the Mood for Love", kind: "film", type: "movie", qloo: "900B6C69-9D86-4153-B8FD-4D6CD726FCF8", start: "19:30", price: 16, format: PRINT, age: "All ages" },
  { week: 0, day: 4, title: "Hermanos Gutiérrez", kind: "gig", type: "artist", qloo: "7E51F8BC-FA1E-4E93-B465-39663E16E7C1", doors: "19:00", start: "20:00", price: 45, status: "few-left", format: SEATED, age: "19+" },
  { week: 0, day: 5, title: "Destroyer", kind: "gig", type: "artist", qloo: "F99BA31E-C404-4AAE-8F26-CD832387EB0E", doors: "19:30", start: "20:30", price: 42, format: STANDING, age: "19+" },
  { week: 0, day: 6, title: "Once in a Lifetime: a Talking Heads night", subject: "Talking Heads", kind: "dance", type: "artist", qloo: "1A758B66-ED5E-4DB7-A8FF-FE4EFA06001B", doors: "21:30", start: "21:30", price: 20, format: "DJs until 2 AM", age: "19+" },
  { week: 0, day: 0, title: "Song Exploder, live", subject: "Song Exploder", kind: "podcast", type: "podcast", qloo: "D95B20A8-0CEA-4BDC-8074-60A303FA1980", doors: "18:30", start: "19:00", price: 35, format: "Live recording, seated", age: "All ages" },
  // Week two.
  { week: 1, day: 2, title: "Tig Notaro", kind: "comedy", type: "artist", qloo: "F102C4D1-EC6A-4769-81CA-E0F312D56C0A", doors: "19:00", start: "20:00", price: 49, status: "few-left", format: SEATED, age: "19+" },
  { week: 1, day: 3, title: "Paris, Texas", kind: "film", type: "movie", qloo: "D68596E5-F60B-4044-8F91-6FF57EA9A25C", start: "19:30", price: 16, format: PRINT, age: "All ages" },
  { week: 1, day: 4, title: "Jessica Pratt", kind: "gig", type: "artist", qloo: "1BFF4538-93DB-45F0-BF46-65FDA34F154D", doors: "19:00", start: "20:00", price: 38, format: SEATED, age: "All ages" },
  { week: 1, day: 5, title: "Ezra Collective", kind: "gig", type: "artist", qloo: "4CCBC47E-4257-4B3F-A9DE-A793C2B7C65A", doors: "19:30", start: "20:30", price: 45, format: STANDING, age: "19+" },
  { week: 1, day: 6, title: "Stop Making Sense, dance-along", subject: "Stop Making Sense", kind: "film", type: "movie", qloo: "1B56E0EB-E4C0-4BAA-9EDC-F8693C0F3EDC", doors: "19:30", start: "20:00", price: 22, format: "Screening, seats out, aisles clear", age: "19+" },
  { week: 1, day: 0, title: "Spirited Away", kind: "film", type: "movie", qloo: "9B33A620-68CA-49B3-BFCF-F09CCF8AD595", start: "13:00", price: 12, format: "Matinee, English subtitles", age: "All ages" },
  // Week three.
  { week: 2, day: 3, title: "Chungking Express", kind: "film", type: "movie", qloo: "D8D8F8A2-F1EC-494C-A384-302A90E6FEFA", start: "19:30", price: 16, format: PRINT, age: "All ages" },
  { week: 2, day: 4, title: "Cassandra Jenkins", kind: "gig", type: "artist", qloo: "26459CDF-9023-4EC0-8223-0F5ACCDC9E5B", doors: "19:00", start: "20:00", price: 32, format: SEATED, age: "All ages" },
  { week: 2, day: 5, title: "Tinariwen", kind: "gig", type: "artist", qloo: "C86738C2-4037-4C51-9C5D-464D4420D85A", doors: "19:30", start: "20:30", price: 55, status: "sold-out", format: STANDING, age: "19+" },
  { week: 2, day: 6, title: "Alvvays", kind: "gig", type: "artist", qloo: "A854F678-4242-4C4B-A21C-38EE521C885B", doors: "18:30", start: "19:30", price: 49, status: "few-left", format: STANDING, age: "All ages" },
  { week: 2, day: 6, title: "Purple Rain: a Prince night", subject: "Prince", kind: "dance", type: "artist", qloo: "0E41BCDA-7C38-4F42-A7CA-22F0DFBDA082", doors: "22:30", start: "22:30", price: 20, format: "DJs until 2 AM", age: "19+" },
  { week: 2, day: 0, title: "99% Invisible, live", subject: "99% Invisible", kind: "podcast", type: "podcast", qloo: "1B466B0E-323A-4EFD-A314-8737F58F1E1B", doors: "18:30", start: "19:00", price: 39, format: "Live recording, seated", age: "All ages" },
  // Week four.
  { week: 3, day: 2, title: "Las Culturistas, live", subject: "Las Culturistas with Matt Rogers and Bowen Yang", kind: "podcast", type: "podcast", qloo: "14EECB60-E987-47CA-8582-D8FEB225C945", doors: "19:00", start: "19:30", price: 45, format: "Live recording, seated", age: "19+" },
  { week: 3, day: 3, title: "Moonlight", kind: "film", type: "movie", qloo: "2955F3C4-36AB-49F3-A818-3597F35EF46C", start: "19:30", price: 16, format: PRINT, age: "All ages" },
  { week: 3, day: 4, title: "Arooj Aftab", kind: "gig", type: "artist", qloo: "B021CBF8-945D-4825-BFA1-F9358BA5D09D", doors: "19:00", start: "20:00", price: 42, format: SEATED, age: "All ages" },
  { week: 3, day: 5, title: "Mdou Moctar", kind: "gig", type: "artist", qloo: "45DF9957-C182-45CA-BD95-04E2959F8C7C", doors: "19:30", start: "20:30", price: 38, format: STANDING, age: "19+" },
  { week: 3, day: 6, title: "Waxahatchee", kind: "gig", type: "artist", qloo: "7A8B7EE3-6A92-453B-AD33-C07D2C029285", doors: "18:30", start: "19:30", price: 45, format: STANDING, age: "All ages" },
  { week: 3, day: 6, title: "Rumours: a Fleetwood Mac night", subject: "Fleetwood Mac", kind: "dance", type: "artist", qloo: "B1414851-6A23-4C52-B647-2A0249B664F9", doors: "22:30", start: "22:30", price: 20, format: "DJs until 2 AM", age: "19+" },
  { week: 3, day: 0, title: "The Big Lebowski, quote-along", subject: "The Big Lebowski", kind: "film", type: "movie", qloo: "BEFD77F0-4AC7-40C0-AF42-BEE51C3E8071", start: "19:00", price: 15, format: "Screening, quotes welcome", age: "19+" },
];

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The demo month: the four weeks from the day after `today`. */
export function demoProgramme(today = localToday()): VenueEvent[] {
  const first = addDays(today, 1);
  return rows
    .map((row): VenueEvent => {
      const date = addDays(first, ((row.day - weekday(first) + 7) % 7) + row.week * 7);
      return {
        id: `${date}-${slug(row.title)}`,
        title: row.title,
        kind: row.kind,
        subject: row.subject ?? row.title,
        type: row.type,
        qloo: row.qloo,
        date,
        doors: row.doors ?? "",
        start: row.start,
        price: row.price,
        status: row.status ?? "on-sale",
        format: row.format,
        age: row.age,
        url: "",
      };
    })
    .toSorted(byDate);
}

/** A believable month for previews: someone who plays Khruangbin and rates In the Mood for Love. */
export function sampleProgramme(today = "2026-10-20"): Programme {
  const events = demoProgramme(today);
  return {
    venue: "The Wren",
    timeZone: "America/Vancouver",
    from: addDays(today, 1),
    to: addDays(today, 28),
    source: "demo",
    events: events.map((event, i) => ({
      ...event,
      match: Math.round((0.97 - ((i * 7) % 23) / 100) * 1000) / 1000,
      named: event.subject === "In the Mood for Love",
      seen: false,
      fits: { kind: event.kind !== "comedy", night: true, price: (event.price ?? 0) <= 50 },
      image: qlooImage(event.qloo),
      because: i % 3 === 0 ? ["Khruangbin"] : i % 3 === 1 ? ["In the Mood for Love"] : [],
    })),
  };
}
