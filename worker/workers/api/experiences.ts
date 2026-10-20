/**
 * Experiences: the config, so any front end can render them; managing
 * them (create, update, delete, tests); and the ways a person goes
 * through one.
 *
 * - The public flow (core/catalogue/client.ts): `optin` creates or finds
 *   their profile and starts a submission; `submissions` with that
 *   submission completes it with their answers.
 * - A trigger: another system (a ticket sale, a booking, a CRM) posts the
 *   person, or the id of someone already in Profiles, and their answers.
 *   It needs a key. With the intake off, it's the only way in.
 *
 * Both start the outcome workflow and return its run, which the caller
 * can poll (`runs/:id`) or listen to (`runs/:id/events`, server-sent events).
 */
import { type Context, Hono } from "hono";
import { z } from "zod";

import { optinSchema, questionsOf } from "@core/catalogue/flow";
import { StartError, startExperience } from "@core/experience-start.server";
import { getCatalogue } from "@core/catalogue/registry";
import { experienceAnalytics } from "@core/analytics.server";
import { feedbackInput, feedbackSummary, saveFeedback } from "@core/feedback.server";
import { type Funnel, funnelStatusLabels, publicPath } from "@core/funnels";
import { appOrigin, pagesOrigin } from "@core/hosts.server";
import { createFunnel, deleteFunnel, getFunnel, getPublicFunnel, listFunnels, saveFunnel } from "@core/funnels.server";
import { funnelGenerations, funnelPeople, getPerson, recordOptin } from "@core/profiles.server";
import { deleteTest, listTests, runTest } from "@core/tests.server";
import { readRun, runEvents } from "@core/workflow/results.server";
import { hasKey, requireKey } from "./auth";
import { ApiError, type WorkspaceEnv, notFound, queryInt, readJson } from "./http";

type Ctx = Context<WorkspaceEnv>;

/** The saved experience, fresh from D1. */
async function funnelOf(c: Ctx) {
  const funnel = await getFunnel(c.get("workspaceId"), c.req.param("slug")!);
  if (!funnel) throw notFound("Experience");
  return funnel;
}

/** One people can go through: it exists and isn't paused. Read through the page cache. */
async function openFunnel(c: Ctx) {
  const funnel = await getPublicFunnel(c.get("workspaceId"), c.req.param("slug")!);
  const catalogue = funnel && getCatalogue(funnel.catalogue);
  if (!funnel || !catalogue || funnel.status === "paused") throw new ApiError(404, "This experience isn't open.");
  return { funnel, catalogue };
}

/** Where to find what a run makes: the outcome page, its state and its event stream. */
function linksFor(c: Ctx, slug: string, generation: string) {
  const origin = appOrigin(c.req.url);
  const api = `${origin}/api/workspaces/${c.get("workspaceId")}/experiences/${slug}/runs/${generation}`;
  return {
    outcome: `${pagesOrigin(c.req.url)}${publicPath(c.get("workspaceId"), slug)}/g/${generation}`,
    run: api,
    events: `${api}/events`,
  };
}

/** Saves the answers (and the person, if they're new), then starts the outcome. Same as the admin's Start. */
async function submit(c: Ctx, slug: string, input: Parameters<typeof startExperience>[2]) {
  try {
    const { url, ...started } = await startExperience(c.get("workspaceId"), slug, input, pagesOrigin(c.req.url));
    return { ...started, links: linksFor(c, slug, started.generation) };
  } catch (error) {
    if (error instanceof StartError) throw new ApiError(422, error.message, error.errors);
    throw error;
  }
}

const experienceInput = z.object({
  name: z.string("Give it a name."),
  catalogue: z.string().default("basic"),
});

const experiencePatch = z.object({
  name: z.string().optional(),
  /** Changing it moves the public link; old links stop working. */
  slug: z.string().optional(),
  status: z
    .enum(Object.keys(funnelStatusLabels) as [Funnel["status"], ...Funnel["status"][]], "Status is live, draft or paused.")
    .optional(),
  /** The whole config (start, intake, artifact, workflow), as GET returns it. */
  config: z.record(z.string(), z.unknown()).optional(),
});

