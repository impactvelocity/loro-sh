/**
 * The workflow pieces of the Outcome tab: how an experience's outcome is
 * made. Workflow Settings is a drawer with a tab each for Taste's lookups,
 * the prompt every model call reads and the skills every section follows; the run wraps the
 * outcome's sections, step by step: code steps at their points, the fixed
 * Taste before the sections and Finish after.
 *
 * Saved with the rest of the config.
 */
import { useState } from "react";
import {
  BoxIcon,
  CheckCheckIcon,
  ChevronRightIcon,
  FingerprintIcon,
  LockIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Settings2Icon,
} from "lucide-react";

import { type BlockConfig, type ExperienceConfig, createBlock } from "@core/catalogue/config";
import type { Catalogue, Icon } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { type StepPoint, getStep, listSteps, stepPoints } from "@core/catalogue/workflow";
import { FieldControl, FieldsForm } from "@/admin-components/catalogue/field-control";
import { Lookups } from "@/admin-components/catalogue/lookup-editor";
import { ConfirmRemoveDialog } from "@/admin-components/confirm-delete";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";

type Workflow = ExperienceConfig["workflow"];
export type SettingsTab = "lookups" | "prompt" | "skills";

const promptField = f.longText({
  label: "Prompt",
  placeholder:
    "A weekend plan for people going to Khruangbin at Moody Center, Austin, on Saturday 14 November. Doors at 7.",
  help: "What the experience is, where and when, and anything every outcome should know. Taste and every section read it.",
});

const skillsField = f.skills({
  label: "Skills",
  help: "Followed by every generated section. Each section can add its own.",
});

function setWorkflow(config: ExperienceConfig, next: Partial<Workflow>): ExperienceConfig {
  return { ...config, workflow: { ...config.workflow, ...next } };
}

/** A heading between groups in the run. */
export function RunLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-3 text-xs font-medium text-muted-foreground uppercase">{children}</h3>;
}

/** One fixed row in the run. Locked unless it has its own actions. */
function FixedRow({ icon: RowIcon, title, actions }: { icon: Icon; title: string; actions?: React.ReactNode }) {
  return (
    <ExpandableCard
      leading={
        <CardIcon>
          <RowIcon />
        </CardIcon>
      }
      title={title}
      open={false}
      onToggle={() => {}}
      actions={actions ?? <LockIcon aria-label="Always runs" className="size-4 text-muted-foreground" />}
    />
  );
}

/**
 * Workflow Settings at a glance, opening a drawer: Taste's lookups, the
 * prompt and the skills every section follows. `tab` is the open tab, or
 * null when it's closed, so the run can open it too.
 */
