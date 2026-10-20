import { useState } from "react";
import { useOutletContext } from "react-router";
import {
  CircleDashedIcon,
  ExternalLinkIcon,
  PlayIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";

import type { Route } from "./+types/tests";
import type { ExperienceContext } from "../experience";
import { type Suggestion, type TestRun, type Verdict, stepKinds, testsFor } from "@core/funnels";
import { experiencesFor, listIndividuals } from "@core/profiles";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { FormSection, ToggleChip } from "@/admin-components/form-section";
import { RunLog, useMockRun } from "@/admin-components/workflow-run";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldLabel } from "@/admin-components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Textarea } from "@/admin-components/ui/textarea";
import { minutesAgo } from "@/lib/format";

export function loader() {
  return {
    people: listIndividuals()
      .filter((person) => person.intake.length > 0)
      .map(({ id, name }) => ({ id, name, title: experiencesFor(id)[0]?.title ?? null })),
  };
}

const verdicts: Record<Verdict, { label: string; icon: typeof ThumbsUpIcon }> = {
  good: { label: "Good", icon: ThumbsUpIcon },
  needs_work: { label: "Needs Work", icon: ThumbsDownIcon },
};

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: Suggestion;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const applied = suggestion.status === "applied";

  return (
    <li className="flex flex-col gap-4 rounded-xl p-5 ring-1 ring-border sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <span className="font-medium text-pretty">{suggestion.title}</span>
        <span className="text-sm">
          <span className="text-muted-foreground">{stepKinds[suggestion.step].title} · </span>
          {suggestion.change}
        </span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestion.sources.map((source) => (
            <Badge key={source} variant="outline">{source}</Badge>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {applied ? (
          <Badge variant="secondary">Applied in v{suggestion.appliedIn}</Badge>
        ) : (
          <>
            <Button variant="ghost" size="sm" disabled={applying} onClick={onDismiss}>
              Dismiss
            </Button>
            <Button
              size="sm"
              aria-busy={applying}
              onClick={() => {
                setApplying(true);
                setTimeout(onApply, 700);
              }}
            >
              {applying && <Spinner data-icon="inline-start" />}
              Apply
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function HistoryCard({
  test,
  open,
  onToggle,
  onChange,
}: {
  test: TestRun;
  open: boolean;
  onToggle: () => void;
  onChange: (test: TestRun) => void;
}) {
  const [note, setNote] = useState(test.note);
  const Icon = test.verdict ? verdicts[test.verdict].icon : CircleDashedIcon;

  return (
    <ExpandableCard
      open={open}
      onToggle={onToggle}
      leading={
        <CardIcon className={test.verdict ? undefined : "text-muted-foreground"}>
          <Icon />
        </CardIcon>
      }
      title={test.title}
      meta={`${test.person} · v${test.version} · ${minutesAgo(test.minutesAgo)}`}
      actions={
        <a
          href="/f/itinerary"
          target="_blank"
          rel="noreferrer"
          aria-label="Open result"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ExternalLinkIcon />
        </a>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(verdicts) as Verdict[]).map((key) => (
            <ToggleChip
              key={key}
              pressed={test.verdict === key}
              onPressedChange={(pressed) => onChange({ ...test, verdict: pressed ? key : null })}
            >
              {verdicts[key].label}
            </ToggleChip>
          ))}
        </div>
        <Field>
          <FieldLabel htmlFor={`${test.id}-note`}>Note</FieldLabel>
          <Textarea
            id={`${test.id}-note`}
            value={note}
            placeholder="What should change? The agent reads these when it suggests edits."
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={note === test.note}
          onClick={() => onChange({ ...test, note })}
        >
          Save Note
        </Button>
      </div>
    </ExpandableCard>
  );
}

export default function ExperienceTests({ loaderData }: Route.ComponentProps) {
  const { funnel } = useOutletContext<ExperienceContext>();
  const { people } = loaderData;
  const initial = testsFor(funnel);
  const [runs, setRuns] = useState<TestRun[]>(initial.runs);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initial.suggestions);
  const [version, setVersion] = useState(funnel.version);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tester, setTester] = useState(people[0]?.id ?? "");
  const [focus, setFocus] = useState("");
  const [reviewing, setReviewing] = useState<"idle" | "busy" | "done">("idle");
  const personItems = Object.fromEntries(people.map((p) => [p.id, p.name]));

  const mock = useMockRun(funnel.steps, () => {
    const person = people.find((p) => p.id === tester);
    const run: TestRun = {
      id: crypto.randomUUID(),
      personId: tester,
      person: person?.name ?? "",
      version,
      minutesAgo: 0,
      seconds: Number(mock.seconds.toFixed(1)),
      title: person?.title ?? `${funnel.anchor.name}, planned for ${person?.name.split(" ")[0]}`,
      verdict: null,
      note: focus,
    };
    setRuns((current) => [run, ...current]);
    setOpenId(run.id);
  });

  const visible = suggestions.filter((s) => s.status !== "dismissed");
  const notes = runs.filter((r) => r.note).length;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-10">
        <FormSection title="Suggestions">
          {visible.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {visible.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => {
                    setSuggestions((current) =>
                      current.map((s) => (s.id === suggestion.id ? { ...s, status: "applied", appliedIn: version + 1 } : s)),
                    );
                    setVersion((v) => v + 1);
                  }}
                  onDismiss={() =>
                    setSuggestions((current) =>
                      current.map((s) => (s.id === suggestion.id ? { ...s, status: "dismissed" } : s)),
                    )
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing yet. Leave notes on tests and the agent will suggest changes.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={reviewing === "busy"}
              onClick={() => {
                setReviewing("busy");
                setTimeout(() => setReviewing("done"), 1600);
              }}
            >
              {reviewing === "busy" ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
              {reviewing === "busy" ? "Reading Notes" : "Review Notes"}
            </Button>
            {reviewing === "done" && (
              <span className="text-sm text-muted-foreground">
                Read {notes} notes and the latest survey responses. Nothing new to suggest.
              </span>
            )}
          </div>
        </FormSection>

        <FormSection title="History">
          {runs.length > 0 ? (
            <ol className="flex flex-col gap-3">
              {runs.map((test) => (
                <HistoryCard
                  key={test.id}
                  test={test}
                  open={openId === test.id}
                  onToggle={() => setOpenId(openId === test.id ? null : test.id)}
                  onChange={(next) => setRuns((current) => current.map((r) => (r.id === test.id ? next : r)))}
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No tests yet.</p>
          )}
        </FormSection>
      </div>

      <aside className="lg:sticky lg:top-10 lg:self-start">
        <section className="flex flex-col gap-5 rounded-xl p-5 ring-1 ring-border">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-xl font-medium">Run a Test</h2>
            <span className="text-xs text-muted-foreground tabular-nums">v{version}</span>
          </div>
          <div className="flex flex-col gap-3">
            <Select items={personItems} value={tester} onValueChange={(value) => setTester(String(value))}>
              <SelectTrigger aria-label="Test with" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              aria-label="What to check"
              value={focus}
              placeholder="What to check, if anything"
              className="min-h-20"
              onChange={(e) => setFocus(e.target.value)}
            />
            <Button size="sm" onClick={mock.start} disabled={mock.running}>
              {mock.running ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {mock.running ? "Running" : "Run Test"}
            </Button>
          </div>
          {mock.run && (
            <div className="border-t pt-5">
              <RunLog steps={funnel.steps} run={mock.run} test />
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
