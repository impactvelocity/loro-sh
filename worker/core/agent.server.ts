/** Agent threads in D1. Each message keeps its UI parts as JSON. */
import { type AgentMessage, type AgentThread, messageText, threadTitle } from "./agent";
import { db, fromJson, now, toJson } from "./db.server";

type ThreadRow = { id: string; title: string; updated_at: number };

const toThread = (row: ThreadRow): AgentThread => ({ id: row.id, title: row.title, updatedAt: row.updated_at });

/** Most recent first. */
export async function listThreads(workspaceId: string, limit = 50) {
  const { results } = await db()
    .prepare(
      `SELECT id, title, updated_at FROM agent_threads WHERE workspace_id = ?
       ORDER BY updated_at DESC, id LIMIT ${Math.floor(limit)}`,
    )
    .bind(workspaceId)
    .all<ThreadRow>();
  return results.map(toThread);
}

export async function getThread(workspaceId: string, id: string) {
  const row = await db()
    .prepare("SELECT id, title, updated_at FROM agent_threads WHERE workspace_id = ? AND id = ?")
    .bind(workspaceId, id)
    .first<ThreadRow>();
  return row ? toThread(row) : null;
}

type MessageRow = { id: string; role: AgentMessage["role"]; parts: string; metadata: string | null };

export async function threadMessages(workspaceId: string, threadId: string): Promise<AgentMessage[]> {
  const { results } = await db()
    .prepare(
      `SELECT id, role, parts, metadata FROM agent_messages
       WHERE workspace_id = ? AND thread_id = ? ORDER BY position`,
    )
    .bind(workspaceId, threadId)
    .all<MessageRow>();
  return results.map((row) => ({
    id: row.id,
    role: row.role,
    parts: fromJson<AgentMessage["parts"]>(row.parts, []),
    ...(row.metadata ? { metadata: fromJson<AgentMessage["metadata"]>(row.metadata, {}) } : {}),
  }));
}

/** Finds the thread, or starts it named after the first message. Ids come from the browser (newThreadId). */
export async function openThread(workspaceId: string, id: string, first: AgentMessage) {
  const title = threadTitle(messageText(first));
  await db()
    .prepare("INSERT INTO agent_threads (workspace_id, id, title) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
    .bind(workspaceId, id, title)
    .run();
}

/** Writes the whole conversation: new messages are added, changed ones (a tool approval) replaced. */
export async function saveMessages(workspaceId: string, threadId: string, messages: AgentMessage[]) {
  const upsert = db().prepare(
    `INSERT INTO agent_messages (workspace_id, thread_id, id, position, role, parts, metadata)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT (workspace_id, thread_id, id) DO UPDATE SET position = ?4, parts = ?6, metadata = ?7`,
  );
  await db().batch([
    ...messages.map((message, position) =>
      upsert.bind(
        workspaceId,
        threadId,
        message.id,
        position,
        message.role,
        toJson(message.parts),
        message.metadata ? toJson(message.metadata) : null,
      ),
    ),
    db()
      .prepare("UPDATE agent_threads SET updated_at = ? WHERE workspace_id = ? AND id = ?")
      .bind(now(), workspaceId, threadId),
  ]);
}

export async function renameThread(workspaceId: string, id: string, title: string) {
  const clean = threadTitle(title);
  await db()
    .prepare("UPDATE agent_threads SET title = ? WHERE workspace_id = ? AND id = ?")
    .bind(clean, workspaceId, id)
    .run();
}

/** Its messages go with it (cascade). */
export async function deleteThread(workspaceId: string, id: string) {
  await db().prepare("DELETE FROM agent_threads WHERE workspace_id = ? AND id = ?").bind(workspaceId, id).run();
}
