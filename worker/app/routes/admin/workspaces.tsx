import { useState } from "react";
import { data, redirect, useFetcher, useSearchParams } from "react-router";
import { LayoutGridIcon, PlusIcon } from "lucide-react";

import type { Route } from "./+types/workspaces";
import {
  type Workspace,
  NAME_MAX,
  TAGLINE_MAX,
  workspaceSubtitle,
} from "@core/workspaces";
import {
  MAX_CREATED,
  WorkspaceError,
  createWorkspace,
  listWorkspaces,
} from "@core/workspaces.server";
import { AccountHeader } from "@/admin-components/account-header";
import { PageHeader } from "@/admin-components/page-header";
import { WorkspaceMark } from "@/admin-components/workspace-mark";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin-components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Spinner } from "@/admin-components/ui/spinner";
import { number } from "@/lib/format";
import type { RouteHandle } from "@/lib/document";
import { readPreferences, savePreferences } from "@/lib/preferences";
import { selectedWorkspace } from "@/lib/workspace.server";
import { cn } from "@/lib/utils";

export const handle: RouteHandle = { surface: "admin" };

export function meta() {
  return [{ title: "Workspaces · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [preferences, workspaces, current] = await Promise.all([
    readPreferences(request),
    listWorkspaces(),
    selectedWorkspace(request),
  ]);
  return {
    // The admin layout normally sets the mode; this page sits outside it.
    mode: preferences.mode,
    workspaces,
    current: current && { id: current.id },
    canCreate: workspaces.filter((w) => !w.demo).length < MAX_CREATED,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const preferences = await readPreferences(request);
  const intent = form.get("intent");
  const saved = async () => ({ "Set-Cookie": await savePreferences(preferences) });

  try {
    if (intent === "switch") {
      const id = String(form.get("id"));
      if ((await listWorkspaces()).some((w) => w.id === id)) preferences.workspaceId = id;
      // Cards open the workspace after switching; the sidebar menu stays put.
      const to = String(form.get("redirectTo") ?? "");
      if (to.startsWith("/admin")) return redirect(to, { headers: await saved() });
    }

    if (intent === "create") {
      // Straight into the new workspace.
      preferences.workspaceId = await createWorkspace({
        name: String(form.get("name") ?? ""),
        tagline: String(form.get("tagline") ?? ""),
        seeded: form.get("start") === "demo",
      });
      return redirect("/admin/analytics", { headers: await saved() });
    }

  } catch (error) {
    if (error instanceof WorkspaceError) return data({ ok: false, error: error.message }, { status: 400 });
    throw error;
  }

  return data({ ok: true, error: null }, { headers: await saved() });
}

const starts = {
  demo: { title: "Demo data", description: "Sample profiles and experiences to explore." },
  empty: { title: "Empty", description: "Start from nothing and add your own." },
};

/** The whole card opens the workspace. Deleting one is in its Settings. */
function WorkspaceCard({ workspace, current }: { workspace: Workspace; current: boolean }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  return (
    <li
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl ring-1 ring-border transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0_0_0/0.08)]",
        current ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-foreground/40",
      )}
    >
      <div className="relative aspect-[16/7] bg-secondary">
        {/* Absolute so the photo can't stretch the box past its aspect ratio. */}
        <div className="absolute inset-0 overflow-hidden">
          {workspace.cover && (
            <img
              src={workspace.cover}
              alt=""
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          {current && <Badge>Current</Badge>}
          {workspace.demo && <Badge variant="secondary">Demo</Badge>}
        </div>
        {busy && (
          <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-background">
            <Spinner className="size-4" />
          </span>
        )}
        <WorkspaceMark
          name={workspace.name}
          className="absolute -bottom-6 left-5 size-12 rounded-lg text-xl ring-4 ring-background"
        />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 pt-9">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                fetcher.submit(
                  { intent: "switch", id: workspace.id, redirectTo: "/admin/analytics" },
                  { method: "post" },
                )
              }
              className="self-start text-left font-heading text-lg font-medium underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {workspace.name}
              <span className="sr-only">{current ? ", current workspace" : ", switch to this workspace"}</span>
            </button>
            {workspaceSubtitle(workspace) && (
              <span className="text-sm text-muted-foreground">{workspaceSubtitle(workspace)}</span>
            )}
          </div>
          {workspace.tagline && <p className="line-clamp-2 text-sm text-pretty">{workspace.tagline}</p>}
        </div>

        <dl className="grid grid-cols-3 gap-4">
          {[
            ["Experiences", workspace.experiences],
            ["Segments", workspace.segments],
            ["Profiles", workspace.profiles],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium tabular-nums">{number.format(Number(value))}</dd>
            </div>
          ))}
        </dl>

        {workspace.host && (
          <div className="mt-auto border-t pt-4">
            <span className="block truncate font-mono text-xs text-muted-foreground">{workspace.host}</span>
          </div>
        )}
      </div>
    </li>
  );
}

function NewWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const fetcher = useFetcher<typeof action>();
  const [start, setStart] = useState<keyof typeof starts>("demo");
  const [name, setName] = useState("");
  const busy = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
        </DialogHeader>
        <fetcher.Form method="post" className="flex flex-col gap-6">
          <input type="hidden" name="intent" value="create" />
          <input type="hidden" name="start" value={start} />
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
              <Input
                id="workspace-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your brand or team"
                maxLength={NAME_MAX}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-tagline">Tagline</FieldLabel>
              <Input
                id="workspace-tagline"
                name="tagline"
                placeholder="One line on what you do"
                maxLength={TAGLINE_MAX}
              />
            </Field>
            <Field>
              <FieldLabel>Start with</FieldLabel>
              <div role="radiogroup" aria-label="Start with" className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(starts) as (keyof typeof starts)[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={start === key}
                    onClick={() => setStart(key)}
                    className="flex flex-col gap-0.5 rounded-lg p-3.5 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
                  >
                    <span className="text-sm font-medium">{starts[key].title}</span>
                    <span className="text-xs text-muted-foreground">{starts[key].description}</span>
                  </button>
                ))}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={busy || !name.trim()} aria-busy={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Workspaces({ loaderData }: Route.ComponentProps) {
  const { workspaces, current, canCreate } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  // ?new opens the dialog, so the sidebar switcher can link straight to it.
  const creating = searchParams.has("new");
  const setCreating = (open: boolean) =>
    setSearchParams(open ? { new: "" } : {}, { preventScrollReset: true, replace: true });

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-10 px-4 py-8 md:px-10 md:py-10">
      <AccountHeader page="workspaces" />

      <PageHeader
        title="Workspaces"
        actions={
          <Button size="sm" disabled={!canCreate} onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            New Workspace
          </Button>
        }
      />

      {workspaces.length === 0 ? (
        <Empty className="flex-none border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGridIcon />
            </EmptyMedia>
            <EmptyTitle>No Workspaces Yet</EmptyTitle>
            <EmptyDescription>One per brand, each with its own profiles, experiences and Context.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} current={workspace.id === current?.id} />
          ))}
        </ul>
      )}

      <NewWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
