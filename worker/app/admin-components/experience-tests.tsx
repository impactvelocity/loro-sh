/**
 * Outcome's Tests tab: run the experience for a made-up person or a real
 * profile, then look at the outcome. Tests use the editor's current
 * config, saved or not, and never touch profiles or analytics. Below the
 * tests, the experience's real generations.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, type SubmitTarget, useFetcher, useRevalidator } from "react-router";
import { ExternalLinkIcon, FlaskConicalIcon, MoreHorizontalIcon, PlayIcon, SparklesIcon } from "lucide-react";

import type { Source } from "@core/analytics";
import { sourceLabels } from "@core/analytics";
import type { ExperienceConfig } from "@core/catalogue/config";
import type { AnswerShape, AnswerValue, Answers, Catalogue } from "@core/catalogue/define";
import { answersSchema, emptyAnswers, errorsOf, questionsOf, sampleAnswers } from "@core/catalogue/flow";
import { createExperienceClient } from "@core/catalogue/client";
import { ExperienceRunner } from "@core/catalogue/runner";
import { planRun } from "@core/outcome/plan";
import type { RunState } from "@core/outcome/state";
import { since } from "@core/people";
import { type ExperienceStatus, experienceStatusLabels } from "@core/profiles";
import { ToggleChip } from "@/admin-components/form-section";
import { type Device, DeviceFrame, DeviceTabs } from "@/admin-components/preview-sheet";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/admin-components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/admin-components/ui/sheet";
import { Spinner } from "@/admin-components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { useReadOnly } from "@/hooks/use-read-only";

export type TestRun = {
  id: string;
  personId: string | null;
  name: string;
  email: string;
  answers: Answers;
  profile: { id: string; question: string; answer: string }[];
  config: ExperienceConfig;
  status: ExperienceStatus;
  /** The finished run; null while it's generating. */
  run: RunState | null;
  createdAt: number;
};

export type TestPerson = { id: string; name: string; email: string; answers: Answers | null };

export type Generation = {
  id: string;
  status: ExperienceStatus;
  error: string | null;
  at: number;
  person: { id: string; name: string; email: string; source: Source };
};

type RunResponse = { ok: true; testId: string } | { ok: false; errors: Record<string, string> };

const statusVariant = (status: ExperienceStatus) =>
  status === "done" ? "secondary" : status === "error" ? "destructive" : "outline";

/** One answer, from its shape: no catalogue components needed. */
export function AnswerInput({
  id,
  shape,
  value,
  onChange,
}: {
  id: string;
  shape: AnswerShape;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  switch (shape.kind) {
    case "text":
      return shape.long ? (
        <Textarea id={id} value={String(value ?? "")} placeholder={shape.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={String(value ?? "")} placeholder={shape.placeholder} onChange={(e) => onChange(e.target.value)} />
      );
    case "one":
    case "many": {
      const picked = Array.isArray(value) ? value : value ? [String(value)] : [];
      return (
        <div className="flex flex-wrap gap-2">
          {shape.options.map((option) => (
            <ToggleChip
              key={option}
              pressed={picked.includes(option)}
              onPressedChange={(pressed) => {
                if (shape.kind === "one") return onChange(pressed ? option : "");
                onChange(pressed ? [...picked, option] : picked.filter((p) => p !== option));
              }}
            >
              {option}
            </ToggleChip>
          ))}
        </div>
      );
    }
    case "number":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: shape.max - shape.min + 1 }, (_, i) => shape.min + i).map((n) => (
              <ToggleChip key={n} pressed={value === n} onPressedChange={(pressed) => onChange(pressed ? n : null)}>
                {n}
              </ToggleChip>
            ))}
          </div>
          {(shape.low || shape.high) && (
            <span className="text-xs text-muted-foreground">
              {shape.min} is “{shape.low}”, {shape.max} is “{shape.high}”
            </span>
          )}
        </div>
      );
  }
}

type Mode = "person" | "form";

