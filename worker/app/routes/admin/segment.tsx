import { useEffect, useState } from "react";
import { Link, type SubmitTarget, data, redirect, useFetcher, useNavigate } from "react-router";
import { CheckIcon } from "lucide-react";

import type { Route } from "./+types/segment";
import { sourceLabels } from "@core/analytics";
import { type Gender, type SegmentInput, genders, since } from "@core/people";
import { type AgeRange, type Signal, ageRanges, statusLabels } from "@core/profiles";
import { ProfileError, deleteSegment, getSegment, listPeople, saveSegment } from "@core/profiles.server";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { FormSection, ToggleChip } from "@/admin-components/form-section";
import { AskAgentLink } from "@/admin-components/agent/ask-agent";
import { PageHeader } from "@/admin-components/page-header";
import { SignalEditor } from "@/admin-components/signal-editor";
import { Button } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin-components/ui/table";
import { Textarea } from "@/admin-components/ui/textarea";
import { number } from "@/lib/format";
import { useReadOnly } from "@/hooks/use-read-only";
import { currentWorkspace } from "@/lib/workspace.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const segment = await getSegment(workspace.id, params.id);
  if (!segment) throw data(null, { status: 404 });
  return { segment, members: await listPeople(workspace.id, segment.id), now: Math.floor(Date.now() / 1000) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.segment.name ?? "Segment"} · Loro` }];
}

export async function action({ request, params }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const body = (await request.json()) as { intent: "save"; segment: SegmentInput } | { intent: "delete" };
  if (body.intent === "delete") {
    await deleteSegment(workspace.id, params.id);
    return redirect("/admin/profiles");
  }
  try {
    await saveSegment(workspace.id, params.id, body.segment);
    return { ok: true as const, error: null };
  } catch (error) {
    if (error instanceof ProfileError) return data({ ok: false as const, error: error.message }, { status: 400 });
    throw error;
  }
}

type LoaderData = Route.ComponentProps["loaderData"];
type Draft = { name: string; description: string; ages: AgeRange[]; gender: Gender; location: string; signals: Signal[] };

function draftOf(segment: LoaderData["segment"]): Draft {
  const { name, description, ages, gender, location, signals } = segment;
  return { name, description, ages, gender, location, signals };
}

export default function SegmentPage({ loaderData }: Route.ComponentProps) {
  const { segment, members, now } = loaderData;
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => draftOf(segment));
  const fetcher = useFetcher<typeof action>();
  const readOnly = useReadOnly();
  const saving = fetcher.state !== "idle";
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  useEffect(() => setDraft(draftOf(segment)), [segment]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(segment));
  const error = fetcher.state === "idle" && fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;
  const saved = fetcher.state === "idle" && fetcher.data?.ok && !dirty;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        back={{ to: "/admin/profiles", label: "Profiles" }}
        title={segment.name}
        description={error ? <span className="text-destructive">{error}</span> : undefined}
        docs={{ slug: "segments", tooltip: "How segments work" }}
        actions={
          <>
            <AskAgentLink kind="segment" id={segment.id} />
            {dirty && !readOnly && (
              <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDraft(draftOf(segment))}>
                Discard
              </Button>
            )}
            {!readOnly && (
              <Button
                size="sm"
                disabled={!dirty || saving}
                aria-busy={saving}
                onClick={() =>
                  fetcher.submit({ intent: "save", segment: draft } as unknown as SubmitTarget, {
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
          <FormSection title="Details">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" value={draft.description} onChange={(e) => set("description", e.target.value)} />
                <FieldDescription>Write it like you'd brief a colleague. Loro uses this to steer what it generates.</FieldDescription>
              </Field>
            </FieldGroup>
          </FormSection>

          <FormSection
            title="Audience"
            description="Sent to Qloo as demographic signals, so recommendations lean towards what this group likes."
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Age</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ageRanges) as AgeRange[]).map((age) => (
                    <ToggleChip
                      key={age}
                      pressed={draft.ages.includes(age)}
                      onPressedChange={(pressed) =>
                        setDraft((current) => ({
                          ...current,
                          // Kept in the order Qloo lists them.
                          ages: (Object.keys(ageRanges) as AgeRange[]).filter((a) =>
                            a === age ? pressed : current.ages.includes(a),
                          ),
                        }))
                      }
                    >
                      {ageRanges[age]}
                    </ToggleChip>
                  ))}
                </div>
                <FieldDescription>Leave all off to target any age.</FieldDescription>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Gender</FieldLabel>
                  <Select items={genders} value={draft.gender} onValueChange={(value) => set("gender", value as Gender)}>
                    <SelectTrigger className="w-full" aria-label="Gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(genders).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input id="location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
                </Field>
              </div>
            </FieldGroup>
          </FormSection>

          <FormSection
            title="Taste Signals"
            description="Things this group already loves. Qloo uses them to find what else they'll like."
          >
            <SignalEditor value={draft.signals} onChange={(signals) => set("signals", signals)} />
          </FormSection>

          <FormSection title="People">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one yet. Assign people from their profile, under Segment.
              </p>
            ) : (
              <Table interactive>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((person) => (
                    <TableRow key={person.id} onClick={() => navigate(`/admin/profiles/people/${person.id}`)}>
                      <TableCell>
                        <Link
                          to={`/admin/profiles/people/${person.id}`}
                          className="flex flex-col gap-0.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="font-medium">{person.name}</span>
                          <span className="text-xs text-muted-foreground">{person.email || "No email"}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sourceLabels[person.source]}</TableCell>
                      <TableCell>{statusLabels[person.status]}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {since(person.lastActiveAt ?? person.createdAt, now)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </FormSection>

          {!readOnly && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
              <div className="flex max-w-md flex-col gap-1">
                <span className="text-sm font-medium">Delete Segment</span>
                <p className="text-sm text-muted-foreground">People in it stay; they're just unassigned.</p>
              </div>
              <ConfirmDeleteButton
                label="Delete Segment"
                confirmTitle={`Delete ${segment.name}?`}
                confirmDescription={`${number.format(segment.people)} ${segment.people === 1 ? "person" : "people"} will be unassigned. This can't be undone.`}
                onConfirm={() => fetcher.submit({ intent: "delete" }, { method: "post", encType: "application/json" })}
              />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
          <div className="flex flex-col gap-5 rounded-xl bg-secondary/60 p-5">
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground">People</dt>
                <dd className="font-heading text-2xl font-medium tabular-nums">{number.format(segment.people)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground">Signals</dt>
                <dd className="font-heading text-2xl font-medium tabular-nums">{segment.signals.length}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">Updated {since(segment.updatedAt, now)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
