import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowUpIcon,
  CalendarDaysIcon,
  CheckIcon,
  ConciergeBellIcon,
  GiftIcon,
  HomeIcon,
  SparklesIcon,
} from "lucide-react";

import type { Route } from "./+types/experience-new";
import { type FunnelType, funnelTypes, getFunnel, isInternal, stepKinds } from "@core/funnels";
import { listSegments } from "@core/profiles";
import { PageHeader } from "@/admin-components/page-header";
import { StartPagePreview } from "@/admin-components/start-page-preview";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "New Experience · Loro" }];
}

export function loader() {
  // The agent isn't connected, so every draft is this one.
  const draft = getFunnel("hermanos-gutierrez")!;
  return {
    draft,
    segments: listSegments().map(({ id, name }) => ({ id, name })),
  };
}

const typeIcons: Record<FunnelType, typeof HomeIcon> = {
  itinerary: CalendarDaysIcon,
  concierge: ConciergeBellIcon,
  guide: HomeIcon,
  edit: GiftIcon,
};

const suggestions = [
  "A quiet evening before Hermanos Gutiérrez at the Paramount",
  "Pre-show dinner plans for Khruangbin ticket holders",
  "A local's night out for the Black Pumas show",
];

const draftingSteps = [
  "Read 5 skills and 6 images in Context",
  "Looked up Hermanos Gutiérrez on Qloo",
  "Matched the Food-first travellers segment",
  "Wrote the start page",
  "Drafted 3 intake questions",
  "Built an 8 step workflow",
];

type Stage = "start" | "drafting" | "details" | "review";
type Path = "describe" | "type";

