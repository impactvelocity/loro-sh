/**
 * An experience's config: what the admin saves and the runner renders.
 * Plain JSON, so it fits in a D1 column and can be written by an agent.
 *
 * {
 *   catalogue: "basic",
 *   parts: {
 *     start:    { enabled, settings: { brand, nav… }, components: [{ id, type: "hero", props }] },
 *     intake:   { enabled, settings, components: [{ id: "goal", type: "text", props }] },
 *     artifact: { enabled, settings, components: […] },
 *   },
 *   workflow: {
 *     prompt: "A weekend plan for Khruangbin at Moody Center…", skills: [ids],
 *     lookups: [{ id: "lookup-1", props: { name: "Bars near the hotel", type: "place", near: "answer"… } }],
 *     steps: [{ id, type: "weather", props }],
 *   },
 *   feedback: { enabled, placement: "right", text: { title… } },
 * }
 */
import { z } from "zod";

import { type LookupConfig, type LookupProps, defaultCity, lookupFields } from "../outcome/lookups";
import { type AnyDefinition, type Catalogue, type PartId, findDefinition, isGenerated, partIds } from "./define";
import { type FeedbackConfig, feedbackSchema } from "./feedback";
import { defaultsOf, fieldsSchema } from "./fields";
import { getStep } from "./workflow";

