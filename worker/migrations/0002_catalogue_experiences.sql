-- Experiences are now built from a catalogue (catalogues/): one JSON
-- config holds the start page, intake and outcome. This replaces the
-- fixture-era columns (anchor, start, intake, steps), which only ever held
-- mock data, so the table is recreated rather than migrated.

DROP TABLE funnels;

CREATE TABLE funnels (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  name          TEXT NOT NULL,
  -- A folder in catalogues/.
  catalogue     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('live', 'draft', 'paused')),
  -- ExperienceConfig: per part, enabled, layout settings and components.
  config        TEXT NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, slug)
);

-- The mock generations pointed at the mock experiences.
UPDATE generations SET funnel_slug = NULL;
