/** Analytics from D1: daily event counts plus the named activity feed. */
import {
  type Activity,
  type Analytics,
  type Range,
  daysFromCounts,
  funnelFor,
  ranges,
  RETENTION_DAYS,
  sumSources,
  totalsFor,
} from "./analytics";
import { db } from "./db.server";
import { readCounts } from "./events.server";

function startOf(today: Date, length: number) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() - (length - 1));
  return date.toISOString().slice(0, 10);
}

/** The latest steps people took, newest first. */
export async function latestActivity(workspaceId: string, limit = 20, funnel?: string): Promise<Activity[]> {
  const { results } = await db()
    .prepare(
      `SELECT a.id, a.person_id, a.at, a.event, a.source, p.name, p.email, f.name AS experience
       FROM activity a
       JOIN people p ON p.workspace_id = a.workspace_id AND p.id = a.person_id
       LEFT JOIN funnels f ON f.workspace_id = a.workspace_id AND f.slug = a.funnel_slug
       WHERE a.workspace_id = ? ${funnel ? "AND a.funnel_slug = ?" : ""}
       ORDER BY a.at DESC, a.id DESC LIMIT ${Math.floor(limit)}`,
    )
    .bind(...(funnel ? [workspaceId, funnel] : [workspaceId]))
    .all<Omit<Activity, "personId"> & { person_id: string }>();
  return results.map(({ person_id, ...row }) => ({ ...row, personId: person_id }));
}

/** The whole workspace, for the Analytics page. */
export async function getAnalytics(workspaceId: string, range: Range, today: Date): Promise<Analytics> {
  const length = ranges[range];
  // The previous period too, when it's still within retention.
  const span = length * 2 <= RETENTION_DAYS ? length * 2 : length;
  const [rows, activity] = await Promise.all([
    readCounts(workspaceId, startOf(today, span)),
    latestActivity(workspaceId),
  ]);
  const all = daysFromCounts(rows, today, span);
  const days = all.slice(-length);
  return {
    range,
    days,
    totals: totalsFor(days),
    previous: span > length ? totalsFor(all.slice(0, length)) : null,
    funnel: funnelFor(days),
    activity,
  };
}

/** One experience over the last 30 days, for its Overview tab. */
export async function experienceAnalytics(workspaceId: string, slug: string, today: Date) {
  const length = 30;
  const rows = await readCounts(workspaceId, startOf(today, length), slug);
  const days = daysFromCounts(rows, today, length);
  const total = (key: "intakeStarted" | "intakeCompleted" | "generated") =>
    days.reduce((n, day) => n + sumSources(day[key]), 0);
  const failed = rows.filter((row) => row.name === "failed").reduce((n, row) => n + row.count, 0);
  const started = total("intakeStarted");
  const finished = total("intakeCompleted");
  return {
    days: days.map((day) => ({ date: day.date, generated: sumSources(day.generated) })),
    stats: {
      views: days.reduce((n, day) => n + day.views, 0),
      started,
      finished,
      generated: total("generated"),
      failed,
      completionRate: started ? finished / started : null,
    },
  };
}
