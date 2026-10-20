/**
 * Renders an experience with its catalogue's own layouts and components.
 * The state and rules are `useExperience` (the headless SDK); this only
 * maps them onto the catalogue. A custom design can skip this file and
 * use the hook directly.
 *
 * Pass `client` to save to Loro's API, or `onOptin` and `onSubmit` to
 * handle it yourself. The editor preview passes neither, so the run stays
 * in the browser.
 *
 * On the outcome, generated sections follow the run: with a client, the
 * one the answers started (useOutcome); in the editor, `outcome` (a
 * preview run from core/outcome/samples.ts).
 */
import { Fragment, useEffect, useMemo, useRef } from "react";

import { previewRun } from "../outcome/samples";
import type { OutcomeView } from "../outcome/state";
import { outcomeView } from "../outcome/state";
import { useOutcome } from "../outcome/use-outcome";
import type { BlockConfig } from "./config";
import {
  type AnyDefinition,
  type Answers,
  type GeneratedDefinition,
  type RenderContext,
  type StepNav,
  findDefinition,
  isGenerated,
  isInput,
} from "./define";
import { type FlowResult, type UseExperienceOptions, useExperience } from "./use-experience";

/** How long a picked option shows before the next question. */
const PICK_DELAY = 280;

export type RunResult = FlowResult;

type RunnerProps = UseExperienceOptions & {
  /** A component id to show: intake jumps to its step, other parts scroll to it. */
  focus?: string | null;
  /** Drawn in the editor: links stay put and the preview scrolls itself. */
  preview?: boolean;
  /** The outcome to draw, instead of following a live run. */
  outcome?: OutcomeView | null;
  /** Show every section whatever the run's state, as the editor does to draw a state on demand. */
  showAll?: boolean;
  className?: string;
};

