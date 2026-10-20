/**
 * The same experience as /f/:workspace/:slug in a completely different
 * design, built only on the headless SDK: `useExperience` for the state
 * and rules, `createExperienceClient` for saving, and `useOutcome` to
 * follow the run that makes the outcome. None of the catalogue's
 * components are rendered; its definitions only supply the answer rules.
 *
 * A new design maps each intake component's `type` to its own input, as
 * `Question` does below. Copy this file to start one.
 */
import { useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/funnel-plain";
import { type ExperienceClient, createExperienceClient } from "@core/catalogue/client";
import type { ExperienceConfig } from "@core/catalogue/config";
import type { AnswerValue } from "@core/catalogue/define";
import { getCatalogue } from "@core/catalogue/registry";
import { type ExperienceFlow, useExperience } from "@core/catalogue/use-experience";
import { getPublicFunnel, trackView } from "@core/funnels.server";
import type { OutcomeView, StepStatus } from "@core/outcome/state";
import { useOutcome } from "@core/outcome/use-outcome";
import type { RouteHandle } from "@/lib/document";

export const handle: RouteHandle = { surface: "experience" };

export async function loader({ request, params }: Route.LoaderArgs) {
  const funnel = await getPublicFunnel(params.workspace, params.slug);
  if (!funnel || !getCatalogue(funnel.catalogue) || funnel.status === "paused") throw data(null, { status: 404 });
  trackView(request, params.workspace, funnel.slug);
  return { workspace: params.workspace, slug: funnel.slug, name: funnel.name, catalogue: funnel.catalogue, config: funnel.config };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.name ?? "Not found" }];
}

const box = "w-full border border-current bg-transparent px-3 py-2 font-mono text-sm outline-none focus:bg-black/5";
const action = "border border-current px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-black hover:text-white disabled:opacity-40";

function Signup({ flow }: { flow: ExperienceFlow }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        flow.optin({ name, email });
      }}
    >
      <input className={box} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={box} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {[flow.optinErrors.email, flow.optinErrors.name, flow.formError].filter(Boolean).map((error) => (
        <p key={error} className="font-mono text-sm text-red-700">! {error}</p>
      ))}
      <button className={action} disabled={flow.pending}>
        {flow.pending ? "…" : "Start"}
      </button>
    </form>
  );
}

