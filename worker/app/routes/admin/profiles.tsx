import { useState } from "react";
import { Link, data, redirect, useFetcher, useNavigate, useSearchParams } from "react-router";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";

import type { Route } from "./+types/profiles";
import { type Source, sourceLabels } from "@core/analytics";
import { since } from "@core/people";
import { ageSummary, statusLabels } from "@core/profiles";
import { ProfileError, createPerson, createSegment, listPeople, listSegments } from "@core/profiles.server";
import { PageHeader } from "@/admin-components/page-header";
import { Button } from "@/admin-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin-components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/admin-components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { useReadOnly } from "@/hooks/use-read-only";
import { number } from "@/lib/format";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta() {
  return [{ title: "Profiles · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const [segments, people] = await Promise.all([listSegments(workspace.id), listPeople(workspace.id)]);
  return { segments, people, now: Math.floor(Date.now() / 1000) };
}

export async function action({ request }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const form = await request.formData();
  const field = (name: string) => String(form.get(name) ?? "");
  try {
    if (field("intent") === "create-segment") {
      const id = await createSegment(workspace.id, { name: field("name"), description: field("description") });
      return redirect(`/admin/profiles/segments/${id}`);
    }
    if (field("intent") === "create-person") {
      const id = await createPerson(workspace.id, {
        name: field("name"),
        email: field("email").trim(),
        segmentId: field("segmentId") === "none" ? null : field("segmentId"),
      });
      return redirect(`/admin/profiles/people/${id}`);
    }
  } catch (error) {
    if (error instanceof ProfileError) return data({ error: error.message }, { status: 400 });
    throw error;
  }
  return null;
}

type LoaderData = Route.ComponentProps["loaderData"];
type View = "segments" | "individuals";

const sourceFilter = { all: "All sources", ...sourceLabels };

function matches(query: string, ...fields: string[]) {
  const needle = query.trim().toLowerCase();
  return !needle || fields.some((field) => field.toLowerCase().includes(needle));
}

function NoneYet({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="flex-none border py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function Segments({ segments }: { segments: LoaderData["segments"] }) {
  const navigate = useNavigate();
  if (segments.length === 0) {
    return <NoneYet title="No Segments Yet" description="Describe a group once, then assign people to it." />;
  }

  return (
    <Table interactive>
      <TableHeader>
        <TableRow>
          <TableHead>Segment</TableHead>
          <TableHead>Ages</TableHead>
          <TableHead className="text-right">Signals</TableHead>
          <TableHead className="text-right">People</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.map((segment) => {
          const href = `/admin/profiles/segments/${segment.id}`;
          return (
            <TableRow key={segment.id} onClick={() => navigate(href)}>
              <TableCell className="h-18 w-full max-w-0">
                <Link to={href} className="block truncate text-base font-medium" onClick={(e) => e.stopPropagation()}>
                  {segment.name}
                </Link>
              </TableCell>
              <TableCell>{ageSummary(segment.ages)}</TableCell>
              <TableCell className="text-right tabular-nums">{segment.signals.length}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{number.format(segment.people)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function Individuals({
  people,
  query,
  source,
  now,
}: {
  people: LoaderData["people"];
  query: string;
  source: Source | "all";
  now: number;
}) {
  const navigate = useNavigate();
  if (people.length === 0) {
    return (
      <NoneYet
        title="No People Yet"
        description="They appear here when they sign up to an experience, or when you add them."
      />
    );
  }
  const rows = people.filter(
    (person) =>
      (source === "all" || person.source === source) &&
      matches(query, person.name, person.email, person.segmentName ?? ""),
  );

  return (
    <Table interactive>
      <TableHeader>
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Segment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Last Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((person) => {
          const href = `/admin/profiles/people/${person.id}`;
          return (
            <TableRow key={person.id} onClick={() => navigate(href)}>
              <TableCell className="h-18">
                <Link to={href} className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-base font-medium">{person.name}</span>
                  <span className="text-xs text-muted-foreground">{person.email || "No email"}</span>
                </Link>
              </TableCell>
              <TableCell>
                {person.segmentName ?? <span className="text-disabled-foreground">No segment</span>}
              </TableCell>
              <TableCell>{statusLabels[person.status]}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {since(person.lastActiveAt ?? person.createdAt, now)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function NewSegmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const fetcher = useFetcher<typeof action>();
  const [name, setName] = useState("");
  const busy = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Segment</DialogTitle>
          <DialogDescription>Add the audience and taste signals on the next page.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="post" className="flex flex-col gap-6">
          <input type="hidden" name="intent" value="create-segment" />
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="segment-name">Name</FieldLabel>
              <Input
                id="segment-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Live music weekenders"
                maxLength={80}
                autoFocus
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="segment-description">Description</FieldLabel>
              <Textarea
                id="segment-description"
                name="description"
                placeholder="Who they are and what they want, like you'd brief a colleague"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={busy || !name.trim()} aria-busy={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              Create Segment
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function AddPersonDialog({
  open,
  onOpenChange,
  segments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: LoaderData["segments"];
}) {
  const fetcher = useFetcher<typeof action>();
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("none");
  const busy = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const segmentItems = { none: "No segment", ...Object.fromEntries(segments.map((s) => [s.id, s.name])) };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
          <DialogDescription>For someone who won't sign up themselves, like a VIP or a guest you know.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="post" className="flex flex-col gap-6">
          <input type="hidden" name="intent" value="create-person" />
          <input type="hidden" name="segmentId" value={segmentId} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="person-name">Name</FieldLabel>
              <Input
                id="person-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="person-email">Email</FieldLabel>
              <Input id="person-email" name="email" type="email" placeholder="Optional" />
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Segment</FieldLabel>
              <Select items={segmentItems} value={segmentId} onValueChange={(value) => setSegmentId(String(value))}>
                <SelectTrigger className="w-full">
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
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={busy || !name.trim()} aria-busy={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              Add Person
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Profiles({ loaderData }: Route.ComponentProps) {
  const { segments, people, now } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get("view") === "individuals" ? "individuals" : "segments";
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source | "all">("all");
  const [creating, setCreating] = useState(false);
  const readOnly = useReadOnly();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        title="Profiles"
        docs={
          view === "segments"
            ? { slug: "segments", tooltip: "How segments describe a group of people" }
            : { slug: "individuals", tooltip: "How individual profiles are built" }
        }
        actions={
          !readOnly && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon data-icon="inline-start" />
              {view === "segments" ? "New Segment" : "Add Person"}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-6">
        <Tabs
          value={view}
          onValueChange={(value) => {
            setQuery("");
            setSearchParams(value === "individuals" ? { view: "individuals" } : {}, { preventScrollReset: true });
          }}
        >
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="segments">
              Segments
              <span className="text-muted-foreground tabular-nums">{segments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="individuals">
              Individuals
              <span className="text-muted-foreground tabular-nums">{people.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "individuals" && people.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                className="h-9 rounded-md pl-9 text-sm"
              />
            </div>
            <Select items={sourceFilter} value={source} onValueChange={(value) => setSource(value as Source | "all")}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceFilter).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {view === "segments" ? (
          <Segments segments={segments} />
        ) : (
          <Individuals people={people} query={query} source={source} now={now} />
        )}
      </div>

      {readOnly ? null : view === "segments" ? (
        <NewSegmentDialog key="segment" open={creating} onOpenChange={setCreating} />
      ) : (
        <AddPersonDialog key="person" open={creating} onOpenChange={setCreating} segments={segments} />
      )}
    </div>
  );
}
