/**
 * The pieces of the experience editor, shared by the experience page and
 * the catalogue playground: part tabs, the editor with its live preview,
 * a full run-through and the raw config.
 */
import { useEffect, useMemo, useState } from "react";
import { BracesIcon, EyeIcon, Maximize2Icon, RotateCcwIcon } from "lucide-react";

import type { ExperienceConfig } from "@core/catalogue/config";
import { type Catalogue, type PartId, partIds, partNames } from "@core/catalogue/define";
import { profileRows } from "@core/catalogue/flow";
import { ExperienceRunner } from "@core/catalogue/runner";
import { generatedBlocks } from "@core/outcome/plan";
import { type PreviewState, previewRun } from "@core/outcome/samples";
import { outcomeView } from "@core/outcome/state";
import { PartEditor, type Section, SectionTabs } from "@/admin-components/catalogue/part-editor";
import { PreviewSheet } from "@/admin-components/preview-sheet";
import { Button } from "@/admin-components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/admin-components/ui/hover-card";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin-components/ui/tooltip";

/** Start, Intake and Outcome with their counts, plus any tabs the page adds. */
export function PartTabs<T extends string = never>({
  config,
  value,
  onChange,
  before = [],
  extra = [],
}: {
  config: ExperienceConfig;
  value: PartId | NoInfer<T>;
  onChange: (value: PartId | NoInfer<T>) => void;
  /** Tabs before the parts, like Overview. */
  before?: { value: T; label: string }[];
  extra?: { value: T; label: string }[];
}) {
  return (
    <Tabs
      className="overflow-x-auto pb-px [scrollbar-width:none]"
      value={value}
      onValueChange={(next) => onChange(next as PartId | T)}
    >
      <TabsList variant="line" className="w-max min-w-full justify-start">
        {before.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
        {partIds.map((part) => (
          <TabsTrigger key={part} value={part}>
            {partNames[part]}
            {config.parts[part].enabled ? (
              <span className="text-muted-foreground tabular-nums">{config.parts[part].components.length}</span>
            ) : (
              <span className="text-muted-foreground">Off</span>
            )}
          </TabsTrigger>
        ))}
        {extra.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

const previewStates: { value: PreviewState; label: string }[] = [
  { value: "done", label: "Done" },
  { value: "generating", label: "Writing" },
  { value: "pending", label: "Waiting" },
  { value: "error", label: "Failed" },
];

/**
 * The outcome's generated sections in one state, from their samples, so
 * each state can be designed for. "Writing" streams the samples in on a loop.
 */
function usePreviewOutcome(catalogue: Catalogue, config: ExperienceConfig, state: PreviewState) {
  const [fraction, setFraction] = useState(1);
  useEffect(() => {
    if (state !== "generating") return setFraction(1);
    setFraction(0);
    const timer = setInterval(() => setFraction((f) => (f >= 1.15 ? 0 : f + 0.02)), 80);
    return () => clearInterval(timer);
  }, [state]);
  return useMemo(
    () => outcomeView(previewRun(catalogue, config, state, Math.min(1, fraction))),
    [catalogue, config, state, fraction],
  );
}

/**
 * One part's editor, with a phone preview that follows the open component.
 * With tests, they get a section of their own, full width.
 */
export function PartWorkspace({
  catalogue,
  config,
  part,
  onChange,
  tests,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  part: PartId;
  onChange: (config: ExperienceConfig) => void;
  tests?: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("components");
  const [state, setState] = useState<PreviewState>("done");
  const on = config.parts[part].enabled;
  const generated = part === "artifact" && generatedBlocks(catalogue, config).length > 0;
  const outcome = usePreviewOutcome(catalogue, config, generated ? state : "done");
  const tabs = (
    <SectionTabs
      catalogue={catalogue}
      config={config}
      part={part}
      value={section}
      onChange={setSection}
      tests={Boolean(tests)}
    />
  );

  if (section === "tests" && on && tests)
    return (
      <div className="flex flex-col gap-8">
        {tabs}
        {tests}
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <PartEditor
        catalogue={catalogue}
        config={config}
        part={part}
        onChange={onChange}
        openId={openId}
        onOpen={setOpenId}
        section={section}
        tabs={tabs}
      />

      <aside className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Preview</h2>
          {on && (
            <RunThrough
              catalogue={catalogue}
              config={config}
              stage={part}
              trigger={(open) => (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-xs" aria-label={`Open ${partNames[part]} in a larger preview`} onClick={open} />
                    }
                  >
                    <Maximize2Icon />
                  </TooltipTrigger>
                  <TooltipContent>Open {partNames[part]}</TooltipContent>
                </Tooltip>
              )}
            />
          )}
        </div>
        <div
          data-theme={catalogue.theme}
          // Shorter than 9:16 on short screens, so the switch below stays in view.
          className="relative mx-auto aspect-[9/16] max-h-[max(22rem,calc(100svh-27rem))] w-full max-w-88 overflow-hidden rounded-2xl bg-background font-sans text-foreground ring-1 ring-border"
        >
          {on ? (
            <ExperienceRunner
              key={part}
              catalogue={catalogue}
              config={config}
              stage={part}
              focus={openId}
              preview
              showAll
              outcome={part === "artifact" ? outcome : undefined}
              className="@container absolute inset-0 flex flex-col overflow-y-auto [scrollbar-width:none]"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
              {partNames[part]} is off.
            </p>
          )}
        </div>
        {generated && (
          <Tabs value={state} onValueChange={(value) => setState(value as PreviewState)} className="self-center">
            <TabsList aria-label="Generated sections">
              {previewStates.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="px-3">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </aside>
    </div>
  );
}

export function JsonSheet({ config }: { config: ExperienceConfig }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="secondary" size="icon-sm" aria-label="View JSON" onClick={() => setOpen(true)} />}
        >
          <BracesIcon />
        </TooltipTrigger>
        <TooltipContent>View JSON</TooltipContent>
      </Tooltip>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="gap-0 data-[side=right]:sm:max-w-xl">
          <div className="flex h-16 shrink-0 items-center border-b px-6 pr-16">
            <SheetTitle className="text-lg">Experience Config</SheetTitle>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto bg-secondary/60 p-6 font-mono text-xs leading-relaxed">
            {JSON.stringify(config, null, 2)}
          </pre>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The whole flow from the first part that's on, logging what it would save. */
export function RunThrough({
  catalogue,
  config,
  stage,
  trigger,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  /** Open on this part instead of the first one that's on. */
  stage?: PartId;
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const [run, setRun] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const restart = () => {
    setRun((n) => n + 1);
    setLog([]);
  };

  return (
    <PreviewSheet
      title={`${config.name} · ${stage ? partNames[stage] : "Run Through"}`}
      trigger={
        trigger ??
        ((open) => (
          <Tooltip>
            <TooltipTrigger render={<Button variant="secondary" size="icon-sm" aria-label="Preview" onClick={open} />}>
              <EyeIcon />
            </TooltipTrigger>
            <TooltipContent>Preview the whole flow</TooltipContent>
          </Tooltip>
        ))
      }
      onOpenChange={(open) => open && restart()}
      // Only once they've signed up: before that there's nothing to start over.
      actions={
        log.length > 0 && (
          <HoverCard>
            <HoverCardTrigger delay={300} render={<Button variant="ghost" size="sm" onClick={restart} />}>
              <RotateCcwIcon data-icon="inline-start" />
              Restart
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-64">
              <span className="font-medium">Start Over</span>
              <p className="text-muted-foreground">
                Goes back to the first page with empty answers, as a new person would see it. Nothing from this run was
                saved, so there's nothing to undo.
              </p>
            </HoverCardContent>
          </HoverCard>
        )
      }
      // What the run would have saved, once there's something to show.
      footer={
        log.length > 0 && (
          <ol className="flex w-full max-w-3xl flex-col gap-1 text-sm text-muted-foreground">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )
      }
    >
      {() => (
        <div data-theme={catalogue.theme} className="absolute inset-0 bg-background font-sans text-foreground">
          <ExperienceRunner
            key={run}
            catalogue={catalogue}
            config={config}
            stage={stage}
            preview
            className="@container flex h-full flex-col overflow-y-auto"
            onOptin={async (person) => {
              setLog((lines) => [...lines, `Signed up: ${person.name || "No name"} <${person.email}>`]);
              return { ok: true };
            }}
            onSubmit={async ({ answers }) => {
              const rows = profileRows(catalogue, config, answers).filter((row) => row.answer);
              setLog((lines) => [
                ...lines,
                `Saved to profile: ${rows.map((row) => `${row.id} = ${row.answer}`).join(" · ") || "no answers"}`,
              ]);
              return { ok: true };
            }}
          />
        </div>
      )}
    </PreviewSheet>
  );
}
