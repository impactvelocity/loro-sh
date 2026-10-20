/**
 * Profiles are who an experience is personalised for.
 *
 * - Segment: a group described once by the owner (an audience or ICP), with
 *   Qloo demographics and taste signals. Individuals can belong to one.
 * - Individual: one person, arriving by sign-up, trigger or owner. Their
 *   own signals come from intake answers and owner edits, layered on top of
 *   their segment's.
 *
 * Fixtures until D1 is wired up. They match the Itinerary experience's
 * anchor: a Khruangbin show at Moody Center, Austin.
 */
import type { Source } from "./analytics";

export const signalTypes = {
  artist: "Artist",
  place: "Place",
  brand: "Brand",
  movie: "Film",
  tv_show: "TV show",
  book: "Book",
  podcast: "Podcast",
  destination: "Destination",
} as const;
export type SignalType = keyof typeof signalTypes;

export type Signal = { type: SignalType; name: string };

/** Qloo's demographic buckets. */
export const ageRanges = {
  "24_and_younger": "24 and under",
  "25_to_29": "25–29",
  "30_to_34": "30–34",
  "35_to_44": "35–44",
  "45_to_54": "45–54",
  "55_and_older": "55+",
} as const;
export type AgeRange = keyof typeof ageRanges;

/** "25–44", "Up to 34" or "35+", assuming the ranges are contiguous. */
export function ageSummary(ages: AgeRange[]) {
  if (ages.length === 0 || ages.length === Object.keys(ageRanges).length) return "Any age";
  const keys = Object.keys(ageRanges);
  const sorted = [...ages].sort((a, b) => keys.indexOf(a) - keys.indexOf(b));
  const low = sorted[0] === "24_and_younger" ? null : sorted[0].split("_")[0];
  const last = sorted[sorted.length - 1];
  const high = last === "55_and_older" ? null : last.split("_").at(-1);
  if (!low) return `Up to ${high}`;
  if (!high) return `${low}+`;
  return `${low}–${high}`;
}

export type Segment = {
  id: string;
  name: string;
  description: string;
  ages: AgeRange[];
  gender: "any" | "female" | "male";
  location: string;
  signals: Signal[];
  updated: string;
};

export type Status = "invited" | "intake_started" | "intake_completed" | "delivered" | "opened";

/** `delivered` means their outcome is ready. `opened` is from before opens stopped being tracked. */
export const statusLabels: Record<Status, string> = {
  invited: "Invited",
  intake_started: "Started intake",
  intake_completed: "Finished intake",
  delivered: "Outcome ready",
  opened: "Outcome ready",
};

export type Individual = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  source: Source;
  /** What created them, e.g. a booking reference for triggered profiles. */
  sourceDetail: string;
  segmentId: string | null;
  status: Status;
  /** Minutes before now. Fixtures are relative so they always look fresh. */
  lastActiveMinutes: number;
  createdDaysAgo: number;
  intake: { question: string; answer: string }[];
  signals: (Signal & { origin: "intake" | "owner" })[];
  notes: string;
};

export const segments: Segment[] = [
  {
    id: "live-music-weekenders",
    name: "Live music weekenders",
    description:
      "Flying in for the show and staying two nights. They want the whole weekend planned around it: record shops, a good dinner before doors, a bar with a band after.",
    ages: ["25_to_29", "30_to_34", "35_to_44"],
    gender: "any",
    location: "Austin, TX",
    signals: [
      { type: "artist", name: "Khruangbin" },
      { type: "artist", name: "Leon Bridges" },
      { type: "artist", name: "Black Pumas" },
      { type: "place", name: "Continental Club" },
      { type: "place", name: "Waterloo Records" },
      { type: "podcast", name: "Song Exploder" },
    ],
    updated: "2 days ago",
  },
  {
    id: "food-first",
    name: "Food-first travellers",
    description:
      "The show is the excuse; the trip is about where they eat. Book ahead, happy to queue for barbecue, care more about natural wine than cocktails.",
    ages: ["30_to_34", "35_to_44", "45_to_54"],
    gender: "any",
    location: "Austin, TX",
    signals: [
      { type: "place", name: "Franklin Barbecue" },
      { type: "place", name: "Suerte" },
      { type: "place", name: "Nixta Taqueria" },
      { type: "tv_show", name: "The Bear" },
      { type: "book", name: "Salt, Fat, Acid, Heat" },
    ],
    updated: "5 days ago",
  },
  {
    id: "locals-night-out",
    name: "Locals on a night out",
    description:
      "Live in Austin, booked the show a month ago. Don't need a hotel or the tourist spots, want somewhere new to eat nearby and an easy way home.",
    ages: ["24_and_younger", "25_to_29", "30_to_34"],
    gender: "any",
    location: "Austin, TX",
    signals: [
      { type: "artist", name: "Khruangbin" },
      { type: "artist", name: "Men I Trust" },
      { type: "place", name: "Cosmic Coffee + Beer Garden" },
      { type: "brand", name: "Topo Chico" },
    ],
    updated: "1 week ago",
  },
  {
    id: "first-time-visitors",
    name: "First-time visitors",
    description:
      "Never been to Austin. Want the classics without the tourist traps, and a plan that doesn't need a car.",
    ages: ["25_to_29", "30_to_34", "35_to_44", "45_to_54"],
    gender: "any",
    location: "Austin, TX",
    signals: [
      { type: "destination", name: "Austin" },
      { type: "place", name: "Barton Springs Pool" },
      { type: "movie", name: "Dazed and Confused" },
      { type: "brand", name: "Allbirds" },
    ],
    updated: "2 weeks ago",
  },
];

