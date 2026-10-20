import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BoxIcon, GripVerticalIcon, InfoIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";

import {
  type BlockConfig,
  type ExperienceConfig,
  type PartConfig,
  createBlock,
  createLookup,
  slugifyId,
} from "@core/catalogue/config";
import {
  type AnyDefinition,
  type Catalogue,
  editableFields,
  type PartId,
  findDefinition,
  isGenerated,
  isInput,
  partIds,
} from "@core/catalogue/define";
import { FieldsForm, LookupOptions } from "@/admin-components/catalogue/field-control";
import { lookupOptions } from "@/admin-components/catalogue/lookup-editor";
import {
  AddStepMenu,
  RunAfter,
  RunBefore,
  RunLabel,
  type SettingsTab,
  WorkflowSettings,
} from "@/admin-components/catalogue/workflow-editor";
import { ConfirmRemoveDialog } from "@/admin-components/confirm-delete";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/admin-components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/admin-components/ui/hover-card";
import { Input } from "@/admin-components/ui/input";
import { Switch } from "@/admin-components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { cn } from "@/lib/utils";

/** What each switch does, for the info card beside its label. */
const switches: Partial<
  Record<
    PartId,
    {
      label: string;
      title: string;
      on: string;
      off: string;
      offNote: string;
      locked?: string;
    }
  >
> = {
  start: {
    label: "Show a start page",
    title: "Start Page",
    on: "A public landing page with a sign-up. Signing up creates the person's profile and takes them to the questions.",
    off: "Turned off, people open the questions straight from a link you send.",
    offNote: "No start page. Turn it on under the preview to edit it.",
    locked: "Needs the questions turned on. Without them there's nothing to sign up for.",
  },
  intake: {
    label: "Ask questions",
    title: "Questions",
    on: "Shown one screen at a time. Each answer is saved to the person's profile under its key, and the outcome can use it with {{answers.key}}.",
    off: "Turned off, another system starts the experience by API, sending the person and their answers.",
    offNote: "No questions. Turn them on under the preview to edit them.",
  },
};

/** Turning the intake off takes the start page with it: there's nothing to sign up for. */
export function setPartEnabled(config: ExperienceConfig, part: PartId, enabled: boolean): ExperienceConfig {
  const parts = { ...config.parts, [part]: { ...config.parts[part], enabled } };
  if (part === "intake" && !enabled) parts.start = { ...parts.start, enabled: false };
  return { ...config, parts };
}

/** The answer's key on the profile. Committed on blur, once it's valid and unused. */
function KeyField({
  block,
  taken,
  onChange,
}: {
  block: BlockConfig;
  taken: Set<string>;
  onChange: (id: string) => void;
}) {
  const [draft, setDraft] = useState(block.id);
  const slug = slugifyId(draft);
  const error = !slug
    ? "Give it a key."
    : slug !== block.id && taken.has(slug)
      ? "Another component uses this key."
      : null;

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={`${block.id}-key`}>Saved as</FieldLabel>
      <Input
        id={`${block.id}-key`}
        value={draft}
        className="font-mono"
        aria-invalid={Boolean(error)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (error) return setDraft(block.id);
          setDraft(slug);
          if (slug !== block.id) onChange(slug);
        }}
      />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <FieldDescription>
          The answer's key on the profile. Use <code className="font-mono">{`{{answers.${slug}}}`}</code> in the
          outcome.
        </FieldDescription>
      )}
    </Field>
  );
}

function blockTitle(definition: AnyDefinition, block: BlockConfig) {
  return isInput(definition) ? definition.input.label(block.props) || definition.name : definition.name;
}

