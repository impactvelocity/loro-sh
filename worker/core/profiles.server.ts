/**
 * Profiles in D1: segments, people and their submissions, per workspace,
 * plus the account-wide lists. Sign-ups and intake answers from public
 * experiences land here through `recordOptin` and `recordSubmission`.
 */
import type { Source } from "./analytics";
import type { Answers, ProfileRow } from "./catalogue/define";
import { slugifyId } from "./catalogue/config";
import { db, fromJson, now, toJson } from "./db.server";
import { track } from "./events.server";
import {
  type OwnSignal,
  type PersonInput,
  type PersonRecord,
  type SegmentInput,
  type SegmentRecord,
  type SubmissionRecord,
  personInput,
  segmentInput,
} from "./people";
import type { AgeRange, ExperienceStatus, Signal, Status } from "./profiles";

export type SegmentAcross = {
  workspaceId: string;
  workspace: string;
  id: string;
  name: string;
  ages: AgeRange[];
  signals: number;
  people: number;
};

export type PersonAcross = {
  workspaceId: string;
  workspace: string;
  id: string;
  name: string;
  email: string;
  source: Source;
  segment: string | null;
};

/** Every segment in every workspace, for the account-wide Profiles page. */
export async function listAllSegments() {
  const { results } = await db()
    .prepare(
      `SELECT s.workspace_id, w.name AS workspace, s.id, s.name, s.ages, s.signals,
         (SELECT count(*) FROM people p WHERE p.workspace_id = s.workspace_id AND p.segment_id = s.id) AS people
       FROM segments s JOIN workspaces w ON w.id = s.workspace_id
       ORDER BY w.name, s.name`,
    )
    .all<{ workspace_id: string; workspace: string; id: string; name: string; ages: string; signals: string; people: number }>();
  return results.map(
    (row): SegmentAcross => ({
      workspaceId: row.workspace_id,
      workspace: row.workspace,
      id: row.id,
      name: row.name,
      ages: fromJson<AgeRange[]>(row.ages, []),
      signals: fromJson<Signal[]>(row.signals, []).length,
      people: row.people,
    }),
  );
}

/** Every person in every workspace, newest first. */
export async function listAllPeople() {
  const { results } = await db()
    .prepare(
      `SELECT p.workspace_id, w.name AS workspace, p.id, p.name, p.email, p.source, s.name AS segment
       FROM people p
       JOIN workspaces w ON w.id = p.workspace_id
       LEFT JOIN segments s ON s.workspace_id = p.workspace_id AND s.id = p.segment_id
       ORDER BY p.created_at DESC, p.name`,
    )
    .all<{ workspace_id: string; workspace: string; id: string; name: string; email: string; source: Source; segment: string | null }>();
  return results.map(
    ({ workspace_id, ...row }): PersonAcross => ({ workspaceId: workspace_id, ...row }),
  );
}

export class ProfileError extends Error {}

/** First message from a failed parse, for a form's error line. */
function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the details and try again.";
}

