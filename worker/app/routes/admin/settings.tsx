import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";
import { ArrowUpRightIcon, ExternalLinkIcon } from "lucide-react";

import type { Route } from "./+types/settings";
import { qloo, resources } from "@core/settings";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { FormSection } from "@/admin-components/form-section";
import { PageHeader } from "@/admin-components/page-header";
import { EditorLibrary, LibraryDrawer } from "@/admin-components/catalogue/media-picker";
import { WorkspaceMark } from "@/admin-components/workspace-mark";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { aiGatewayId, aiModelId } from "@core/ai.server";
import { listContextFiles } from "@core/context.server";
import type { ImageAsset } from "@core/context";
import { listFiles } from "@core/files.server";
import { TAGLINE_MAX, type Workspace as WorkspaceData } from "@core/workspaces";
import { WorkspaceError, deleteWorkspace, updateWorkspace } from "@core/workspaces.server";
import { type Mode, isMode, readPreferences, savePreferences } from "@/lib/preferences";
import { currentWorkspace } from "@/lib/workspace.server";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Settings · Loro" }];
}

/** Covers are picked from the workspace's own images in Context. */
async function coverOptions(workspaceId: string) {
  const images = await listFiles(workspaceId, "image");
  return images.flatMap(({ id, url, alt }) => (url ? [{ id, url, alt }] : []));
}

export async function loader({ request }: Route.LoaderArgs) {
  const [preferences, workspace] = await Promise.all([readPreferences(request), currentWorkspace(request)]);
  const { images } = await listContextFiles(workspace.id);
  return {
    preferences,
    workspace,
    // Uploaded images with a URL; only those can be a cover.
    covers: images.filter((image) => image.url),
    ai: { model: aiModelId(), gateway: aiGatewayId() },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const preferences = await readPreferences(request);
  const intent = form.get("intent");
  const mode = form.get("mode");

  try {
    if (intent === "workspace") {
      const current = await currentWorkspace(request);
      await updateWorkspace(current.id, {
        name: String(form.get("workspaceName") ?? ""),
        tagline: String(form.get("tagline") ?? ""),
      });
    }
    if (intent === "cover") {
      const current = await currentWorkspace(request);
      const cover = String(form.get("cover") ?? "");
      const options = await coverOptions(current.id);
      if (cover && !options.some((option) => option.url === cover)) {
        return data({ error: "Pick one of the images." }, { status: 400 });
      }
      await updateWorkspace(current.id, { cover: cover || null });
    }
    if (intent === "delete") {
      const current = await currentWorkspace(request);
      await deleteWorkspace(current.id);
      preferences.workspaceId = null;
      return redirect("/admin/workspaces", { headers: { "Set-Cookie": await savePreferences(preferences) } });
    }
  } catch (error) {
    if (error instanceof WorkspaceError) return data({ error: error.message }, { status: 400 });
    throw error;
  }

  if (intent === "mode" && isMode(mode)) {
    preferences.mode = mode;
    return data({ error: null }, { headers: { "Set-Cookie": await savePreferences(preferences) } });
  }
  return data({ error: null });
}

/* Workspace */

function Workspace({ name, tagline, locked }: { name: string; tagline: string; locked: boolean }) {
  const fetcher = useFetcher<typeof action>();
  const [value, setValue] = useState(name);
  const [line, setLine] = useState(tagline);
  const saving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const changed = value.trim() !== name || line.trim() !== tagline;

  return (
    <fetcher.Form method="post" className="flex flex-col gap-5">
      <input type="hidden" name="intent" value="workspace" />
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
        <Input
          id="workspace-name"
          name="workspaceName"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={60}
          disabled={locked}
          aria-invalid={error ? true : undefined}
        />
        <FieldDescription>
          {error ?? (locked ? "Demo workspaces keep their names." : "Shown at the top of the sidebar.")}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="workspace-tagline">Tagline</FieldLabel>
        <Input
          id="workspace-tagline"
          name="tagline"
          value={line}
          onChange={(event) => setLine(event.target.value)}
          maxLength={TAGLINE_MAX}
          disabled={locked}
          placeholder="One line on what you do"
        />
        <FieldDescription>Shown under the name on the Workspaces page.</FieldDescription>
      </Field>
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={saving || locked || !value.trim() || !changed}>
          {saving ? "Saving" : "Save Changes"}
        </Button>
        {changed && !saving && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setValue(name);
              setLine(tagline);
            }}
          >
            Discard
          </Button>
        )}
      </div>
    </fetcher.Form>
  );
}

