/**
 * One Durable Object per run: the live copy of its state, and the stream
 * every open page listens to.
 *
 * The workflow sends events here as it works (`apply`). Each one is folded
 * into the state and sent to every listener as a server-sent event. A new
 * listener gets a snapshot first, so a page opened mid-run catches up.
 *
 * Step changes are saved to storage; a section's partial data isn't (it
 * changes a few times a second, and the next event carries all of it).
 * Once the run is done, D1 holds the finished copy and this is only a cache.
 */
import { DurableObject, env } from "cloudflare:workers";

import { type RunEvent, type RunState, applyEvent, isSettled } from "../outcome/state";

const encoder = new TextEncoder();
const KEEPALIVE_MS = 15_000;

export class OutcomeRoom extends DurableObject<Env> {
  private state: RunState | null | undefined;
  private listeners = new Set<WritableStreamDefaultWriter<Uint8Array>>();
  private keepalive: ReturnType<typeof setInterval> | null = null;

  private async current() {
    if (this.state === undefined) this.state = (await this.ctx.storage.get<RunState>("state")) ?? null;
    return this.state;
  }

  async snapshot() {
    return this.current();
  }

  /** Folds the events in and sends them on. `persist: false` for streaming partials. */
  async apply(events: RunEvent[], { persist = true }: { persist?: boolean } = {}) {
    let state = await this.current();
    for (const event of events) state = applyEvent(state, event);
    this.state = state;
    if (persist && state) await this.ctx.storage.put("state", state);
    for (const event of events) this.send(event);
    if (state && isSettled(state)) {
      for (const writer of this.listeners) writer.close().catch(() => {});
      this.listeners.clear();
    }
  }

  private send(event: RunEvent) {
    const chunk = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
    for (const writer of this.listeners) {
      writer.write(chunk).catch(() => this.listeners.delete(writer));
    }
  }

  async fetch(): Promise<Response> {
    const state = await this.current();
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    if (state) writer.write(encoder.encode(`data: ${JSON.stringify({ type: "snapshot", state })}\n\n`));

    if (state && isSettled(state)) {
      // Nothing more is coming: the snapshot is the whole story.
      writer.close();
    } else {
      this.listeners.add(writer);
      this.keepalive ??= setInterval(() => {
        const ping = encoder.encode(": ping\n\n");
        for (const listener of this.listeners) listener.write(ping).catch(() => this.listeners.delete(listener));
        if (this.listeners.size === 0 && this.keepalive) {
          clearInterval(this.keepalive);
          this.keepalive = null;
        }
      }, KEEPALIVE_MS);
    }

    return new Response(readable, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  }
}

/** The room for one run. Ids repeat across workspaces, so the workspace is part of the name. */
export function roomFor(workspaceId: string, runId: string) {
  return env.OUTCOME_ROOMS.get(env.OUTCOME_ROOMS.idFromName(`${workspaceId}:${runId}`));
}
