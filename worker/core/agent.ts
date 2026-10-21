/**
 * The workspace agent: a chat that reads and edits the workspace's
 * profiles, segments, experiences, analytics and skills, and asks Qloo,
 * through tools (agent-tools.server.ts), on the model set in
 * core/ai.server.ts.
 *
 * Threads and their messages are saved in D1 (agent.server.ts). Messages
 * are AI SDK UI messages, so the admin renders them with useChat.
 */
import type { InferUITools, UIDataTypes, UIMessage } from "ai";

import type { agentTools } from "./agent-tools.server";

/** Something in the workspace attached to a message, so the agent reads it first. */
export type AgentRefKind = "segment" | "person" | "experience";
export type AgentRef = { kind: AgentRefKind; id: string; label: string };

export const refKindLabels: Record<AgentRefKind, string> = {
  segment: "Segment",
  person: "Person",
  experience: "Experience",
};

export type AgentMetadata = {
  /** On the person's messages: what they attached. */
  refs?: AgentRef[];
  /** On the agent's: the model that answered. */
  model?: string;
};
export type AgentTools = InferUITools<ReturnType<typeof agentTools>>;
export type AgentMessage = UIMessage<AgentMetadata, UIDataTypes, AgentTools>;

export type AgentThread = {
  id: string;
  title: string;
  /** Unix seconds. */
  updatedAt: number;
};

export const TITLE_MAX = 60;
/** Longest message a person can send, in characters. */
export const MESSAGE_MAX = 8000;

/** Thread ids are made in the browser, so a new thread has its URL before the first reply. */
export function newThreadId() {
  return `thread-${crypto.randomUUID().slice(0, 8)}`;
}

/** A thread is named after its first message. */
export function threadTitle(text: string) {
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX).trimEnd()}…` : line || "New Thread";
}

/** The text a person typed, without the parts the agent added. */
export function messageText(message: Pick<AgentMessage, "parts">) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
