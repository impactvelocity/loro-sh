import { useEffect, useRef, useState } from "react";
import { type SubmitTarget, data, redirect, useFetcher } from "react-router";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import { renderSVG } from "uqr";

import type { Route } from "./+types/experience";
import { listContextFiles, listSkills } from "@core/context.server";
import type { ExperienceConfig } from "@core/catalogue/config";
import type { PartId } from "@core/catalogue/define";
import { getCatalogue } from "@core/catalogue/registry";
import {
  type FunnelStatus,
  NAME_MAX,
  funnelStatusDescriptions,
  funnelStatusLabels,
  publicPath,
} from "@core/funnels";
import { experienceAnalytics } from "@core/analytics.server";
import { feedbackSummary } from "@core/feedback.server";
import { appOrigin, pagesOrigin } from "@core/hosts.server";
import { FunnelError, deleteFunnel, getFunnel, saveFunnel } from "@core/funnels.server";
import { funnelGenerations, funnelPeople, testPeople } from "@core/profiles.server";
import { TestError, deleteTest, listTests, runTest } from "@core/tests.server";
import { EditorLibrary } from "@/admin-components/catalogue/media-picker";
import { JsonSheet, PartTabs, PartWorkspace, RunThrough } from "@/admin-components/catalogue/experience-editor";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { type OverviewData, ExperienceOverview } from "@/admin-components/experience-overview";
import { ExperienceFeedback } from "@/admin-components/experience-feedback";
import { FeedbackWidgetSettings } from "@/admin-components/feedback-widget-settings";
import { ExperienceShare } from "@/admin-components/experience-share";
import { CatalogueBadge, StatusBadge } from "@/admin-components/experience-status";
import { type TestPerson, type TestRun, ExperienceTests } from "@/admin-components/experience-tests";
import { FormSection } from "@/admin-components/form-section";
import { AskAgentLink } from "@/admin-components/agent/ask-agent";
import { PageHeader } from "@/admin-components/page-header";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Spinner } from "@/admin-components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { cn } from "@/lib/utils";
import { currentWorkspace } from "@/lib/workspace.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const now = new Date();
  const [funnel, files, analytics, people, generations, testers, skills] = await Promise.all([
    getFunnel(workspace.id, params.slug),
    listContextFiles(workspace.id),
    experienceAnalytics(workspace.id, params.slug, now),
    funnelPeople(workspace.id, params.slug),
    funnelGenerations(workspace.id, params.slug),
    testPeople(workspace.id, params.slug),
    listSkills(workspace.id),
  ]);
  if (!funnel) throw data(null, { status: 404 });
  const [tests, feedback] = await Promise.all([listTests(workspace.id, funnel), feedbackSummary(workspace.id, funnel.slug)]);
  const url = `${pagesOrigin(request.url)}${publicPath(workspace.id, funnel.slug)}`;
  return {
    workspaceId: workspace.id,
    funnel,
    images: files.images,
    videos: files.media.filter((item) => item.kind === "video"),
    skills: skills.map(({ id, title, description }) => ({ id, title, description })),
    overview: { ...analytics, people } satisfies OverviewData,
    tests,
    testers,
    generations,
    feedback,
    share: { url, api: appOrigin(request.url), qr: renderSVG(url, { pixelSize: 8, border: 2 }) },
    now: Math.floor(now.getTime() / 1000),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.funnel.name ?? "Experience"} · Loro` }];
}

type Draft = { name: string; slug: string; status: FunnelStatus; config: ExperienceConfig };

export async function action({ request, params }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const body = (await request.json()) as
    | { intent: "save"; draft: Draft }
    | { intent: "delete" }
    | { intent: "run-test"; personId: string | null; name: string; email: string; answers: unknown; config: unknown }
    | { intent: "delete-test"; id: string };

  if (body.intent === "delete") {
    await deleteFunnel(workspace.id, params.slug);
    return redirect("/admin/experiences");
  }
  if (body.intent === "delete-test") {
    await deleteTest(workspace.id, body.id);
    return { ok: true as const, error: null };
  }
  if (body.intent === "run-test") {
    const funnel = await getFunnel(workspace.id, params.slug);
    if (!funnel) throw data(null, { status: 404 });
    try {
      return { ok: true as const, testId: await runTest(workspace.id, funnel, body) };
    } catch (error) {
      if (error instanceof TestError) return data({ ok: false as const, errors: error.errors }, { status: 400 });
      throw error;
    }
  }
  try {
    const slug = await saveFunnel(workspace.id, params.slug, body.draft);
    if (slug !== params.slug) return redirect(`/admin/experiences/${slug}`);
    return { ok: true as const, error: null };
  } catch (error) {
    if (error instanceof FunnelError) return data({ ok: false as const, error: error.message }, { status: 400 });
    throw error;
  }
}

type Tab = PartId | "overview" | "feedback" | "share" | "settings";
/** Each saves its own fields: the parts' config, the link, the feedback widget, or name and status. */
type Area = "parts" | "share" | "feedback" | "settings";

function draftOf(funnel: Route.ComponentProps["loaderData"]["funnel"]): Draft {
  return { name: funnel.name, slug: funnel.slug, status: funnel.status, config: funnel.config as ExperienceConfig };
}

/** Save and Discard for one area of the page. */
function SaveButtons({
  dirty,
  saving,
  saved,
  label = "Save Changes",
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  /** Just saved from here: shows a tick for a moment. */
  saved: boolean;
  label?: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {dirty && (
        <Button variant="ghost" size="sm" disabled={saving} onClick={onDiscard}>
          Discard
        </Button>
      )}
      <Button size="sm" disabled={!dirty || saving} aria-busy={saving} onClick={onSave}>
        {saving && <Spinner data-icon="inline-start" />}
        {saved && !dirty && <CheckIcon data-icon="inline-start" />}
        {saved && !dirty ? "Saved" : label}
      </Button>
    </div>
  );
}

function Settings({
  draft,
  setDraft,
  actions,
  onDelete,
}: {
  draft: Draft;
  setDraft: (update: (draft: Draft) => Draft) => void;
  /** This tab's Save and Discard. */
  actions: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <FormSection title="General">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              maxLength={NAME_MAX}
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((current) => ({ ...current, name }));
              }}
            />
          </Field>
        </FieldGroup>
      </FormSection>

      <FormSection title="Status">
        <div role="radiogroup" aria-label="Status" className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(funnelStatusLabels) as FunnelStatus[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={draft.status === key}
              onClick={() => setDraft((current) => ({ ...current, status: key }))}
              className="flex flex-col gap-1 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
            >
              <span className="font-medium">{funnelStatusLabels[key]}</span>
              <span className="text-sm text-muted-foreground">{funnelStatusDescriptions[key]}</span>
            </button>
          ))}
        </div>
      </FormSection>

      <div className="flex justify-end border-t pt-6">{actions}</div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
        <div className="flex max-w-md flex-col gap-1">
          <span className="text-sm font-medium">Delete Experience</span>
          <p className="text-sm text-muted-foreground">The link stops working. People and their profiles stay.</p>
        </div>
        <ConfirmDeleteButton
          label="Delete Experience"
          confirmTitle={`Delete ${draft.name}?`}
          confirmDescription="This can't be undone."
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

export default function ExperiencePage({ loaderData }: Route.ComponentProps) {
  const { funnel, workspaceId, images, videos, skills, overview, now } = loaderData;
  const catalogue = getCatalogue(funnel.catalogue)!;
  const [draft, setDraft] = useState<Draft>(() => draftOf(funnel));
  const [tab, setTab] = useState<Tab>("overview");
  const [feedbackView, setFeedbackView] = useState<"responses" | "settings">("responses");
  const fetcher = useFetcher<typeof action>();
  const saving = fetcher.state !== "idle";
  // Which area saved last, so only its button shows the tick.
  const [savedFrom, setSavedFrom] = useState<Area | null>(null);

  // After a save, take what's stored, but keep unsaved edits in the other
  // areas: a field the save didn't touch keeps whatever's been typed.
  const savedDraft = draftOf(funnel);
  const saved = JSON.stringify(savedDraft);
  const previous = useRef(savedDraft);
  useEffect(() => {
    const before = previous.current;
    previous.current = savedDraft;
    setDraft((current) => {
      const keep = <K extends keyof Draft>(key: K) =>
        JSON.stringify(current[key]) === JSON.stringify(before[key]) ? savedDraft[key] : current[key];
      return { name: keep("name"), slug: keep("slug"), status: keep("status"), config: keep("config") };
    });
  }, [saved]);
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data?.ok) return;
    const timer = setTimeout(() => setSavedFrom(null), 1500);
    return () => clearTimeout(timer);
  }, [fetcher.state, fetcher.data]);

  const changed = (key: keyof Draft) => JSON.stringify(draft[key]) !== JSON.stringify(savedDraft[key]);
  // The feedback widget lives in the config but saves from its own tab, so the parts leave it out.
  const partsOf = (config: ExperienceConfig) => JSON.stringify({ ...config, feedback: null });
  const dirty = {
    parts: partsOf(draft.config) !== partsOf(savedDraft.config),
    share: changed("slug"),
    feedback: JSON.stringify(draft.config.feedback) !== JSON.stringify(savedDraft.config.feedback),
    settings: changed("name") || changed("status"),
  };
  // Absolute, so outcome links open on the pages host.
  const savedHref = new URL(loaderData.share.url).origin + publicPath(workspaceId, funnel.slug);
  const error =
    fetcher.state === "idle" && fetcher.data && !fetcher.data.ok && "error" in fetcher.data ? fetcher.data.error : null;
  const setConfig = (config: ExperienceConfig) => setDraft((current) => ({ ...current, config }));

  /** Saves one area's fields on top of what's stored. */
  function save(area: Area) {
    const fields: Partial<Draft> =
      area === "parts"
        ? { config: { ...draft.config, feedback: savedDraft.config.feedback } }
        : area === "share"
          ? { slug: draft.slug }
          : area === "feedback"
            ? { config: { ...savedDraft.config, feedback: draft.config.feedback } }
            : { name: draft.name, status: draft.status };
    setSavedFrom(area);
    // Props are typed unknown, but they came from JSON and go back as JSON.
    fetcher.submit({ intent: "save", draft: { ...savedDraft, ...fields } } as unknown as SubmitTarget, {
      method: "post",
      encType: "application/json",
    });
  }
  const discard = (area: Area) =>
    setDraft((current) =>
      area === "parts"
        ? { ...current, config: { ...savedDraft.config, feedback: current.config.feedback } }
        : area === "share"
          ? { ...current, slug: savedDraft.slug }
          : area === "feedback"
            ? { ...current, config: { ...current.config, feedback: savedDraft.config.feedback } }
            : { ...current, name: savedDraft.name, status: savedDraft.status },
    );
  const buttons = (area: Area, label?: string) => (
    <SaveButtons
      dirty={dirty[area]}
      saving={saving && savedFrom === area}
      saved={savedFrom === area && fetcher.state === "idle" && Boolean(fetcher.data?.ok)}
      label={label}
      onSave={() => save(area)}
      onDiscard={() => discard(area)}
    />
  );

  // Start, Intake and Outcome save from a bar along the bottom.
  const onPart = tab === "start" || tab === "intake" || tab === "artifact";
  const showBar = onPart && (dirty.parts || (saving && savedFrom === "parts"));

  return (
    <EditorLibrary value={{ images, videos, workspaceId, skills }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <PageHeader
          back={{ to: "/admin/experiences", label: "Experiences" }}
          backAside={
            <>
              <CatalogueBadge name={catalogue.name} description={catalogue.description} />
              <StatusBadge status={funnel.status} />
            </>
          }
          title={funnel.name}
          description={error && <span className="text-destructive">{error}</span>}
          actions={
            <>
              <AskAgentLink kind="experience" id={funnel.slug} />
              <JsonSheet config={draft.config} />
              <RunThrough catalogue={catalogue} config={draft.config} />
              <a href={savedHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                Open Page
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </>
          }
        />

        <PartTabs
          config={draft.config}
          value={tab}
          onChange={setTab}
          before={[{ value: "overview" as const, label: "Overview" }]}
          extra={[
            { value: "feedback" as const, label: "Feedback" },
            { value: "share" as const, label: "Share" },
            { value: "settings" as const, label: "Settings" },
          ]}
        />

        {tab === "overview" ? (
          <ExperienceOverview
            data={overview}
            startOn={funnel.config.parts.start.enabled}
            outcomeHref={(id) => `${savedHref}/g/${id}`}
            now={now}
          />
        ) : tab === "feedback" ? (
          <div className="flex flex-col gap-8">
            <Tabs value={feedbackView} onValueChange={(value) => setFeedbackView(value as typeof feedbackView)}>
              <TabsList>
                <TabsTrigger value="responses" className="px-3">
                  Responses
                </TabsTrigger>
                <TabsTrigger value="settings" className="px-3">
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {feedbackView === "responses" ? (
              <ExperienceFeedback data={loaderData.feedback} outcomeHref={(id) => `${savedHref}/g/${id}`} now={now} />
            ) : (
              <div className="flex max-w-3xl flex-col gap-10">
                <FeedbackWidgetSettings
                  value={draft.config.feedback}
                  onChange={(feedback) => setDraft((current) => ({ ...current, config: { ...current.config, feedback } }))}
                />
                <div className="flex justify-end border-t pt-6">{buttons("feedback")}</div>
              </div>
            )}
          </div>
        ) : tab === "share" ? (
          <ExperienceShare
            url={loaderData.share.url}
            api={loaderData.share.api}
            qr={loaderData.share.qr}
            workspace={workspaceId}
            slug={funnel.slug}
            slugDraft={draft.slug}
            onSlugChange={(slug) => setDraft((current) => ({ ...current, slug }))}
            actions={buttons("share", "Save Link")}
            status={funnel.status}
            catalogue={catalogue}
            config={funnel.config as ExperienceConfig}
          />
        ) : tab === "settings" ? (
          <Settings
            draft={draft}
            setDraft={setDraft}
            actions={buttons("settings")}
            onDelete={() => fetcher.submit({ intent: "delete" }, { method: "post", encType: "application/json" })}
          />
        ) : (
          <PartWorkspace
            key={tab}
            catalogue={catalogue}
            config={draft.config}
            part={tab}
            onChange={setConfig}
            tests={
              tab === "artifact" && (
                <ExperienceTests
                  workspaceId={workspaceId}
                  slug={funnel.slug}
                  catalogue={catalogue}
                  config={draft.config}
                  tests={loaderData.tests as TestRun[]}
                  people={loaderData.testers as TestPerson[]}
                  generations={loaderData.generations}
                  outcomeHref={(id) => `${savedHref}/g/${id}`}
                  now={now}
                />
              )
            }
          />
        )}
      </div>

      <div
        inert={!showBar}
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-[opacity,translate] duration-300 ease-out md:left-64",
          showBar ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-6 rounded-full bg-background py-2 pr-2 pl-5 shadow-[0_8px_40px_rgb(0_0_0/0.16)] ring-1 ring-border">
          <span className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}>
            {error ?? "Unsaved changes"}
          </span>
          {buttons("parts")}
        </div>
      </div>
    </EditorLibrary>
  );
}