/** The side drawer: who it's for, then every question on one page. */
function NewTest({
  open,
  onOpenChange,
  catalogue,
  config,
  people,
  onRan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogue: Catalogue;
  config: ExperienceConfig;
  people: TestPerson[];
  onRan: (testId: string) => void;
}) {
  const fetcher = useFetcher<RunResponse>();
  const questions = useMemo(() => questionsOf(catalogue, config), [catalogue, config]);
  const [mode, setMode] = useState<Mode>("form");
  const [personId, setPersonId] = useState<string | null>(null);
  const [name, setName] = useState("Test Person");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Answers>(() => sampleAnswers(catalogue, config));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const running = fetcher.state !== "idle";
  const person = people.find((p) => p.id === personId);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.ok) onRan(fetcher.data.testId);
    else setErrors(fetcher.data.errors);
  }, [fetcher.state, fetcher.data]);

  function pick(id: string) {
    const next = people.find((p) => p.id === id);
    if (!next) return;
    setPersonId(next.id);
    setName(next.name);
    setEmail(next.email);
    setAnswers({ ...emptyAnswers(catalogue, config), ...next.answers });
    setErrors({});
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    if (next === "form") {
      setPersonId(null);
      setName("Test Person");
      setEmail("");
      setAnswers(sampleAnswers(catalogue, config));
    } else {
      setAnswers(emptyAnswers(catalogue, config));
      if (people[0]) pick(people[0].id);
    }
  }

  function run() {
    const parsed = answersSchema(catalogue, config).safeParse(answers);
    if (!parsed.success) return setErrors(errorsOf(parsed.error));
    setErrors({});
    fetcher.submit(
      // Answers and config came from JSON and go back as JSON.
      { intent: "run-test", personId, name, email, answers, config } as unknown as SubmitTarget,
      { method: "post", encType: "application/json" },
    );
  }

  const personItems = Object.fromEntries(people.map((p) => [p.id, p.name]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>New Test</SheetTitle>
          <SheetDescription>Runs what's in the editor now, saved or not. Tests stay out of Analytics and Profiles.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6">
          <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)}>
            <TabsList>
              <TabsTrigger value="form" className="px-3">
                New Answers
              </TabsTrigger>
              <TabsTrigger value="person" className="px-3" disabled={people.length === 0}>
                As a Person
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <FieldGroup>
            {mode === "person" ? (
              <Field>
                <FieldLabel>Person</FieldLabel>
                <Select items={personItems} value={personId ?? ""} onValueChange={(value) => pick(String(value))}>
                  <SelectTrigger className="w-full" aria-label="Person">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {person?.answers
                    ? "Filled with their last answers to this experience. Change any to try something else."
                    : "They haven't answered this one yet. Fill the answers in below."}
                </FieldDescription>
              </Field>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor="test-name">Name</FieldLabel>
                  <Input id="test-name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field data-invalid={errors.email ? true : undefined}>
                  <FieldLabel htmlFor="test-email">Email</FieldLabel>
                  <Input id="test-email" type="email" placeholder="Optional" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {errors.email && <FieldError>{errors.email}</FieldError>}
                </Field>
              </div>
            )}
          </FieldGroup>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Answers</h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setAnswers(sampleAnswers(catalogue, config));
                  setErrors({});
                }}
              >
                <SparklesIcon data-icon="inline-start" />
                Fill With Samples
              </Button>
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">This experience asks no questions.</p>
            ) : (
              <FieldGroup>
                {questions.map((question) => (
                  <Field key={question.id} data-invalid={errors[question.id] ? true : undefined}>
                    <FieldLabel htmlFor={`answer-${question.id}`}>
                      {question.question}
                      {!question.required && <span className="font-normal text-muted-foreground">Optional</span>}
                    </FieldLabel>
                    <AnswerInput
                      id={`answer-${question.id}`}
                      shape={question.shape}
                      value={answers[question.id]}
                      onChange={(value) => {
                        setAnswers((current) => ({ ...current, [question.id]: value }));
                        setErrors(({ [question.id]: _, ...rest }) => rest);
                      }}
                    />
                    {errors[question.id] && <FieldError>{errors[question.id]}</FieldError>}
                  </Field>
                ))}
              </FieldGroup>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-3 border-t">
          {errors[""] && <p className="mr-auto text-sm text-destructive">{errors[""]}</p>}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={running} aria-busy={running} onClick={run}>
            {running ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
            Run Test
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** A test's outcome, drawn from the config it ran with, live while its run is going. */
function TestOutcome({
  test,
  catalogue,
  workspaceId,
  slug,
  onClose,
}: {
  test: TestRun | null;
  catalogue: Catalogue;
  workspaceId: string;
  slug: string;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<Device>("mobile");
  const client = useMemo(() => createExperienceClient({ workspace: workspaceId, experience: slug }), [workspaceId, slug]);
  return (
    <Sheet open={test !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:w-[90vw] data-[side=right]:sm:max-w-none">
        <div className="flex h-16 shrink-0 items-center gap-4 border-b px-6 pr-16">
          <SheetTitle className="flex-1 truncate text-lg">Test · {test?.name}</SheetTitle>
          <DeviceTabs device={device} onChange={setDevice} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-5 bg-secondary/60 p-4 sm:p-8">
          <DeviceFrame device={device}>
            {test && (
              <div data-theme={catalogue.theme} className="absolute inset-0 bg-background font-sans text-foreground">
                <ExperienceRunner
                  key={test.id}
                  catalogue={catalogue}
                  config={test.config}
                  stage="artifact"
                  person={{ name: test.name, email: test.email }}
                  answers={test.answers}
                  run={test.run ?? planRun(test.id, catalogue, test.config)}
                  client={client}
                  preview
                  className="@container flex h-full flex-col overflow-y-auto"
                />
              </div>
            )}
          </DeviceFrame>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ExperienceTests({
  workspaceId,
  slug,
  catalogue,
  config,
  tests,
  people,
  generations,
  outcomeHref,
  now,
}: {
  workspaceId: string;
  slug: string;
  catalogue: Catalogue;
  /** The editor's config, saved or not. */
  config: ExperienceConfig;
  tests: TestRun[];
  people: TestPerson[];
  generations: Generation[];
  outcomeHref: (id: string) => string;
  now: number;
}) {
  const [drawer, setDrawer] = useState(0);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const deleter = useFetcher();
  const revalidator = useRevalidator();
  const readOnly = useReadOnly();
  const shown = tests.find((test) => test.id === viewing) ?? null;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-medium">Tests</h2>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => {
                // A fresh drawer each time, from the config as it is now.
                setDrawer((n) => n + 1);
                setCreating(true);
              }}
            >
              <FlaskConicalIcon data-icon="inline-start" />
              New Test
            </Button>
          )}
        </div>

        {tests.length === 0 ? (
          <Empty className="flex-none border py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FlaskConicalIcon />
              </EmptyMedia>
              <EmptyTitle>No Tests Yet</EmptyTitle>
              <EmptyDescription>Run it as one of your people, or with answers you make up.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table interactive>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Answers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">When</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id} onClick={() => setViewing(test.id)}>
                  <TableCell className="h-18">
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{test.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {test.personId ? "As a person" : "New answers"}
                        {test.email && ` · ${test.email}`}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="max-w-80">
                    <span className="line-clamp-2 text-sm text-muted-foreground">
                      {test.profile
                        .map((row) => row.answer)
                        .filter(Boolean)
                        .join(" · ") || "No answers"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(test.status)}>{experienceStatusLabels[test.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                    {since(test.createdAt, now)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => setViewing(test.id)}>
                        View
                      </Button>
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() =>
                                deleter.submit({ intent: "delete-test", id: test.id }, { method: "post", encType: "application/json" })
                              }
                            >
                              Delete Test
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">Generations</h2>
        {generations.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet. Each finished intake makes one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">When</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Outcome</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations.map((generation) => (
                <TableRow key={generation.id}>
                  <TableCell className="h-18">
                    <Link to={`/admin/profiles/people/${generation.person.id}`} className="flex flex-col gap-0.5">
                      <span className="font-medium underline-offset-4 hover:underline">{generation.person.name}</span>
                      <span className="text-xs text-muted-foreground">{generation.person.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sourceLabels[generation.person.source]}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(generation.status)}>{experienceStatusLabels[generation.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                    {since(generation.at, now)}
                  </TableCell>
                  <TableCell>
                    {generation.status === "done" && (
                      <a
                        href={outcomeHref(generation.id)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        View
                        <ExternalLinkIcon data-icon="inline-end" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <NewTest
        key={drawer}
        open={creating}
        onOpenChange={setCreating}
        catalogue={catalogue}
        config={config}
        people={people}
        onRan={(testId) => {
          setCreating(false);
          setViewing(testId);
        }}
      />
      <TestOutcome
        test={shown}
        catalogue={catalogue}
        workspaceId={workspaceId}
        slug={slug}
        onClose={() => {
          setViewing(null);
          // It may have finished while open.
          revalidator.revalidate();
        }}
      />
    </div>
  );
}