/** Banner preview like the workspace card. It opens the image library to change it. */
function Cover({ workspace, covers }: { workspace: WorkspaceData; covers: ImageAsset[] }) {
  const fetcher = useFetcher<typeof action>();
  const [open, setOpen] = useState(false);
  const locked = Boolean(workspace.demo);
  // Show the new choice straight away, before the round trip finishes.
  const pending = fetcher.formData?.get("cover");
  const current = pending === undefined || pending === null ? workspace.cover : String(pending) || null;
  const pick = (url: string) => fetcher.submit({ intent: "cover", cover: url }, { method: "post" });

  return (
    <Field>
      <FieldLabel htmlFor="workspace-cover">Cover</FieldLabel>
      <div className="relative mb-6">
        <button
          id="workspace-cover"
          type="button"
          disabled={locked}
          aria-label={current ? "Replace cover" : "Choose cover"}
          onClick={() => setOpen(true)}
          className="group relative block aspect-[16/6] w-full overflow-hidden rounded-xl bg-secondary ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        >
          {current && <img src={current} alt="" className="absolute inset-0 size-full object-cover" />}
          {!locked && (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-sm font-medium transition-opacity",
                current
                  ? "bg-black/40 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {current ? "Replace" : "Choose Image"}
            </span>
          )}
        </button>
        <WorkspaceMark
          name={workspace.name}
          className="pointer-events-none absolute -bottom-6 left-5 size-12 rounded-lg text-xl ring-4 ring-background"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <FieldDescription>
          {fetcher.data?.error ??
            (locked ? "Demo workspaces keep their covers." : "From the images in Context. Shown on the Workspaces page.")}
        </FieldDescription>
        {current && !locked && (
          <Button variant="ghost" size="sm" className="-mr-3 shrink-0" onClick={() => pick("")}>
            Remove
          </Button>
        )}
      </div>
      <EditorLibrary value={{ images: covers, videos: [], workspaceId: workspace.id }}>
        <LibraryDrawer
          open={open}
          onOpenChange={setOpen}
          kinds={["image"]}
          value={{ type: "image", url: current ?? "" }}
          onPick={(media) => pick(media.url)}
          links={false}
        />
      </EditorLibrary>
    </Field>
  );
}

/* Appearance */

const modes: { value: Mode; label: string }[] = [
  { value: "q", label: "Q" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/* Hard-coded rather than tokens, since every thumbnail shows at once. */
const samples: Record<Mode, { ground: string; panel: string; ink: string; faint: string; button: string }> = {
  light: { ground: "bg-white", panel: "bg-[#f3f3f3]", ink: "bg-black", faint: "bg-black/30", button: "rounded-sm bg-black" },
  dark: { ground: "bg-[#141414]", panel: "bg-[#262626]", ink: "bg-white", faint: "bg-white/40", button: "rounded-sm bg-white" },
  q: { ground: "bg-[#f8f6f4]", panel: "bg-[#e8e6e4]", ink: "bg-[#28323c]", faint: "bg-[#505a64]/40", button: "rounded-full bg-[#8c8cc8]" },
};

/** A thumbnail of the admin in each mode. */
function ModeSample({ mode }: { mode: Mode }) {
  const sample = samples[mode];
  return (
    <div className={cn("flex h-24 gap-2 p-3", sample.ground)}>
      <div className="flex w-1/4 flex-col gap-1.5 pt-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-1.5 rounded-full opacity-70", sample.ink)} />
        ))}
      </div>
      <div className={cn("flex flex-1 flex-col gap-1.5 rounded-md p-2", sample.panel)}>
        <span className={cn("h-2 w-1/2 rounded-full", sample.ink)} />
        <span className={cn("h-1.5 w-3/4 rounded-full", sample.faint)} />
        <span className={cn("mt-auto h-3 w-8", sample.button)} />
      </div>
    </div>
  );
}

