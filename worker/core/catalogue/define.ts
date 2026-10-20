/**
 * A catalogue is the set of components an experience can be built from,
 * grouped by the part they belong to:
 *
 * - start: the public landing page, with the sign-up that starts the flow.
 * - intake: the questions. Each input component's answer is saved to the
 *   person's profile under the component's id.
 * - artifact: the outcome the person gets at the end. Its components are
 *   static, or generated (defineGenerated): written for each person by
 *   the outcome workflow and streamed in.
 *
 * Each part can have a layout, which takes the part's own settings (logo,
 * nav, background) and wraps its components. The experience itself is
 * plain JSON (config.ts): per part, the layout settings and an ordered
 * list of components with their props. The runner renders any catalogue
 * from that JSON, and the admin builds its editor from the same fields.
 */
import type { DeepPartial } from "ai";
import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";

import type { LookupProps } from "../outcome/lookups";
import type { EntityType, OutcomeView, SectionView } from "../outcome/state";
import { type FieldValues, type Fields, f } from "./fields";

export const partIds = ["start", "intake", "artifact"] as const;
export type PartId = (typeof partIds)[number];

export const partNames: Record<PartId, string> = {
  start: "Start",
  intake: "Intake",
  artifact: "Outcome",
};

export type Person = { name: string; email: string };
export type AnswerValue = string | string[] | number | null;
/** Intake answers, keyed by the input component's id. */
export type Answers = Record<string, AnswerValue>;
export type ProfileRow = { id: string; question: string; answer: string };

/** The sign-up on the start page. */
export type Optin = {
  submit: (person: Person) => void;
  pending: boolean;
  /** Per field, plus `form` for anything that isn't one field's (the network, the server). */
  errors: Partial<Record<keyof Person | "form", string>>;
};

/** What the runner gives every layout and component. */
export type RenderContext = {
  part: PartId;
  /** Null until they sign up, or when the experience was started by API. */
  person: Person | null;
  answers: Answers;
  /** The answers as they'd read on the profile, in intake order. */
  profile: ProfileRow[];
  /** Fills {{name}}, {{first_name}}, {{email}} and {{answers.<id>}}. */
  fill: (text: string) => string;
  /** Drawn in the editor: links shouldn't leave the page. */
  preview: boolean;
  optin: Optin;
  /**
   * On the outcome: the run that's making it, with its progress and the
   * Qloo entities sections point at. Null on the other parts.
   */
  outcome: OutcomeView | null;
};

/** Intake moves one component at a time; the layout draws the controls. */
export type StepNav = {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  back: () => void;
  pending: boolean;
  /** A problem saving that isn't one answer's. */
  error: string | null;
};

export type Icon = ComponentType<{ className?: string }>;

export type ComponentProps<F extends Fields> = {
  id: string;
  props: FieldValues<F>;
  ctx: RenderContext;
};

/** An input's answer, wired to the runner. */
export type InputBinding<V extends AnswerValue> = {
  name: string;
  value: V;
  onChange: (value: V) => void;
  error?: string;
  /** Enter in a text box moves on. */
  submit: () => void;
  /**
   * A one-tap answer (one option, a number): sets it, then moves to the
   * next question after a beat. On the last question it only sets it, so
   * the person still presses the button to send.
   */
  pick: (value: V) => void;
};

export type InputProps<F extends Fields, V extends AnswerValue> = ComponentProps<F> & {
  field: InputBinding<V>;
};

type DefinitionBase<F extends Fields> = {
  /** Stored in the config as the component's `type`. Unique in its part. */
  type: string;
  name: string;
  description?: string;
  icon?: Icon;
  fields: F;
};

export type ComponentDefinition<F extends Fields = Fields> = DefinitionBase<F> & {
  Component: ComponentType<ComponentProps<F>>;
  input?: undefined;
  generate?: undefined;
};

/**
 * What kind of answer an input takes, so a generic form (the admin's test
 * drawer, an import, another design) can ask the same question without
 * the catalogue's component.
 */
export type AnswerShape =
  | { kind: "text"; long?: boolean; placeholder?: string }
  | { kind: "one" | "many"; options: string[] }
  | { kind: "number"; min: number; max: number; low?: string; high?: string };

export type InputSpec<F extends Fields, V extends AnswerValue> = {
  /** Validates the answer, from the component's own settings (required, options). */
  schema: (props: FieldValues<F>) => z.ZodType<V>;
  /** The question as it reads on the profile. */
  label: (props: FieldValues<F>) => string;
  /** The answer before they've touched it. */
  empty: (props: FieldValues<F>) => V;
  shape: (props: FieldValues<F>) => AnswerShape;
  /** Whether it must be answered. */
  required: (props: FieldValues<F>) => boolean;
  /** A believable answer, for previews and API-started experiences. */
  sample: (props: FieldValues<F>) => V;
};

export type InputDefinition<F extends Fields = Fields, V extends AnswerValue = AnswerValue> = DefinitionBase<F> & {
  Component: ComponentType<InputProps<F, V>>;
  input: InputSpec<F, V>;
  generate?: undefined;
};

/**
 * Every generated component has these, so the owner can steer any section
 * the same way. `lookups` only shows for sections that pick (`picks`).
 */
export const generatedFields = {
  lookups: f.lookups({ label: "From", help: "The lookups it recommends from. Set them up under Taste." }),
  prompt: f.longText({
    label: "Prompt",
    help: "Added to the component's own instructions. Say what to focus on or leave out.",
  }),
  skills: f.skills({ label: "Skills", help: "Followed by this section, on top of the experience's own skills." }),
};

