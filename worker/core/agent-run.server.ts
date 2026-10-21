/**
 * One turn of the agent: take the person's message (or their answer to a
 * tool approval), run the model with the workspace's tools, and stream the
 * reply back while saving the thread.
 */
import {
  convertToModelMessages,
  createIdGenerator,
  isStepCount,
  safeValidateUIMessages,
  streamText,
} from "ai";
import { z } from "zod";

import { type AgentMessage, type AgentRef, MESSAGE_MAX, messageText, refKindLabels } from "./agent";
import { openThread, saveMessages, threadMessages } from "./agent.server";
import { agentTools, writeTools } from "./agent-tools.server";
import { aiModelId, languageModel } from "./ai.server";
import { isId } from "./db.server";
import { type Workspace, workspaceSubtitle } from "./workspaces";

const metadataSchema = z.object({
  refs: z
    .array(z.object({ kind: z.enum(["segment", "person", "experience"]), id: z.string(), label: z.string() }))
    .max(10)
    .optional(),
  model: z.string().optional(),
}).optional();

export class AgentInputError extends Error {}

/**
 * The thread with the incoming message in it. A new message must be the
 * person's. An existing one can only be an assistant message coming back
 * with approval decisions, so only those are taken from it: the browser
 * can't rewrite what the agent said or approve a call it never asked for.
 */
function withIncoming(history: AgentMessage[], incoming: AgentMessage): AgentMessage[] {
  const index = history.findIndex((m) => m.id === incoming.id);
  if (index === -1) {
    if (incoming.role !== "user") throw new AgentInputError("Only your own messages can be added.");
    if (messageText(incoming).length > MESSAGE_MAX) throw new AgentInputError("That message is too long.");
    const text = incoming.parts.filter((part) => part.type === "text");
    return [...history, { ...incoming, parts: text }];
  }

  const decisions = new Map(
    incoming.parts.flatMap((part) =>
      "approval" in part && part.state === "approval-responded" ? [[part.approval.id, part.approval] as const] : [],
    ),
  );
  const stored = history[index];
  const parts = stored.parts.map((part) => {
    if (!("approval" in part) || part.state !== "approval-requested") return part;
    const decision = decisions.get(part.approval.id);
    if (!decision) return part;
    return {
      ...part,
      state: "approval-responded" as const,
      approval: { ...part.approval, approved: decision.approved === true, reason: decision.reason },
    };
  }) as AgentMessage["parts"];
  return history.map((m, i) => (i === index ? { ...stored, parts } : m));
}

/**
 * Tool call ids as every provider accepts them. Workers AI makes ids like
 * "functions.listPeople:1::cf-wai-tool-call::…", which Anthropic rejects
 * (Bad Request), so a thread started on one model breaks on another.
 */
function withSafeToolIds(messages: AgentMessage[]): AgentMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      "toolCallId" in part ? { ...part, toolCallId: part.toolCallId.replace(/[^a-zA-Z0-9_-]/g, "_") } : part,
    ) as AgentMessage["parts"],
  }));
}

/** Attachments become a line the model reads before the message, so it knows what to look up. */
function withRefs(messages: AgentMessage[]): AgentMessage[] {
  return messages.map((message) => {
    const refs = message.metadata?.refs;
    if (message.role !== "user" || !refs?.length) return message;
    const lines = refs.map((ref: AgentRef) => `- ${refKindLabels[ref.kind]} "${ref.label}" (${ref.kind === "experience" ? "slug" : "id"}: ${ref.id})`);
    const note = `Attached from the workspace, read these before answering:\n${lines.join("\n")}`;
    return { ...message, parts: [{ type: "text", text: note }, ...message.parts] };
  });
}