/** On or off for start and intake. Sits under the preview, out of the way. */
export function PartSwitch({
  part,
  config,
  onChange,
}: {
  part: PartId;
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
}) {
  const toggle = switches[part];
  if (!toggle) return null;
  const enabled = config.parts[part].enabled;
  const locked = part === "start" && !config.parts.intake.enabled;
  return (
    <Field orientation="horizontal" className="items-center rounded-xl p-4 ring-1 ring-border">
      <div className="flex flex-1 items-center gap-1.5">
        <FieldLabel htmlFor={`${part}-enabled`}>{toggle.label}</FieldLabel>
        <HoverCard>
          <HoverCardTrigger
            delay={150}
            render={
              <button
                type="button"
                aria-label={`About ${toggle.title.toLowerCase()}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <InfoIcon className="size-4" />
          </HoverCardTrigger>
          <HoverCardContent>
            <span className="font-medium">{toggle.title}</span>
            <p className="text-muted-foreground">{toggle.on}</p>
            <p className="text-muted-foreground">{toggle.off}</p>
            {locked && <p>{toggle.locked}</p>}
          </HoverCardContent>
        </HoverCard>
      </div>
      <Switch
        id={`${part}-enabled`}
        checked={enabled}
        disabled={locked}
        onCheckedChange={(next) => onChange(setPartEnabled(config, part, next))}
      />
    </Field>
  );
}

/**
 * One component in the list. The icon tile is the drag handle: it shows a
 * grip on hover, and space or enter picks it up from the keyboard.
 */
function ComponentCard({
  block,
  index,
  part,
  component,
  open,
  onToggle,
  onChange,
  onRename,
  onDuplicate,
  onRemove,
  taken,
}: {
  block: BlockConfig;
  index: number;
  part: PartId;
  component: AnyDefinition;
  open: boolean;
  onToggle: () => void;
  onChange: (block: BlockConfig) => void;
  onRename: (id: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  taken: Set<string>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const Icon = component.icon ?? BoxIcon;
  const title = blockTitle(component, block);
  const [removing, setRemoving] = useState(false);

  return (
    <ExpandableCard
      rootRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragging={isDragging}
      open={open}
      onToggle={onToggle}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={`Reorder ${title}`}
          className={cn(
            "group/handle shrink-0 touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
          {...attributes}
          {...listeners}
        >
          <CardIcon>
            <Icon className={cn("group-hover/card:hidden group-focus-visible/handle:hidden", isDragging && "hidden")} />
            <GripVerticalIcon
              className={cn("hidden group-hover/card:block group-focus-visible/handle:block", isDragging && "block")}
            />
          </CardIcon>
        </button>
      }
      title={
        <>
          {part === "intake" && <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>}
          {title}
        </>
      }
      // In the outcome's workflow, the title is enough.
      meta={
        part !== "artifact" && (
          <span className="flex flex-wrap items-center gap-2">
            {isInput(component) ? (
              <>
                {component.name}
                <Badge variant="outline" className="h-5 px-2 font-mono">
                  {block.id}
                </Badge>
              </>
            ) : isGenerated(component) ? (
              <>
                <Badge variant="secondary" className="h-5 px-2">
                  Generated
                </Badge>
                {component.description}
              </>
            ) : (
              component.description
            )}
          </span>
        )
      }
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRemoving(true)}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ConfirmRemoveDialog
            open={removing}
            onOpenChange={setRemoving}
            title={part === "artifact" ? "Remove Section?" : "Remove Component?"}
            description={`“${title}” and its settings go with it.`}
            onConfirm={onRemove}
          />
        </>
      }
    >
      <div className="flex flex-col gap-7">
        {isInput(component) && <KeyField key={block.id} block={block} taken={taken} onChange={onRename} />}
        <FieldsForm
          fields={editableFields(component)}
          values={block.props}
          onChange={(props) => onChange({ ...block, props })}
          idPrefix={block.id}
        />
      </div>
    </ExpandableCard>
  );
}

export type Section = "components" | "layout" | "tests";

/** Components (or Workflow), Settings and Tests, when there's more than one. */
export function SectionTabs({
  catalogue,
  config,
  part: partId,
  value,
  onChange,
  tests = false,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  part: PartId;
  value: Section;
  onChange: (section: Section) => void;
  tests?: boolean;
}) {
  const definition = catalogue.parts[partId];
  const part = config.parts[partId];
  const hasLayout = Boolean(definition.layout && Object.keys(definition.layout.fields).length > 0);
  if (!part.enabled || (!hasLayout && !tests)) return null;
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as Section)}>
      <TabsList>
        <TabsTrigger value="components" className="px-3">
          {partId === "artifact" ? "Workflow" : "Components"}
          <span className="text-muted-foreground tabular-nums">{part.components.length}</span>
        </TabsTrigger>
        {hasLayout && (
          <TabsTrigger value="layout" className="px-3">
            Settings
          </TabsTrigger>
        )}
        {tests && (
          <TabsTrigger value="tests" className="px-3">
            Tests
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}

export function PartEditor({
  catalogue,
  config,
  part: partId,
  onChange,
  openId,
  onOpen,
  section,
  tabs,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  part: PartId;
  onChange: (config: ExperienceConfig) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
  section: Section;
  /** The section tabs, above the editor. */
  tabs: React.ReactNode;
}) {
  const definition = catalogue.parts[partId];
  const part = config.parts[partId];
  // Workflow Settings' open tab, or null when it's closed.
  const [settings, setSettings] = useState<SettingsTab | null>(null);
  // The outcome's sections sit in the run that makes them, between Taste and Finish.
  const run = partId === "artifact";
  const runProps = { config, onChange, openId, onOpen };
  const taken = new Set(partIds.flatMap((id) => config.parts[id].components.map((block) => block.id)));
  const sensors = useSensors(
    // A few pixels of movement first, so a click on the icon still focuses it.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const setPart = (next: Partial<PartConfig>) =>
    onChange({
      ...config,
      parts: { ...config.parts, [partId]: { ...part, ...next } },
    });
  const setBlocks = (components: BlockConfig[]) => setPart({ components });
  const setBlock = (index: number, block: BlockConfig) =>
    setBlocks(part.components.map((b, i) => (i === index ? block : b)));
  const add = (component: AnyDefinition, at = part.components.length) => {
    const block = createBlock(component, config);
    let next = config;
    // A section that picks starts from the first lookup, or one made for it.
    if (isGenerated(component) && component.generate.picks) {
      const first = config.workflow.lookups[0] ?? createLookup(config, component.generate.lookup?.(block.props));
      if (!config.workflow.lookups.length) next = { ...config, workflow: { ...config.workflow, lookups: [first] } };
      block.props.lookups = [first.id];
    }
    const components = [...part.components.slice(0, at), block, ...part.components.slice(at)];
    onChange({ ...next, parts: { ...next.parts, [partId]: { ...part, components } } });
    onOpen(block.id);
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = part.components.findIndex((block) => block.id === active.id);
    const to = part.components.findIndex((block) => block.id === over.id);
    setBlocks(arrayMove(part.components, from, to));
  }

  return (
    <LookupOptions value={run ? lookupOptions(config) : []}>
      <div className="flex flex-col gap-8">
        {!part.enabled && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {switches[partId]?.offNote}
          </p>
        )}
        {part.enabled && (
          <>
            {tabs}

            {section === "layout" && definition.layout ? (
              <FieldsForm
                fields={definition.layout.fields}
                values={part.settings}
                onChange={(settings) => setPart({ settings })}
                idPrefix={`${partId}-layout`}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {run && (
                  <>
                    <WorkflowSettings
                      catalogue={catalogue}
                      config={config}
                      onChange={onChange}
                      tab={settings}
                      onTab={setSettings}
                    />
                    <RunBefore {...runProps} onLookups={() => setSettings("lookups")} />
                    <RunLabel>Sections</RunLabel>
                  </>
                )}
                {run && part.components.length === 0 && (
                  <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No sections yet.</p>
                )}
                {part.components.length > 0 && (
                  <DndContext
                    // A fixed id keeps its aria ids the same on the server and in the browser.
                    id={`components-${partId}`}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    // Closed cards are short, so the list is easier to drag through.
                    onDragStart={() => onOpen(null)}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={part.components.map((block) => block.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="flex flex-col gap-3">
                        {part.components.map((block, index) => {
                          const component = findDefinition(catalogue, partId, block.type);
                          if (!component) return null;
                          const open = openId === block.id;
                          return (
                            <ComponentCard
                              key={block.id}
                              block={block}
                              index={index}
                              part={partId}
                              component={component}
                              open={open}
                              onToggle={() => onOpen(open ? null : block.id)}
                              onChange={(next) => setBlock(index, next)}
                              onRename={(id) => {
                                setBlock(index, { ...block, id });
                                onOpen(id);
                              }}
                              onDuplicate={() => {
                                const copy = {
                                  ...createBlock(component, config),
                                  props: structuredClone(block.props),
                                };
                                setBlocks([
                                  ...part.components.slice(0, index + 1),
                                  copy,
                                  ...part.components.slice(index + 1),
                                ]);
                                onOpen(copy.id);
                              }}
                              onRemove={() => setBlocks(part.components.filter((_, i) => i !== index))}
                              taken={taken}
                            />
                          );
                        })}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}

                {run && <RunAfter {...runProps} />}

                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
                      <PlusIcon data-icon="inline-start" />
                      {run ? "Add Section" : "Add Component"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {definition.components
                        .filter((component) => !isGenerated(component))
                        .map((component) => (
                          <DropdownMenuItem key={component.type} onClick={() => add(component)}>
                            {component.name}
                          </DropdownMenuItem>
                        ))}
                      {definition.components.some(isGenerated) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Generated for each person</DropdownMenuLabel>
                            {definition.components.filter(isGenerated).map((component) => (
                              <DropdownMenuItem key={component.type} onClick={() => add(component)}>
                                {component.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {run && <AddStepMenu config={config} onChange={onChange} onOpen={onOpen} />}
                </div>
                {run && (
                  <p className="text-sm text-muted-foreground">
                    Code steps live in <code className="font-mono">steps/</code> in your repo. Add a file there to call
                    your own API.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </LookupOptions>
  );
}
