import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookOpenIcon,
  MapPinIcon,
  PenLineIcon,
  PlayIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  UserCheckIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";

import type { Route } from "./+types/workflow";
import type { ExperienceContext } from "../experience";
import { listSkills } from "@core/context";
import { type Step, type StepKind, isInternal, stepKinds, testsFor } from "@core/funnels";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { ToggleChip } from "@/admin-components/form-section";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Checkbox } from "@/admin-components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Switch } from "@/admin-components/ui/switch";
import { Textarea } from "@/admin-components/ui/textarea";
import { minutesAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function loader() {
  return {
    skills: listSkills().map(({ id, title }) => ({ id, title })),
  };
}

const stepIcons: Record<StepKind, typeof ZapIcon> = {
  trigger: ZapIcon,
  profile: UserIcon,
  taste: SparklesIcon,
  recommend: MapPinIcon,
  skills: BookOpenIcon,
  write: PenLineIcon,
  review: UserCheckIcon,
  deliver: SendIcon,
};

/** Steps the workflow can't run without. */
const required: StepKind[] = ["trigger", "profile", "write", "deliver"];

const models = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};
const channels = { email: "Email", sms: "Text message", both: "Email and text" };
const popularity = { any: "Any", gems: "Hidden gems first", popular: "Well known first" };
const autoSend = { never: "Never, wait for me", "1h": "After 1 hour", "24h": "After 24 hours" };
const tasteDomains = ["Music", "Dining", "Places", "Film", "Books", "Brands"];

const extraSteps = [
  { title: "Translate", description: "Rewrite in the person's language." },
  { title: "Add Images", description: "Pick photos for each stop from Context." },
  { title: "Webhook", description: "Post the result to your own system." },
];

