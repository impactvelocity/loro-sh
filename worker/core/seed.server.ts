/**
 * Copies the events fixtures into a workspace, for one created with demo
 * data. A fresh database starts with no workspaces at all.
 */
import { sampleDays, sources } from "./analytics";
import { listImages, listMedia, listSkills } from "./context";
import { db, now, toJson } from "./db.server";
import { experiencesFor, listIndividuals, listSegments } from "./profiles";

export async function seedWorkspace(workspaceId: string) {
  await db().batch(fixtureData(workspaceId));
}

/** Fixtures say "Oct 14"; assume this year. */
function fromLabel(label: string) {
  const parsed = Date.parse(`${label} ${new Date().getFullYear()}`);
  return Number.isNaN(parsed) ? now() : Math.floor(parsed / 1000);
}

const minutesAgo = (minutes: number) => now() - minutes * 60;
const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

function fixtureData(ws: string) {
  const d = db();

  const segments = listSegments().map((s) =>
    d
      .prepare(
        `INSERT OR IGNORE INTO segments (workspace_id, id, name, description, ages, gender, location, signals, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(ws, s.id, s.name, s.description, toJson(s.ages), s.gender, s.location, toJson(s.signals), fromLabel(s.updated)),
  );

  const individuals = listIndividuals();
  const people = individuals.map((p) =>
    d
      .prepare(
        `INSERT OR IGNORE INTO people (workspace_id, id, segment_id, name, email, phone, location, source, source_detail,
           status, intake, signals, notes, last_active_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        ws,
        p.id,
        p.segmentId,
        p.name,
        p.email,
        p.phone ?? null,
        p.location,
        p.source,
        p.sourceDetail,
        p.status,
        toJson(p.intake),
        toJson(p.signals),
        p.notes,
        minutesAgo(p.lastActiveMinutes),
        daysAgo(p.createdDaysAgo),
      ),
  );

  // No fixture experiences, so the sample generations aren't linked to one.
  const generations = individuals.flatMap((p) =>
    experiencesFor(p.id).map((g) =>
      d
        .prepare(
          `INSERT OR IGNORE INTO generations (workspace_id, id, funnel_slug, person_id, title, status, created_at, updated_at)
           VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
        )
        .bind(ws, g.id, p.id, g.title, g.status, minutesAgo(g.createdMinutesAgo), minutesAgo(g.createdMinutesAgo)),
    ),
  );

  // Ninety days of sample counts for Analytics, one statement per day.
  const counts = sampleDays(new Date()).map((day) => {
    const rows: [string, string, number][] = [
      ["view", "", day.views],
      ["intake_started", "signup", day.intakeStarted.signup],
      ["intake_started", "trigger", day.intakeStarted.trigger],
      ...sources.flatMap((source): [string, string, number][] => [
        ["profile", source, day.profiles[source]],
        ["generated", source, day.generated[source]],
      ]),
      ["intake_completed", "signup", day.intakeCompleted.signup],
      ["intake_completed", "trigger", day.intakeCompleted.trigger],
    ];
    const kept = rows.filter(([, , count]) => count > 0);
    return d
      .prepare(
        `INSERT OR IGNORE INTO event_counts (workspace_id, day, funnel_slug, name, source, count) VALUES ${kept
          .map(() => "(?, ?, '', ?, ?, ?)")
          .join(", ")}`,
      )
      .bind(...kept.flatMap(([name, source, count]) => [ws, day.date, name, source, count]));
  });

  const skills = listSkills().map((s) =>
    d
      .prepare(`INSERT OR IGNORE INTO skills (workspace_id, id, title, description, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(ws, s.id, s.title, s.description, fromLabel(s.updated)),
  );

  const insertFile = d.prepare(
    `INSERT OR IGNORE INTO files (workspace_id, id, kind, name, store, ref, url, content_type, bytes, width, height,
       seconds, alt, created_at)
     VALUES (?, ?, ?, ?, 'url', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const images = listImages().map((i) =>
    insertFile.bind(ws, i.id, "image", i.name, i.url, i.url, "image/jpeg", i.bytes, i.width, i.height, null, i.alt,
      daysAgo(i.addedDaysAgo)),
  );
  // Media fixtures have no file behind them; the admin says so instead of a player.
  const media = listMedia().map((m) =>
    insertFile.bind(ws, m.id, m.kind, m.name, `fixture:${m.id}`, null, m.kind === "video" ? "video/mp4" : "audio/mpeg",
      m.bytes, null, null, m.seconds, "", daysAgo(m.addedDaysAgo)),
  );

  return [...segments, ...people, ...generations, ...counts, ...skills, ...images, ...media];
}
