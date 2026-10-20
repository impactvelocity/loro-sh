/**
 * Profiles as stored in D1 (profiles.server.ts): segments, the people in
 * them, and each person's submissions to experiences. The signal, age and
 * status vocabularies are shared with the fixtures in profiles.ts.
 */
import { z } from "zod";

import type { Source } from "./analytics";
import type { ProfileRow } from "./catalogue/define";
import { type AgeRange, type Signal, type SignalType, type Status, ageRanges, signalTypes } from "./profiles";

export type Gender = "any" | "female" | "male";
export const genders: Record<Gender, string> = { any: "Any", female: "Female", male: "Male" };

export type OwnSignal = Signal & { origin: "intake" | "owner" };

export type SegmentRecord = {
  id: string;
  name: string;
  description: string;
  ages: AgeRange[];
  gender: Gender;
  location: string;
  signals: Signal[];
  people: number;
  updatedAt: number;
};

export type PersonRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  source: Source;
  /** What created them: the experience they signed up to, or "Added by your team". */
  sourceDetail: string;
  segmentId: string | null;
  segmentName: string | null;
  status: Status;
  signals: OwnSignal[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number | null;
};

export type SubmissionRecord = {
  id: string;
  funnelSlug: string | null;
  funnelName: string;
  status: "started" | "completed";
  /** Question/answer rows as they were asked. */
  profile: ProfileRow[];
  createdAt: number;
  updatedAt: number;
};

const signal = z.object({
  type: z.enum(Object.keys(signalTypes) as [SignalType, ...SignalType[]]),
  name: z.string().trim().min(1).max(120),
});

export const personInput = z.object({
  name: z.string().trim().min(1, "Give them a name.").max(80),
  email: z.union([z.literal(""), z.email("Check the email address.")]),
  phone: z.string().trim().max(40).catch(""),
  location: z.string().trim().max(120).catch(""),
  segmentId: z.string().nullable().catch(null),
  signals: z.array(signal.extend({ origin: z.enum(["intake", "owner"]).catch("owner") })).max(100).catch([]),
  notes: z.string().max(4000).catch(""),
});
/** Everything but the name and email falls back to empty. */
export type PersonInput = Partial<z.input<typeof personInput>> & Pick<z.input<typeof personInput>, "name" | "email">;

export const segmentInput = z.object({
  name: z.string().trim().min(1, "Give the segment a name.").max(80),
  description: z.string().trim().max(2000).catch(""),
  ages: z.array(z.enum(Object.keys(ageRanges) as [AgeRange, ...AgeRange[]])).catch([]),
  gender: z.enum(["any", "female", "male"]).catch("any"),
  location: z.string().trim().max(120).catch(""),
  signals: z.array(signal).max(100).catch([]),
});
export type SegmentInput = Partial<z.input<typeof segmentInput>> & Pick<z.input<typeof segmentInput>, "name">;

/** "2h ago", from unix seconds. */
export function since(seconds: number | null, now = Date.now() / 1000) {
  if (!seconds) return "Never";
  const minutes = Math.max(0, Math.round((now - seconds) / 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
