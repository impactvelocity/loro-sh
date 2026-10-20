-- One database for every workspace. Each table's key starts with
-- workspace_id, so ids only need to be unique within a workspace and a
-- demo workspace can reuse the same fixture ids as another.
--
-- Nested, schema-shaped data (start page, intake questions, workflow steps,
-- signals) is JSON text. It's always read and written whole with its row.
-- Times are unix seconds.

CREATE TABLE workspaces (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  tagline     TEXT NOT NULL DEFAULT '',
  vertical    TEXT NOT NULL CHECK (vertical IN ('events', 'real_estate', 'retail', 'other')),
  location    TEXT NOT NULL DEFAULT '',
  -- Custom hostname that serves this workspace's public pages.
  host        TEXT UNIQUE,
  -- A /files URL or an outside URL. Null for none.
  cover       TEXT,
  demo        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE segments (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  ages          TEXT NOT NULL DEFAULT '[]',
  gender        TEXT NOT NULL DEFAULT 'any' CHECK (gender IN ('any', 'female', 'male')),
  location      TEXT NOT NULL DEFAULT '',
  signals       TEXT NOT NULL DEFAULT '[]',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);

-- Individuals. Their segment isn't a foreign key: deleting a segment should
-- leave its members, and SET NULL on a composite key would null workspace_id.
CREATE TABLE people (
  workspace_id    TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id              TEXT NOT NULL,
  segment_id      TEXT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  location        TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL CHECK (source IN ('signup', 'trigger', 'owner')),
  source_detail   TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL CHECK (status IN ('invited', 'intake_started', 'intake_completed', 'delivered', 'opened')),
  intake          TEXT NOT NULL DEFAULT '[]',
  signals         TEXT NOT NULL DEFAULT '[]',
  notes           TEXT NOT NULL DEFAULT '',
  last_active_at  INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);
CREATE UNIQUE INDEX people_email ON people (workspace_id, email) WHERE email <> '';
CREATE INDEX people_segment ON people (workspace_id, segment_id);

-- Experiences in the admin. Addressed by slug at /f/:slug on the
-- workspace's host.
CREATE TABLE funnels (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('live', 'draft', 'paused')),
  anchor        TEXT NOT NULL,
  segment_id    TEXT,
  start         TEXT NOT NULL,
  intake_mode   TEXT NOT NULL DEFAULT 'form' CHECK (intake_mode IN ('form', 'chat')),
  intake        TEXT NOT NULL DEFAULT '[]',
  steps         TEXT NOT NULL DEFAULT '[]',
  -- Bumped each time the workflow is saved.
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, slug)
);

-- One generated artifact for one person: what the workflow wrote and
-- whether it's been sent and opened.
CREATE TABLE generations (
  workspace_id    TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id              TEXT NOT NULL,
  funnel_slug     TEXT,
  person_id       TEXT NOT NULL,
  -- Experience type, a folder in experiences/.
  experience      TEXT NOT NULL,
  title           TEXT NOT NULL,
  anchor          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('generating', 'review', 'delivered', 'opened')),
  -- The experience's schema output. Null while generating.
  data            TEXT,
  -- Workflow version that produced it.
  version         INTEGER,
  opens           INTEGER NOT NULL DEFAULT 0,
  last_opened_at  INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, person_id) REFERENCES people (workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX generations_person ON generations (workspace_id, person_id, created_at DESC);
CREATE INDEX generations_funnel ON generations (workspace_id, funnel_slug, created_at DESC);

-- Context: instructions the workflow can pick up.
CREATE TABLE skills (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);

-- Context: images, video and audio. Images live in Cloudflare Images,
-- video in Stream and audio in R2; fixtures point at an outside URL.
CREATE TABLE files (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('image', 'video', 'audio')),
  name          TEXT NOT NULL,
  store         TEXT NOT NULL CHECK (store IN ('images', 'stream', 'r2', 'url')),
  -- The Images id, Stream video id, R2 key or outside URL.
  ref           TEXT NOT NULL,
  -- Where to load it: an Images delivery URL, Stream HLS manifest, /files
  -- path or the outside URL. Null until Stream has processed the video.
  url           TEXT,
  poster        TEXT,
  status        TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
  content_type  TEXT NOT NULL,
  bytes         INTEGER NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  seconds       REAL,
  -- Images: read by screen readers and given to the workflow as a caption.
  alt           TEXT NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX files_kind ON files (workspace_id, kind, created_at DESC);

-- Only a hash of each key is kept; the key itself is shown once.
CREATE TABLE api_keys (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  name          TEXT NOT NULL,
  hash          TEXT NOT NULL UNIQUE,
  last4         TEXT NOT NULL,
  last_used_at  INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);

-- The recent activity feed, with names. Counts and charts come from
-- Analytics Engine, which shouldn't hold personal details.
CREATE TABLE activity (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            INTEGER PRIMARY KEY,
  person_id     TEXT NOT NULL,
  funnel_slug   TEXT,
  event         TEXT NOT NULL CHECK (event IN ('intake_started', 'intake_completed', 'delivered', 'opened')),
  source        TEXT NOT NULL CHECK (source IN ('signup', 'trigger', 'owner')),
  at            INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX activity_recent ON activity (workspace_id, at DESC);
