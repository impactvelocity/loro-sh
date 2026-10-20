/**
 * The festival's lineup: days, stages and sets, as the start page's Lineup
 * component holds them. The `lineup` code step (steps/lineup.ts) reads it
 * from there, ranks every act for the person in Qloo, and publishes the
 * timetable as its public data, which the guide's sections draw from.
 *
 * Times are 24-hour local ("19:40"). Anything before 6:00 is the small
 * hours of the same festival day, so "00:45" sorts after "23:15".
 *
 * Plain data and functions: shared by the start page, the step and the guide.
 */
import { f } from "@core/catalogue/fields";

export const billings = [
  { value: "top", label: "Top" },
  { value: "mid", label: "Middle" },
  { value: "low", label: "Small print" },
] as const;
export type Billing = (typeof billings)[number]["value"];

export type LineupDay = { name: string; date: string };
export type LineupStage = { name: string; color: string };
export type LineupSet = {
  artist: string;
  day: string;
  stage: string;
  start: string;
  end: string;
  billing: Billing;
  /** Qloo's entity id. Empty: the step finds it by name. */
  qloo: string;
};

export type Lineup = { days: LineupDay[]; stages: LineupStage[]; sets: LineupSet[] };

/** The Lineup component's fields: the festival's single source of truth. */
export const lineupFields = {
  days: f.list({
    label: "Days",
    itemLabel: "Day",
    max: 7,
    fields: { name: f.text({ label: "Day", placeholder: "Friday" }), date: f.text({ label: "Date", placeholder: "April 16" }) },
  }),
  stages: f.list({
    label: "Stages",
    itemLabel: "Stage",
    max: 12,
    fields: { name: f.text({ label: "Name" }), color: f.color({ label: "Colour", default: "#f25c2a" }) },
  }),
  sets: f.list({
    label: "Sets",
    itemLabel: "Set",
    max: 120,
    fields: {
      artist: f.text({ label: "Artist" }),
      day: f.text({ label: "Day", help: "As named under Days." }),
      stage: f.text({ label: "Stage", help: "As named under Stages." }),
      start: f.text({ label: "Starts", placeholder: "19:40" }),
      end: f.text({ label: "Ends", placeholder: "20:55" }),
      billing: f.segmented({ label: "Billing", options: billings, default: "low" }),
      qloo: f.text({ label: "Qloo id", help: "Optional. Found by name when empty." }),
    },
  }),
};

/** One set as the guide gets it, from the step's public data. */
export type TimetableSet = {
  /** The Qloo entity the guide's sections point at. */
  id: string;
  artist: string;
  day: string;
  stage: string;
  start: string;
  end: string;
  /** 0–1, how well Qloo says the act fits this person. Null when Qloo wasn't asked. */
  match: number | null;
  /** They picked it in the intake, or named it. */
  named: boolean;
};

export type Timetable = { days: LineupDay[]; stages: LineupStage[]; sets: TimetableSet[] };

export function isTimetable(value: unknown): value is Timetable {
  return Boolean(value && typeof value === "object" && Array.isArray((value as Timetable).sets));
}

/** Minutes since midnight of the festival day; the small hours count as late, not early. */
export function minutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  const total = Number(match[1]) * 60 + Number(match[2]);
  return total < 6 * 60 ? total + 24 * 60 : total;
}

/** "19:40" → "7:40". With `meridiem`, "7:40 PM". */
export function clock(time: string, meridiem = false) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const hours = Number(match[1]);
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${match[2]}${meridiem ? (hours < 12 ? " AM" : " PM") : ""}`;
}

export const byTime = <T extends { start: string }>(a: T, b: T) => minutes(a.start) - minutes(b.start);

export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end);
}

export function stageColor(stages: LineupStage[], name: string) {
  return stages.find((stage) => stage.name === name)?.color ?? "var(--primary)";
}

/**
 * An act's photo from Qloo, by its entity id, at a width Qloo serves
 * (120, 160, 240, 420, 640, 1080). Empty without an id.
 */
export const qlooImage = (id: string, width = 420) => (id ? `https://images.qloo.com/i/${id}-${width}x-auto.jpg` : "");