const intakeQuestions = {
  why: "What's bringing you to Austin?",
  who: "Who's coming with you?",
  night: "What does a perfect night out look like?",
  avoid: "Anything we should steer you away from?",
};

export const individuals: Individual[] = [
  {
    id: "maya-okafor",
    name: "Maya Okafor",
    email: "maya.okafor@hey.com",
    phone: "+1 312 555 0148",
    location: "Chicago, IL",
    source: "signup",
    sourceDetail: "Public link · khruangbin-austin",
    segmentId: "live-music-weekenders",
    status: "intake_completed",
    lastActiveMinutes: 4,
    createdDaysAgo: 0,
    intake: [
      { question: intakeQuestions.why, answer: "Khruangbin on Saturday. Making a weekend of it." },
      { question: intakeQuestions.who, answer: "My partner. We're both big on vinyl." },
      { question: intakeQuestions.night, answer: "Small room, a band we've never heard, mezcal." },
      { question: intakeQuestions.avoid, answer: "Sixth Street on a Saturday." },
    ],
    signals: [
      { type: "artist", name: "Hermanos Gutiérrez", origin: "intake" },
      { type: "brand", name: "Del Maguey", origin: "intake" },
    ],
    notes: "",
  },
  {
    id: "theo-lindqvist",
    name: "Theo Lindqvist",
    email: "theo@lindqvist.se",
    location: "Stockholm, Sweden",
    source: "trigger",
    sourceDetail: "Ticket order #MC-48213",
    segmentId: "first-time-visitors",
    status: "delivered",
    lastActiveMinutes: 26,
    createdDaysAgo: 3,
    intake: [
      { question: intakeQuestions.why, answer: "The show, and I've always wanted to see Texas." },
      { question: intakeQuestions.who, answer: "Travelling solo." },
      { question: intakeQuestions.night, answer: "Somewhere I can talk to locals. Not too loud." },
      { question: intakeQuestions.avoid, answer: "I don't eat pork." },
    ],
    signals: [{ type: "podcast", name: "99% Invisible", origin: "intake" }],
    notes: "No pork. Flag barbecue stops accordingly.",
  },
  {
    id: "priya-raman",
    name: "Priya Raman",
    email: "priya.raman@gmail.com",
    location: "Houston, TX",
    source: "signup",
    sourceDetail: "Public link · khruangbin-austin",
    segmentId: "food-first",
    status: "delivered",
    lastActiveMinutes: 95,
    createdDaysAgo: 2,
    intake: [
      { question: intakeQuestions.why, answer: "The show is the excuse. I want to eat." },
      { question: intakeQuestions.who, answer: "Two friends from college." },
      { question: intakeQuestions.night, answer: "Long dinner, natural wine, then the show." },
      { question: intakeQuestions.avoid, answer: "Places that don't take bookings." },
    ],
    signals: [
      { type: "place", name: "Emmer & Rye", origin: "intake" },
      { type: "book", name: "The Food Lab", origin: "owner" },
    ],
    notes: "",
  },
  {
    id: "jonah-feld",
    name: "Jonah Feld",
    email: "jonah.feld@outlook.com",
    location: "Austin, TX",
    source: "owner",
    sourceDetail: "Added by Dylan",
    segmentId: "locals-night-out",
    status: "delivered",
    lastActiveMinutes: 160,
    createdDaysAgo: 1,
    intake: [],
    signals: [
      { type: "artist", name: "Khruangbin", origin: "owner" },
      { type: "place", name: "Kemuri Tatsu-ya", origin: "owner" },
    ],
    notes: "VIP guest of the venue. Keep it close to East Austin.",
  },
  {
    id: "ana-duarte",
    name: "Ana Duarte",
    email: "ana.duarte@proton.me",
    location: "Lisbon, Portugal",
    source: "trigger",
    sourceDetail: "Hotel booking #SJ-2291",
    segmentId: "live-music-weekenders",
    status: "intake_started",
    lastActiveMinutes: 210,
    createdDaysAgo: 4,
    intake: [
      { question: intakeQuestions.why, answer: "Khruangbin. I've seen them in Lisbon twice." },
      { question: intakeQuestions.who, answer: "My sister." },
    ],
    signals: [],
    notes: "",
  },
  {
    id: "sam-whitaker",
    name: "Sam Whitaker",
    email: "sam@whitaker.co",
    location: "Denver, CO",
    source: "signup",
    sourceDetail: "Public link · khruangbin-austin",
    segmentId: null,
    status: "intake_started",
    lastActiveMinutes: 290,
    createdDaysAgo: 0,
    intake: [{ question: intakeQuestions.why, answer: "Work trip, the show is a bonus." }],
    signals: [],
    notes: "",
  },
  {
    id: "lena-brandt",
    name: "Lena Brandt",
    email: "lena.brandt@gmail.com",
    location: "Berlin, Germany",
    source: "signup",
    sourceDetail: "Public link · khruangbin-austin",
    segmentId: "first-time-visitors",
    status: "delivered",
    lastActiveMinutes: 340,
    createdDaysAgo: 6,
    intake: [
      { question: intakeQuestions.why, answer: "First time in the US, the concert decided the city." },
      { question: intakeQuestions.who, answer: "My boyfriend." },
      { question: intakeQuestions.night, answer: "Outside, warm, a beer garden." },
      { question: intakeQuestions.avoid, answer: "We won't rent a car." },
    ],
    signals: [{ type: "place", name: "Zilker Park", origin: "intake" }],
    notes: "",
  },
  {
    id: "marcus-bell",
    name: "Marcus Bell",
    email: "mbell@fastmail.com",
    location: "Nashville, TN",
    source: "trigger",
    sourceDetail: "Ticket order #MC-48377",
    segmentId: "live-music-weekenders",
    status: "delivered",
    lastActiveMinutes: 410,
    createdDaysAgo: 5,
    intake: [
      { question: intakeQuestions.why, answer: "The show, then a night at the Continental Club." },
      { question: intakeQuestions.who, answer: "Three of us from the band." },
      { question: intakeQuestions.night, answer: "Somewhere we can hear a good drummer." },
      { question: intakeQuestions.avoid, answer: "Chain restaurants." },
    ],
    signals: [{ type: "artist", name: "Vulfpeck", origin: "intake" }],
    notes: "",
  },
  {
    id: "ines-moreau",
    name: "Ines Moreau",
    email: "ines.moreau@gmail.com",
    location: "Montréal, QC",
    source: "owner",
    sourceDetail: "Added by Dylan",
    segmentId: "food-first",
    status: "delivered",
    lastActiveMinutes: 520,
    createdDaysAgo: 8,
    intake: [],
    signals: [{ type: "place", name: "Uchi", origin: "owner" }],
    notes: "Press. Food writer for a Montréal magazine.",
  },
  {
    id: "kofi-mensah",
    name: "Kofi Mensah",
    email: "kofi.mensah@icloud.com",
    location: "Austin, TX",
    source: "signup",
    sourceDetail: "Public link · khruangbin-austin",
    segmentId: "locals-night-out",
    status: "intake_completed",
    lastActiveMinutes: 600,
    createdDaysAgo: 1,
    intake: [
      { question: intakeQuestions.why, answer: "I live here. Want to try somewhere new before the show." },
      { question: intakeQuestions.who, answer: "My girlfriend." },
      { question: intakeQuestions.night, answer: "Ramen, then the show, home by one." },
      { question: intakeQuestions.avoid, answer: "Anything downtown that needs parking." },
    ],
    signals: [{ type: "artist", name: "Thundercat", origin: "intake" }],
    notes: "",
  },
];