export function ExperienceRunner({
  focus = null,
  preview = false,
  outcome: given,
  showAll = false,
  className,
  ...options
}: RunnerProps) {
  const { catalogue, config } = options;
  const root = useRef<HTMLDivElement>(null);
  const flow = useExperience({
    ...options,
    onStageChange: (stage) => {
      root.current?.scrollTo({ top: 0 });
      if (!preview) window.scrollTo({ top: 0 });
      options.onStageChange?.(stage);
    },
  });
  const { stage, steps, step } = flow;

  // A pick waits a beat so the choice shows, then moves on. Leaving the
  // question first (Back, the editor) cancels it.
  const pickTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(pickTimer.current), [step, stage]);

  // The run the answers started, live. A preview with no run shows samples.
  const live = useOutcome({
    url: options.client && flow.run ? options.client.runUrl(flow.run.id) : null,
    initial: flow.run,
  });
  const sample = useMemo(
    () => (preview && !given && !flow.run ? outcomeView(previewRun(catalogue, config, "done")) : null),
    [preview, given, flow.run, catalogue, config],
  );
  const outcome = given ?? live ?? sample;

  // The editor points at a component: show its step, or scroll to it.
  const focusStep = steps.findIndex((block) => block.id === focus);
  useEffect(() => {
    if (!focus) return;
    if (stage === "intake") {
      if (focusStep >= 0) flow.goToStep(focusStep);
      return;
    }
    // Scrolls the preview only, not the page around it.
    const container = root.current;
    const element = container?.querySelector<HTMLElement>(`[data-block="${CSS.escape(focus)}"]`);
    if (container && element) {
      const top = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [focus, stage, focusStep]);

  const ctx: RenderContext = {
    part: stage,
    person: flow.person,
    answers: flow.answers,
    profile: flow.profile,
    fill: flow.fill,
    preview,
    optin: {
      pending: flow.pending,
      errors: { ...flow.optinErrors, ...(flow.formError && stage === "start" ? { form: flow.formError } : {}) },
      submit: flow.optin,
    },
    outcome: stage === "artifact" ? outcome : null,
  };

  const nav: StepNav | null =
    stage === "intake"
      ? {
          index: step,
          total: steps.length,
          isFirst: flow.isFirstStep,
          isLast: flow.isLastStep,
          next: () => flow.next(),
          back: flow.back,
          pending: flow.pending,
          error: flow.formError,
        }
      : null;

  const part = catalogue.parts[stage];
  const blocks = stage === "intake" ? steps.slice(step, step + 1) : config.parts[stage].components;
  const Layout = part.layout?.Layout;
  // While a run is under way, the outcome builds down the page: a section
  // shows once it starts, a static one once every section above it is
  // done, so nothing waiting further down shows early.
  let settled = true;
  const content = blocks.map((block) => {
    const definition = findDefinition(catalogue, stage, block.type);
    if (!definition) return null;
    let hidden = false;
    if (ctx.outcome && !showAll) {
      if (isGenerated(definition)) {
        const { status } = ctx.outcome.section(block.id);
        hidden = status === "pending";
        if (status === "pending" || status === "generating") settled = false;
      } else {
        hidden = !settled;
      }
    }
    return (
      <Block
        key={block.id}
        block={block}
        definition={definition}
        ctx={ctx}
        hidden={hidden}
        answers={flow.answers}
        error={flow.answerErrors[block.id]}
        onAnswer={(value) => flow.setAnswer(block.id, value)}
        onSubmit={() => flow.next()}
        onPick={(value) => {
          flow.setAnswer(block.id, value);
          if (stage !== "intake" || flow.isLastStep) return;
          window.clearTimeout(pickTimer.current);
          pickTimer.current = window.setTimeout(() => flow.next({ [block.id]: value }), PICK_DELAY);
        }}
      />
    );
  });

  return (
    <div ref={root} className={className} data-part={stage}>
      {Layout ? (
        <Layout settings={config.parts[stage].settings} ctx={ctx} nav={nav}>
          {content}
        </Layout>
      ) : (
        <Fragment>{content}</Fragment>
      )}
    </div>
  );
}

/** Holds a block's place on the page while it waits to show. */
const reveal = (hidden: boolean) => `transition-opacity duration-500${hidden ? " opacity-0" : ""}`;

function Block({
  block,
  definition,
  ctx,
  hidden,
  answers,
  error,
  onAnswer,
  onSubmit,
  onPick,
}: {
  block: BlockConfig;
  definition: AnyDefinition;
  ctx: RenderContext;
  hidden: boolean;
  answers: Answers;
  error?: string;
  onAnswer: (value: Answers[string]) => void;
  onSubmit: () => void;
  onPick: (value: Answers[string]) => void;
}) {
  if (isInput(definition)) {
    const Input = definition.Component;
    return (
      <div data-block={block.id}>
        <Input
          id={block.id}
          props={block.props}
          ctx={ctx}
          field={{
            name: block.id,
            value: answers[block.id] ?? definition.input.empty(block.props),
            onChange: onAnswer,
            error,
            submit: onSubmit,
            pick: onPick,
          }}
        />
      </div>
    );
  }
  if (isGenerated(definition)) return <GeneratedBlock block={block} definition={definition} ctx={ctx} hidden={hidden} />;
  const Component = definition.Component;
  return (
    <div data-block={block.id} className={reveal(hidden)} inert={hidden}>
      <Component id={block.id} props={block.props} ctx={ctx} />
    </div>
  );
}

/**
 * A generated section: its Pending state until data arrives, then the
 * component with the partial and finally whole data. One that failed
 * leaves the page, except in the editor, where it says so.
 */
function GeneratedBlock({
  block,
  definition,
  ctx,
  hidden,
}: {
  block: BlockConfig;
  definition: GeneratedDefinition<any, any>;
  ctx: RenderContext;
  hidden: boolean;
}) {
  const section = ctx.outcome?.section(block.id) ?? { status: "pending" as const, data: null, error: null };
  const Pending = definition.Pending ?? DefaultPending;
  const Component = definition.Component;
  const state = section.status === "error" && !section.data ? "error" : section.data ? section.status : "pending";

  return (
    <div
      data-block={block.id}
      data-section={state}
      aria-busy={state === "pending" || state === "generating"}
      className={reveal(hidden)}
      inert={hidden}
    >
      {state === "error" ? (
        ctx.preview && <p className="text-sm text-muted-foreground">{definition.name} couldn't be made: {section.error}</p>
      ) : state === "pending" ? (
        <Pending id={block.id} props={block.props} ctx={ctx} />
      ) : (
        <Component id={block.id} props={block.props} ctx={ctx} section={section} />
      )}
    </div>
  );
}

/** For generated components without a Pending of their own: a few quiet lines. */
function DefaultPending() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden>
      <div className="h-7 w-2/5 rounded-(--radius) bg-muted" />
      <div className="h-4 w-full rounded-(--radius) bg-muted" />
      <div className="h-4 w-11/12 rounded-(--radius) bg-muted" />
      <div className="h-4 w-3/5 rounded-(--radius) bg-muted" />
    </div>
  );
}
