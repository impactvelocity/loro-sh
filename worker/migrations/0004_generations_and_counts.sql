-- Generations are now generating, done or error: no review step and no
-- open tracking. Each one comes from a submission. Existing rows are kept,
-- with every finished state mapped to done.
CREATE TABLE generations_next (
  workspace_id   TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id             TEXT NOT NULL,
  funnel_slug    TEXT,
  person_id      TEXT NOT NULL,
  submission_id  TEXT,
  title          TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('generating', 'done', 'error')),
  -- The outcome's data once it's generated; null while static.
  data           TEXT,
  error          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, person_id) REFERENCES people (workspace_id, id) ON DELETE CASCADE
);
INSERT INTO generations_next (workspace_id, id, funnel_slug, person_id, title, status, data, created_at, updated_at)
  SELECT workspace_id, id, funnel_slug, person_id, title,
    CASE status WHEN 'generating' THEN 'generating' ELSE 'done' END, data, created_at, created_at
  FROM generations;
DROP TABLE generations;
ALTER TABLE generations_next RENAME TO generations;
CREATE INDEX generations_person ON generations (workspace_id, person_id, created_at DESC);
CREATE INDEX generations_funnel ON generations (workspace_id, funnel_slug, created_at DESC);

-- The activity feed follows: delivered and opened become generated.
CREATE TABLE activity_next (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            INTEGER PRIMARY KEY,
  person_id     TEXT NOT NULL,
  funnel_slug   TEXT,
  event         TEXT NOT NULL CHECK (event IN ('intake_started', 'intake_completed', 'generated', 'failed')),
  source        TEXT NOT NULL CHECK (source IN ('signup', 'trigger', 'owner')),
  at            INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO activity_next (workspace_id, id, person_id, funnel_slug, event, source, at)
  SELECT workspace_id, id, person_id, funnel_slug,
    CASE event WHEN 'delivered' THEN 'generated' WHEN 'opened' THEN 'generated' ELSE event END, source, at
  FROM activity;
DROP TABLE activity;
ALTER TABLE activity_next RENAME TO activity;
CREATE INDEX activity_recent ON activity (workspace_id, at DESC);

-- Daily counts for Analytics: no names or emails, just how many of each
-- event per experience and source. Analytics Engine gets the same events;
-- this copy is what the admin reads, so it works without API secrets.
-- funnel_slug and source are '' when there isn't one (a demo's seeded
-- history, or a page view before anyone signs up).
CREATE TABLE event_counts (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  -- YYYY-MM-DD, UTC.
  day           TEXT NOT NULL,
  funnel_slug   TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL CHECK (name IN ('view', 'profile', 'intake_started', 'intake_completed', 'generated', 'failed')),
  source        TEXT NOT NULL DEFAULT '',
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, day, funnel_slug, name, source)
);