/** Segment sizes include people beyond the fixtures above. */
const segmentSizes: Record<string, number> = {
  "live-music-weekenders": 412,
  "food-first": 128,
  "locals-night-out": 236,
  "first-time-visitors": 97,
};

export function listSegments() {
  return segments.map((segment) => ({
    ...segment,
    people: segmentSizes[segment.id] ?? 0,
  }));
}

export function getSegment(id: string) {
  return listSegments().find((segment) => segment.id === id);
}

export function listIndividuals() {
  return individuals;
}

export function getIndividual(id: string) {
  return individuals.find((person) => person.id === id);
}

export function segmentMembers(id: string) {
  return individuals.filter((person) => person.segmentId === id);
}

/**
 * One generated outcome for one person. A person can have several: one
 * per experience they finish, or a new one after their answers change.
 */
export type ExperienceStatus = "generating" | "done" | "error";

export type PersonExperience = {
  id: string;
  /** Experience type, a folder in experiences/. */
  experience: string;
  title: string;
  anchor: { name: string; date: string; place: string };
  status: ExperienceStatus;
  createdMinutesAgo: number;
};

export const experienceStatusLabels: Record<ExperienceStatus, string> = {
  generating: "Generating",
  done: "Done",
  error: "Error",
};

const khruangbin = { name: "Khruangbin", date: "Sat 14 Nov", place: "Moody Center" };

