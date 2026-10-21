import { useMemo, useRef, useState } from "react";
import { redirect, useFetcher, useNavigate, useRevalidator } from "react-router";
import { ChevronDownIcon, CircleCheckIcon, LoaderCircleIcon, RotateCwIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";

import type { Route } from "./+types/agent";
import {
  type AgentMessage,
  type AgentRef,
  type AgentRefKind,
  type AgentThread,
  messageText,
  newThreadId,
  refKindLabels,
} from "@core/agent";
import { hasAdminSession } from "@core/admin-auth.server";
import { deleteThread, getThread, listThreads, threadMessages } from "@core/agent.server";
import { listFunnels } from "@core/funnels.server";
import { since } from "@core/people";
import { listPeople, listSegments } from "@core/profiles.server";
import { type Attachable, Composer } from "@/admin-components/agent/composer";
import { Markdown } from "@/admin-components/agent/markdown";
import { type AgentToolPart, ApprovalCard, ToolLine } from "@/admin-components/agent/tool-line";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { ViewOnlyNote } from "@/admin-components/view-only";
import { Bubble, BubbleContent } from "@/admin-components/ui/bubble";
import { Button } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Message, MessageContent } from "@/admin-components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/admin-components/ui/message-scroller";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/admin-components/ui/trace";
import { useReadOnly } from "@/hooks/use-read-only";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.thread?.title ?? "Agent"} · Loro` }];
}

/** "segment:live-music" from ?attach=, as links from other admin pages send it. */
function parseAttach(value: string | null): { kind: AgentRefKind; id: string } | null {
  const [kind, id] = value?.split(":") ?? [];
  return kind && id && kind in refKindLabels ? { kind: kind as AgentRefKind, id } : null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const url = new URL(request.url);
  const threadId = url.searchParams.get("thread");
  // Every chat has its id in the URL from the start, so the first reply
  // and a reload land on the same thread.
  if (!threadId) {
    // View only, there's no chatting, so open the latest thread instead of a blank one.
    const [latest] = (await hasAdminSession(request)) ? [] : await listThreads(workspace.id, 1);
    // Built from scratch: on client navigations request.url is the .data fetch.
    const next = new URLSearchParams({ thread: latest?.id ?? newThreadId() });
    const attach = url.searchParams.get("attach");
    if (attach) next.set("attach", attach);
    throw redirect(`/admin/agent?${next}`);
  }

  const [threads, thread, messages, segments, people, experiences] = await Promise.all([
    listThreads(workspace.id),
    getThread(workspace.id, threadId),
    threadMessages(workspace.id, threadId),
    listSegments(workspace.id),
    listPeople(workspace.id),
    listFunnels(workspace.id),
  ]);
  const attachable: Attachable = {
    segment: segments.map((s) => ({ id: s.id, label: s.name })),
    person: people.slice(0, 100).map((p) => ({ id: p.id, label: p.name })),
    experience: experiences.map((f) => ({ id: f.slug, label: f.name })),
  };
  const asked = parseAttach(url.searchParams.get("attach"));
  const found = asked && attachable[asked.kind].find((item) => item.id === asked.id);

  return {
    workspace: { id: workspace.id, demo: workspace.demo },
    threadId,
    thread,
    threads,
    messages,
    attachable,
    attach: found ? ({ kind: asked.kind, id: found.id, label: found.label } satisfies AgentRef) : null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const body = (await request.json()) as { intent: "delete"; thread: string };
  await deleteThread(workspace.id, body.thread);
  return redirect("/admin/agent");
}

const suggestions = [
  "Summarise my segments",
  "How are my experiences doing this month?",
  "Who finished intake most recently?",
  "Suggest a new segment from my people",
];

/* Threads */

/** The current thread's title, opening a menu of every thread. */
function ThreadMenu({ threads, active }: { threads: AgentThread[]; active: AgentThread | null }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="-ml-3 max-w-full min-w-0" />}>
        <span className="truncate">{active?.title ?? "New Thread"}</span>
        <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Threads</DropdownMenuLabel>
          {threads.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Your conversations will show here.</p>
          )}
          {threads.map((thread) => (
            <DropdownMenuItem
              key={thread.id}
              onClick={() => navigate(`/admin/agent?thread=${thread.id}`)}
              className="justify-between gap-4"
            >
              <span className="truncate">{thread.title}</span>
              <span className="shrink-0 text-[11px] font-normal text-muted-foreground">{since(thread.updatedAt)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Messages */

function ReasoningLine({ text, running }: { text: string; running: boolean }) {
  const [open, setOpen] = useState<boolean>();
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : <CircleCheckIcon />}</TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
    </TraceLine>
  );
  if (!text) return line;
  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="max-h-60 overflow-y-auto whitespace-pre-wrap">{text}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

/**
 * The agent's turn, in the order it happened: thinking and tool calls as
 * trace lines, text as markdown, and approval cards where it waits on you
 * (not view only, where `onApproval` is left out).
 */
function AgentTurn({
  message,
  streaming,
  onApproval,
}: {
  message: AgentMessage;
  streaming: boolean;
  onApproval?: (id: string, approved: boolean) => void;
}) {
  // Neighbouring steps share one trace, so a run of lookups reads as a list.
  const groups: ({ kind: "trace"; parts: AgentMessage["parts"] } | { kind: "text"; text: string; key: number })[] = [];
  message.parts.forEach((part, index) => {
    if (part.type === "text") {
      if (part.text.trim()) groups.push({ kind: "text", text: part.text, key: index });
      return;
    }
    if (part.type !== "reasoning" && !isToolUIPart(part)) return;
    const last = groups.at(-1);
    if (last?.kind === "trace") last.parts.push(part);
    else groups.push({ kind: "trace", parts: [part] });
  });

  const approvals = message.parts.filter(
    (part): part is AgentToolPart => Boolean(onApproval) && isToolUIPart(part) && part.state === "approval-requested",
  );
  const waiting = streaming && groups.length === 0;

  return (
    <Message>
      <MessageContent className="gap-4">
        {waiting && (
          <TraceLine status="running">
            <TraceIcon>
              <LoaderCircleIcon className="animate-spin" />
            </TraceIcon>
            <TraceTitle>Working</TraceTitle>
          </TraceLine>
        )}
        {groups.map((group, index) =>
          group.kind === "text" ? (
            <Markdown key={group.key} streaming={streaming && index === groups.length - 1}>
              {group.text}
            </Markdown>
          ) : (
            <Trace key={index}>
              {group.parts.map((part, i) =>
                part.type === "reasoning" ? (
                  <ReasoningLine key={i} text={part.text} running={streaming && part.state === "streaming"} />
                ) : isToolUIPart(part) ? (
                  <ToolLine key={part.toolCallId} part={part} streaming={streaming} />
                ) : null,
              )}
            </Trace>
          ),
        )}
        {approvals.map((part) => (
          <ApprovalCard
            key={part.toolCallId}
            part={part}
            onRespond={(approved) => part.approval && onApproval?.(part.approval.id, approved)}
          />
        ))}
      </MessageContent>
    </Message>
  );
}

function UserTurn({ message }: { message: AgentMessage }) {
  const refs = message.metadata?.refs ?? [];
  return (
    <Message align="end">
      <MessageContent>
        {refs.length > 0 && (
          <p className="self-end text-xs text-muted-foreground">
            {refs.map((ref) => `${refKindLabels[ref.kind]}: ${ref.label}`).join(" · ")}
          </p>
        )}
        <Bubble align="end" variant="secondary">
          <BubbleContent className="rounded-2xl px-4 py-2.5 text-base whitespace-pre-wrap md:text-sm">
            {messageText(message)}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

/* Chat */

function Chat({ data }: { data: Route.ComponentProps["loaderData"] }) {
  const { workspace, threadId, thread, attachable } = data;
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const readOnly = useReadOnly();
  const input = useRef<HTMLTextAreaElement>(null);
  const [refs, setRefs] = useState<AgentRef[]>(data.attach ? [data.attach] : []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AgentMessage>({
        api: `/api/workspaces/${workspace.id}/agent/threads/${threadId}`,
        // The server has the thread; send only what's new (or the approval answers).
        prepareSendMessagesRequest: ({ messages }) => ({ body: { message: messages.at(-1) } }),
      }),
    [workspace.id, threadId],
  );

  const { messages, sendMessage, addToolApprovalResponse, status, error, regenerate, stop, clearError } =
    useChat<AgentMessage>({
      id: threadId,
      messages: data.messages,
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
      // New threads and titles show in the menu once the reply is saved.
      onFinish: () => revalidator.revalidate(),
    });
  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    if (busy) return;
    clearError();
    void sendMessage({ text, metadata: refs.length ? { refs } : undefined });
    setRefs([]);
    // Drop ?attach= so a reload doesn't attach it again.
    if (data.attach) navigate(`/admin/agent?thread=${threadId}`, { replace: true, preventScrollReset: true });
  }

  return (
    // Fills the admin's main area edge to edge, so the composer sits at the bottom.
    <div className="-mx-4 -my-8 flex h-[calc(100svh-3.5rem)] flex-col md:-mx-10 md:-my-10 md:h-svh">
      <header className="h-14 shrink-0 border-b">
        <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-between gap-2 px-4 md:px-6">
          <div className="min-w-0 flex-1">
            <ThreadMenu threads={data.threads} active={thread} />
          </div>
          {!readOnly && (
            <div className="flex shrink-0 items-center gap-2">
              {thread && <DeleteThread thread={thread} />}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/admin/agent?thread=${newThreadId()}`)}
              >
                New Thread
              </Button>
            </div>
          )}
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-medium">What Should We Work On?</h2>
            <p className="text-sm text-muted-foreground">
              Ask about your profiles, segments and experiences
              {workspace.demo ? ". This demo is read-only." : ", or have the agent draft segments and skills for you to approve."}
            </p>
          </div>
          {!readOnly && (
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Button key={suggestion} variant="secondary" size="sm" onClick={() => send(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent aria-busy={busy} className="mx-auto max-w-3xl gap-8 px-4 py-8 md:px-6">
                {messages.map((message, index) => (
                  <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === "user"}>
                    {message.role === "user" ? (
                      <UserTurn message={message} />
                    ) : (
                      <AgentTurn
                        message={message}
                        streaming={busy && index === messages.length - 1}
                        onApproval={readOnly ? undefined : (id, approved) => addToolApprovalResponse({ id, approved })}
                      />
                    )}
                  </MessageScrollerItem>
                ))}
                {status === "submitted" && messages.at(-1)?.role === "user" && (
                  <TraceLine status="running">
                    <TraceIcon>
                      <LoaderCircleIcon className="animate-spin" />
                    </TraceIcon>
                    <TraceTitle>Working</TraceTitle>
                  </TraceLine>
                )}
                {error && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                    <span className="text-destructive">{errorText(error)}</span>
                    <Button size="sm" variant="secondary" onClick={() => regenerate()}>
                      <RotateCwIcon data-icon="inline-start" />
                      Try Again
                    </Button>
                  </div>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      )}

      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-6 md:px-6">
        {readOnly ? (
          <ViewOnlyNote>The agent reads and changes this workspace, so chatting with it needs the password.</ViewOnlyNote>
        ) : (
          <Composer
            inputRef={input}
            attachable={attachable}
            refs={refs}
            onRefsChange={setRefs}
            busy={busy}
            onSend={send}
            onStop={() => void stop()}
          />
        )}
      </div>
    </div>
  );
}

/** The API answers errors as JSON; show its message, not the raw body. */
function errorText(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {}
  return error.message || "Something went wrong. Try again.";
}

function DeleteThread({ thread }: { thread: AgentThread }) {
  const fetcher = useFetcher();
  return (
    <ConfirmDeleteButton
      iconOnly
      label="Delete Thread"
      confirmTitle="Delete This Thread?"
      confirmDescription={`"${thread.title}" and its messages will be deleted. Anything the agent created stays.`}
      onConfirm={() =>
        fetcher.submit({ intent: "delete", thread: thread.id }, { method: "post", encType: "application/json" })
      }
    />
  );
}

export default function Agent({ loaderData }: Route.ComponentProps) {
  // A fresh chat per thread: useChat keeps its messages for the life of the component.
  return <Chat key={loaderData.threadId} data={loaderData} />;
}
