/**
 * Profiles: segments, people, and the outcomes made for them. Create and
 * update take the same fields as the admin's forms (core/people.ts); an
 * update only needs the fields that change.
 */
import { Hono } from "hono";
import { z } from "zod";

import { feedbackForGeneration, feedbackForPerson } from "@core/feedback.server";
import type { PersonInput, SegmentInput } from "@core/people";
import {
  createPerson,
  createSegment,
  deletePerson,
  deleteSegment,
  getGeneration,
  getPerson,
  getSegment,
  listGenerations,
  listPeople,
  listSegments,
  listSubmissions,
  savePerson,
  saveSegment,
} from "@core/profiles.server";
import { readRun } from "@core/workflow/results.server";
import { requireKey } from "./auth";
import { type WorkspaceEnv, notFound, readJson } from "./http";

// The core functions check every field; this only makes sure it's an object.
const fields = z.record(z.string(), z.unknown(), "Send the fields as a JSON object.");

export const segmentRoutes = new Hono<WorkspaceEnv>()
  .get("/", async (c) => c.json({ segments: await listSegments(c.get("workspaceId")) }))
  .post("/", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const id = await createSegment(ws, (await readJson(c, fields)) as SegmentInput);
    return c.json({ segment: await getSegment(ws, id) }, 201);
  })
  .get("/:id", async (c) => {
    const ws = c.get("workspaceId");
    const segment = await getSegment(ws, c.req.param("id"));
    if (!segment) throw notFound("Segment");
    return c.json({ segment, people: await listPeople(ws, segment.id) });
  })
  .patch("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const current = await getSegment(ws, c.req.param("id"));
    if (!current) throw notFound("Segment");
    await saveSegment(ws, current.id, { ...current, ...(await readJson(c, fields)) } as SegmentInput);
    return c.json({ segment: await getSegment(ws, current.id) });
  })
  // Its people stay, unassigned.
  .delete("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    if (!(await getSegment(ws, c.req.param("id")))) throw notFound("Segment");
    await deleteSegment(ws, c.req.param("id"));
    return c.body(null, 204);
  });

export const peopleRoutes = new Hono<WorkspaceEnv>()
  // ?segment=<id> for one segment's members.
  .get("/", async (c) => c.json({ people: await listPeople(c.get("workspaceId"), c.req.query("segment") || undefined) }))
  .post("/", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const id = await createPerson(ws, (await readJson(c, fields)) as PersonInput);
    return c.json({ person: await getPerson(ws, id) }, 201);
  })
  // With everything on their profile page: submissions, outcomes and ratings.
  .get("/:id", async (c) => {
    const ws = c.get("workspaceId");
    const person = await getPerson(ws, c.req.param("id"));
    if (!person) throw notFound("Person");
    const [submissions, generations, feedback] = await Promise.all([
      listSubmissions(ws, person.id),
      listGenerations(ws, { person: person.id }),
      feedbackForPerson(ws, person.id),
    ]);
    return c.json({ person, submissions, generations, feedback });
  })
  .patch("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const current = await getPerson(ws, c.req.param("id"));
    if (!current) throw notFound("Person");
    await savePerson(ws, current.id, { ...current, ...(await readJson(c, fields)) } as PersonInput);
    return c.json({ person: await getPerson(ws, current.id) });
  })
  // Their submissions and outcomes go with them.
  .delete("/:id", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    if (!(await getPerson(ws, c.req.param("id")))) throw notFound("Person");
    await deletePerson(ws, c.req.param("id"));
    return c.body(null, 204);
  });

/** One outcome: who it's for, their answers, the run (live or finished) and its rating. */
export const generationRoutes = new Hono<WorkspaceEnv>().get("/:id", async (c) => {
  const ws = c.get("workspaceId");
  const generation = await getGeneration(ws, c.req.param("id"));
  if (!generation) throw notFound("Outcome");
  const [run, feedback] = await Promise.all([readRun(ws, generation.id), feedbackForGeneration(ws, generation.id)]);
  return c.json({ generation, run, feedback: feedback ?? null });
});