function instructionsFor(workspace: Workspace, today: Date) {
  const about = [workspace.name, workspace.tagline, workspaceSubtitle(workspace)].filter(Boolean).join(" · ");
  return `You are the agent inside Loro, working in the "${workspace.name}" workspace (${about}). Today is ${today.toISOString().slice(0, 10)}.

Loro personalises what a brand sells. People arrive through an experience: a start page where they sign up, intake questions, and an outcome made for them from their answers, their segment and Qloo's taste data. The brand describes audiences once as segments (demographics plus taste signals like artists, places and brands); each person can belong to one. Skills in Context are instructions the outcome generation follows when they apply.

Qloo is the taste engine. It knows artists, places, brands, films, TV shows, books, podcasts and destinations, and ranks what fits a set of favourites and demographics. You can ask it directly: searchQloo checks names, and recommendWithQloo ranks things for a segment, a person or a few favourites the way their outcomes do.

How to work:
- Look things up with your tools before answering. Never guess numbers, names or ids.
- Answer like a sharp colleague: short, plain and specific. Lead with the answer, then the evidence. Use numbers from the tools.
- Use short paragraphs and "-" lists. Use a table only to compare several rows.
- Link to what you mention in the admin with markdown links: segments /admin/profiles/segments/<id>, people /admin/profiles/people/<id>, experiences /admin/experiences/<slug>, analytics /admin/analytics, skills /admin/context.
- If the workspace has nothing yet for a question, say so and suggest the first step in the admin.
- ${workspace.demo ? "This is a read-only demo workspace: you can read everything but not create or change anything." : "Creating a segment or a skill asks the owner to approve it in the chat. Propose it with the tool rather than describing it, unless they only asked for ideas. The card in the chat is the approval: don't ask for a yes in text. A result from one of these tools means it was approved and is saved, so confirm it in a line with its link. If they decline, ask what to change."}
- Ground taste in Qloo. Check names with searchQloo before you suggest them as signals, and use the names it returns. To show what a segment or person would like, or to back a new segment's signals, use recommendWithQloo.
- Only name artists, places and other things that came back from Qloo or the workspace. Say when Qloo didn't know a name, and say why a pick came up when "because" tells you.`;
}

/**
 * Validates the browser's message, adds it to the thread and starts the
 * reply.
 */
export async function runAgent({
  workspace,
  threadId,
  message,
}: {
  workspace: Workspace;
  threadId: string;
  message: unknown;
}) {
  if (!isId(threadId)) throw new AgentInputError("That thread id isn't valid.");
  const tools = agentTools(workspace);
  const parsed = await safeValidateUIMessages<AgentMessage>({ messages: [message], metadataSchema, tools });
  if (!parsed.success) {
    console.warn("agent: invalid message", parsed.error.message);
    throw new AgentInputError("That message couldn't be read.");
  }
  const incoming = parsed.data[0];

  await openThread(workspace.id, threadId, incoming);
  const messages = withIncoming(await threadMessages(workspace.id, threadId), incoming);
  const model = aiModelId();

  const result = streamText({
    model: languageModel(model),
    instructions: instructionsFor(workspace, new Date()),
    messages: await convertToModelMessages(withRefs(withSafeToolIds(messages)), { tools, ignoreIncompleteToolCalls: true }),
    tools,
    activeTools: workspace.demo
      ? (Object.keys(tools) as (keyof typeof tools)[]).filter((name) => !(writeTools as readonly string[]).includes(name))
      : undefined,
    stopWhen: isStepCount(10),
    // Workers AI reasoning models think at length by default; the agent's
    // lookups don't need it. Other providers ignore this.
    providerOptions: { "workers-ai": { reasoning_effort: "low" } },
  });

  // Keep the model running if the browser goes away mid-reply, so the
  // thread is still saved. `done` waits for both; give it to waitUntil.
  let markSaved = () => {};
  const saved = new Promise<void>((resolve) => (markSaved = resolve));
  const done = Promise.all([result.consumeStream(), saved]);

  const response = result.toUIMessageStreamResponse<AgentMessage>({
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    messageMetadata: ({ part }) => (part.type === "start" ? { model } : undefined),
    onEnd: async ({ messages: all }) => {
      try {
        await saveMessages(workspace.id, threadId, all);
      } finally {
        markSaved();
      }
    },
    onError: (error) => {
      console.error("agent", error);
      return error instanceof Error ? error.message : "The model didn't answer. Try again.";
    },
  });

  return { response, done };
}