/** A readable id from a name, unique in the table: "sam-okafor", then "sam-okafor-2". */
async function uniqueId(table: "people" | "segments", workspaceId: string, name: string, fallback: string) {
  const base = slugifyId(name) || fallback;
  const { results } = await db()
    .prepare(`SELECT id FROM ${table} WHERE workspace_id = ? AND (id = ? OR id LIKE ?)`)
    .bind(workspaceId, base, `${base}-%`)
    .all<{ id: string }>();
  const taken = new Set(results.map((r) => r.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

// Segments

type SegmentRow = {
  id: string;
  name: string;
  description: string;
  ages: string;
  gender: SegmentRecord["gender"];
  location: string;
  signals: string;
  people: number;
  updated_at: number;
};

const segmentSelect = `
  SELECT s.id, s.name, s.description, s.ages, s.gender, s.location, s.signals, s.updated_at,
    (SELECT count(*) FROM people p WHERE p.workspace_id = s.workspace_id AND p.segment_id = s.id) AS people
  FROM segments s`;

const toSegment = (row: SegmentRow): SegmentRecord => ({
  id: row.id,
  name: row.name,
  description: row.description,
  ages: fromJson<AgeRange[]>(row.ages, []),
  gender: row.gender,
  location: row.location,
  signals: fromJson<Signal[]>(row.signals, []),
  people: row.people,
  updatedAt: row.updated_at,
});

export async function listSegments(workspaceId: string) {
  const { results } = await db()
    .prepare(`${segmentSelect} WHERE s.workspace_id = ? ORDER BY s.name`)
    .bind(workspaceId)
    .all<SegmentRow>();
  return results.map(toSegment);
}

export async function getSegment(workspaceId: string, id: string) {
  const row = await db()
    .prepare(`${segmentSelect} WHERE s.workspace_id = ? AND s.id = ?`)
    .bind(workspaceId, id)
    .first<SegmentRow>();
  return row ? toSegment(row) : null;
}

export async function createSegment(workspaceId: string, input: SegmentInput) {
  const parsed = segmentInput.safeParse(input);
  if (!parsed.success) throw new ProfileError(firstError(parsed.error));
  const s = parsed.data;
  const id = await uniqueId("segments", workspaceId, s.name, "segment");
  await db()
    .prepare(
      `INSERT INTO segments (workspace_id, id, name, description, ages, gender, location, signals)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(workspaceId, id, s.name, s.description, toJson(s.ages), s.gender, s.location, toJson(s.signals))
    .run();
  return id;
}

export async function saveSegment(workspaceId: string, id: string, input: SegmentInput) {
  const parsed = segmentInput.safeParse(input);
  if (!parsed.success) throw new ProfileError(firstError(parsed.error));
  const s = parsed.data;
  await db()
    .prepare(
      `UPDATE segments SET name = ?, description = ?, ages = ?, gender = ?, location = ?, signals = ?, updated_at = ?
       WHERE workspace_id = ? AND id = ?`,
    )
    .bind(s.name, s.description, toJson(s.ages), s.gender, s.location, toJson(s.signals), now(), workspaceId, id)
    .run();
}

/** Its people stay, unassigned. */
export async function deleteSegment(workspaceId: string, id: string) {
  await db().batch([
    db().prepare("UPDATE people SET segment_id = NULL WHERE workspace_id = ? AND segment_id = ?").bind(workspaceId, id),
    db().prepare("DELETE FROM segments WHERE workspace_id = ? AND id = ?").bind(workspaceId, id),
  ]);
}

// People

type PersonRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  source: Source;
  source_detail: string;
  segment_id: string | null;
  segment_name: string | null;
  status: Status;
  signals: string;
  notes: string;
  created_at: number;
  updated_at: number;
  last_active_at: number | null;
};

const personSelect = `
  SELECT p.id, p.name, p.email, p.phone, p.location, p.source, p.source_detail, p.segment_id,
    s.name AS segment_name, p.status, p.signals, p.notes, p.created_at, p.updated_at, p.last_active_at
  FROM people p
  LEFT JOIN segments s ON s.workspace_id = p.workspace_id AND s.id = p.segment_id`;

const toPerson = (row: PersonRow): PersonRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone ?? "",
  location: row.location,
  source: row.source,
  sourceDetail: row.source_detail,
  segmentId: row.segment_id,
  segmentName: row.segment_name,
  status: row.status,
  signals: fromJson<OwnSignal[]>(row.signals, []),
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastActiveAt: row.last_active_at,
});

/** Most recently active first. */
export async function listPeople(workspaceId: string, segmentId?: string) {
  const where = segmentId ? "p.workspace_id = ? AND p.segment_id = ?" : "p.workspace_id = ?";
  const { results } = await db()
    .prepare(`${personSelect} WHERE ${where} ORDER BY coalesce(p.last_active_at, p.created_at) DESC, p.name`)
    .bind(...(segmentId ? [workspaceId, segmentId] : [workspaceId]))
    .all<PersonRow>();
  return results.map(toPerson);
}

export async function getPerson(workspaceId: string, id: string) {
  const row = await db()
    .prepare(`${personSelect} WHERE p.workspace_id = ? AND p.id = ?`)
    .bind(workspaceId, id)
    .first<PersonRow>();
  return row ? toPerson(row) : null;
}

async function personByEmail(workspaceId: string, email: string) {
  if (!email) return null;
  const row = await db()
    .prepare(`${personSelect} WHERE p.workspace_id = ? AND p.email = ?`)
    .bind(workspaceId, email)
    .first<PersonRow>();
  return row ? toPerson(row) : null;
}

async function checkSegment(workspaceId: string, segmentId: string | null) {
  if (segmentId && !(await getSegment(workspaceId, segmentId))) throw new ProfileError("That segment no longer exists.");
}

async function checkEmail(workspaceId: string, email: string, personId?: string) {
  const other = await personByEmail(workspaceId, email);
  if (other && other.id !== personId) throw new ProfileError(`${other.name} already uses this email.`);
}

/** Added by hand in the admin. */
export async function createPerson(workspaceId: string, input: PersonInput) {
  const parsed = personInput.safeParse(input);
  if (!parsed.success) throw new ProfileError(firstError(parsed.error));
  const p = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  await checkSegment(workspaceId, p.segmentId);
  await checkEmail(workspaceId, p.email);
  const id = await uniqueId("people", workspaceId, p.name, "person");
  await db()
    .prepare(
      `INSERT INTO people (workspace_id, id, segment_id, name, email, phone, location, source, source_detail, status,
         signals, notes, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'owner', 'Added by your team', 'invited', ?, ?, ?)`,
    )
    .bind(workspaceId, id, p.segmentId, p.name, p.email, p.phone || null, p.location, toJson(p.signals), p.notes, now())
    .run();
  track({ workspaceId, name: "profile", funnel: "", source: "owner" });
  return id;
}

export async function savePerson(workspaceId: string, id: string, input: PersonInput) {
  const parsed = personInput.safeParse(input);
  if (!parsed.success) throw new ProfileError(firstError(parsed.error));
  const p = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  await checkSegment(workspaceId, p.segmentId);
  await checkEmail(workspaceId, p.email, id);
  await db()
    .prepare(
      `UPDATE people SET name = ?, email = ?, phone = ?, location = ?, segment_id = ?, signals = ?, notes = ?, updated_at = ?
       WHERE workspace_id = ? AND id = ?`,
    )
    .bind(p.name, p.email, p.phone || null, p.location, p.segmentId, toJson(p.signals), p.notes, now(), workspaceId, id)
    .run();
}

/** Their submissions go with them (cascade). */
export async function deletePerson(workspaceId: string, id: string) {
  await db().batch([
    db().prepare("DELETE FROM activity WHERE workspace_id = ? AND person_id = ?").bind(workspaceId, id),
    db().prepare("DELETE FROM people WHERE workspace_id = ? AND id = ?").bind(workspaceId, id),
  ]);
}

// Submissions

type SubmissionRow = {
  id: string;
  funnel_slug: string | null;
  funnel_name: string;
  status: SubmissionRecord["status"];
  profile: string;
  created_at: number;
  updated_at: number;
};

/** Newest first. */
export async function listSubmissions(workspaceId: string, personId: string) {
  const { results } = await db()
    .prepare(
      `SELECT id, funnel_slug, funnel_name, status, profile, created_at, updated_at FROM submissions
       WHERE workspace_id = ? AND person_id = ? ORDER BY created_at DESC, id DESC`,
    )
    .bind(workspaceId, personId)
    .all<SubmissionRow>();
  return results.map(
    (row): SubmissionRecord => ({
      id: row.id,
      funnelSlug: row.funnel_slug,
      funnelName: row.funnel_name,
      status: row.status,
      profile: fromJson<ProfileRow[]>(row.profile, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );
}

/** Statuses only move forward: a second sign-up doesn't undo a finished intake. */
const statusRank: Record<Status, number> = {
  invited: 0,
  intake_started: 1,
  intake_completed: 2,
  delivered: 3,
  opened: 4,
};
const later = (current: Status, next: Status) => (statusRank[next] > statusRank[current] ? next : current);

type Funnel = { slug: string; name: string };
type Signup = { name: string; email: string };
/** A sign-up, or a profile that's already here (an API trigger for a known person). */
type PersonRef = Signup | { id: string };

/**
 * Finds them by id or email, or creates them, and moves them on to
 * `status`. New people get the source; known people keep theirs.
 */
async function upsertPerson(workspaceId: string, funnel: Funnel, input: PersonRef, source: Source, status: Status) {
  if ("id" in input) {
    const known = await getPerson(workspaceId, input.id);
    if (!known) throw new ProfileError("That person isn't in this workspace.");
    await db()
      .prepare(`UPDATE people SET status = ?, last_active_at = ?, updated_at = ? WHERE workspace_id = ? AND id = ?`)
      .bind(later(known.status, status), now(), now(), workspaceId, known.id)
      .run();
    return { id: known.id, name: known.name, email: known.email, source: known.source };
  }
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split("@")[0];
  const existing = await personByEmail(workspaceId, email);
  if (existing) {
    await db()
      .prepare(
        `UPDATE people SET name = ?, status = ?, last_active_at = ?, updated_at = ? WHERE workspace_id = ? AND id = ?`,
      )
      .bind(input.name.trim() || existing.name, later(existing.status, status), now(), now(), workspaceId, existing.id)
      .run();
    return { id: existing.id, name: input.name.trim() || existing.name, email, source: existing.source };
  }
  const id = await uniqueId("people", workspaceId, name, "person");
  const detail = source === "signup" ? `Signed up · ${funnel.name}` : `API · ${funnel.name}`;
  await db()
    .prepare(
      `INSERT INTO people (workspace_id, id, name, email, source, source_detail, status, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(workspaceId, id, name, email, source, detail, status, now())
    .run();
  track({ workspaceId, name: "profile", funnel: funnel.slug, source });
  return { id, name, email, source };
}

function logActivity(
  workspaceId: string,
  personId: string,
  funnel: Funnel,
  event: "intake_started" | "intake_completed" | "generated" | "failed",
  source: Source,
) {
  track({ workspaceId, name: event, funnel: funnel.slug, source });
  return db()
    .prepare("INSERT INTO activity (workspace_id, person_id, funnel_slug, event, source) VALUES (?, ?, ?, ?, ?)")
    .bind(workspaceId, personId, funnel.slug, event, source)
    .run();
}

/** A sign-up on an experience's start page: their profile, and a submission waiting for answers. */
export async function recordOptin(workspaceId: string, funnel: Funnel, signup: Signup) {
  const person = await upsertPerson(workspaceId, funnel, signup, "signup", "intake_started");
  const submission = `sub-${crypto.randomUUID().slice(0, 12)}`;
  await db()
    .prepare(
      `INSERT INTO submissions (workspace_id, id, person_id, funnel_slug, funnel_name, status) VALUES (?, ?, ?, ?, ?, 'started')`,
    )
    .bind(workspaceId, submission, person.id, funnel.slug, funnel.name)
    .run();
  await logActivity(workspaceId, person.id, funnel, "intake_started", person.source);
  return { person: { id: person.id, name: person.name, email: person.email }, submission };
}

/**
 * Their answers. Completes the submission their sign-up started when it's
 * theirs and still open; otherwise (an API call, or a second go) records a
 * new one. Without a sign-up first, they're a triggered profile.
 */
export async function recordSubmission(
  workspaceId: string,
  funnel: Funnel,
  input: { submission: string | null; person: PersonRef; answers: Answers; profile: ProfileRow[] },
) {
  const source: Source = input.submission ? "signup" : "trigger";
  const person = await upsertPerson(workspaceId, funnel, input.person, source, "intake_completed");
  const open = input.submission
    ? await db()
        .prepare(
          `SELECT id FROM submissions WHERE workspace_id = ? AND id = ? AND person_id = ? AND status = 'started'`,
        )
        .bind(workspaceId, input.submission, person.id)
        .first<{ id: string }>()
    : null;
  const submission = open?.id ?? `sub-${crypto.randomUUID().slice(0, 12)}`;
  // Straight in by API, or a second go: it starts and finishes now.
  if (!open) await logActivity(workspaceId, person.id, funnel, "intake_started", person.source);
  await db()
    .prepare(
      `INSERT INTO submissions (workspace_id, id, person_id, funnel_slug, funnel_name, status, answers, profile)
       VALUES (?1, ?2, ?3, ?4, ?5, 'completed', ?6, ?7)
       ON CONFLICT (workspace_id, id) DO UPDATE SET status = 'completed', answers = ?6, profile = ?7, updated_at = unixepoch()`,
    )
    .bind(workspaceId, submission, person.id, funnel.slug, funnel.name, toJson(input.answers), toJson(input.profile))
    .run();
  await logActivity(workspaceId, person.id, funnel, "intake_completed", person.source);
  const generation = await recordGeneration(workspaceId, funnel, person, submission);
  return { person: { id: person.id, name: person.name, email: person.email }, submission, generation };
}

/**
 * The outcome for a finished submission. It starts as `generating`; the
 * outcome workflow (workflow/outcome.server.ts) finishes it with
 * `finishGeneration`.
 */
async function recordGeneration(workspaceId: string, funnel: Funnel, person: { id: string; source: Source }, submission: string) {
  const id = `gen-${crypto.randomUUID().slice(0, 12)}`;
  await db()
    .prepare(
      `INSERT INTO generations (workspace_id, id, funnel_slug, person_id, submission_id, title, status)
       VALUES (?, ?, ?, ?, ?, ?, 'generating')`,
    )
    .bind(workspaceId, id, funnel.slug, person.id, submission, funnel.name)
    .run();
  return id;
}

/**
 * A run finished: its data, and the person's status and activity to match.
 * The workflow saves again after background steps (and retries), so only
 * the first save, out of 'generating', counts as the event.
 */
export async function finishGeneration(
  workspaceId: string,
  id: string,
  result: { status: "done" | "error"; data: unknown; error: string | null },
) {
  const [before, updated] = await db().batch<{ status?: string; person_id?: string; funnel_slug?: string | null }>([
    db().prepare("SELECT status FROM generations WHERE workspace_id = ? AND id = ?").bind(workspaceId, id),
    db()
      .prepare(
        `UPDATE generations SET status = ?, data = ?, error = ?, updated_at = ? WHERE workspace_id = ? AND id = ?
         RETURNING person_id, funnel_slug`,
      )
      .bind(result.status, toJson(result.data), result.error, now(), workspaceId, id),
  ]);
  const row = updated.results[0] as { person_id: string; funnel_slug: string | null } | undefined;
  if (!row || before.results[0]?.status !== "generating") return;
  const person = await db()
    .prepare("SELECT source FROM people WHERE workspace_id = ? AND id = ?")
    .bind(workspaceId, row.person_id)
    .first<{ source: Source }>();
  if (result.status === "done") {
    await db()
      .prepare(
        "UPDATE people SET status = 'delivered' WHERE workspace_id = ? AND id = ? AND status IN ('invited', 'intake_started', 'intake_completed')",
      )
      .bind(workspaceId, row.person_id)
      .run();
  }
  const funnel = { slug: row.funnel_slug ?? "", name: "" };
  await logActivity(workspaceId, row.person_id, funnel, result.status === "done" ? "generated" : "failed", person?.source ?? "trigger");
}

/** A finished run's stored data: the run, its brief and the config it ran with. */
export async function generationData(workspaceId: string, id: string) {
  const row = await db()
    .prepare("SELECT data FROM generations WHERE workspace_id = ? AND id = ?")
    .bind(workspaceId, id)
    .first<{ data: string | null }>();
  return row?.data ? fromJson<unknown>(row.data, null) : null;
}

// Generations

export type GenerationRecord = {
  id: string;
  funnelSlug: string | null;
  submissionId: string | null;
  personId: string;
  title: string;
  status: ExperienceStatus;
  error: string | null;
  createdAt: number;
  updatedAt: number;
};

type GenerationRow = {
  id: string;
  funnel_slug: string | null;
  submission_id: string | null;
  person_id: string;
  title: string;
  status: ExperienceStatus;
  error: string | null;
  created_at: number;
  updated_at: number;
};

const toGeneration = (row: GenerationRow): GenerationRecord => ({
  id: row.id,
  funnelSlug: row.funnel_slug,
  submissionId: row.submission_id,
  personId: row.person_id,
  title: row.title,
  status: row.status,
  error: row.error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Newest first. */
export async function listGenerations(workspaceId: string, by: { person: string } | { funnel: string }) {
  const [column, value] = "person" in by ? ["person_id", by.person] : ["funnel_slug", by.funnel];
  const { results } = await db()
    .prepare(
      `SELECT id, funnel_slug, submission_id, person_id, title, status, error, created_at, updated_at FROM generations
       WHERE workspace_id = ? AND ${column} = ? ORDER BY created_at DESC, id DESC`,
    )
    .bind(workspaceId, value)
    .all<GenerationRow>();
  return results.map(toGeneration);
}

/** One outcome with what it was made from: the person and their answers. */
export async function getGeneration(workspaceId: string, id: string) {
  const row = await db()
    .prepare(
      `SELECT g.id, g.funnel_slug, g.submission_id, g.person_id, g.title, g.status, g.error, g.created_at, g.updated_at,
         p.name AS person_name, p.email AS person_email, s.answers
       FROM generations g
       JOIN people p ON p.workspace_id = g.workspace_id AND p.id = g.person_id
       LEFT JOIN submissions s ON s.workspace_id = g.workspace_id AND s.id = g.submission_id
       WHERE g.workspace_id = ? AND g.id = ?`,
    )
    .bind(workspaceId, id)
    .first<GenerationRow & { person_name: string; person_email: string; answers: string | null }>();
  if (!row) return null;
  return {
    ...toGeneration(row),
    person: { name: row.person_name, email: row.person_email },
    answers: fromJson<Answers>(row.answers, {}),
  };
}

/** Everyone who's been through one experience, with their latest submission and outcome. */
export async function funnelPeople(workspaceId: string, funnel: string) {
  const { results } = await db()
    .prepare(
      `SELECT p.id, p.name, p.email, p.source,
         s.status AS submission, s.updated_at AS submitted_at,
         g.id AS generation, g.status AS generation_status, g.updated_at AS generated_at
       FROM people p
       JOIN submissions s ON s.workspace_id = p.workspace_id AND s.person_id = p.id AND s.funnel_slug = ?2
         AND s.created_at = (SELECT max(created_at) FROM submissions WHERE workspace_id = p.workspace_id
           AND person_id = p.id AND funnel_slug = ?2)
       LEFT JOIN generations g ON g.workspace_id = p.workspace_id AND g.submission_id = s.id
       WHERE p.workspace_id = ?1
       GROUP BY p.id
       ORDER BY max(s.updated_at, coalesce(g.updated_at, 0)) DESC`,
    )
    .bind(workspaceId, funnel)
    .all<{
      id: string;
      name: string;
      email: string;
      source: Source;
      submission: SubmissionRecord["status"];
      submitted_at: number;
      generation: string | null;
      generation_status: ExperienceStatus | null;
      generated_at: number | null;
    }>();
  return results.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    source: row.source,
    submission: row.submission,
    generation: row.generation ? { id: row.generation, status: row.generation_status! } : null,
    at: Math.max(row.submitted_at, row.generated_at ?? 0),
  }));
}

/** One experience's outcomes with who they're for, newest first. */
export async function funnelGenerations(workspaceId: string, funnel: string, limit = 50) {
  const { results } = await db()
    .prepare(
      `SELECT g.id, g.status, g.error, g.created_at, g.updated_at, p.id AS person_id, p.name, p.email, p.source
       FROM generations g JOIN people p ON p.workspace_id = g.workspace_id AND p.id = g.person_id
       WHERE g.workspace_id = ? AND g.funnel_slug = ? ORDER BY g.created_at DESC, g.id DESC LIMIT ${Math.floor(limit)}`,
    )
    .bind(workspaceId, funnel)
    .all<{
      id: string;
      status: ExperienceStatus;
      error: string | null;
      created_at: number;
      updated_at: number;
      person_id: string;
      name: string;
      email: string;
      source: Source;
    }>();
  return results.map((row) => ({
    id: row.id,
    status: row.status,
    error: row.error,
    at: row.updated_at,
    person: { id: row.person_id, name: row.name, email: row.email, source: row.source },
  }));
}

/** People to test as, with their latest finished answers to this experience, if any. */
export async function testPeople(workspaceId: string, funnel: string) {
  const { results } = await db()
    .prepare(
      `SELECT p.id, p.name, p.email,
         (SELECT s.answers FROM submissions s WHERE s.workspace_id = p.workspace_id AND s.person_id = p.id
            AND s.funnel_slug = ? AND s.status = 'completed' ORDER BY s.updated_at DESC LIMIT 1) AS answers
       FROM people p WHERE p.workspace_id = ? ORDER BY p.name`,
    )
    .bind(funnel, workspaceId)
    .all<{ id: string; name: string; email: string; answers: string | null }>();
  return results.map((row) => ({ ...row, answers: row.answers ? fromJson<Answers>(row.answers, {}) : null }));
}