/** One input per intake component type. Unknown types (statements) just show their title. */
function Question({ flow }: { flow: ExperienceFlow }) {
  const block = flow.current!;
  const props = block.props as Record<string, unknown>;
  const value = flow.answers[block.id];
  const set = (next: AnswerValue) => flow.setAnswer(block.id, next);
  const options = ((props.options as { label: string }[] | undefined) ?? []).map((o) => o.label);

  let input: React.ReactNode = null;
  if (block.type === "text") {
    input = <textarea className={box} rows={3} value={String(value ?? "")} onChange={(e) => set(e.target.value)} />;
  } else if (block.type === "choice") {
    const picked = Array.isArray(value) ? value : value ? [String(value)] : [];
    input = (
      <div className="flex flex-col gap-1 font-mono text-sm">
        {options.map((label) => (
          <label key={label} className="flex items-center gap-2">
            <input
              type={props.multiple ? "checkbox" : "radio"}
              checked={picked.includes(label)}
              onChange={() =>
                set(props.multiple ? (picked.includes(label) ? picked.filter((p) => p !== label) : [...picked, label]) : label)
              }
            />
            {label}
          </label>
        ))}
      </div>
    );
  } else if (block.type === "scale") {
    input = (
      <input
        type="range"
        min={1}
        max={Number(props.max ?? 5)}
        value={typeof value === "number" ? value : 1}
        onChange={(e) => set(Number(e.target.value))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs">
        {flow.step + 1}/{flow.steps.length}
      </p>
      <h2 className="text-2xl">{String(props.question ?? props.title ?? "")}</h2>
      {input}
      {[flow.answerErrors[block.id], flow.formError].filter(Boolean).map((error) => (
        <p key={error} className="font-mono text-sm text-red-700">! {error}</p>
      ))}
      <div className="flex gap-2">
        {!flow.isFirstStep && (
          <button type="button" className={action} onClick={flow.back}>
            Back
          </button>
        )}
        <button type="button" className={action} disabled={flow.pending} onClick={() => flow.next()}>
          {flow.isLastStep ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}

const marks: Record<StepStatus, string> = { pending: "[ ]", running: "[~]", done: "[x]", error: "[!]", skipped: "[-]" };

/** Any section's data, with no idea of its design: text as lines, entities by name. */
function Plain({ value, outcome }: { value: unknown; outcome: OutcomeView }): React.ReactNode {
  if (typeof value === "string") return value ? <p>{value}</p> : null;
  if (Array.isArray(value)) return value.map((item, i) => <Plain key={i} value={item} outcome={outcome} />);
  if (value && typeof value === "object") {
    return (
      <div className="flex flex-col gap-1 border-l border-current pl-3">
        {Object.entries(value).map(([key, item]) =>
          key === "entity" ? (
            <strong key={key}>{outcome.entity(item as string)?.name ?? "…"}</strong>
          ) : (
            <Plain key={key} value={item} outcome={outcome} />
          ),
        )}
      </div>
    );
  }
  return null;
}

/** The run, step by step, then each section's text as it streams. */
function Run({ flow, client }: { flow: ExperienceFlow; client: ExperienceClient }) {
  const outcome = useOutcome({ url: flow.run ? client.runUrl(flow.run.id) : null, initial: flow.run });
  if (!outcome) return null;
  return (
    <div className="flex flex-col gap-6 font-mono text-sm">
      <ol className="flex flex-col gap-1">
        {outcome.state.steps.map((step) => (
          <li key={step.id}>
            {marks[step.status]} {step.label}
            {step.message && <span className="opacity-60"> · {step.message}</span>}
          </li>
        ))}
      </ol>
      {outcome.state.steps
        .filter((step) => step.kind === "section" && step.data)
        .map((step) => (
          <section key={step.id} className="flex flex-col gap-2">
            <h3 className="uppercase tracking-wider">{step.label}</h3>
            <Plain value={step.data} outcome={outcome} />
          </section>
        ))}
    </div>
  );
}

function Outcome({ flow, client }: { flow: ExperienceFlow; client: ExperienceClient }) {
  const [rated, setRated] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl">{flow.fill("Thanks, {{first_name}}.")}</h2>
      <Run flow={flow} client={client} />
      <dl className="flex flex-col gap-2 font-mono text-sm">
        {flow.profile.map((row) => (
          <div key={row.id}>
            <dt className="opacity-60">{row.question}</dt>
            <dd>{row.answer || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2 border-t border-current pt-4 font-mono text-sm">
        <span className="mr-2">{rated ? `Rated ${rated}/5. Thanks.` : "Rate it:"}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={action}
            onClick={async () => {
              if ((await client.feedback({ rating: n })).ok) setRated(n);
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlainDesign({ loaderData }: Route.ComponentProps) {
  const { workspace, slug, name } = loaderData;
  const [client] = useState(() => createExperienceClient({ workspace, experience: slug }));
  const flow = useExperience({
    catalogue: getCatalogue(loaderData.catalogue)!,
    config: loaderData.config as ExperienceConfig,
    client,
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-10 bg-white px-6 py-16 text-black">
      <h1 className="font-mono text-sm uppercase tracking-widest">{name}</h1>
      {flow.stage === "start" && <Signup flow={flow} />}
      {flow.stage === "intake" && flow.current && <Question flow={flow} />}
      {flow.stage === "artifact" && <Outcome flow={flow} client={client} />}
    </main>
  );
}
