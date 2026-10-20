/**
 * The headless form SDK: everything an experience does, with no markup.
 * Sign-up, one intake step at a time, checking each answer, submitting,
 * then the outcome. Bring your own components:
 *
 *   const flow = useExperience({ catalogue, config, client });
 *   if (flow.stage === "start") return <MySignup onSubmit={flow.optin} errors={flow.optinErrors} />;
 *   if (flow.stage === "intake") {
 *     const block = flow.current;   // the intake component on screen
 *     return <MyQuestion value={flow.answers[block.id]} onChange={(v) => flow.setAnswer(block.id, v)}
 *       error={flow.answerErrors[block.id]} onNext={flow.next} />;
 *   }
 *   return <MyOutcome profile={flow.profile} fill={flow.fill} />;
 *
 * The catalogue supplies the answer rules (each input's schema); nothing
 * from it has to be rendered. ExperienceRunner is this hook plus the
 * catalogue's own components.
 */
import { useMemo, useState } from "react";

import type { BlockConfig, ExperienceConfig } from "./config";
import type { Answers, AnswerValue, Catalogue, PartId, Person } from "./define";
import type { RunState } from "../outcome/state";
import type { ExperienceClient } from "./client";
import {
  answersSchema,
  emptyAnswers,
  errorsOf,
  fillTemplate,
  inputOf,
  optinSchema,
  profileRows,
  sampleAnswers,
  samplePerson,
  stagesOf,
} from "./flow";

/** `run` is the outcome the submit started, if it started one. */
export type FlowResult = { ok: true; run?: RunState } | { ok: false; errors: Record<string, string> };

export type UseExperienceOptions = {
  catalogue: Catalogue;
  config: ExperienceConfig;
  /** Part to open on. Defaults to the first one that's on. */
  stage?: PartId;
  /** Already known, e.g. an experience started by API. */
  person?: Person | null;
  answers?: Answers;
  /** An outcome that's already being made or done, e.g. on its own page. */
  run?: RunState | null;
  /** Saves sign-ups and answers through Loro's API. */
  client?: ExperienceClient;
  /** Or handle them yourself. Without either, the run stays in the browser. */
  onOptin?: (person: Person) => Promise<FlowResult>;
  onSubmit?: (submission: { person: Person | null; answers: Answers }) => Promise<FlowResult>;
  /** Called when the part changes, e.g. to scroll back to the top. */
  onStageChange?: (stage: PartId) => void;
};

const ok = async (): Promise<FlowResult> => ({ ok: true });

/** Errors with no field (the network, the server) come back under "". */
function split(errors: Record<string, string>) {
  const { "": form = null, ...fields } = errors;
  return { form, fields };
}

