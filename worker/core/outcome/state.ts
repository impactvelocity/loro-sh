/**
 * The live state of one outcome run, as every front end sees it.
 *
 * A run is an ordered list of steps: code steps from steps/, Taste (the
 * person's profile matched against Qloo), one step per generated section
 * of the outcome, then Finish. The workflow moves each step through
 * pending → running → done (or error, or skipped) and streams the change
 * to the page as a small event; `applyEvent` folds the events back into
 * state, so a page that joins late gets a snapshot and carries on.
 *
 * This is public: the outcome page reads it at a link anyone can open.
 * The profile text and Taste brief the sections were written from stay
 * on the server.
 *
 * Plain data and functions, no React. `useOutcome` is the hook.
 */
import type { SignalType } from "../profiles";

export type EntityType = SignalType;

/** One Qloo entity, trimmed to what a section can show and the model can use. */
export type TasteEntity = {
  id: string;
  name: string;
  type: EntityType;
  image: string | null;
  /** Readable tags: category, genre, ambience. */
  tags: string[];
  /** Places only. */
  address: string | null;
  neighbourhood: string | null;
  website: string | null;
  /** 1–4. */
  priceLevel: number | null;
  rating: number | null;
  /** Qloo's own description. Raw material, not copy to publish. */
  description: string | null;
  /** Most-mentioned review keywords, e.g. "almond croissant". */
  keywords: string[];
  /** 0–1, how well it fits this person's signals. */
  affinity: number | null;
  /** The person's signals that pulled it up: "because you like …". */
  because: string[];
  /** Places, when Qloo has it. */
  location?: { lat: number; lng: number } | null;
};

export type StepKind = "code" | "taste" | "section" | "finish";
export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";
export type RunStatus = "running" | "done" | "error";

export type StepState = {
  /** The block id for sections and code steps; "taste" and "finish" for the fixed ones. */
  id: string;
  kind: StepKind;
  /** The component or step type it runs. */
  type: string | null;
  label: string;
  status: StepStatus;
  /** What it's doing right now, in a line a person can read. */
  message: string | null;
  /** A section's output: partial while it streams, whole when done. */
  data: unknown;
  error: string | null;
  /** Runs after the outcome is ready (a webhook, a CRM sync), so progress leaves it out. */
  background: boolean;
  /**
   * Sections only: the titles of the skills it followed, set when it starts.
   * Titles only, never what a skill says, since this is public.
   */
  skills?: string[];
  /** Unix ms. */
  startedAt: number | null;
  endedAt: number | null;
};

export type RunState = {
  id: string;
  status: RunStatus;
  steps: StepState[];
  /** Every Qloo entity a section can point at, by id. */
  entities: Record<string, TasteEntity>;
  error: string | null;
  updatedAt: number;
};

export type RunEvent =
  | { type: "snapshot"; state: RunState }
  | { type: "step"; id: string; patch: Partial<Omit<StepState, "id" | "kind">> }
  | { type: "entities"; entities: Record<string, TasteEntity> }
  | { type: "run"; patch: Partial<Pick<RunState, "status" | "error">> };

export function applyEvent(state: RunState | null, event: RunEvent): RunState | null {
  if (event.type === "snapshot") return event.state;
  if (!state) return null;
  const updatedAt = Date.now();
  switch (event.type) {
    case "step":
      return {
        ...state,
        updatedAt,
        steps: state.steps.map((step) => (step.id === event.id ? { ...step, ...event.patch } : step)),
      };
    case "entities":
      return { ...state, updatedAt, entities: { ...state.entities, ...event.entities } };
    case "run":
      return { ...state, updatedAt, ...event.patch };
  }
}

/**
 * Nothing more will change: the run failed, or it's done and its
 * background steps (webhooks, syncs) have finished too.
 */
export function isSettled(state: RunState) {
  if (state.status === "error") return true;
  return state.status === "done" && state.steps.every((step) => step.status !== "pending" && step.status !== "running");
}

export type SectionStatus = "pending" | "generating" | "done" | "error";

/** What a generated component gets: its step, read as a section. */
export type SectionView<T = unknown> = {
  status: SectionStatus;
  /** Partial while generating: strings grow and arrays fill in. */
  data: T | null;
  error: string | null;
};

const sectionStatus: Record<StepStatus, SectionStatus> = {
  pending: "pending",
  running: "generating",
  done: "done",
  error: "error",
  skipped: "error",
};

/** A run as a page reads it: progress, the step under way, sections and entities. */
export type OutcomeView = {
  state: RunState;
  status: RunStatus;
  /** Steps that count towards the person's wait: everything but background ones. */
  progress: { done: number; total: number };
  /** The step running now, if any. */
  current: StepState | null;
  section: <T = unknown>(id: string) => SectionView<T>;
  entity: (id: string | null | undefined) => TasteEntity | null;
};

export function outcomeView(state: RunState): OutcomeView {
  const counted = state.steps.filter((step) => !step.background);
  const steps = new Map(state.steps.map((step) => [step.id, step]));
  // While a section streams, the model's reference may be a lower-cased id or the name; the finished one is the id.
  const loose = new Map(
    Object.values(state.entities).flatMap((e) => [
      [e.id.toLowerCase(), e],
      [e.name.trim().toLowerCase(), e],
    ]),
  );
  return {
    state,
    status: state.status,
    progress: {
      done: counted.filter((step) => step.status === "done" || step.status === "skipped" || step.status === "error").length,
      total: counted.length,
    },
    current: counted.find((step) => step.status === "running") ?? null,
    section: <T,>(id: string): SectionView<T> => {
      const step = steps.get(id);
      if (!step) return { status: "pending", data: null, error: null };
      return { status: sectionStatus[step.status], data: (step.data as T) ?? null, error: step.error };
    },
    entity: (id) => (id ? (state.entities[id] ?? loose.get(id.trim().toLowerCase()) ?? null) : null),
  };
}

/** A step as the plan lays it out, before anything has run. */
export function pendingStep(step: Pick<StepState, "id" | "kind" | "type" | "label"> & { background?: boolean }): StepState {
  return {
    ...step,
    background: step.background ?? false,
    status: "pending",
    message: null,
    data: null,
    error: null,
    startedAt: null,
    endedAt: null,
  };
}