function StepSettings({
  step,
  skills,
  internal,
  onChange,
}: {
  step: Step;
  skills: { id: string; title: string }[];
  /** No start page, so nothing arrives from intake. */
  internal: boolean;
  onChange: (settings: Step["settings"]) => void;
}) {
  const s = step.settings;
  const set = (key: string, value: string | number | boolean) => onChange({ ...s, [key]: value });
  const toggle = (key: string, label: string, description: string) => (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={key}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={key} checked={Boolean(s[key])} onCheckedChange={(checked) => set(key, checked)} />
    </Field>
  );

  switch (step.kind) {
    case "trigger":
      return (
        <FieldGroup>
          {!internal && toggle("onIntake", "After intake", "When someone finishes the questions on the start page.")}
          {toggle("onApi", "From the API", "When your ticketing or booking system adds a person.")}
          {s.onApi && (
            <code className="block overflow-x-auto rounded-lg bg-secondary px-3 py-2.5 text-xs whitespace-nowrap">
              POST /api/experiences/:slug/people
            </code>
          )}
          {toggle("onOwner", "By your team", "When you create one for someone from their profile.")}
        </FieldGroup>
      );
    case "profile":
      return (
        <FieldGroup>
          {toggle("includeSegment", "Include segment", "Add the segment's audience and taste signals.")}
          {toggle("includeNotes", "Include notes", "Your team's notes on the person.")}
        </FieldGroup>
      );
    case "taste": {
      const selected = String(s.domains).split(", ").map((d) => d.toLowerCase());
      return (
        <FieldGroup>
          <Field>
            <FieldLabel>Look across</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {tasteDomains.map((domain) => (
                <ToggleChip
                  key={domain}
                  pressed={selected.includes(domain.toLowerCase())}
                  onPressedChange={(pressed) =>
                    set(
                      "domains",
                      (pressed
                        ? [...selected, domain.toLowerCase()]
                        : selected.filter((d) => d !== domain.toLowerCase())
                      ).join(", "),
                    )
                  }
                >
                  {domain}
                </ToggleChip>
              ))}
            </div>
          </Field>
          <Field className="max-w-40">
            <FieldLabel htmlFor="take">Insights to keep</FieldLabel>
            <Input id="take" type="number" value={Number(s.take)} onChange={(e) => set("take", Number(e.target.value))} />
          </Field>
        </FieldGroup>
      );
    }
    case "recommend":
      return (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="categories">Kinds of place</FieldLabel>
            <Input id="categories" value={String(s.categories)} onChange={(e) => set("categories", e.target.value)} />
            <FieldDescription>Comma separated. Matched to Qloo place tags.</FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-5">
            <Field>
              <FieldLabel htmlFor="radius">Radius (mi)</FieldLabel>
              <Input id="radius" type="number" value={Number(s.radius)} onChange={(e) => set("radius", Number(e.target.value))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="results">Results</FieldLabel>
              <Input id="results" type="number" value={Number(s.take)} onChange={(e) => set("take", Number(e.target.value))} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Popularity</FieldLabel>
            <Select items={popularity} defaultValue="gems">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(popularity).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      );
    case "skills":
      return (
        <FieldGroup>
          {toggle("auto", "Let the workflow choose", "It reads each skill's description and uses the ones that apply.")}
          <Field>
            <FieldLabel>Skills</FieldLabel>
            <ul className="flex flex-col gap-3">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox defaultChecked disabled={Boolean(s.auto)} />
                    {skill.title}
                  </label>
                </li>
              ))}
            </ul>
          </Field>
        </FieldGroup>
      );
    case "write":
      return (
        <FieldGroup>
          <Field>
            <FieldLabel>Model</FieldLabel>
            <Select items={models} value={String(s.model)} onValueChange={(value) => set("model", String(value))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(models).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-5">
            <Field>
              <FieldLabel htmlFor="days">Days</FieldLabel>
              <Input id="days" type="number" value={Number(s.days)} onChange={(e) => set("days", Number(e.target.value))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="stops">Stops a day</FieldLabel>
              <Input id="stops" value={String(s.stops)} onChange={(e) => set("stops", e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="brief">Brief</FieldLabel>
            <Textarea id="brief" value={String(s.brief)} onChange={(e) => set("brief", e.target.value)} className="min-h-32" />
            <FieldDescription>Added to the Context skills this step picks up.</FieldDescription>
          </Field>
        </FieldGroup>
      );
    case "review":
      return (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="notify">Notify</FieldLabel>
            <Input id="notify" type="email" value={String(s.notify)} onChange={(e) => set("notify", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Send without review</FieldLabel>
            <Select items={autoSend} defaultValue="never">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(autoSend).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      );
    case "deliver":
      return (
        <FieldGroup>
          <Field>
            <FieldLabel>Channel</FieldLabel>
            <Select items={channels} value={String(s.channel)} onValueChange={(value) => set("channel", String(value))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(channels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="from">From</FieldLabel>
            <Input id="from" value={String(s.from)} onChange={(e) => set("from", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input id="subject" value={String(s.subject)} onChange={(e) => set("subject", e.target.value)} />
          </Field>
        </FieldGroup>
      );
  }
}

function LatestTest({ funnel }: { funnel: ExperienceContext["funnel"] }) {
  const { runs, suggestions } = testsFor(funnel);
  const latest = runs[0];
  const open = suggestions.filter((s) => s.status === "open").length;
  const tests = `/admin/experiences/${funnel.slug}/tests`;

  return (
    <section className="flex flex-col gap-4 rounded-xl p-5 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-medium">Latest Test</h2>
        <span className="text-xs text-muted-foreground tabular-nums">v{funnel.version}</span>
      </div>
      {latest ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-pretty">{latest.title}</span>
          <span className="text-muted-foreground">
            {latest.person} · {minutesAgo(latest.minutesAgo)}
            {latest.verdict && ` · ${latest.verdict === "good" ? "Good" : "Needs work"}`}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tests yet.</p>
      )}
      {open > 0 && (
        <p className="flex items-center gap-2 text-sm">
          <SparklesIcon className="size-4 shrink-0" />
          {open} {open === 1 ? "suggestion" : "suggestions"} from your notes
        </p>
      )}
      <Link to={tests} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <PlayIcon data-icon="inline-start" />
        Open Tests
      </Link>
    </section>
  );
}

export default function ExperienceWorkflow({ loaderData }: Route.ComponentProps) {
  const { funnel } = useOutletContext<ExperienceContext>();
  const { skills } = loaderData;
  const internal = isInternal(funnel.type);
  const [steps, setSteps] = useState<Step[]>(funnel.steps);
  const [openId, setOpenId] = useState<string | null>(null);

  function update(id: string, patch: Partial<Step>) {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  // Start and Deliver stay put; everything between can be reordered.
  function move(index: number, by: -1 | 1) {
    setSteps((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <ol className="relative flex flex-col gap-3">
          {/* The line that joins the step icons. */}
          <span aria-hidden className="absolute top-6 bottom-6 left-[2.125rem] w-px bg-border-strong" />
          {steps.map((step, i) => {
            const Icon = stepIcons[step.kind];
            const fixed = i === 0 || i === steps.length - 1;
            const optional = !required.includes(step.kind);
            return (
              <ExpandableCard
                key={step.id}
                open={openId === step.id}
                onToggle={() => setOpenId(openId === step.id ? null : step.id)}
                muted={!step.enabled}
                leading={
                  <CardIcon className={cn("rounded-full", !step.enabled && "text-disabled-foreground")}>
                    <Icon />
                  </CardIcon>
                }
                title={
                  <>
                    <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}</span>
                    {stepKinds[step.kind].title}
                  </>
                }
                actions={
                  <>
                    {/* Fixed-width slots keep the controls lined up across rows. */}
                    <span className="flex w-12 shrink-0">
                      {optional && (
                        <Switch
                          aria-label={`Run ${stepKinds[step.kind].title}`}
                          checked={step.enabled}
                          onCheckedChange={(checked) => update(step.id, { enabled: checked })}
                        />
                      )}
                    </span>
                    {fixed ? (
                      <span className="w-[4.5rem] shrink-0 text-center text-xs text-muted-foreground">
                        {i === 0 ? "Always first" : "Always last"}
                      </span>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 1} onClick={() => move(i, -1)}>
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move down"
                          disabled={i === steps.length - 2}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDownIcon />
                        </Button>
                      </>
                    )}
                  </>
                }
              >
                <div className="flex flex-col gap-5">
                  <p className="text-sm text-muted-foreground">{stepKinds[step.kind].description}</p>
                  {step.enabled ? (
                    <StepSettings
                      step={step}
                      skills={skills}
                      internal={internal}
                      onChange={(settings) => update(step.id, { settings })}
                    />
                  ) : (
                    <p className="rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">
                      This step is off, so the workflow skips it.
                    </p>
                  )}
                </div>
              </ExpandableCard>
            );
          })}
        </ol>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="self-start" />}>
            <PlusIcon data-icon="inline-start" />
            Add Step
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Coming soon</DropdownMenuLabel>
              {extraSteps.map((step) => (
                <DropdownMenuItem key={step.title} disabled className="flex-col items-start gap-0.5">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <aside className="lg:sticky lg:top-10 lg:self-start">
        <LatestTest funnel={funnel} />
      </aside>
    </div>
  );
}
