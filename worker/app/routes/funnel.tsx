import { useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/funnel";
import type { ExperienceConfig } from "@core/catalogue/config";
import { getCatalogue } from "@core/catalogue/registry";
import { createExperienceClient } from "@core/catalogue/client";
import { ExperienceRunner } from "@core/catalogue/runner";
import { getPublicFunnel, trackView } from "@core/funnels.server";
import { FeedbackWidget } from "@/experience-components/feedback-widget";
import type { RouteHandle } from "@/lib/document";

export const handle: RouteHandle = { surface: "experience" };

/** A saved experience, run end to end. Sign-ups and answers are saved through the API client. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const funnel = await getPublicFunnel(params.workspace, params.slug);
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue) throw data(null, { status: 404 });
  if (funnel.status !== "paused") trackView(request, params.workspace, funnel.slug);
  return {
    workspace: params.workspace,
    slug: funnel.slug,
    name: funnel.name,
    status: funnel.status,
    catalogue: catalogue.id,
    theme: catalogue.theme,
    config: funnel.config,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.name ?? "Not found" }];
}

export default function FunnelPage({ loaderData }: Route.ComponentProps) {
  const { workspace, slug, name, status, config } = loaderData;
  const catalogue = getCatalogue(loaderData.catalogue)!;
  // One per visit: it carries the submission from sign-up to answers.
  const [client] = useState(() => createExperienceClient({ workspace, experience: slug }));
  const [generation, setGeneration] = useState<string | null>(null);

  if (status === "paused") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
        <h1 className="font-heading text-3xl font-medium">{name}</h1>
        <p className="text-muted-foreground">This isn't open right now. Check back soon.</p>
      </main>
    );
  }

  return (
    <div className="@container flex min-h-svh flex-col">
      <ExperienceRunner
        catalogue={catalogue}
        config={config as ExperienceConfig}
        className="flex flex-1 flex-col"
        client={client}
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
