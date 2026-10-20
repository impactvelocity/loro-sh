/**
 * The Taste brief: what the Taste step learns about one person, and what
 * every generated section is written from. Server-side only in practice
 * (it holds the profile text); types live here so code steps can read it.
 */
import type { PlaceCategory } from "./lookups";
import type { EntityType, TasteEntity } from "./state";

export type TasteSignal = {
  name: string;
  type: EntityType;
  /** Where it came from: what they answered, their own profile, their segment, or a name a lookup steers by. */
  from: "answers" | "person" | "segment" | "lookup";
  /** Qloo's id once matched; null when Qloo doesn't know it. */
  id: string | null;
};

export type TasteBrief = {
  /** The experience's prompt, the person, their answers, segment and notes, as the model reads them. */
  profile: string;
  /** Two or three sentences on their taste, from the profile and what Qloo matched. */
  summary: string;
  /** Threads the sections can pull on. */
  angles: string[];
  signals: TasteSignal[];
  /** Kinds of place that fit them, for lookups that leave kinds open. */
  categories: PlaceCategory[];
  /** Candidates by lookup id (and by code step id, for steps that provide), best fit first. */
  pools: Record<string, string[]>;
  entities: Record<string, TasteEntity>;
  location: string | null;
  /** False when Qloo isn't connected: sections then write from the profile alone. */
  qloo: boolean;
};
