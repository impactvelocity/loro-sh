/**
 * Funnel analytics. Every experience reaches people one of three ways, so
 * each metric is split by source:
 *
 * - signup:  someone finds a public link, signs up, completes intake.
 * - trigger: an API call after an event (booking, ticket, purchase) creates
 *            a known profile and invites them to intake.
 * - owner:   the owner creates the profile for someone, so there's no
 *            intake step.
 *
 * The numbers come from daily event counts in D1 (events.server.ts and
 * analytics.server.ts). Ranges are capped at 90 days, matching Analytics
 * Engine's retention, so the 90 day view has no previous period.
 */
export const sources = ["signup", "trigger", "owner"] as const;
export type Source = (typeof sources)[number];

export const sourceLabels: Record<Source, string> = {
  signup: "Sign-up",
  trigger: "Triggered",
  owner: "Owner-created",
};

export const ranges = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type Range = keyof typeof ranges;
export const RETENTION_DAYS = 90;

export function parseRange(value: string | null): Range {
  return value && value in ranges ? (value as Range) : "30d";
}

export type Day = {
  date: string;
  views: number;
  profiles: Record<Source, number>;
  intakeStarted: Record<Source, number>;
  intakeCompleted: Record<Source, number>;
  generated: Record<Source, number>;
};

export type ActivityEvent = "intake_started" | "intake_completed" | "generated" | "failed";

export type Activity = {
  /** Activity row id. */
  id: number;
  personId: string;
  at: number;
  name: string;
  email: string;
  source: Source;
  event: ActivityEvent;
  experience: string | null;
};

export type Totals = {
  views: number;
  profiles: number;
  generated: number;
  /** Intakes finished / started. Owner-created profiles skip intake. */
  completionRate: number;
};

export type FunnelRow = {
  source: Source;
  entered: number;
  /** Null for owner-created profiles, which have no intake. */
  intakeStarted: number | null;
  intakeCompleted: number | null;
  generated: number;
};

export type Analytics = {
  range: Range;
  days: Day[];
  totals: Totals;
  /** Null when the previous period falls outside retention. */
  previous: Totals | null;
  funnel: FunnelRow[];
  activity: Activity[];
};

const zero = (): Record<Source, number> => ({ signup: 0, trigger: 0, owner: 0 });
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const sumSources = (record: Record<Source, number>) => sum(sources.map((s) => record[s]));

/** `length` days ending today, oldest first, with nothing counted yet. */
export function emptyDays(today: Date, length: number): Day[] {
  return Array.from({ length }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (length - 1 - index));
    return {
      date: date.toISOString().slice(0, 10),
      views: 0,
      profiles: zero(),
      intakeStarted: zero(),
      intakeCompleted: zero(),
      generated: zero(),
    };
  });
}

type CountRow = { day: string; name: string; source: string; count: number };

/** Fills days from event_counts rows. Days or events outside the range are ignored. */
export function daysFromCounts(rows: CountRow[], today: Date, length: number): Day[] {
  const days = emptyDays(today, length);
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const row of rows) {
    const day = byDate.get(row.day);
    if (!day) continue;
    const source = (sources as readonly string[]).includes(row.source) ? (row.source as Source) : null;
    if (row.name === "view") day.views += row.count;
    else if (source && row.name === "profile") day.profiles[source] += row.count;
    else if (source && row.name === "intake_started") day.intakeStarted[source] += row.count;
    else if (source && row.name === "intake_completed") day.intakeCompleted[source] += row.count;
    else if (source && row.name === "generated") day.generated[source] += row.count;
  }
  return days;
}

export function totalsFor(days: Day[]): Totals {
  const started = sum(days.map((day) => sumSources(day.intakeStarted)));
  return {
    views: sum(days.map((day) => day.views)),
    profiles: sum(days.map((day) => sumSources(day.profiles))),
    generated: sum(days.map((day) => sumSources(day.generated))),
    completionRate: started ? sum(days.map((day) => sumSources(day.intakeCompleted))) / started : 0,
  };
}

export function funnelFor(days: Day[]): FunnelRow[] {
  return sources.map((source) => {
    const total = (key: "profiles" | "intakeStarted" | "intakeCompleted" | "generated") =>
      sum(days.map((day) => day[key][source]));
    return {
      source,
      entered: total("profiles"),
      intakeStarted: source === "owner" ? null : total("intakeStarted"),
      intakeCompleted: source === "owner" ? null : total("intakeCompleted"),
      generated: total("generated"),
    };
  });
}

// Small deterministic PRNG so the sample numbers are stable.
function random(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function around(base: number, seed: number, spread = 0.35) {
  return Math.max(0, Math.round(base * (1 - spread + random(seed) * spread * 2)));
}

/** Ninety days of believable numbers, seeded into demo workspaces as event counts. */
export function sampleDays(today: Date): Day[] {
  return emptyDays(today, RETENTION_DAYS).map((day, index) => {
    // Slow growth over the quarter, busier towards the weekend.
    const growth = 0.6 + (index / RETENTION_DAYS) * 0.7;
    const weekday = new Date(day.date).getUTCDay();
    const weekly = weekday === 5 || weekday === 6 ? 1.35 : weekday === 0 ? 1.1 : 1;
    const scale = growth * weekly;
    const seed = index * 97;

    const profiles = {
      signup: around(14 * scale, seed + 1),
      trigger: around(9 * scale, seed + 2),
      owner: around(2.5 * scale, seed + 3, 0.8),
    };
    const intakeCompleted = {
      signup: Math.round(profiles.signup * (0.66 + random(seed + 4) * 0.14)),
      trigger: Math.round(profiles.trigger * (0.8 + random(seed + 5) * 0.12)),
      owner: 0,
    };
    return {
      ...day,
      views: around(190 * scale, seed + 6, 0.25),
      profiles,
      intakeStarted: { signup: profiles.signup, trigger: profiles.trigger, owner: 0 },
      intakeCompleted,
      generated: { signup: intakeCompleted.signup, trigger: intakeCompleted.trigger, owner: profiles.owner },
    };
  });
}
