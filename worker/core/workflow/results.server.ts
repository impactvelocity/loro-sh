/**
 * Starting a run, saving what it made, and reading it back.
 *
 * A run's live state is in its room while it works. Once it's finished,
 * D1 has the copy: `generations.data` for a person's outcome, `tests.data`
 * for a test. Both hold `{ run, brief, config }`: the public run state,
 * the Taste brief it was written from (admin only), and the experience as
 * it ran.
 */
import { env } from "cloudflare:workers";

import type { ExperienceConfig } from "../catalogue/config";
import { getCatalogue } from "../catalogue/registry";
import { db, fromJson, now, toJson } from "../db.server";
import type { TasteBrief } from "../outcome/brief";
import { planRun } from "../outcome/plan";
import type { RunState } from "../outcome/state";
import { finishGeneration } from "../profiles.server";
import type { OutcomeParams } from "./context.server";
import { roomFor } from "./room.server";

export type StoredRun = { run: RunState; brief: TasteBrief | null; config: ExperienceConfig };

/** Plans the run so the page has its steps straight away, then starts the workflow. */
export async function startOutcome(params: OutcomeParams) {
  const catalogue = getCatalogue(params.config.catalogue);
  if (!catalogue) throw new Error(`The catalogue "${params.config.catalogue}" is missing.`);
  const state = planRun(params.runId, catalogue, params.config);
  await roomFor(params.workspaceId, params.runId).apply([{ type: "snapshot", state }]);
  await env.OUTCOME.create({ id: `${params.workspaceId}-${params.runId}`, params });
  return state;
}

export async function saveRunResult(
  params: OutcomeParams,
  result: { status: "done" | "error"; run: RunState | null; brief: TasteBrief | null; error: string | null },
) {
  const data: StoredRun | null = result.run ? { run: result.run, brief: result.brief, config: params.config } : null;
  if (!params.test) {
    await finishGeneration(params.workspaceId, params.runId, { status: result.status, data, error: result.error });
    return;
  }
  await db()
    .prepare("UPDATE tests SET status = ?, data = ?, error = ?, updated_at = ? WHERE workspace_id = ? AND id = ?")
    .bind(result.status, toJson(data), result.error, now(), params.workspaceId, params.runId)
    .run();
}

/** gen-… or test-…, as recordGeneration and runTest make them. */
export const isRunId = (id: string) => /^(gen|test)-[a-z0-9-]{6,40}$/.test(id);

/** What a run made, from D1 once it's finished. Null while it's still going. */
export async function storedRun(workspaceId: string, runId: string): Promise<StoredRun | null> {
  if (!isRunId(runId)) return null;
  const table = runId.startsWith("test-") ? "tests" : "generations";
  const row = await db()
    .prepare(`SELECT status, data FROM ${table} WHERE workspace_id = ? AND id = ?`)
    .bind(workspaceId, runId)
    .first<{ status: string; data: string | null }>();
  if (!row?.data || row.status === "generating") return null;
  return fromJson<StoredRun | null>(row.data, null);
}

/** The run as the page sees it: D1's copy once finished, the room's while it works. */
export async function readRun(workspaceId: string, runId: string): Promise<RunState | null> {
  if (!isRunId(runId)) return null;
  const stored = await storedRun(workspaceId, runId);
  if (stored) return stored.run;
  return roomFor(workspaceId, runId).snapshot();
}

/** The room's event stream, or a one-off snapshot when the run is long finished. */
export async function runEvents(workspaceId: string, runId: string): Promise<Response | null> {
  if (!isRunId(runId)) return null;
  const stored = await storedRun(workspaceId, runId);
  if (stored) {
    const body = `data: ${JSON.stringify({ type: "snapshot", state: stored.run })}\n\n`;
    return new Response(body, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
  }
  const snapshot = await roomFor(workspaceId, runId).snapshot();
  if (!snapshot) return null;
  return roomFor(workspaceId, runId).fetch("https://room/events");
}
