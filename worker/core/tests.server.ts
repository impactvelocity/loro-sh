/**
 * Test runs from the admin. Same rules as a real run (the answers are
 * checked against the intake), but nothing touches profiles or analytics.
 */
import { type ExperienceConfig, parseConfig } from "./catalogue/config";
import type { Answers, ProfileRow } from "./catalogue/define";
import { answersSchema, errorsOf, optinSchema, profileRows } from "./catalogue/flow";
import { getCatalogue } from "./catalogue/registry";
import { db, fromJson, toJson } from "./db.server";
import type { RunState } from "./outcome/state";
import type { ExperienceStatus } from "./profiles";
import { type StoredRun, startOutcome } from "./workflow/results.server";

export type TestRecord = {
  id: string;
  personId: string | null;
  name: string;
  email: string;
  answers: Answers;
  profile: ProfileRow[];
  config: ExperienceConfig;
  status: ExperienceStatus;
  error: string | null;
  /** The finished run; null while it's generating. */
  run: RunState | null;
  createdAt: number;
};

type TestRow = {
  id: string;
  person_id: string | null;
  name: string;
  email: string;
  answers: string;
  profile: string;
  config: string;
  status: ExperienceStatus;
  error: string | null;
  data: string | null;
  created_at: number;
};

export class TestError extends Error {
  constructor(public errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? "Check the answers.");
  }
}

/** Newest first. */
export async function listTests(workspaceId: string, funnel: { slug: string; catalogue: string }) {
  const catalogue = getCatalogue(funnel.catalogue);
  if (!catalogue) return [];
  const { results } = await db()
    .prepare(
      `SELECT id, person_id, name, email, answers, profile, config, status, error, data, created_at FROM tests
       WHERE workspace_id = ? AND funnel_slug = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
    )
    .bind(workspaceId, funnel.slug)
    .all<TestRow>();
  return results.map(
    (row): TestRecord => ({
      id: row.id,
      personId: row.person_id,
      name: row.name,
      email: row.email,
      answers: fromJson<Answers>(row.answers, {}),
      profile: fromJson<ProfileRow[]>(row.profile, []),
      config: parseConfig(catalogue, fromJson(row.config, {})),
      status: row.status,
      error: row.error,
      run: fromJson<StoredRun | null>(row.data, null)?.run ?? null,
      createdAt: row.created_at,
    }),
  );
}

/**
 * Runs the experience as it is in the editor, saved or not, through the
 * same outcome workflow as a real one. Finishing writes to `tests`, never
 * to profiles or analytics.
 */
export async function runTest(
  workspaceId: string,
  funnel: { slug: string; catalogue: string; name: string },
  input: { personId: string | null; name: string; email: string; answers: unknown; config: unknown },
) {
  const catalogue = getCatalogue(funnel.catalogue);
  if (!catalogue) throw new TestError({ "": "This experience's catalogue is missing." });
  const config = parseConfig(catalogue, { ...(input.config as object), catalogue: catalogue.id, name: funnel.name });

  const person = optinSchema.safeParse({ name: input.name, email: input.email || "test@example.com" });
  if (!person.success) throw new TestError(errorsOf(person.error));
  const answers = answersSchema(catalogue, config).safeParse(input.answers ?? {});
  if (!answers.success) throw new TestError(errorsOf(answers.error));

  const id = `test-${crypto.randomUUID().slice(0, 12)}`;
  const profile = profileRows(catalogue, config, answers.data as Answers);
  await db()
    .prepare(
      `INSERT INTO tests (workspace_id, id, funnel_slug, person_id, name, email, answers, profile, config, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generating')`,
    )
    .bind(
      workspaceId,
      id,
      funnel.slug,
      input.personId,
      person.data.name || "Test",
      input.email ? person.data.email : "",
      toJson(answers.data),
      toJson(profile),
      toJson(config),
    )
    .run();
  await startOutcome({
    workspaceId,
    runId: id,
    test: true,
    funnel: { slug: funnel.slug, name: funnel.name },
    config,
    person: { id: input.personId, name: person.data.name || "Test", email: person.data.email },
    answers: answers.data as Answers,
    profile,
    outcomeUrl: null,
  });
  return id;
}

export async function deleteTest(workspaceId: string, id: string) {
  await db().prepare("DELETE FROM tests WHERE workspace_id = ? AND id = ?").bind(workspaceId, id).run();
}
