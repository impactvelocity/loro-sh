-- Test runs: an experience run for a made-up person or a real profile,
-- from the admin. Kept apart from submissions and generations, so tests
-- never show up in Analytics or on anyone's profile.
--
-- `config` is the experience as it was tested, saved or not, so a test of
-- unsaved changes still shows what was tested.
CREATE TABLE tests (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  funnel_slug   TEXT NOT NULL,
  -- Set when run as a real profile. Not a foreign key: the test outlives them.
  person_id     TEXT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL DEFAULT '',
  answers       TEXT NOT NULL DEFAULT '{}',
  profile       TEXT NOT NULL DEFAULT '[]',
  config        TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('generating', 'done', 'error')),
  error         TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX tests_funnel ON tests (workspace_id, funnel_slug, created_at DESC);
