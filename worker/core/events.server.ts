/**
 * Funnel events: page views, new profiles, intakes started and finished,
 * outcomes generated or failed. No names or emails; the activity table
 * has those.
 *
 * Each event goes two places:
 *
 * - D1 `event_counts`: one row per day, experience, event and source,
 *   incremented. The admin reads this, so Analytics works locally and on
 *   a fresh fork without API secrets.
 * - Workers Analytics Engine: index1 the workspace, blob1 the event,
 *   blob2 the funnel slug, blob3 the source. Built for volume; reading it
 *   needs CF_ACCOUNT_ID and CF_API_TOKEN (`queryEvents`).
 */
import { env, waitUntil } from "cloudflare:workers";

import type { Source } from "./analytics";
import { db, isId } from "./db.server";

export const eventNames = ["view", "profile", "intake_started", "intake_completed", "generated", "failed"] as const;
export type EventName = (typeof eventNames)[number];

/** YYYY-MM-DD in UTC, the day an event counts towards. */
export function dayOf(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function track(event: {
  workspaceId: string;
  name: EventName;
  funnel: string;
  /** Unknown for page views, before anyone has signed up. */
  source?: Source;
}) {
  env.EVENTS.writeDataPoint({
    indexes: [event.workspaceId],
    blobs: [event.name, event.funnel, event.source ?? ""],
    doubles: [1],
  });
  // After the response, so a view never waits on a write.
  waitUntil(
    db()
      .prepare(
        `INSERT INTO event_counts (workspace_id, day, funnel_slug, name, source, count) VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT (workspace_id, day, funnel_slug, name, source) DO UPDATE SET count = count + 1`,
      )
      .bind(event.workspaceId, dayOf(), event.funnel, event.name, event.source ?? "")
      .run()
      .catch((error) => console.error("track", error)),
  );
}

export type CountRow = { day: string; funnel: string; name: EventName; source: Source | ""; count: number };

/** Daily counts from `since` (YYYY-MM-DD) on, for one experience or all of them. */
export async function readCounts(workspaceId: string, since: string, funnel?: string) {
  const { results } = await db()
    .prepare(
      `SELECT day, funnel_slug AS funnel, name, source, count FROM event_counts
       WHERE workspace_id = ? AND day >= ? ${funnel === undefined ? "" : "AND funnel_slug = ?"}`,
    )
    .bind(...(funnel === undefined ? [workspaceId, since] : [workspaceId, since, funnel]))
    .all<CountRow>();
  return results;
}

export type EventCount = {
  /** YYYY-MM-DD in UTC. */
  day: string;
  name: EventName;
  funnel: string;
  source: Source | "";
  count: number;
};

/** Daily counts for the last `days` days. Analytics Engine keeps 90. */
export async function queryEvents(workspaceId: string, days: number): Promise<EventCount[] | null> {
  if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) return null;
  // Interpolated into SQL below; the API has no bound parameters.
  if (!isId(workspaceId)) throw new Error(`Bad workspace id: ${workspaceId}`);
  const span = Math.min(90, Math.max(1, Math.floor(days)));

  const sql = `
    SELECT
      formatDateTime(toStartOfDay(timestamp), '%Y-%m-%d') AS day,
      blob1 AS name,
      blob2 AS funnel,
      blob3 AS source,
      SUM(_sample_interval) AS count
    FROM loro_events
    WHERE index1 = '${workspaceId}' AND timestamp > NOW() - INTERVAL '${span}' DAY
    GROUP BY day, name, funnel, source
    ORDER BY day
    FORMAT JSON`;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
    { method: "POST", headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }, body: sql },
  );
  if (!response.ok) throw new Error(`Analytics Engine ${response.status}: ${await response.text()}`);
  const { data } = await response.json<{ data: (Omit<EventCount, "count"> & { count: string })[] }>();
  return data.map((row) => ({ ...row, count: Number(row.count) }));
}