export type BlockConfig = {
  /** Unique in the experience. For intake inputs it's the answer's key on the profile. */
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export type PartConfig = {
  enabled: boolean;
  /** The layout's fields. */
  settings: Record<string, unknown>;
  components: BlockConfig[];
};

/** How the outcome is made (catalogue/workflow.ts). */
export type WorkflowConfig = {
  /** What the experience is, where and when. Every model call in the run reads it. */
  prompt: string;
  /** Skill ids every generated section follows. */
  skills: string[];
  /** Qloo searches the Taste step runs; sections pick from them (outcome/lookups.ts). */
  lookups: LookupConfig[];
  /** Code steps from steps/. */
  steps: BlockConfig[];
};

export type ExperienceConfig = {
  catalogue: string;
  name: string;
  parts: Record<PartId, PartConfig>;
  workflow: WorkflowConfig;
  /** The rating widget on the outcome (catalogue/feedback.ts). */
  feedback: FeedbackConfig;
};

const record = z.record(z.string(), z.unknown());

const rawPart = z
  .object({
    enabled: z.boolean().catch(true),
    settings: record.catch({}),
    components: z.array(z.unknown()).catch([]),
  })
  .catch({ enabled: true, settings: {}, components: [] });

const rawBlock = z.object({
  id: z.string().min(1),
  type: z.string(),
  props: record.catch({}),
});

/** Before the prompt, an experience had an anchor. Its parts now live in the prompt and the lookups. */
const rawAnchor = z
  .object({
    name: z.string().catch(""),
    location: z.string().catch(""),
    date: z.string().catch(""),
    about: z.string().catch(""),
  })
  .catch({ name: "", location: "", date: "", about: "" });
type RawAnchor = z.output<typeof rawAnchor>;

const rawWorkflow = z
  .object({
    prompt: z.string().optional().catch(undefined),
    anchor: rawAnchor,
    skills: z.array(z.string()).catch([]),
    // Missing on configs saved before lookups: they're made from the sections then.
    lookups: z.array(z.unknown()).optional().catch(undefined),
    steps: z.array(z.unknown()).catch([]),
  })
  .catch({ prompt: undefined, anchor: rawAnchor.parse(undefined), skills: [], lookups: undefined, steps: [] });

function anchorPrompt(anchor: RawAnchor) {
  return [
    anchor.name,
    anchor.location && `Where: ${anchor.location}`,
    anchor.date && `When: ${anchor.date}`,
    anchor.about,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * A lookup saved against an anchor: "near the anchor" becomes its city,
 * "open on the anchor's date" that day, and weighing the anchor steers by
 * its name.
 */
function fromAnchor(props: Record<string, unknown>, anchor: RawAnchor): Record<string, unknown> {
  const out = { ...props };
  if (props.near === "anchor") Object.assign(out, { near: "city", place: anchor.location });
  if (props.near === "fixed") out.near = "place";
  if (props.open === true) out.day = weekday(anchor.date) ?? "any";
  if (typeof props.anchor === "string" && props.anchor !== "off" && anchor.name) {
    Object.assign(out, { steer: anchor.name, steerWeight: props.anchor });
  }
  return out;
}

/** The day of the week for a YYYY-MM-DD date, lower case. */
function weekday(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase();
}

const rawLookup = z.object({ id: z.string().min(1), props: record.catch({}) });

const rawConfig = z.object({
  catalogue: z.string(),
  workflow: rawWorkflow,
  feedback: feedbackSchema,
  name: z.string().catch("Untitled"),
  parts: z.object({ start: rawPart, intake: rawPart, artifact: rawPart }).catch({
    start: rawPart.parse(undefined),
    intake: rawPart.parse(undefined),
    artifact: rawPart.parse(undefined),
  }),
});

/**
 * Reads a saved config against its catalogue. Unknown components are
 * dropped and props are filled from field defaults, so a config saved
 * before a catalogue changed still renders.
 */
export function parseConfig(catalogue: Catalogue, input: unknown): ExperienceConfig {
  const raw = rawConfig.parse(input);
  const seen = new Set<string>();
  // Ids first, so a section upgraded below can't take a saved lookup's.
  for (const value of raw.workflow.lookups ?? []) {
    const lookup = rawLookup.safeParse(value);
    if (lookup.success) seen.add(lookup.data.id);
  }
  const lookups: LookupConfig[] = [];
  const known = new Set<string>();
  for (const value of raw.workflow.lookups ?? []) {
    const lookup = rawLookup.safeParse(value);
    if (!lookup.success || known.has(lookup.data.id)) continue;
    known.add(lookup.data.id);
    const props = fromAnchor(lookup.data.props, raw.workflow.anchor);
    lookups.push({ id: lookup.data.id, props: fieldsSchema(lookupFields).parse(props) });
  }
  const upgrade = raw.workflow.lookups === undefined;
  const city = raw.workflow.anchor.location;
  // Code steps that provide candidates are picked like lookups, by id.
  for (const value of raw.workflow.steps) {
    const block = rawBlock.safeParse(value);
    if (block.success && getStep(block.data.type)?.provides) known.add(block.data.id);
  }

  const parts = Object.fromEntries(
    partIds.map((partId) => {
      const definition = catalogue.parts[partId];
      const part = raw.parts[partId];
      const components = part.components.flatMap((value) => {
        const block = rawBlock.safeParse(value);
        if (!block.success || seen.has(block.data.id)) return [];
        const component = findDefinition(catalogue, partId, block.data.type);
        if (!component) return [];
        seen.add(block.data.id);
        const props = fieldsSchema(component.fields).parse(block.data.props);
        if (isGenerated(component) && component.generate.picks) {
          props.lookups = upgrade
            ? [startingLookup(lookups, seen, { place: city, ...component.generate.lookup?.(block.data.props) })]
            : (props.lookups as string[]).filter((id) => known.has(id));
        }
        return [{ ...block.data, props }];
      });
      const settings = definition.layout ? fieldsSchema(definition.layout.fields).parse(part.settings) : {};
      // There's always an outcome; it's what the experience is for.
      const enabled = partId === "artifact" ? true : part.enabled;
      return [partId, { enabled, settings, components }];
    }),
  ) as Record<PartId, PartConfig>;

  // Code steps whose file is gone are dropped, like components.
  const steps = raw.workflow.steps.flatMap((value) => {
    const block = rawBlock.safeParse(value);
    const step = block.success ? getStep(block.data.type) : undefined;
    if (!block.success || !step || seen.has(block.data.id)) return [];
    seen.add(block.data.id);
    return [{ ...block.data, props: fieldsSchema(step.fields).parse(block.data.props) }];
  });
  const workflow: WorkflowConfig = {
    prompt: raw.workflow.prompt ?? anchorPrompt(raw.workflow.anchor),
    skills: [...new Set(raw.workflow.skills)],
    lookups,
    steps,
  };

  return { catalogue: catalogue.id, name: raw.name, parts, workflow, feedback: raw.feedback };
}

/** Lowercase letters, numbers and dashes, so ids read well in {{answers.id}}. */
export function slugifyId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function usedIds(config: ExperienceConfig) {
  return new Set([
    ...partIds.flatMap((id) => config.parts[id].components.map((block) => block.id)),
    ...config.workflow.steps.map((block) => block.id),
    ...config.workflow.lookups.map((lookup) => lookup.id),
  ]);
}

function nextId(prefix: string, used: Set<string>) {
  let n = 1;
  while (used.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** A new component or code step with its defaults, and an id not yet used in the config. */
export function createBlock(definition: Pick<AnyDefinition, "type" | "fields">, config: ExperienceConfig): BlockConfig {
  return { id: nextId(definition.type, usedIds(config)), type: definition.type, props: defaultsOf(definition.fields) };
}

const firstLookup: Partial<LookupProps> = { name: "Places nearby", type: "place" };

/** A new lookup with its defaults, in the same city as the others, then `props`. */
export function createLookup(config: ExperienceConfig, props: Partial<LookupProps> = {}): LookupConfig {
  const place = defaultCity(config.workflow.lookups);
  return {
    id: nextId("lookup", usedIds(config)),
    props: { ...defaultsOf(lookupFields), ...firstLookup, place, ...props },
  };
}

/**
 * The lookup a section starts with, added to `lookups` unless an identical
 * one is already there. Returns its id.
 */
function startingLookup(lookups: LookupConfig[], used: Set<string>, props: Partial<LookupProps> = {}) {
  const wanted = fieldsSchema(lookupFields).parse({ ...defaultsOf(lookupFields), ...firstLookup, ...props });
  const same = lookups.find((lookup) => JSON.stringify(lookup.props) === JSON.stringify(wanted));
  if (same) return same.id;
  const id = nextId("lookup", used);
  used.add(id);
  lookups.push({ id, props: wanted });
  return id;
}
