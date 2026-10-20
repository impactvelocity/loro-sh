/**
 * The workspace agent's threads. Posting a message stays open, since the
 * admin's chat posts from the browser; renaming and deleting need a key.
 */
import { Hono } from "hono";
import { z } from "zod";

import { runAgent } from "@core/agent-run.server";
import { deleteThread, getThread, listThreads, renameThread, threadMessages } from "@core/agent.server";
import { requireKey } from "./auth";
import { type WorkspaceEnv, notFound, readJson } from "./http";

export const agentRoutes = new Hono<WorkspaceEnv>()
  .get("/threads", async (c) => c.json({ threads: await listThreads(c.get("workspaceId")) }))
  .get("/threads/:thread", async (c) => {
    const ws = c.get("workspaceId");
    const thread = await getThread(ws, c.req.param("thread"));
    if (!thread) throw notFound("Thread");
    return c.json({ thread, messages: await threadMessages(ws, thread.id) });
  })
  // One message in, the reply streamed back as AI SDK UI message chunks
  // (what useChat reads). The thread is saved as it finishes.
  .post("/threads/:thread", async (c) => {
    const body = (await c.req.json().catch(() => null)) as { message?: unknown } | null;
    const { response, done } = await runAgent({
      workspace: c.get("workspace"),
      threadId: c.req.param("thread"),
      message: body?.message,
    });
    c.executionCtx.waitUntil(done);
    return response;
  })
  .patch("/threads/:thread", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    const { title } = await readJson(c, z.object({ title: z.string().trim().min(1, "Give the thread a title.") }));
    if (!(await getThread(ws, c.req.param("thread")))) throw notFound("Thread");
    await renameThread(ws, c.req.param("thread"), title);
    return c.json({ thread: await getThread(ws, c.req.param("thread")) });
  })
  .delete("/threads/:thread", requireKey, async (c) => {
    const ws = c.get("workspaceId");
    if (!(await getThread(ws, c.req.param("thread")))) throw notFound("Thread");
    await deleteThread(ws, c.req.param("thread"));
    return c.body(null, 204);
  });
