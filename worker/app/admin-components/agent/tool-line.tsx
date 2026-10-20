import { Link } from "react-router";
import {
  BarChart3Icon,
  BookOpenIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { type DynamicToolUIPart, type ToolUIPart, getToolName } from "ai";

import type { AgentTools } from "@core/agent";
import { ageRanges, signalTypes } from "@core/profiles";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/admin-components/ui/trace";

export type AgentToolPart = ToolUIPart<AgentTools> | DynamicToolUIPart;

type Loose = Record<string, unknown> & { error?: string };

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const count = (value: unknown, one: string, many: string) => {
  const n = Array.isArray(value) ? value.length : 0;
  return `${n} ${n === 1 ? one : many}`;
};

/** What each call says while it runs and once it's done. */
function describe(name: string, input: Loose, output: Loose | undefined) {
  const named = (output?.name as string) ?? (input.id as string) ?? (input.slug as string) ?? "";
  switch (name) {
    case "listSegments":
      return { icon: UsersIcon, running: "Reading segments", done: `Read ${count(output, "segment", "segments")}` };
    case "getSegment":
      return { icon: UsersIcon, running: `Reading segment ${named}`, done: `Read segment ${named}` };
    case "listPeople":
      return {
        icon: UserIcon,
        running: "Reading people",
        done: `Read ${count(output?.people, "person", "people")}${input.segmentId ? ` in ${input.segmentId}` : ""}`,
      };
    case "getPerson":
      return { icon: UserIcon, running: `Reading ${named}`, done: `Read ${named}'s profile` };
    case "listExperiences":
      return { icon: SparklesIcon, running: "Reading experiences", done: `Read ${count(output, "experience", "experiences")}` };
    case "getExperience":
      return { icon: SparklesIcon, running: `Reading ${named}`, done: `Read ${named}` };
    case "getAnalytics": {
      const days = String(input.range ?? "30d").replace("d", "");
      return { icon: BarChart3Icon, running: "Reading analytics", done: `Read analytics for the last ${days} days` };
    }
    case "listSkills":
      return { icon: BookOpenIcon, running: "Reading skills", done: `Read ${count(output, "skill", "skills")}` };
    case "createSegment":
      return { icon: UsersIcon, running: `Creating segment ${input.name}`, done: `Created segment ${input.name}` };
    case "addSkill":
      return { icon: BookOpenIcon, running: `Adding skill ${input.title}`, done: `Added skill ${input.title}` };
    default:
      return { icon: SparklesIcon, running: `Running ${name}`, done: `Ran ${name}` };
  }
}

/** One tool call as a line in the reply's trace; open it to see what came back. */
export function ToolLine({ part, streaming }: { part: AgentToolPart; streaming: boolean }) {
  const name = getToolName(part);
  const input = (part.input ?? {}) as Loose;
  const output = part.state === "output-available" ? (part.output as Loose) : undefined;
  const { icon: Icon, running, done } = describe(name, input, output);

  if (part.state === "output-denied") {
    return (
      <TraceLine status="pending">
        <TraceIcon>
          <XIcon />
        </TraceIcon>
        <TraceTitle>Declined: {lowerFirst(running)}</TraceTitle>
      </TraceLine>
    );
  }

  const failed = part.state === "output-error" || Boolean(output?.error);
  if (part.state === "output-available" || part.state === "output-error") {
    const link = typeof output?.link === "string" && output.link.startsWith("/admin") ? output.link : null;
    return (
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status={failed ? "error" : undefined}>
            <TraceIcon>
              <Icon />
            </TraceIcon>
            <TraceTitle>{failed ? `Couldn't finish: ${lowerFirst(running)}` : done}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="flex flex-col gap-2">
          {link && (
            <Link to={link} className="w-fit text-sm font-medium text-foreground underline underline-offset-4">
              Open
            </Link>
          )}
          <pre className="max-h-64 overflow-auto rounded-md bg-secondary p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-secondary-foreground">
            {part.state === "output-error" ? part.errorText : JSON.stringify(output, null, 2)}
          </pre>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    );
  }

  // Waiting on the owner's approval, or running.
  const waiting = part.state === "approval-requested";
  return (
    <TraceLine status={waiting ? "pending" : streaming ? "running" : "error"}>
      <TraceIcon>{waiting || !streaming ? <Icon /> : <LoaderCircleIcon className="animate-spin" />}</TraceIcon>
      <TraceTitle>{waiting ? `Waiting for you: ${lowerFirst(running)}` : streaming ? running : `Stopped: ${lowerFirst(running)}`}</TraceTitle>
    </TraceLine>
  );
}

/** What a write will save, so the owner can approve it knowing what they're getting. */
export function ApprovalCard({
  part,
  onRespond,
}: {
  part: AgentToolPart;
  onRespond: (approved: boolean) => void;
}) {
  const name = getToolName(part);
  const input = (part.input ?? {}) as Loose;

  let title = "Approve This Change";
  let body: React.ReactNode = null;
  if (name === "createSegment") {
    title = "Create Segment";
    const signals = (input.signals as { type: keyof typeof signalTypes; name: string }[] | undefined) ?? [];
    const ages = ((input.ages as (keyof typeof ageRanges)[] | undefined) ?? []).map((age) => ageRanges[age]);
    body = (
      <>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{String(input.name ?? "")}</span>
          {input.description ? <p className="text-muted-foreground">{String(input.description)}</p> : null}
        </div>
        {(ages.length > 0 || input.location) && (
          <p className="text-muted-foreground">
            {[ages.join(", "), input.location, input.gender && input.gender !== "any" ? input.gender : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <Badge key={`${signal.type}:${signal.name}`} variant="secondary">
                <span className="text-muted-foreground">{signalTypes[signal.type]}</span>
                {signal.name}
              </Badge>
            ))}
          </div>
        )}
      </>
    );
  } else if (name === "addSkill") {
    title = "Add Skill";
    body = (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{String(input.title ?? "")}</span>
        <p className="whitespace-pre-wrap text-muted-foreground">{String(input.description ?? "")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <CircleCheckIcon className="size-4 text-muted-foreground" />
        {title}
      </div>
      {body}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onRespond(true)}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onRespond(false)}>
          Decline
        </Button>
      </div>
    </div>
  );
}
