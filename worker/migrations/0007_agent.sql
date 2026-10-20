-- The workspace agent's conversations. A thread is one chat; its messages
-- are AI SDK UI messages, stored with their parts (text, reasoning, tool
-- calls and results) as JSON so a thread reopens exactly as it was.
CREATE TABLE agent_threads (
  workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  title         TEXT NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX agent_threads_recent ON agent_threads (workspace_id, updated_at DESC);

CREATE TABLE agent_messages (
  workspace_id  TEXT NOT NULL,
  thread_id     TEXT NOT NULL,
  id            TEXT NOT NULL,
  -- Order in the thread.
  position      INTEGER NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  parts         TEXT NOT NULL DEFAULT '[]',
  metadata      TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, thread_id, id),
  FOREIGN KEY (workspace_id, thread_id) REFERENCES agent_threads (workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX agent_messages_thread ON agent_messages (workspace_id, thread_id, position);