export function WorkflowSettings({
  catalogue,
  config,
  onChange,
  tab,
  onTab,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
  tab: SettingsTab | null;
  onTab: (tab: SettingsTab | null) => void;
}) {
  const [openLookup, setOpenLookup] = useState<string | null>(null);
  const { prompt, skills, lookups } = config.workflow;

  return (
    <>
      <button
        type="button"
        onClick={() => onTab("lookups")}
        className="flex items-center gap-4 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardIcon>
          <Settings2Icon />
        </CardIcon>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium">Workflow Settings</span>
          <span className="line-clamp-1 text-sm text-muted-foreground">{prompt.trim() || "No prompt yet."}</span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-5 px-2">
              {lookups.length} {lookups.length === 1 ? "lookup" : "lookups"}
            </Badge>
            {skills.length > 0 && (
              <Badge variant="outline" className="h-5 px-2">
                {skills.length} {skills.length === 1 ? "skill" : "skills"}
              </Badge>
            )}
          </span>
        </span>
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Sheet open={tab !== null} onOpenChange={(open) => !open && onTab(null)}>
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          <Tabs
            value={tab ?? "lookups"}
            onValueChange={(next) => onTab(next as SettingsTab)}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="flex shrink-0 flex-col gap-3 border-b px-6 pt-5">
              <SheetTitle className="pr-10 text-lg">Workflow Settings</SheetTitle>
              <TabsList variant="line">
                <TabsTrigger value="lookups">
                  Lookups
                  <span className="text-muted-foreground tabular-nums">{lookups.length}</span>
                </TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="skills">
                  Skills
                  {skills.length > 0 && <span className="text-muted-foreground tabular-nums">{skills.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {tab === "lookups" ? (
                <div className="flex flex-col gap-6">
                  <p className="text-sm text-muted-foreground">
                    The Qloo searches Taste runs for each person, ranked by their favourites. Sections pick them under
                    From.
                  </p>
                  <Lookups
                    catalogue={catalogue}
                    config={config}
                    onChange={onChange}
                    openId={openLookup}
                    onOpen={setOpenLookup}
                  />
                </div>
              ) : tab === "prompt" ? (
                <FieldControl
                  id="workflow-prompt"
                  field={promptField}
                  value={prompt}
                  onChange={(next) => onChange(setWorkflow(config, { prompt: next as string }))}
                />
              ) : (
                <FieldControl
                  id="workflow-skills"
                  field={skillsField}
                  value={skills}
                  onChange={(next) => onChange(setWorkflow(config, { skills: next as string[] }))}
                />
              )}
            </div>
          </Tabs>
          <div className="flex shrink-0 justify-end border-t px-6 py-4">
            <Button size="sm" onClick={() => onTab(null)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The code steps at one point, under its label. Nothing when there are none. */
function CodeSteps({
  at,
  config,
  onChange,
  openId,
  onOpen,
}: {
  at: StepPoint;
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const { steps } = config.workflow;
  const setSteps = (next: BlockConfig[]) => onChange(setWorkflow(config, { steps: next }));
  const [removing, setRemoving] = useState<BlockConfig | null>(null);
  if (!steps.some((block) => getStep(block.type)?.at === at)) return null;

  return (
    <>
      <RunLabel>{stepPoints[at].label}</RunLabel>
      <ol className="flex flex-col gap-3">
        {steps.map((block, index) => {
          const definition = getStep(block.type);
          if (!definition || definition.at !== at) return null;
          const open = openId === block.id;
          const StepIcon = definition.icon ?? BoxIcon;
          return (
            <ExpandableCard
              key={block.id}
              leading={
                <CardIcon>
                  <StepIcon />
                </CardIcon>
              }
              title={definition.name}
              open={open}
              onToggle={() => onOpen(open ? null : block.id)}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setRemoving(block)}>Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            >
              {Object.keys(definition.fields).length > 0 ? (
                <FieldsForm
                  fields={definition.fields}
                  values={block.props}
                  onChange={(props) => setSteps(steps.map((b, i) => (i === index ? { ...b, props } : b)))}
                  idPrefix={block.id}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to set.</p>
              )}
            </ExpandableCard>
          );
        })}
      </ol>
      <ConfirmRemoveDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove Step?"
        description={`“${(removing && getStep(removing.type)?.name) ?? "This step"}” and its settings go with it.`}
        onConfirm={() => removing && setSteps(steps.filter((b) => b.id !== removing.id))}
      />
    </>
  );
}

type RunProps = {
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
};

/** Everything that runs before the sections: code steps, then Taste, whose lookups open in Workflow Settings. */
export function RunBefore({ onLookups, ...props }: RunProps & { onLookups: () => void }) {
  const count = props.config.workflow.lookups.length;
  return (
    <>
      <CodeSteps at="before" {...props} />
      {props.config.workflow.steps.some((block) => getStep(block.type)?.at === "before") && <RunLabel>Taste</RunLabel>}
      <ol className="flex flex-col gap-3">
        <FixedRow
          icon={FingerprintIcon}
          title="Taste"
          actions={
            <Button variant="ghost" size="sm" onClick={onLookups}>
              {count} {count === 1 ? "Lookup" : "Lookups"}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          }
        />
      </ol>
      <CodeSteps at="after-taste" {...props} />
    </>
  );
}

/** Everything after the sections: Finish, then code steps in the background. */
export function RunAfter(props: RunProps) {
  return (
    <>
      <ol className="flex flex-col gap-3">
        <FixedRow icon={CheckCheckIcon} title="Finish" />
      </ol>
      <CodeSteps at="finish" {...props} />
    </>
  );
}

/** Adds a code step from steps/ at its definition's point. */
export function AddStepMenu({
  config,
  onChange,
  onOpen,
}: {
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
  onOpen: (id: string) => void;
}) {
  const available = listSteps();
  if (available.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        Add Step
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        {available.map((definition) => (
          <DropdownMenuItem
            key={definition.type}
            className="flex-col items-start gap-0.5"
            onClick={() => {
              const block = createBlock(definition, config);
              onChange(setWorkflow(config, { steps: [...config.workflow.steps, block] }));
              onOpen(block.id);
            }}
          >
            <span>{definition.name}</span>
            <span className="text-xs text-muted-foreground">{stepPoints[definition.at].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