/** A set by the entity a section picked, or by name while the id streams in. */
export function findSet(timetable: Timetable | null, entity: string | null | undefined) {
  if (!timetable || !entity) return null;
  const key = entity.trim().toLowerCase();
  return timetable.sets.find((set) => set.id.toLowerCase() === key || set.artist.toLowerCase() === key) ?? null;
}

// The example: Mirage Valley, three days in the desert near Indio, CA.

const stages: LineupStage[] = [
  { name: "Sundial Stage", color: "#f25c2a" },
  { name: "Palm Court", color: "#1f9e8f" },
  { name: "The Dune", color: "#8c3fc4" },
  { name: "Oasis Tent", color: "#e8a020" },
];

const days: LineupDay[] = [
  { name: "Friday", date: "April 16" },
  { name: "Saturday", date: "April 17" },
  { name: "Sunday", date: "April 18" },
];

type Row = [artist: string, stage: number, start: string, end: string, billing: Billing, qloo: string];

const rows: Record<string, Row[]> = {
  Friday: [
    ["Mdou Moctar", 0, "16:30", "17:30", "low", "45DF9957-C182-45CA-BD95-04E2959F8C7C"],
    ["Japanese Breakfast", 0, "18:00", "19:00", "mid", "AA21934D-3A6E-4973-983F-28604C44E3AC"],
    ["Khruangbin", 0, "19:40", "20:55", "mid", "BAF6317A-DF94-4C90-92AE-63F86560C21B"],
    ["LCD Soundsystem", 0, "21:45", "23:15", "top", "E454D97B-AF51-4D81-A32A-D8EE4B40BFB1"],
    ["Men I Trust", 1, "17:00", "18:00", "low", "86E45BD3-3265-4B47-BF9A-367D583F12A6"],
    ["Beach House", 1, "18:40", "19:45", "mid", "3460E83E-DCD5-4D1B-B3BF-1B6C1D6D2BB8"],
    ["Arooj Aftab", 1, "20:30", "21:30", "low", "B021CBF8-945D-4825-BFA1-F9358BA5D09D"],
    ["Peggy Gou", 2, "20:00", "21:15", "mid", "CCCDAEFE-96FC-414B-9FBD-F07D3D929FB6"],
    ["Bicep", 2, "21:30", "23:00", "mid", "78AA0492-B692-47A8-8BC6-78CB0721AF2F"],
    ["Fred again..", 2, "23:15", "00:45", "mid", "D723CAE9-2A15-4F4B-A8CE-E49F1706D7ED"],
    ["Hermanos Gutiérrez", 3, "16:00", "16:50", "low", "7E51F8BC-FA1E-4E93-B465-39663E16E7C1"],
    ["Altın Gün", 3, "17:30", "18:30", "low", "31DA05F2-0096-4209-94FA-3AE331190494"],
    ["Nilüfer Yanya", 3, "19:10", "20:05", "low", "E433873C-3912-4069-95C9-5078F42C783F"],
  ],
  Saturday: [
    ["Toro y Moi", 0, "16:30", "17:30", "low", "01726594-EDBE-4EAD-AD46-3F81D6983919"],
    ["Kaytranada", 0, "18:00", "19:10", "mid", "BF6AC996-EA91-4F02-B822-42881E60A21E"],
    ["Phoenix", 0, "19:50", "21:00", "mid", "E7649B3E-6FFE-46A1-85F3-836D842B2AF0"],
    ["Tame Impala", 0, "21:50", "23:20", "top", "D1AE8792-9129-46E0-AEE7-2C3A81E91385"],
    ["Clairo", 1, "17:00", "18:00", "low", "9B2140E4-8DEB-452C-BB75-C3B7B6AD198E"],
    ["Mac DeMarco", 1, "18:40", "19:45", "low", "B58E846A-D1F1-4C6A-AFA7-9230F74CAEE0"],
    ["The National", 1, "20:30", "21:45", "mid", "192BB96E-F4BD-4A76-B24E-CD049EC9DFA2"],
    ["Jamie xx", 2, "20:00", "21:30", "mid", "DBFF3527-BCE7-4984-854A-03DC88D5C7CF"],
    ["Four Tet", 2, "21:45", "23:15", "mid", "1FCE26EB-24C4-4AD9-85E0-6F6BC8D262B8"],
    ["Charlotte de Witte", 2, "23:30", "01:00", "low", "83EB2335-C9ED-4418-B25C-0A450F5F7C63"],
    ["Cimafunk", 3, "16:00", "16:50", "low", "29E30258-6E76-45E0-992A-8B4B7C9CF79A"],
    ["Vulfpeck", 3, "17:30", "18:30", "low", "F986ED77-8148-4C4E-BDA1-7240FE7C32D2"],
    ["Thee Sacred Souls", 3, "19:00", "19:55", "low", "FC07BE09-ED83-46BD-AFB1-D5C58D84BDA7"],
    ["Little Simz", 3, "20:30", "21:30", "mid", "823E245F-17E1-49B2-95F8-255130700E2B"],
  ],
  Sunday: [
    ["Leon Bridges", 0, "16:30", "17:30", "mid", "96B907F3-9F2C-4E6E-BCCF-9C9F0173E162"],
    ["Janelle Monáe", 0, "18:00", "19:10", "mid", "5032D31E-1B79-4A40-901D-DCDDFA0F4493"],
    ["Vampire Weekend", 0, "19:50", "21:05", "mid", "6A955457-1D79-41C2-94D2-06683841CD66"],
    ["Tyler, the Creator", 0, "21:55", "23:25", "top", "375758AA-B0FA-4508-8EC1-D7FBFE3A4B3C"],
    ["Faye Webster", 1, "17:00", "18:00", "low", "F562D40B-46B6-493A-9B33-2E8B3B2D4635"],
    ["Fleet Foxes", 1, "18:40", "19:50", "low", "17CA60C4-D34B-4D9C-B6BC-E1CD59BDFAA5"],
    ["Bon Iver", 1, "20:35", "21:50", "mid", "E51DB8F2-7A93-4746-A283-E55B5216FDE1"],
    ["Channel Tres", 2, "19:30", "20:30", "low", "A8B31E0B-8D03-42F8-8273-A3F05B91288D"],
    ["Disclosure", 2, "21:00", "22:30", "mid", "9FB7395E-11E3-46A0-8322-B5A7BEB5E927"],
    ["Justice", 2, "22:45", "00:15", "mid", "066EBC51-DB40-4F86-A121-1D2B625D9185"],
    ["Cymande", 3, "16:00", "16:50", "low", "C1F095DF-B186-4C7F-8CB1-D51B38F69E85"],
    ["BADBADNOTGOOD", 3, "17:30", "18:30", "low", "5DE0ACFB-A7A9-4CE3-B83E-4B1F41D48D55"],
    ["Sudan Archives", 3, "19:00", "19:55", "low", "C1FE36BE-CAF9-4132-89D2-AD42F787CF70"],
    ["Hiatus Kaiyote", 3, "20:30", "21:30", "low", "AC007829-3D79-438E-9F02-11228C82AD38"],
  ],
};

export const exampleLineup: Lineup = {
  days,
  stages,
  sets: Object.entries(rows).flatMap(([day, sets]) =>
    sets.map(([artist, stage, start, end, billing, qloo]) => ({
      artist,
      day,
      stage: stages[stage].name,
      start,
      end,
      billing,
      qloo,
    })),
  ),
};

/** A believable timetable for previews: a fan of Khruangbin and Beach House. */
export function sampleTimetable(lineup: Lineup = exampleLineup): Timetable {
  const named = new Set(["Khruangbin", "Beach House", "Tame Impala"]);
  return {
    days: lineup.days,
    stages: lineup.stages,
    sets: lineup.sets.map((set, i) => ({
      id: set.qloo || set.artist,
      artist: set.artist,
      day: set.day,
      stage: set.stage,
      start: set.start,
      end: set.end,
      match: named.has(set.artist) ? null : Math.round((0.96 - ((i * 7) % 20) / 100) * 1000) / 1000,
      named: named.has(set.artist),
    })),
  };
}

/** Its id in the example, for samples. */
export const exampleId = (artist: string) => exampleLineup.sets.find((set) => set.artist === artist)?.qloo ?? artist;