const personExperiences: Record<string, PersonExperience[]> = {
  "maya-okafor": [
    { id: "exp-1042", experience: "itinerary", title: "Vinyl, mezcal and Khruangbin", anchor: khruangbin, status: "done", createdMinutesAgo: 3 },
  ],
  "theo-lindqvist": [
    { id: "exp-1031", experience: "itinerary", title: "Your first Austin weekend, no car needed", anchor: khruangbin, status: "done", createdMinutesAgo: 30 },
  ],
  "priya-raman": [
    { id: "exp-1036", experience: "itinerary", title: "Leon Bridges, and a long lunch first", anchor: { name: "Leon Bridges", date: "Sun 6 Dec", place: "ACL Live" }, status: "done", createdMinutesAgo: 95 },
    { id: "exp-1019", experience: "itinerary", title: "Three dinners and a show", anchor: khruangbin, status: "done", createdMinutesAgo: 2900 },
  ],
  "jonah-feld": [
    { id: "exp-1028", experience: "itinerary", title: "East Austin, before and after the show", anchor: khruangbin, status: "done", createdMinutesAgo: 165 },
  ],
  "lena-brandt": [
    { id: "exp-1007", experience: "itinerary", title: "Beer gardens, Barton Springs and Khruangbin", anchor: khruangbin, status: "done", createdMinutesAgo: 345 },
  ],
  "marcus-bell": [
    { id: "exp-1033", experience: "itinerary", title: "Black Pumas, then the Continental Club", anchor: { name: "Black Pumas", date: "Fri 4 Dec", place: "Stubb's" }, status: "done", createdMinutesAgo: 410 },
    { id: "exp-1003", experience: "itinerary", title: "A drummer's weekend in Austin", anchor: khruangbin, status: "done", createdMinutesAgo: 7100 },
  ],
  "ines-moreau": [
    { id: "exp-1044", experience: "itinerary", title: "Hermanos Gutiérrez at the Paramount", anchor: { name: "Hermanos Gutiérrez", date: "Sat 9 Jan", place: "Paramount Theatre" }, status: "generating", createdMinutesAgo: 1 },
    { id: "exp-1011", experience: "itinerary", title: "Where Austin chefs eat on a show night", anchor: khruangbin, status: "done", createdMinutesAgo: 11500 },
  ],
  "kofi-mensah": [
    { id: "exp-1043", experience: "itinerary", title: "Ramen, Khruangbin, home by one", anchor: khruangbin, status: "generating", createdMinutesAgo: 2 },
  ],
};

/** Newest first. */
export function experiencesFor(personId: string) {
  return [...(personExperiences[personId] ?? [])].sort(
    (a, b) => a.createdMinutesAgo - b.createdMinutesAgo,
  );
}

export type HistoryKind = "created" | "intake_started" | "intake_completed" | "generated" | "failed" | "rated";

export type HistoryEvent = {
  id: string;
  kind: HistoryKind;
  label: string;
  detail?: string;
  minutesAgo: number;
};

