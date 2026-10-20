/**
 * Starts an experience for someone, the way another system would by API
 * (POST /experiences/:slug/submissions): the person and their answers go
 * in, a submission and a generation are saved, and the outcome workflow
 * makes their page. The admin uses it to start one for a person on their
 * page, e.g. an agent sending a buyer a home they found. The API's
 * /submissions and /trigger use it too (workers/api/experiences.ts).
 *
 * `submission` completes the one a sign-up started; `personId` starts it
 * for someone already in Profiles instead of a `person`.
 */
import type { Answers } from "./catalogue/define";
import { answersSchema, errorsOf, optinSchema, profileRows } from "./catalogue/flow";
import { getCatalogue } from "./catalogue/registry";
import { getFunnel } from "./funnels.server";
import { recordSubmission } from "./profiles.server";
import { startOutcome } from "./workflow/results.server";

export class StartError extends Error {
  constructor(public errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? "Check the answers.");
  }
}

export async function startExperience(
  workspaceId: string,
  slug: string,
  input: { person?: unknown; personId?: string; submission?: string | null; answers?: unknown },
  origin: string,
) {
  const funnel = await getFunnel(workspaceId, slug);
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue) throw new StartError({ "": "That experience isn't here any more." });
  if (funnel.status === "paused") throw new StartError({ "": "This experience is paused. Turn it back on to start it." });
  const person = input.personId ? null : optinSchema.safeParse(input.person);
  if (person && !person.success) throw new StartError(errorsOf(person.error));
  const answers = answersSchema(catalogue, funnel.config).safeParse(input.answers ?? {});
  if (!answers.success) throw new StartError(errorsOf(answers.error));

  const profile = profileRows(catalogue, funnel.config, answers.data as Answers);
  const saved = await recordSubmission(workspaceId, funnel, {
    submission: input.submission ?? null,
    person: person ? person.data : { id: input.personId! },
    answers: answers.data as Answers,
    profile,
  });
  const url = new URL(`/f/${workspaceId}/${funnel.slug}/g/${saved.generation}`, origin).toString();
  const run = await startOutcome({
    workspaceId,
    runId: saved.generation,
    test: false,
    funnel: { slug: funnel.slug, name: funnel.name },
    config: funnel.config,
    person: saved.person,
    answers: answers.data as Answers,
    profile,
    outcomeUrl: url,
  });
  // `run` is the outcome's planned steps, all pending, for a page to draw straight away.
  return { ...saved, profile, run, url };
}
