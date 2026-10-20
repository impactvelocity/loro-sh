-- One person's run through one experience: started when they sign up,
-- completed when their intake answers arrive (or straight away when
-- another system posts them by API).
--
-- `answers` is keyed by the intake component's id. `profile` is the same
-- answers as question/answer rows, written at the time, so it still reads
-- right after the experience's questions change or it's deleted.

CREATE TABLE submissions (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  person_id     TEXT NOT NULL,
  funnel_slug   TEXT,
  funnel_name   TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  answers       TEXT NOT NULL DEFAULT '{}',
  profile       TEXT NOT NULL DEFAULT '[]',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, person_id) REFERENCES people (workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX submissions_person ON submissions (workspace_id, person_id, created_at DESC);