export function useExperience({
  catalogue,
  config,
  stage: initialStage,
  person: initialPerson = null,
  answers: initialAnswers,
  run: initialRun = null,
  client,
  onOptin = ok,
  onSubmit = ok,
  onStageChange,
}: UseExperienceOptions) {
  const stages = stagesOf(config);
  const [stageState, setStage] = useState<PartId>(initialStage ?? stages[0]);
  const [person, setPerson] = useState<Person | null>(initialPerson);
  const [answers, setAnswers] = useState<Answers>(() => ({ ...emptyAnswers(catalogue, config), ...initialAnswers }));
  const [step, setStep] = useState(0);
  const [optinErrors, setOptinErrors] = useState<Record<string, string>>({});
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // The outcome being made: set when the answers are in.
  const [run, setRun] = useState<RunState | null>(initialRun);
  // Real answers came in, so blanks stay blank on the outcome.
  const [answered, setAnswered] = useState(initialAnswers !== undefined);

  const stage = stages.includes(stageState) ? stageState : stages[0];
  const steps: BlockConfig[] = config.parts.intake.components;
  const saveOptin = client ? async (p: Person) => toFlow(await client.optin(p)) : onOptin;
  const saveAnswers = client
    ? async (s: { person: Person | null; answers: Answers }) =>
        s.person ? toFlow(await client.submit({ person: s.person, answers: s.answers })) : missingPerson()
    : onSubmit;

  function goToStage(next: PartId) {
    setStage(next);
    setStep(0);
    setFormError(null);
    onStageChange?.(next);
  }

  function advance() {
    const next = stages[stages.indexOf(stage) + 1];
    if (next) goToStage(next);
  }

  /** Sign up: checks the name and email, saves, then moves on. */
  async function optin(input: Person) {
    const parsed = optinSchema.safeParse(input);
    if (!parsed.success) return setOptinErrors(errorsOf(parsed.error));
    setPending(true);
    setFormError(null);
    const result = await saveOptin(parsed.data);
    setPending(false);
    if (!result.ok) {
      const { form, fields } = split(result.errors);
      setOptinErrors(fields);
      return setFormError(form);
    }
    setOptinErrors({});
    setPerson(parsed.data);
    advance();
  }

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((all) => ({ ...all, [id]: value }));
    setAnswerErrors(({ [id]: _, ...rest }) => rest);
  }

  function showErrors(errors: Record<string, string>) {
    const { form, fields } = split(errors);
    setAnswerErrors(fields);
    setFormError(form);
    const index = steps.findIndex((block) => fields[block.id]);
    if (index >= 0) setStep(index);
  }

  /**
   * Checks the answer on screen, then moves on. On the last step, submits
   * everything. Pass answers set in the same tick (a one-tap pick), since
   * `answers` here is still the last render's.
   */
  async function next(picked?: Answers) {
    const all = picked ? { ...answers, ...picked } : answers;
    const block = steps[step];
    const input = block && inputOf(catalogue, block);
    if (input) {
      const parsed = input.input.schema(block.props).safeParse(all[block.id]);
      if (!parsed.success) {
        setAnswerErrors((errors) => ({ ...errors, [block.id]: parsed.error.issues[0]?.message ?? "Check this answer" }));
        return;
      }
    }
    if (step < steps.length - 1) return setStep(step + 1);

    const parsed = answersSchema(catalogue, config).safeParse(all);
    if (!parsed.success) return showErrors(errorsOf(parsed.error));
    setPending(true);
    setFormError(null);
    const result = await saveAnswers({ person, answers: parsed.data as Answers });
    setPending(false);
    if (!result.ok) return showErrors(result.errors);
    setAnswered(true);
    if (result.run) setRun(result.run);
    advance();
  }

  // An outcome shown before anyone answered (an editor preview) uses samples.
  const shown = useMemo(() => {
    if (stage !== "artifact" || answered) return { person, answers };
    const samples = sampleAnswers(catalogue, config);
    const filled = Object.fromEntries(
      Object.entries(samples).map(([id, sample]) => {
        const value = answers[id];
        const empty = value === null || value === "" || (Array.isArray(value) && value.length === 0);
        return [id, empty ? sample : value];
      }),
    );
    return { person: person ?? samplePerson, answers: { ...answers, ...filled } };
  }, [stage, answered, person, answers, catalogue, config]);

  return {
    stage,
    stages,
    /** The signed-up person, or a sample on a preview's outcome. */
    person: shown.person,
    answers: shown.answers,
    /** Answers as question/answer rows, in intake order. */
    profile: profileRows(catalogue, config, shown.answers),
    fill: (text: string) => fillTemplate(text, shown.person, shown.answers),
    pending,
    /** The outcome's run as it started; follow it live with useOutcome. */
    run,
    optinErrors,
    answerErrors,
    /** A problem that isn't one field's, like the network. */
    formError,

    steps,
    step,
    current: stage === "intake" ? (steps[step] ?? null) : null,
    isFirstStep: step === 0,
    isLastStep: step === steps.length - 1,

    optin,
    setAnswer,
    next,
    back: () => setStep((current) => Math.max(0, current - 1)),
    goToStep: (index: number) => setStep(Math.min(Math.max(0, index), Math.max(0, steps.length - 1))),
    goToStage,
  };
}

export type ExperienceFlow = ReturnType<typeof useExperience>;

function toFlow(
  result: { ok: true; data: object } | { ok: false; errors: Record<string, string> },
): FlowResult {
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, run: "run" in result.data ? (result.data.run as RunState) : undefined };
}

function missingPerson(): Promise<FlowResult> {
  return Promise.resolve({ ok: false, errors: { "": "Sign up first, so we know who the answers are from." } });
}
