-- What people thought of their outcome: a 1–5 rating and an optional
-- comment, from the widget under the outcome. One per outcome; rating
-- again replaces it.
CREATE TABLE feedback (
  workspace_id   TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id             TEXT NOT NULL,
  funnel_slug    TEXT NOT NULL,
  generation_id  TEXT NOT NULL,
  -- Not a foreign key: feedback outlives a deleted profile, unnamed.
  person_id      TEXT,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL DEFAULT '',
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, generation_id)
);
CREATE INDEX feedback_funnel ON feedback (workspace_id, funnel_slug, updated_at DESC);