function Appearance({ mode }: { mode: Mode }) {
  const fetcher = useFetcher();
  // Show the new choice straight away, before the cookie round trip finishes.
  const current = (fetcher.formData?.get("mode") as Mode | null) ?? mode;

  return (
    <div role="radiogroup" aria-label="Mode" className="grid max-w-xl grid-cols-3 gap-4">
      {modes.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={current === option.value}
          onClick={() => fetcher.submit({ intent: "mode", mode: option.value }, { method: "post" })}
          className="group flex flex-col gap-2 text-left outline-none"
        >
          <div className="overflow-hidden rounded-lg border-2 border-border transition-colors group-hover:border-muted-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-aria-checked:border-primary">
            <ModeSample mode={option.value} />
          </div>
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Delete */

function DeleteWorkspace({ name }: { name: string }) {
  const fetcher = useFetcher<typeof action>();
  const error = fetcher.data?.error;

  return (
    <div className="flex flex-col items-start gap-4">
      <ConfirmDeleteButton
        label="Delete Workspace"
        confirmTitle={`Delete ${name}?`}
        confirmDescription="Its profiles, experiences, Context and uploaded files go with it. This can't be undone."
        onConfirm={() => fetcher.submit({ intent: "delete" }, { method: "post" })}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/* Page */

export default function Settings({ loaderData }: Route.ComponentProps) {
  const { preferences, workspace, covers, ai } = loaderData;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-10">
        <FormSection title="Workspace">
          <Workspace
            key={workspace.id + workspace.name + workspace.tagline}
            name={workspace.name}
            tagline={workspace.tagline}
            locked={Boolean(workspace.demo)}
          />
          <Cover key={workspace.id} workspace={workspace} covers={covers} />
        </FormSection>

        <FormSection title="Appearance">
          <Appearance mode={preferences.mode} />
        </FormSection>

        <FormSection title="Qloo">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">Taste AI</span>
              <Badge variant={qloo.connected ? "default" : "secondary"}>
                {qloo.connected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Loro asks Qloo what each person is likely to love. The key is a Worker secret, so it
              never reaches the browser. To change it, run{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground">
                wrangler secret put {qloo.secret}
              </code>
              .
            </p>
          </div>
        </FormSection>

        <FormSection title="AI">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">Agent</span>
              <Badge variant="secondary" className="font-mono">
                {ai.model}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              The agent runs through the Worker's AI binding and the{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground">{ai.gateway}</code> AI
              Gateway, which logs, caches and rate limits every call. Claude is billed through the gateway's
              credits or your Anthropic key stored on it. To change models, set{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground">AI_MODEL</code> in
              wrangler.jsonc: another gateway model like "openai/gpt-5", or a Workers AI model ("@cf/…") that needs
              no key.
            </p>
            <a
              href="https://dash.cloudflare.com/?to=/:account/ai/ai-gateway"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm", className: "w-fit" })}
            >
              Open AI Gateway
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </div>
        </FormSection>

        <FormSection title="Resources">
          <ul className="flex flex-col">
            {resources.map((resource) => (
              <li key={resource.href} className="border-b last:border-b-0">
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium group-hover:underline group-hover:underline-offset-4">
                      {resource.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{resource.description}</span>
                  </span>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </FormSection>

        {!workspace.demo && (
          <FormSection title="Delete Workspace">
            <DeleteWorkspace name={workspace.name} />
          </FormSection>
        )}
      </div>
    </div>
  );
}