const triggerInput = z
  .object({
    /** Someone new, or found by email. */
    person: optinSchema.optional(),
    /** Someone already in Profiles. */
    personId: z.string().optional(),
    answers: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((body) => body.person || body.personId, { message: "Send a person or a personId.", path: ["person"] });

const testInput = z.object({
  /** Test as someone in Profiles; their name and email are used. Not saved to their profile. */
  personId: z.string().nullable().default(null),
  name: z.string().default(""),
  email: z.string().default(""),
  answers: z.record(z.string(), z.unknown()).default({}),
  /** A config to try without saving it. Defaults to the saved one. */
  config: z.record(z.string(), z.unknown()).optional(),
});

export const experienceRoutes = new Hono<WorkspaceEnv>()
  .get("/", async (c) => c.json({ experiences: await listFunnels(c.get("workspaceId")) }))
  // Starts from the catalogue's example, so there's something to edit straight away.
  .post("/", requireKey, async (c) => {
    const input = await readJson(c, experienceInput);
    const slug = await createFunnel(c.get("workspaceId"), input);
    return c.json({ experience: await getFunnel(c.get("workspaceId"), slug) }, 201);
  })
  .get("/:slug", async (c) => {
    const funnel = await getPublicFunnel(c.get("workspaceId"), c.req.param("slug"));
    if (!funnel) throw notFound("Experience");
    return c.json({ experience: funnel });
  })
  .patch("/:slug", requireKey, async (c) => {
    const current = await funnelOf(c);
    const patch = await readJson(c, experiencePatch);
    const slug = await saveFunnel(c.get("workspaceId"), current.slug, {
      name: patch.name ?? current.name,
      slug: patch.slug ?? current.slug,
      status: patch.status ?? current.status,
      config: patch.config ?? current.config,
    });
    return c.json({ experience: await getFunnel(c.get("workspaceId"), slug) });
  })
  .delete("/:slug", requireKey, async (c) => {
    const funnel = await funnelOf(c);
    await deleteFunnel(c.get("workspaceId"), funnel.slug);
    return c.body(null, 204);
  })

  // The intake as plain data: each answer's id, question, shape and whether it's required.
  .get("/:slug/questions", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({ questions: questionsOf(getCatalogue(funnel.catalogue)!, funnel.config) });
  })
  // The last 30 days: views, started, finished, generated, failed and completion rate.
  .get("/:slug/analytics", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({ analytics: await experienceAnalytics(c.get("workspaceId"), funnel.slug, new Date()) });
  })
  .get("/:slug/people", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({ people: await funnelPeople(c.get("workspaceId"), funnel.slug) });
  })
  // ?limit=1–200. Newest first.
  .get("/:slug/generations", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({
      generations: await funnelGenerations(c.get("workspaceId"), funnel.slug, queryInt(c, "limit", 50, 1, 200)),
    });
  })
  .get("/:slug/feedback", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({ feedback: await feedbackSummary(c.get("workspaceId"), funnel.slug) });
  })

  // A sign-up: their profile, and a submission waiting for answers.
  .post("/:slug/optin", async (c) => {
    const { funnel } = await openFunnel(c);
    const person = await readJson(c, optinSchema);
    return c.json(await recordOptin(c.get("workspaceId"), funnel, person), 201);
  })
  // Answers for the submission a sign-up started. Without one it's a trigger, which needs a key.
  .post("/:slug/submissions", async (c) => {
    const { funnel } = await openFunnel(c);
    const body = await readJson(
      c,
      z.object({ person: z.unknown(), answers: z.unknown(), submission: z.string().nullish() }),
    );
    if (!body.submission && !(await hasKey(c.get("workspaceId"), c.req.header("authorization")))) {
      throw new ApiError(401, "Sign up first, or start it with an API key (POST …/trigger).");
    }
    return c.json(await submit(c, funnel.slug, body), 201);
  })
  // Another system starts it for someone: new, found by email, or by their profile id.
  .post("/:slug/trigger", requireKey, async (c) => {
    const { funnel } = await openFunnel(c);
    const body = await readJson(c, triggerInput);
    if (body.personId && !(await getPerson(c.get("workspaceId"), body.personId))) throw notFound("Person");
    return c.json(await submit(c, funnel.slug, { ...body, submission: null }), 201);
  })

  // A rating for an outcome, from the widget under it (or any front end).
  .post("/:slug/feedback", async (c) => {
    const input = await readJson(c, feedbackInput);
    if (!(await saveFeedback(c.get("workspaceId"), c.req.param("slug"), input))) {
      throw new ApiError(404, "That outcome isn't here.");
    }
    return c.json({ ok: true }, 201);
  })

  // A run: the outcome being made for a submission (or a test). The id is
  // random, so the link is the key, as on the outcome page. `events` is a
  // server-sent event stream: a snapshot, then every change.
  .get("/:slug/runs/:id", async (c) => {
    const run = await readRun(c.get("workspaceId"), c.req.param("id"));
    if (!run) throw notFound("Run");
    return c.json({ run });
  })
  .get("/:slug/runs/:id/events", async (c) => {
    const response = await runEvents(c.get("workspaceId"), c.req.param("id"));
    if (!response) throw notFound("Run");
    return response;
  })

  // Tests: the same run, kept out of Profiles and Analytics. Newest first.
  .get("/:slug/tests", async (c) => {
    const funnel = await funnelOf(c);
    return c.json({ tests: await listTests(c.get("workspaceId"), funnel) });
  })
  .post("/:slug/tests", requireKey, async (c) => {
    const funnel = await funnelOf(c);
    const input = await readJson(c, testInput);
    const known = input.personId ? await getPerson(c.get("workspaceId"), input.personId) : null;
    if (input.personId && !known) throw notFound("Person");
    const id = await runTest(c.get("workspaceId"), funnel, {
      ...input,
      name: input.name || known?.name || "",
      email: input.email || known?.email || "",
      config: input.config ?? funnel.config,
    });
    const { run, events } = linksFor(c, funnel.slug, id);
    return c.json({ test: id, links: { run, events } }, 201);
  })
  .delete("/:slug/tests/:id", requireKey, async (c) => {
    await deleteTest(c.get("workspaceId"), c.req.param("id"));
    return c.body(null, 204);
  });
