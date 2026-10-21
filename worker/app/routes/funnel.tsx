import { useEffect, useRef, useState } from "react";
import { data, useNavigate } from "react-router";

import type { Route } from "./+types/funnel";
import type { ExperienceConfig } from "@core/catalogue/config";
import type { Catalogue, Person } from "@core/catalogue/define";
import { getCatalogue } from "@core/catalogue/registry";
import { type ExperienceClient, createExperienceClient } from "@core/catalogue/client";
import { type Prefill, samplePrefill } from "@core/catalogue/flow";
import { ExperienceRunner } from "@core/catalogue/runner";
import { planRun } from "@core/outcome/plan";
import { getPublicFunnel, trackView } from "@core/funnels.server";
import { FeedbackWidget } from "@/experience-components/feedback-widget";
import type { RouteHandle } from "@/lib/document";

export const handle: RouteHandle = { surface: "experience" };

/**
 * A saved experience, run end to end. Sign-ups and answers are saved
 * through the API client. ?profile=<id> fills them in from one of the
 * catalogue's sample profiles, for demos; sending them still makes a real
 * sign-up and run. Add &skip=1 to send them as the page opens and watch
 * the outcome being made. That works with the intake off too, standing in
 * for the system that would trigger it.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const funnel = await getPublicFunnel(params.workspace, params.slug);
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue) throw data(null, { status: 404 });
  if (funnel.status !== "paused") trackView(request, params.workspace, funnel.slug);
  const query = new URL(request.url).searchParams;
  const sample = samplePrefill(catalogue, funnel.config, query.get("profile"));
  // Only a sample that answers everything can skip. Otherwise they click through, which needs the questions.
  const skip = query.get("skip") === "1" && Boolean(sample?.complete);
  return {
    workspace: params.workspace,
    slug: funnel.slug,
    name: funnel.name,
    status: funnel.status,
    catalogue: catalogue.id,
    theme: catalogue.theme,
    config: funnel.config,
    prefill: skip || funnel.config.parts.intake.enabled ? sample : null,
    skip,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.name ?? "Not found" }];
}

export default function FunnelPage({ loaderData }: Route.ComponentProps) {
  const { workspace, slug, name, status, config, prefill } = loaderData;
  const catalogue = getCatalogue(loaderData.catalogue)!;
  // One per visit: it carries the submission from sign-up to answers.
  const [client] = useState(() => createExperienceClient({ workspace, experience: slug }));
  const [generation, setGeneration] = useState<string | null>(null);
  // Cleared if sending the sample fails, so they can click through instead.
  const [skip, setSkip] = useState(loaderData.skip);

  if (status === "paused") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
        <h1 className="font-heading text-3xl font-medium">{name}</h1>
        <p className="text-muted-foreground">This isn't open right now. Check back soon.</p>
      </main>
    );
  }

  // With the intake off there's nothing to click through to, so say it didn't start.
  if (loaderData.skip && !skip && !(config as ExperienceConfig).parts.intake.enabled) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
        <h1 className="font-heading text-3xl font-medium">{name}</h1>
        <p className="text-muted-foreground">This one didn't start. Refresh the page to try again.</p>
      </main>
    );
  }

  if (skip && prefill?.person) {
    return (
      <SkipToOutcome
        workspace={workspace}
        slug={slug}
        catalogue={catalogue}
        config={config as ExperienceConfig}
        client={client}
        person={prefill.person}
        answers={prefill.answers}
        onFail={() => setSkip(false)}
      />
    );
  }

  return (
    <div className="@container flex min-h-svh flex-col">
      <ExperienceRunner
        catalogue={catalogue}
        config={config as ExperienceConfig}
        className="flex flex-1 flex-col"
        client={client}
        prefill={prefill}
        // Once the outcome shows, ask what they thought of it.
        onStageChange={(stage) => stage === "artifact" && setGeneration(client.generation)}
      />
      {generation && (
        <FeedbackWidget
          settings={(config as ExperienceConfig).feedback}
          onSend={(feedback) => client.feedback({ ...feedback, generation })}
        />
      )}
    </div>
  );
}

/**
 * Sends a sample profile's sign-up and answers as the page opens, then
 * moves to the outcome's own page, which follows the run live. Until then
 * it draws the outcome with every step waiting. It only runs in a browser,
 * so link previews and crawlers never start a run.
 */
function SkipToOutcome({
  workspace,
  slug,
  catalogue,
  config,
  client,
  person,
  answers,
  onFail,
}: {
  workspace: string;
  slug: string;
  catalogue: Catalogue;
  config: ExperienceConfig;
  client: ExperienceClient;
  person: Person;
  answers: Prefill["answers"];
  onFail: () => void;
}) {
  const navigate = useNavigate();
  const [planned] = useState(() => planRun("starting", catalogue, config));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const signup = await client.optin(person);
      const sent = signup.ok ? await client.submit({ person, answers }) : null;
      if (!sent?.ok) return onFail();
      // Replaced, so going back or refreshing doesn't start another run.
      navigate(`/f/${workspace}/${slug}/g/${sent.data.generation}`, { replace: true });
    })();
  }, []);

  return (
    <div className="@container flex min-h-svh flex-col">
      <ExperienceRunner
        catalogue={catalogue}
        config={config}
        stage="artifact"
        person={person}
        answers={answers}
        run={planned}
        className="flex flex-1 flex-col"
      />
    </div>
  );
}