const stages: { key: Stage; label: string }[] = [
  { key: "start", label: "Start" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
];

function Progress({ stage, path }: { stage: Stage; path: Path }) {
  const at = stage === "drafting" ? 0 : stages.findIndex((s) => s.key === stage);
  return (
    <ol className="flex items-center gap-3 text-sm">
      {stages.map((s, i) => {
        const done = i < at;
        const drafted = s.key === "details" && path === "describe" && at === 2;
        return (
          <li key={s.key} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden className="h-px w-6 bg-border-strong sm:w-10" />}
            <span
              aria-current={i === at ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 font-medium",
                i > at && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  i === at ? "bg-primary text-primary-foreground" : done ? "bg-secondary" : "ring-1 ring-border-strong",
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              {drafted ? "Drafted" : s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Describe({
  prompt,
  setPrompt,
  onSubmit,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-2 rounded-2xl border-2 border-transparent bg-secondary p-3 pl-4 transition-colors focus-within:border-ring focus-within:bg-background"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          autoFocus
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onSubmit();
            }
          }}
          rows={3}
          placeholder="Who is it for, what's it built around, and what should they get?"
          aria-label="Describe the experience"
          className="field-sizing-content max-h-60 min-h-20 resize-none bg-transparent py-1 outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Uses your Context, Profiles and Qloo
          </span>
          <Button type="submit" size="icon-sm" className="rounded-full" aria-label="Draft it" disabled={!prompt.trim()}>
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setPrompt(suggestion)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypePicker({ type, setType }: { type: FunnelType; setType: (type: FunnelType) => void }) {
  return (
    <div role="radiogroup" aria-label="Type" className="grid gap-3">
      {(Object.keys(funnelTypes) as FunnelType[]).map((key) => {
        const Icon = typeIcons[key];
        const { name, description, example, internal } = funnelTypes[key];
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={type === key}
            onClick={() => setType(key)}
            className="flex items-start gap-4 rounded-xl p-5 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Icon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-2 font-medium">
                {name}
                {internal && <Badge variant="outline">Internal</Badge>}
              </span>
              <span className="text-sm text-muted-foreground">{description}</span>
              <span className="pt-1 text-xs text-muted-foreground italic">{example}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Drafting({ shown }: { shown: number }) {
  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-medium">Drafting Your Experience</h2>
        <p className="text-muted-foreground">Reading your workspace and asking Qloo about the event.</p>
      </div>
      <ul className="flex w-full max-w-sm flex-col gap-2.5 text-left text-sm">
        {draftingSteps.slice(0, shown).map((step, i) => (
          <li key={step} className="flex items-center gap-2.5">
            {i === shown - 1 && shown < draftingSteps.length ? (
              <Spinner className="size-4" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NewExperience({ loaderData }: Route.ComponentProps) {
  const { draft, segments } = loaderData;
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("start");
  const [path, setPath] = useState<Path>("describe");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<FunnelType>("itinerary");
  const [details, setDetails] = useState({
    name: draft.name,
    event: draft.anchor.name,
    date: draft.anchor.date,
    place: draft.anchor.place,
    segment: "food-first",
  });
  const [shown, setShown] = useState(0);
  const [creating, setCreating] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const segmentItems = { none: "No segment", ...Object.fromEntries(segments.map((s) => [s.id, s.name])) };
  const set = (key: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [key]: value }));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function draftIt() {
    if (!prompt.trim()) return;
    setStage("drafting");
    setShown(1);
    draftingSteps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShown(i + 2), (i + 1) * 650));
    });
    timers.current.push(setTimeout(() => setStage("review"), draftingSteps.length * 650 + 500));
  }

  const chosen = path === "type" ? type : draft.type;
  const internal = isInternal(chosen);
  const start = {
    ...draft.start,
    eyebrow: [details.event, details.date, details.place].filter(Boolean).join(" · "),
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        back={{ to: "/admin/experiences", label: "Experiences" }}
        title="New Experience"
        docs={{ slug: "experiences", tooltip: "How experiences work" }}
        actions={<Progress stage={stage} path={path} />}
      />

      {stage === "start" && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="font-heading text-2xl font-medium">What Are You Making?</h2>
            <Tabs value={path} onValueChange={(value) => setPath(value as Path)}>
              <TabsList>
                <TabsTrigger value="describe" className="px-4">Describe It</TabsTrigger>
                <TabsTrigger value="type" className="px-4">Choose a Type</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {path === "describe" ? (
            <Describe prompt={prompt} setPrompt={setPrompt} onSubmit={draftIt} />
          ) : (
            <>
              <TypePicker type={type} setType={setType} />
              <Button size="sm" className="self-end" onClick={() => setStage("details")}>
                Continue
              </Button>
            </>
          )}
        </div>
      )}

      {stage === "drafting" && <Drafting shown={shown} />}

      {stage === "details" && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl font-medium">{funnelTypes[type].name}</h2>
            <p className="text-muted-foreground">What it's built around, and who it's for.</p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" value={details.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="event">Event</FieldLabel>
              <Input id="event" value={details.event} onChange={(e) => set("event", e.target.value)} />
              <FieldDescription>Looked up on Qloo, so recommendations start from it.</FieldDescription>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input id="date" value={details.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="place">Venue</FieldLabel>
                <Input id="place" value={details.place} onChange={(e) => set("place", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Segment</FieldLabel>
              <Select items={segmentItems} value={details.segment} onValueChange={(value) => set("segment", String(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(segmentItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Fills in taste signals before anyone answers a question.</FieldDescription>
            </Field>
          </FieldGroup>
          <div className="flex justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStage("start")}>Back</Button>
            <Button size="sm" onClick={() => setStage("review")}>Continue</Button>
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {internal ? (
            <div className="mx-auto flex aspect-[9/16] w-full max-w-80 flex-col items-center justify-center gap-2 self-start rounded-2xl bg-secondary/60 p-8 text-center">
              <span className="font-medium">No Start Page</span>
              <span className="text-sm text-muted-foreground">
                Your team creates these for someone from their profile, then shares the link.
              </span>
            </div>
          ) : (
            <StartPagePreview
              start={start}
              type={chosen}
              anchor={{ name: details.event, date: details.date, place: details.place }}
              className="mx-auto aspect-[9/16] w-full max-w-80 self-start rounded-2xl ring-1 ring-border"
            />
          )}

          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-xl font-medium">Details</h2>
              <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                {[
                  ["Name", details.name],
                  ["Type", funnelTypes[chosen].name],
                  ["Event", `${details.event}, ${details.date}`],
                  ["Venue", details.place],
                  ["Segment", segmentItems[details.segment as keyof typeof segmentItems] ?? "No segment"],
                  ["Link", `loro.sh/f/${draft.slug}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {!internal && (
              <section className="flex flex-col gap-4 border-t pt-8">
                <h2 className="font-heading text-xl font-medium">Intake</h2>
                <ol className="flex flex-col gap-2">
                  {draft.intake.map((question, i) => (
                    <li key={question.id} className="flex gap-3 text-sm">
                      <span className="w-4 shrink-0 text-muted-foreground tabular-nums">{i + 1}.</span>
                      {question.prompt}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="flex flex-col gap-4 border-t pt-8">
              <h2 className="font-heading text-xl font-medium">Workflow</h2>
              <ol className="flex flex-wrap gap-2">
                {draft.steps.filter((s) => s.enabled).map((step, i) => (
                  <li key={step.id} className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pr-3 pl-1.5 text-sm font-medium">
                    <span className="flex size-5 items-center justify-center rounded-full bg-background text-xs tabular-nums">
                      {i + 1}
                    </span>
                    {stepKinds[step.kind].title}
                  </li>
                ))}
              </ol>
              <p className="text-sm text-muted-foreground">
                Generations wait for your review until you turn it off in the workflow.
              </p>
            </section>

            <div className="flex justify-between gap-3 border-t pt-8">
              <Button
                variant="ghost"
                size="sm"
                disabled={creating}
                onClick={() => setStage(path === "type" ? "details" : "start")}
              >
                Back
              </Button>
              <Button
                size="sm"
                aria-busy={creating}
                onClick={() => {
                  setCreating(true);
                  setTimeout(() => navigate(`/admin/experiences/${draft.slug}/start`), 700);
                }}
              >
                {creating && <Spinner data-icon="inline-start" />}
                Create Experience
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
