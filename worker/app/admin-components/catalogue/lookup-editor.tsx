/**
 * Taste's lookups, in Workflow Settings: one card per Qloo search, opened
 * in place to set what it finds, where, and how much each group of
 * favourites counts. Sections pick them under From.
 */
import { useState } from "react";
import {
  BookOpenIcon,
  FilmIcon,
  GlobeIcon,
  MapPinIcon,
  MicIcon,
  MoreHorizontalIcon,
  MusicIcon,
  PlusIcon,
  ShoppingBagIcon,
  TvIcon,
} from "lucide-react";

import { type ExperienceConfig, createLookup } from "@core/catalogue/config";
import { type Catalogue, type Icon, findDefinition, isInput } from "@core/catalogue/define";
import { getStep } from "@core/catalogue/workflow";
import { type LookupConfig, type LookupOption, type LookupProps, lookupFields } from "@core/outcome/lookups";
import type { EntityType } from "@core/outcome/state";
import { FieldControl } from "@/admin-components/catalogue/field-control";
import { ConfirmRemoveDialog } from "@/admin-components/confirm-delete";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { Button } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/admin-components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";

export const typeIcons: Record<EntityType, Icon> = {
  place: MapPinIcon,
  artist: MusicIcon,
  movie: FilmIcon,
  tv_show: TvIcon,
  book: BookOpenIcon,
  podcast: MicIcon,
  brand: ShoppingBagIcon,
  destination: GlobeIcon,
};

/** What sections can pick under From: the lookups, then code steps that provide candidates. */
export function lookupOptions(config: ExperienceConfig): LookupOption[] {
  return [
    ...config.workflow.lookups.map(({ id, props }) => ({
      id,
      name: props.name || "Untitled lookup",
      type: props.type,
    })),
    ...config.workflow.steps.flatMap((block) => {
      const step = getStep(block.type);
      return step?.provides ? [{ id: block.id, name: step.name, type: step.provides }] : [];
    }),
  ];
}

/** Takes a lookup out, and out of every section that picked it. */
function withoutLookup(config: ExperienceConfig, id: string): ExperienceConfig {
  const artifact = config.parts.artifact;
  return {
    ...config,
    workflow: { ...config.workflow, lookups: config.workflow.lookups.filter((lookup) => lookup.id !== id) },
    parts: {
      ...config.parts,
      artifact: {
        ...artifact,
        components: artifact.components.map((block) =>
          Array.isArray(block.props.lookups)
            ? { ...block, props: { ...block.props, lookups: block.props.lookups.filter((l) => l !== id) } }
            : block,
        ),
      },
    },
  };
}

/** The intake's answers, by key, for "Near: an answer". */
function answerOptions(catalogue: Catalogue, config: ExperienceConfig) {
  return config.parts.intake.components.flatMap((block) => {
    const definition = findDefinition(catalogue, "intake", block.type);
    return definition && isInput(definition)
      ? [{ value: block.id, label: definition.input.label(block.props) || block.id }]
      : [];
  });
}

function AnswerField({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field className="sm:max-w-sm">
      <FieldLabel htmlFor={id}>{lookupFields.answer.label}</FieldLabel>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions to take it from.</p>
      ) : (
        <Select
          items={Object.fromEntries(options.map((option) => [option.value, option.label]))}
          value={value || null}
          onValueChange={(next) => onChange(String(next ?? ""))}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Pick a question" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <FieldDescription>{lookupFields.answer.help}</FieldDescription>
    </Field>
  );
}

function LookupForm({
  lookup,
  answers,
  onChange,
}: {
  lookup: LookupConfig;
  answers: { value: string; label: string }[];
  onChange: (props: LookupProps) => void;
}) {
  const { props } = lookup;
  const place = props.type === "place";
  const control = (key: keyof LookupProps) => (
    <FieldControl
      id={`${lookup.id}-${key}`}
      field={lookupFields[key]}
      value={props[key]}
      onChange={(value) => onChange({ ...props, [key]: value })}
    />
  );

  return (
    <div className="flex flex-col gap-7">
      {control("name")}
      {control("type")}
      {place && (
        <>
          {control("near")}
          {props.near === "city" && (
            <FieldControl
              id={`${lookup.id}-place`}
              field={{ ...lookupFields.place, label: "City", placeholder: "Austin, TX", help: undefined }}
              value={props.place}
              onChange={(value) => onChange({ ...props, place: value as string })}
            />
          )}
          {props.near === "answer" && (
            <AnswerField
              id={`${lookup.id}-answer`}
              value={props.answer}
              options={answers}
              onChange={(answer) => onChange({ ...props, answer })}
            />
          )}
          {props.near === "place" && control("place")}
          {props.near !== "city" && control("radius")}
          {control("kinds")}
        </>
      )}
      {control("popularity")}
      {place && control("price")}
      {place && control("day")}
      {control("take")}
      <div className="flex flex-col gap-7 border-t pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ranked By</span>
          <p className="text-sm text-muted-foreground">How much each group of favourites counts in Qloo.</p>
        </div>
        {control("person")}
        {control("segment")}
        {control("steer")}
        {props.steer.trim() && control("steerWeight")}
      </div>
    </div>
  );
}

/** Taste's lookups, then a button to add one. */
export function Lookups({
  catalogue,
  config,
  onChange,
  openId,
  onOpen,
}: {
  catalogue: Catalogue;
  config: ExperienceConfig;
  onChange: (config: ExperienceConfig) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const { lookups } = config.workflow;
  const setLookups = (next: LookupConfig[]) => onChange({ ...config, workflow: { ...config.workflow, lookups: next } });
  const answers = answerOptions(catalogue, config);
  const [removing, setRemoving] = useState<LookupConfig | null>(null);
  const add = (props?: Partial<LookupProps>) => {
    const lookup = createLookup(config, props);
    setLookups([...lookups, lookup]);
    onOpen(lookup.id);
  };

  return (
    <div className="flex flex-col gap-3">
      {lookups.length > 0 && (
        <ol className="flex flex-col gap-3">
          {lookups.map((lookup, index) => {
            const open = openId === lookup.id;
            const TypeIcon = typeIcons[lookup.props.type];
            return (
              <ExpandableCard
                key={lookup.id}
                leading={
                  <CardIcon>
                    <TypeIcon />
                  </CardIcon>
                }
                title={lookup.props.name || "Untitled lookup"}
                open={open}
                onToggle={() => onOpen(open ? null : lookup.id)}
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => add({ ...lookup.props, name: `${lookup.props.name} copy` })}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setRemoving(lookup)}>Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              >
                <LookupForm
                  lookup={lookup}
                  answers={answers}
                  onChange={(props) => setLookups(lookups.map((l, i) => (i === index ? { ...l, props } : l)))}
                />
              </ExpandableCard>
            );
          })}
        </ol>
      )}
      <Button variant="ghost" size="sm" className="-ml-3 self-start" onClick={() => add()}>
        <PlusIcon data-icon="inline-start" />
        Add Lookup
      </Button>
      <ConfirmRemoveDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove Lookup?"
        description={`“${removing?.props.name || "Untitled lookup"}” comes out of every section that picks it under From.`}
        onConfirm={() => removing && onChange(withoutLookup(config, removing.id))}
      />
    </div>
  );
}
