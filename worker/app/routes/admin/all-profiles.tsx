import { useState } from "react";
import { useFetcher, useSearchParams } from "react-router";
import { UsersIcon } from "lucide-react";

import type { Route } from "./+types/all-profiles";
import { sourceLabels } from "@core/analytics";
import { ageSummary } from "@core/profiles";
import { listAllPeople, listAllSegments } from "@core/profiles.server";
import { listWorkspaces } from "@core/workspaces.server";
import { AccountHeader } from "@/admin-components/account-header";
import { PageHeader } from "@/admin-components/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import type { RouteHandle } from "@/lib/document";
import { number } from "@/lib/format";
import { readPreferences } from "@/lib/preferences";

export const handle: RouteHandle = { surface: "admin" };

export function meta() {
  return [{ title: "Profiles · Loro" }];
}

/** Segments and people from every workspace, so you can see who's where. */
export async function loader({ request }: Route.LoaderArgs) {
  const [preferences, workspaces, segments, people] = await Promise.all([
    readPreferences(request),
    listWorkspaces(),
    listAllSegments(),
    listAllPeople(),
  ]);
  return {
    // Sits outside the admin layout, which normally sets the mode.
    mode: preferences.mode,
    workspaces: workspaces.map(({ id, name }) => ({ id, name })),
    segments,
    people,
  };
}

type View = "segments" | "people";

/**
 * Rows open the profile inside its workspace, switching to it first.
 * The Workspaces page's action does the switch and the redirect.
 */
function useOpenIn() {
  const fetcher = useFetcher();
  return (workspaceId: string, path: string) =>
    fetcher.submit(
      { intent: "switch", id: workspaceId, redirectTo: path },
      { method: "post", action: "/admin/workspaces" },
    );
}

export default function AllProfiles({ loaderData }: Route.ComponentProps) {
  const { workspaces, segments, people } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get("view") === "people" ? "people" : "segments";
  const [workspace, setWorkspace] = useState("all");
  const openIn = useOpenIn();

  const inWorkspace = <T extends { workspaceId: string }>(rows: T[]) =>
    workspace === "all" ? rows : rows.filter((row) => row.workspaceId === workspace);
  const segmentRows = inWorkspace(segments);
  const personRows = inWorkspace(people);
  const workspaceFilter = { all: "All workspaces", ...Object.fromEntries(workspaces.map((w) => [w.id, w.name])) };

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-10 px-4 py-8 md:px-10 md:py-10">
      <AccountHeader page="profiles" />
      <PageHeader title="Profiles" />

      {segments.length === 0 && people.length === 0 ? (
        <Empty className="flex-none border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No Profiles Yet</EmptyTitle>
            <EmptyDescription>Segments and people from every workspace show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          <Tabs
            value={view}
            onValueChange={(value) =>
              setSearchParams(value === "people" ? { view: "people" } : {}, { preventScrollReset: true })
            }
          >
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="segments">
                Segments
                <span className="text-muted-foreground tabular-nums">{segmentRows.length}</span>
              </TabsTrigger>
              <TabsTrigger value="people">
                People
                <span className="text-muted-foreground tabular-nums">{personRows.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {workspaces.length > 1 && (
            <div className="flex">
              <Select items={workspaceFilter} value={workspace} onValueChange={(value) => setWorkspace(String(value))}>
                <SelectTrigger size="sm" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(workspaceFilter).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {view === "segments" && (
            <Table interactive>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Ages</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead className="text-right">People</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segmentRows.map((segment) => {
                  const open = () => openIn(segment.workspaceId, `/admin/profiles/segments/${segment.id}`);
                  return (
                    <TableRow key={`${segment.workspaceId}/${segment.id}`} onClick={open}>
                      <TableCell className="h-18 w-full max-w-0">
                        <button
                          type="button"
                          className="block w-full truncate text-left text-base font-medium outline-none"
                          onClick={(event) => {
                            event.stopPropagation();
                            open();
                          }}
                        >
                          {segment.name}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{segment.workspace}</TableCell>
                      <TableCell className="whitespace-nowrap">{ageSummary(segment.ages)}</TableCell>
                      <TableCell className="text-right tabular-nums">{segment.signals}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {number.format(segment.people)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {view === "people" && (
            <Table interactive>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personRows.map((person) => {
                  const open = () => openIn(person.workspaceId, `/admin/profiles/people/${person.id}`);
                  return (
                    <TableRow key={`${person.workspaceId}/${person.id}`} onClick={open}>
                      <TableCell className="h-18">
                        <button
                          type="button"
                          className="flex flex-col text-left outline-none"
                          onClick={(event) => {
                            event.stopPropagation();
                            open();
                          }}
                        >
                          <span className="text-base font-medium">{person.name}</span>
                          {person.email && <span className="text-sm text-muted-foreground">{person.email}</span>}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{person.workspace}</TableCell>
                      <TableCell>
                        {person.segment ?? <span className="text-disabled-foreground">No segment</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {sourceLabels[person.source]}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
