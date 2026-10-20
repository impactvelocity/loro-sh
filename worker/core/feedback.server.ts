/** Ratings people give their outcome, from the widget under it. */
import { z } from "zod";

import { db } from "./db.server";

export const feedbackInput = z.object({
  generation: z.string().min(1, "Which outcome is this for?"),
  rating: z.number("Pick a rating").int().min(1, "Pick a rating").max(5, "Ratings go from 1 to 5"),
  comment: z.string().trim().max(2000, "Keep it under 2,000 characters").catch(""),
});

export type FeedbackRecord = {
  id: string;
  generationId: string;
  person: { id: string; name: string; email: string } | null;
  rating: number;
  comment: string;
  at: number;
};

/**
 * Saves or replaces the rating for one outcome. The outcome has to belong
 * to the experience and be done; returns false when it isn't.
 */
export async function saveFeedback(workspaceId: string, funnel: string, input: z.output<typeof feedbackInput>) {
  const generation = await db()
    .prepare(`SELECT person_id FROM generations WHERE workspace_id = ? AND id = ? AND funnel_slug = ? AND status = 'done'`)
    .bind(workspaceId, input.generation, funnel)
    .first<{ person_id: string }>();
  if (!generation) return false;
  await db()
    .prepare(
      `INSERT INTO feedback (workspace_id, id, funnel_slug, generation_id, person_id, rating, comment)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT (workspace_id, generation_id) DO UPDATE SET rating = ?6, comment = ?7, updated_at = unixepoch()`,
    )
    .bind(
      workspaceId,
      `fb-${crypto.randomUUID().slice(0, 12)}`,
      funnel,
      input.generation,
      generation.person_id,
      input.rating,
      input.comment,
    )
    .run();
  return true;
}

/** What they said about one outcome, if anything. */
export async function feedbackForGeneration(workspaceId: string, generation: string) {
  return db()
    .prepare("SELECT rating, comment FROM feedback WHERE workspace_id = ? AND generation_id = ?")
    .bind(workspaceId, generation)
    .first<{ rating: number; comment: string }>();
}

type Row = {
  id: string;
  generation_id: string;
  person_id: string | null;
  name: string | null;
  email: string | null;
  rating: number;
  comment: string;
  updated_at: number;
};

const toRecord = (row: Row): FeedbackRecord => ({
  id: row.id,
  generationId: row.generation_id,
  person: row.person_id && row.name !== null ? { id: row.person_id, name: row.name, email: row.email ?? "" } : null,
  rating: row.rating,
  comment: row.comment,
  at: row.updated_at,
});

const select = `
  SELECT f.id, f.generation_id, f.person_id, p.name, p.email, f.rating, f.comment, f.updated_at
  FROM feedback f LEFT JOIN people p ON p.workspace_id = f.workspace_id AND p.id = f.person_id`;

/** Every response for one experience, newest first, with the numbers the Feedback tab shows. */
export async function feedbackSummary(workspaceId: string, funnel: string) {
  const [{ results }, outcomes] = await Promise.all([
    db()
      .prepare(`${select} WHERE f.workspace_id = ? AND f.funnel_slug = ? ORDER BY f.updated_at DESC LIMIT 200`)
      .bind(workspaceId, funnel)
      .all<Row>(),
    db()
      .prepare(`SELECT count(*) AS n FROM generations WHERE workspace_id = ? AND funnel_slug = ? AND status = 'done'`)
      .bind(workspaceId, funnel)
      .first<number>("n"),
  ]);
  const responses = results.map(toRecord);
  const total = responses.length;
  return {
    responses,
    total,
    /** Share of finished outcomes that got a rating. */
    rate: outcomes ? total / outcomes : null,
    average: total ? responses.reduce((sum, r) => sum + r.rating, 0) / total : null,
    fiveStar: total ? responses.filter((r) => r.rating === 5).length / total : null,
    ratings: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: responses.filter((r) => r.rating === rating).length })),
  };
}

/** One person's ratings, for their activity. */
export async function feedbackForPerson(workspaceId: string, personId: string) {
  const { results } = await db()
    .prepare(
      `SELECT f.id, f.rating, f.comment, f.updated_at, coalesce(fn.name, f.funnel_slug) AS experience
       FROM feedback f LEFT JOIN funnels fn ON fn.workspace_id = f.workspace_id AND fn.slug = f.funnel_slug
       WHERE f.workspace_id = ? AND f.person_id = ? ORDER BY f.updated_at DESC`,
    )
    .bind(workspaceId, personId)
    .all<{ id: string; rating: number; comment: string; updated_at: number; experience: string }>();
  return results;
}
