import { useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/generation";
import { type ExperienceConfig, parseConfig } from "@core/catalogue/config";
import { getCatalogue } from "@core/catalogue/registry";
import { ExperienceRunner } from "@core/catalogue/runner";
import type { RunState } from "@core/outcome/state";
import { createExperienceClient } from "@core/catalogue/client";
import { feedbackForGeneration } from "@core/feedback.server";
import { getPublicFunnel } from "@core/funnels.server";
import { getGeneration } from "@core/profiles.server";
import { readRun, storedRun } from "@core/workflow/results.server";
import { FeedbackWidget } from "@/experience-components/feedback-widget";
import type { RouteHandle } from "@/lib/document";

export const handle: RouteHandle = { surface: "experience" };

/**
 * One person's outcome, at a link of its own: the experience's outcome
 * part, filled from the answers and the run that made it. While the run is
 * still going, the page follows it live. The id is random, so the link is
 * the key.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const [funnel, generation, feedback, stored] = await Promise.all([
    getPublicFunnel(params.workspace, params.slug),
    getGeneration(params.workspace, params.id),
    feedbackForGeneration(params.workspace, params.id),
    storedRun(params.workspace, params.id),
  ]);
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue || !generation || generation.funnelSlug !== funnel.slug) throw data(null, { status: 404 });
  // Older outcomes were made before runs and have none: their page is static.
  const run = stored?.run ?? (generation.status === "generating" ? await readRun(params.workspace, params.id) : null);
  return {
    workspace: params.workspace,
    slug: funnel.slug,
    id: generation.id,
    feedback,
    // Today's widget, not the one it ran with: its words may have been fixed since.
    widget: funnel.config.feedback,
    name: funnel.name,
    catalogue: catalogue.id,
    theme: catalogue.theme,
    // As it was when it ran, so later edits don't move sections around; read against today's
    // catalogue, so a field added since (a share button) gets its default.
    config: parseConfig(catalogue, stored?.config ?? funnel.config),
    run,
    status: generation.status,
    person: generation.person,
    answers: generation.answers,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData ? `${loaderData.name} · ${loaderData.person.name}` : "Not found" }];
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <h1 className="font-heading text-3xl font-medium">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
    </main>
  );
}

export default function GenerationPage({ loaderData }: Route.ComponentProps) {
  const { status, person, answers, run } = loaderData;
  const [client] = useState(() => createExperienceClient({ workspace: loaderData.workspace, experience: loaderData.slug }));
  if (status === "error" && !run) return <Notice title="Something went wrong" body="We couldn't make this one. We're on it." />;

  return (
    <div className="@container flex min-h-svh flex-col">
      <ExperienceRunner
        catalogue={getCatalogue(loaderData.catalogue)!}
        config={loaderData.config as ExperienceConfig}
        stage="artifact"
        person={person}
        answers={answers}
        run={run as RunState | null}
        client={client}
        className="flex flex-1 flex-col"
      />
      <FeedbackWidget
        settings={loaderData.widget}
        initial={loaderData.feedback}
        onSend={(feedback) => client.feedback({ ...feedback, generation: loaderData.id })}
      />
    </div>
  );
}
