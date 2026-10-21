import { useEffect, useState } from "react";
import { Link, type SubmitTarget, data, redirect, useFetcher } from "react-router";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";

import type { Route } from "./+types/person";
import { sourceLabels } from "@core/analytics";
import { StartError, startExperience } from "@core/experience-start.server";
import { feedbackForPerson } from "@core/feedback.server";
import { listFunnels } from "@core/funnels.server";
import { pagesOrigin } from "@core/hosts.server";
import { publicPath } from "@core/funnels";
import { type OwnSignal, type PersonInput, since } from "@core/people";
import { type HistoryEvent, statusLabels } from "@core/profiles";
import {
  ProfileError,
  deletePerson,
  getPerson,
  listSegments,
  listGenerations,
  listSubmissions,
  savePerson,
} from "@core/profiles.server";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { FormSection } from "@/admin-components/form-section";
import { PersonActivity, PersonDetails } from "@/admin-components/person-rail";
import { AskAgentLink } from "@/admin-components/agent/ask-agent";
import { PageHeader } from "@/admin-components/page-header";
import { SignalEditor } from "@/admin-components/signal-editor";
import { type StartResponse, StartExperience } from "@/admin-components/start-experience";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Textarea } from "@/admin-components/ui/textarea";
import { useReadOnly } from "@/hooks/use-read-only";
import { currentWorkspace } from "@/lib/workspace.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const person = await getPerson(workspace.id, params.id);
  if (!person) throw data(null, { status: 404 });
  const [segments, submissions, generations, ratings, funnels] = await Promise.all([
    listSegments(workspace.id),
    listSubmissions(workspace.id, person.id),
    listGenerations(workspace.id, { person: person.id }),
    feedbackForPerson(workspace.id, person.id),
    listFunnels(workspace.id),
  ]);
  return {
    person,
    workspaceId: workspace.id,
    generations,
    ratings,
    // With their signals, so picking one shows what they'd inherit before saving.
    segments: segments.map(({ id, name, signals }) => ({ id, name, signals })),
    submissions,
    // What the team can start for them; paused ones can't run.
    experiences: funnels
      .filter((funnel) => funnel.status !== "paused")
      .map(({ slug, name, catalogue, config }) => ({ slug, name, catalogue, config })),
    now: Math.floor(Date.now() / 1000),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.person.name ?? "Person"} · Loro` }];
}

export async function action({ request, params }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const body = (await request.json()) as
    | { intent: "save"; person: PersonInput }
    | { intent: "delete" }
    | { intent: "start"; slug: string; answers: unknown };
  if (body.intent === "start") {
    try {
      const started = await startExperience(
        workspace.id,
        body.slug,
        { personId: params.id, answers: body.answers },
        pagesOrigin(request.url),
      );
      return { ok: true as const, generation: started.generation, url: started.url } satisfies StartResponse;
    } catch (error) {
      if (error instanceof StartError) return data({ ok: false as const, errors: error.errors } satisfies StartResponse, { status: 400 });
      throw error;
    }
  }
  if (body.intent === "delete") {
    await deletePerson(workspace.id, params.id);
    return redirect("/admin/profiles?view=individuals");
  }
  try {
    await savePerson(workspace.id, params.id, body.person);
    return { ok: true as const, error: null };
  } catch (error) {
    if (error instanceof ProfileError) return data({ ok: false as const, error: error.message }, { status: 400 });
    throw error;
  }
}

type LoaderData = Route.ComponentProps["loaderData"];
type Draft = {
  name: string;
  email: string;
  phone: string;
  location: string;
  segmentId: string | null;
  signals: OwnSignal[];
  notes: string;
};

function draftOf(person: LoaderData["person"]): Draft {
  const { name, email, phone, location, segmentId, signals, notes } = person;
  return { name, email, phone, location, segmentId, signals, notes };
}

/** Newest first: when they arrived, then each experience they started and finished. */
function historyOf({ person, submissions, generations, ratings, now }: LoaderData): HistoryEvent[] {
  const events: (HistoryEvent & { at: number })[] = [];
  const add = (id: string, at: number, event: Omit<HistoryEvent, "id" | "minutesAgo">) =>
    events.push({ id, at, minutesAgo: Math.max(0, Math.round((now - at) / 60)), ...event });

  add("created", person.createdAt, {
    kind: "created",
    label: person.source === "owner" ? "Added by your team" : person.source === "trigger" ? "Created by API" : "Signed up",
    detail: person.sourceDetail,
  });
  for (const submission of submissions) {
    add(`${submission.id}-started`, submission.createdAt, {
      kind: "intake_started",
      label: "Started intake",
      detail: submission.funnelName,
    });
    if (submission.status === "completed") {
      add(`${submission.id}-completed`, submission.updatedAt, {
        kind: "intake_completed",
        label: "Finished intake",
        detail: `${submission.funnelName} · ${submission.profile.filter((row) => row.answer).length} answers`,
      });
    }
  }
  for (const generation of generations) {
    if (generation.status === "generating") continue;
    add(generation.id, generation.updatedAt, {
      kind: generation.status === "done" ? "generated" : "failed",
      label: generation.status === "done" ? "Outcome generated" : "Generation failed",
      detail: generation.error ?? generation.title,
    });
  }
  for (const rating of ratings) {
    add(rating.id, rating.updated_at, {
      kind: "rated",
      label: `Rated the outcome ${rating.rating}/5`,
      detail: rating.comment ? `“${rating.comment}”` : rating.experience,
    });
  }
  // Same second: later in the list happened later.
  return events
    .map((event, order) => ({ event, order }))
    .sort((a, b) => b.event.at - a.event.at || b.order - a.order)
    .map(({ event: { at: _, ...event } }) => event);
}

function Submissions({ submissions, generations, workspaceId, now }: Pick<LoaderData, "submissions" | "generations" | "workspaceId" | "now">) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers yet. They show up here when they go through an experience's intake.</p>;
  }
  return (
    <ol className="flex flex-col gap-4">
      {submissions.map((submission) => (
        <li key={submission.id} className="flex flex-col gap-4 rounded-xl p-5 ring-1 ring-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {submission.funnelSlug ? (
              <Link
                to={`/admin/experiences/${submission.funnelSlug}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {submission.funnelName}
              </Link>
            ) : (
              <span className="font-medium">{submission.funnelName}</span>
            )}
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {since(submission.updatedAt, now)}
              <Badge variant={submission.status === "completed" ? "secondary" : "outline"}>
                {submission.status === "completed" ? "Finished" : "Started"}
              </Badge>
              {(() => {
                const outcome = generations.find((g) => g.submissionId === submission.id && g.status === "done");
                return outcome && submission.funnelSlug ? (
                  <a
                    href={`${publicPath(workspaceId, submission.funnelSlug)}/g/${outcome.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "secondary", size: "xs" })}
                  >
                    View Outcome
                    <ExternalLinkIcon data-icon="inline-end" />
                  </a>
                ) : null;
              })()}
            </span>
          </div>
          {submission.profile.length > 0 ? (
            <dl className="flex flex-col">
              {submission.profile.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-1 border-t py-3 sm:grid-cols-[16rem_1fr] sm:gap-6"
                >
                  <dt className="text-sm text-muted-foreground">{row.question}</dt>
                  <dd className={row.answer ? "font-medium" : "text-disabled-foreground"}>{row.answer || "Skipped"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Signed up. No answers yet.</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function PersonPage({ loaderData }: Route.ComponentProps) {
  const { person, segments, submissions, now } = loaderData;
  const [draft, setDraft] = useState<Draft>(() => draftOf(person));
  const fetcher = useFetcher<typeof action>();
  const readOnly = useReadOnly();
  const saving = fetcher.state !== "idle";
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  // Each save reloads them; start again from what's stored.
  useEffect(() => setDraft(draftOf(person)), [person]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(person));
  const error = fetcher.state === "idle" && fetcher.data && "error" in fetcher.data ? fetcher.data.error : null;
  const saved = fetcher.state === "idle" && fetcher.data?.ok && !dirty;
  const segmentItems = { none: "No segment", ...Object.fromEntries(segments.map((s) => [s.id, s.name])) };
  const segment = segments.find((s) => s.id === draft.segmentId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        back={{ to: "/admin/profiles?view=individuals", label: "Profiles" }}
        title={person.name}
        description={error ? <span className="text-destructive">{error}</span> : person.email || "No email"}
        docs={{ slug: "individuals", tooltip: "How individual profiles are built" }}
        actions={
          <>
            <AskAgentLink kind="person" id={person.id} />
            {!readOnly && <StartExperience name={person.name} experiences={loaderData.experiences} />}
            {dirty && !readOnly && (
              <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDraft(draftOf(person))}>
                Discard
              </Button>
            )}
            {!readOnly && (
              <Button
                size="sm"
                disabled={!dirty || saving}
                aria-busy={saving}
                onClick={() =>
                  fetcher.submit({ intent: "save", person: draft } as unknown as SubmitTarget, {
                    method: "post",
                    encType: "application/json",
                  })
                }
              >
                {saving && <Spinner data-icon="inline-start" />}
                {saved && <CheckIcon data-icon="inline-start" />}
                {saved ? "Saved" : "Save Changes"}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-10">
          <FormSection title="Intake">
            <Submissions submissions={submissions} generations={loaderData.generations} workspaceId={loaderData.workspaceId} now={now} />
          </FormSection>

          <FormSection title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={draft.phone}
                  placeholder="Optional"
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="location">Home location</FieldLabel>
                <Input id="location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Segment">
            <Field>
              <Select
                items={segmentItems}
                value={draft.segmentId ?? "none"}
                onValueChange={(value) => set("segmentId", value === "none" ? null : String(value))}
              >
                <SelectTrigger className="w-full sm:w-80" aria-label="Segment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(segmentItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {segments.length === 0
                  ? "No segments yet. Create one under Profiles, then assign it here."
                  : "They inherit the segment's audience and taste signals, then their own answers refine it."}
              </FieldDescription>
            </Field>
          </FormSection>

          <FormSection title="Taste Signals">
            <SignalEditor
              value={draft.signals}
              onChange={(signals) => set("signals", signals)}
              inherited={segment ? { from: segment.name, signals: segment.signals } : undefined}
            />
          </FormSection>

          <FormSection
            title="Notes"
            description="Every outcome is written with these in mind, and they win over the segment. They never appear on the page."
          >
            <Textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Lives alone and works from home. Or: young family, vegetarian, needs step-free access."
            />
          </FormSection>

          {!readOnly && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
              <div className="flex max-w-md flex-col gap-1">
                <span className="text-sm font-medium">Delete Profile</span>
                <p className="text-sm text-muted-foreground">Removes them, their answers and their activity.</p>
              </div>
              <ConfirmDeleteButton
                label="Delete Profile"
                confirmTitle={`Delete ${person.name}?`}
                confirmDescription="Their intake answers and taste signals go too. This can't be undone."
                onConfirm={() => fetcher.submit({ intent: "delete" }, { method: "post", encType: "application/json" })}
              />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <PersonDetails
            items={[
              { label: "Status", value: statusLabels[person.status] },
              { label: "Segment", value: person.segmentName ?? "None" },
              { label: "Source", value: sourceLabels[person.source] },
              { label: "Via", value: person.sourceDetail || "—" },
              { label: "Experiences", value: new Set(submissions.map((s) => s.funnelSlug ?? s.funnelName)).size },
              { label: "Created", value: since(person.createdAt, now) },
              { label: "Last active", value: since(person.lastActiveAt, now) },
            ]}
          />
          <PersonActivity name={person.name.split(" ")[0]} events={historyOf(loaderData)} />
        </aside>
      </div>
    </div>
  );
}