export type WithGenerated<F extends Fields> = F & typeof generatedFields;

/**
 * How an outcome section is written. The workflow gives the model the
 * person's profile, the Taste brief, this section's Qloo candidates and
 * what earlier sections said, then streams the object into the page.
 */
export type GenerateSpec<F extends Fields, T> = {
  /**
   * What gets written. Keys stream in order, so order them the way the
   * section reads (title, then intro, then items). `.describe()` on a
   * field is part of the prompt. Name a field `entity` to point at a
   * Qloo entity: it's checked against the candidates.
   */
  schema: (props: FieldValues<F>) => z.ZodType<T>;
  /** The component's own instructions. The owner's prompt is added after. */
  instructions: (props: FieldValues<F>) => string;
  /**
   * How many candidates it chooses from. Set it and the section
   * recommends things: it gets a From field to pick the workflow's
   * lookups, and is given their results. Without it, the section writes
   * from the brief alone.
   */
  picks?: (props: FieldValues<F>) => number;
  /**
   * How long its answer may run, in tokens, thinking included. Default
   * 2500; raise it for long sections, like a plan for three days.
   */
  maxOutputTokens?: (props: FieldValues<F>) => number;
  /**
   * How hard the model thinks before it writes. Unset, it decides. Low
   * keeps a long, rule-heavy section from spending its whole budget
   * thinking and returning nothing.
   */
  effort?: (props: FieldValues<F>) => "low" | "medium" | "high";
  /**
   * The lookup a new section starts with when the workflow has none yet.
   * Gets the raw saved props, so it can also upgrade a config saved before
   * lookups existed.
   */
  lookup?: (props: Record<string, unknown>) => Partial<LookupProps>;
  /**
   * Believable output, for the editor preview. Entity ids come from
   * core/outcome/samples.ts; `types` are what its lookups find.
   */
  sample: (props: FieldValues<F>, ctx: { types: EntityType[] }) => T;
};

export type GeneratedProps<F extends Fields, T> = ComponentProps<WithGenerated<F>> & {
  /** Its run step: pending, then generating with partial data, then done or error. */
  section: SectionView<DeepPartial<T>>;
};

export type GeneratedDefinition<F extends Fields = Fields, T = unknown> = DefinitionBase<WithGenerated<F>> & {
  /** Drawn once there's data, partial or whole. Must cope with missing keys. */
  Component: ComponentType<GeneratedProps<F, T>>;
  /** Drawn before the first data arrives. The runner has a plain default. */
  Pending?: ComponentType<ComponentProps<WithGenerated<F>>>;
  generate: GenerateSpec<WithGenerated<F>, T>;
  input?: undefined;
};

// `any` so definitions with different fields can share a list.
export type AnyDefinition = ComponentDefinition<any> | InputDefinition<any, any> | GeneratedDefinition<any, any>;

export type LayoutProps<F extends Fields> = {
  settings: FieldValues<F>;
  ctx: RenderContext;
  /** Intake only. */
  nav: StepNav | null;
  children: ReactNode;
};

export type LayoutDefinition<F extends Fields = Fields> = {
  fields: F;
  Layout: ComponentType<LayoutProps<F>>;
};

export type PartDefinition = {
  /** Without one, components render one after another with no wrapper. */
  layout?: LayoutDefinition<any>;
  components: AnyDefinition[];
};

export type Catalogue = {
  id: string;
  name: string;
  description: string;
  /** Theme from themes/, applied as data-theme. */
  theme: string;
  parts: Record<PartId, PartDefinition>;
  /** A complete experience built from this catalogue. Parsed with parseConfig. */
  example: unknown;
  /**
   * Skills the example follows, by the ids its workflow and sections use.
   * Making an experience from the catalogue adds them to the workspace's
   * Context, unless one with that id is already there.
   */
  skills?: { id: string; title: string; description: string }[];
};

export function defineComponent<F extends Fields>(definition: ComponentDefinition<F>) {
  return definition;
}

export function defineInput<F extends Fields, V extends AnswerValue>(definition: InputDefinition<F, V>) {
  return definition;
}

/** An outcome section the workflow writes. Adds From first, and the prompt and skills last. */
export function defineGenerated<F extends Fields, T>(
  definition: Omit<GeneratedDefinition<F, T>, "fields"> & { fields: F },
): GeneratedDefinition<F, T> {
  const { lookups, ...rest } = generatedFields;
  return { ...definition, fields: { lookups, ...definition.fields, ...rest } };
}

/** Its fields as the editor shows them: no From for a section that doesn't pick. */
export function editableFields(definition: AnyDefinition): Fields {
  if (!isGenerated(definition) || definition.generate.picks) return definition.fields;
  const { lookups: _, ...fields } = definition.fields;
  return fields;
}

export function defineLayout<F extends Fields>(definition: LayoutDefinition<F>) {
  return definition;
}

export function defineCatalogue(catalogue: Catalogue) {
  return catalogue;
}

export function isInput(definition: AnyDefinition): definition is InputDefinition<any, any> {
  return definition.input !== undefined;
}

export function isGenerated(definition: AnyDefinition): definition is GeneratedDefinition<any, any> {
  return definition.generate !== undefined;
}

export function findDefinition(catalogue: Catalogue, part: PartId, type: string) {
  return catalogue.parts[part].components.find((definition) => definition.type === type);
}
