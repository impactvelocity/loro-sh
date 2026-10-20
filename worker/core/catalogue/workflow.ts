/**
 * The experience's workflow settings: what turns a finished intake into
 * the outcome. Saved in the config next to the parts.
 *
 * - prompt: what the experience is (the show, the city, the listing, the
 *   product), where and when. Every model call in the run reads it.
 * - skills: skills from Context that every generated section follows.
 * - lookups: the Qloo searches Taste runs (outcome/lookups.ts).
 * - steps: code steps from steps/, each run at its definition's point.
 *
 * The run itself is always: code steps "before", Taste, code steps
 * "after-taste", the outcome's generated sections in their order, Finish,
 * then code steps "finish" in the background.
 */
import type { LanguageModel } from "ai";
import type { ComponentType } from "react";

import type { ExperienceConfig } from "./config";
import type { ProfileRow, Person, Answers } from "./define";
import type { FieldValues, Fields } from "./fields";
import type { TasteBrief } from "../outcome/brief";
import type { PlaceCategory, Weight } from "../outcome/lookups";
import type { EntityType, TasteEntity } from "../outcome/state";


/** Where a code step runs. */
export type StepPoint = "before" | "after-taste" | "finish";

export const stepPoints: Record<StepPoint, { label: string; description: string }> = {
  before: {
    label: "Before Taste",
    description: "Can add notes to the profile before Qloo is asked, e.g. a CRM lookup or the weather.",
  },
  "after-taste": { label: "After Taste", description: "Sees the brief. Its output is given to every section." },
  finish: { label: "After Finish", description: "Runs once the outcome is ready, in the background: webhooks, syncs." },
};

/** What a code step gets. Use `env` for bindings and secrets: don't import cloudflare:workers here, the admin loads this file. */
export type StepContext = {
  env: Cloudflare.Env;
  workspaceId: string;
  /** The generation or test id. */
  runId: string;
  test: boolean;
  person: Person;
  answers: Answers;
  profile: ProfileRow[];
  /** The experience's prompt: what it is, where and when. */
  prompt: string;
  /** The whole experience as the run started, so a step can read its parts, like the lineup on the start page. */
  config: ExperienceConfig;
  /** The first lookup's city, if any: a default for steps that need a place. */
  location: string | null;
  /** From "after-taste" on. */
  brief: TasteBrief | null;
  /** Finished sections' output, by block id. Finish steps see them all. */
  sections: Record<string, unknown>;
  /** Earlier code steps' output, by id. */
  steps: Record<string, unknown>;
  /** Link to the outcome page. */
  outcomeUrl: string | null;
  /** Shows a line on the step while it works. */
  report: (message: string) => Promise<void>;
  /** Qloo, with this person's taste built in once Taste has run. */
  qloo: QlooTools;
  /** The outcome model, through the AI Gateway: for steps that read or write with AI (`generateText` from "ai"). */
  model: LanguageModel;
};

/** A point on the map. */
export type GeoPoint = { lat: number; lng: number };

export type RecommendQuery = {
  type: EntityType;
  /** Places: a city or neighbourhood by name, or a point and how far around it. */
  near?: string | (GeoPoint & { radiusKm?: number });
  /** Places: kinds to look for. None: any kind. */
  kinds?: PlaceCategory[];
  /** Default 10, at most 50. */
  take?: number;
  popularity?: "any" | "known" | "lesser";
  /** Places: 1–4, like dollar signs. */
  priceMax?: number;
  /** Places: open on this day, e.g. "saturday". */
  openOn?: string;
  /**
   * How much the person's and their segment's favourites count, from the
   * brief. Defaults: high, low. Before Taste there are none, so results
   * are ranked by what's popular.
   */
  weights?: Partial<Record<"person" | "segment", Weight>>;
  /** More Qloo ids to steer by, each with a weight greater than 0. `name` shows in "because you like…". */
  entities?: { id: string; weight: number; name?: string }[];
  /** Ids to leave out. The person's own favourites are always left out. */
  exclude?: string[];
  /** Rank only these ids, e.g. a festival's lineup: Qloo scores each one against the person. */
  only?: string[];
};

/**
 * Qloo for code steps, e.g. a road trip step that finds stops along a
 * route. Every call is rate limited and retried for you.
 */
export type QlooTools = {
  /** False without a QLOO_API_KEY: calls then return nothing. */
  connected: boolean;
  /** A name to its Qloo entity, or null. Places come with a `location`. `near` helps find the right one. */
  search: (name: string, type: EntityType, near?: string) => Promise<TasteEntity | null>;
  /** Things of one type ranked for this person, best first. */
  recommend: (query: RecommendQuery) => Promise<TasteEntity[]>;
};

export type StepResult = {
  /** Passed to later steps and sections. Plain JSON. */
  output?: unknown;
  /** "before" steps: lines added to the profile the run is written from. */
  notes?: string[];
  /** Shown on the step when it's done. */
  message?: string;
  /** Didn't apply this time (no URL set, no date): shown as skipped, not failed. */
  skipped?: boolean;
  /** For a step that `provides`: what sections that pick it recommend from, best first. */
  candidates?: TasteEntity[];
  /**
   * "before" steps: answers it fills in for the rest of the run, where the
   * person's are empty, e.g. a listing's location read from its link.
   * Lookups set to "Near an answer" can use them. Not saved to the profile.
   */
  answers?: Answers;
  /**
   * Public: shown on the outcome page, which anyone with the link can open.
   * Components read it with `ctx.outcome.section(<step id>)`, e.g. a
   * listing's photos and price. Plain JSON, nothing private.
   */
  data?: unknown;
};

export type StepDefinition<F extends Fields = Fields> = {
  type: string;
  name: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  at: StepPoint;
  /**
   * "after-taste" steps: returns `candidates` of this type. Sections can
   * then pick this step under From, like a lookup.
   */
  provides?: EntityType;
  /**
   * The run stops if it fails, instead of carrying on without it: for a
   * step the page can't be true without, like the listing it's about.
   */
  required?: boolean;
  fields: F;
  run: (props: FieldValues<F>, ctx: StepContext) => Promise<StepResult>;
  /** Believable `data`, for the editor preview. */
  sample?: (props: FieldValues<F>) => unknown;
};

export function defineStep<F extends Fields>(definition: StepDefinition<F>) {
  return definition;
}

// Every file in steps/ registers itself.
const modules = import.meta.glob<{ default: StepDefinition<any> }>("../../steps/*.ts", { eager: true });
const steps = new Map(Object.values(modules).map(({ default: step }) => [step.type, step]));

export function listSteps(): StepDefinition<any>[] {
  return [...steps.values()];
}

export function getStep(type: string): StepDefinition<any> | undefined {
  return steps.get(type);
}
