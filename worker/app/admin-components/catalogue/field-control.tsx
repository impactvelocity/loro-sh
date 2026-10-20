/**
 * The editor for a catalogue component, built from its fields: one
 * control per field kind. Add a kind in core/catalogue/fields.ts and give
 * it a case here.
 */
import { createContext, use, useRef, useState } from "react";
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
import { ChevronDownIcon, GripVerticalIcon, MoreHorizontalIcon, PlusIcon, XIcon } from "lucide-react";

import { type Field, type Fields, type ListField, type Media, defaultsOf } from "@core/catalogue/fields";
import type { LookupOption } from "@core/outcome/lookups";
import { Button } from "@/admin-components/ui/button";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/admin-components/ui/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import {
  Field as FieldRow,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/admin-components/ui/field";
import { EditorLibrary, ImagePicker, MediaPicker } from "@/admin-components/catalogue/media-picker";
import { ConfirmRemoveDialog } from "@/admin-components/confirm-delete";
import { ToggleChip } from "@/admin-components/form-section";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Switch } from "@/admin-components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;

/** Every field of a component or layout, in order. */
export function FieldsForm({
  fields,
  values,
  onChange,
  idPrefix,
}: {
  fields: Fields;
  values: Values;
  onChange: (values: Values) => void;
  idPrefix: string;
}) {
  return (
    <FieldGroup>
      {Object.entries(fields).map(([key, field]) => (
        <FieldControl
          key={key}
          id={`${idPrefix}-${key}`}
          field={field}
          value={values[key] ?? field.default}
          onChange={(value) => onChange({ ...values, [key]: value })}
        />
      ))}
    </FieldGroup>
  );
}

function Labelled({
  id,
  field,
  className,
  children,
}: {
  id?: string;
  field: Field;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <FieldRow className={className}>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      {children}
      {field.help && <FieldDescription>{field.help}</FieldDescription>}
    </FieldRow>
  );
}

function Segmented({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(String(next))}>
      <TabsList aria-label={label}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="px-3">
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** "#abc", "abc123" or "#ABC123" as "#aabbcc", or null while it's still being typed. */
function toHex(input: string) {
  let hex = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) hex = hex.replace(/./g, "$&$&");
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

/**
 * A hex field with its swatch inside. The swatch opens the picker; typing
 * saves once the hex is whole, and a half-typed one goes back on blur.
 */
function ColorControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <ColorPicker value={toHex(value) ?? "#000000"} onValueChange={onChange} defaultFormat="hex" className="relative">
      <ColorPickerTrigger
        nativeButton
        aria-label={`Pick ${label.toLowerCase()}`}
        render={
          <button
            type="button"
            className="absolute top-1/2 left-2.5 -translate-y-1/2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <ColorPickerSwatch className="size-7 rounded-md border-0 shadow-none ring-1 ring-foreground/10 ring-inset" />
      </ColorPickerTrigger>
      <ColorPickerContent align="start" sideOffset={8} className="w-72 gap-3">
        <ColorPickerArea className="h-40 rounded-lg" />
        <div className="flex items-center gap-2">
          <ColorPickerHueSlider className="flex-1" />
          <ColorPickerEyeDropper size="icon-sm" variant="ghost" />
        </div>
      </ColorPickerContent>
      <Input
        id={id}
        value={draft ?? value}
        spellCheck={false}
        className="pl-12 font-mono uppercase"
        onChange={(e) => {
          setDraft(e.target.value);
          const hex = toHex(e.target.value);
          if (hex) onChange(hex);
        }}
        onBlur={() => setDraft(null)}
      />
    </ColorPicker>
  );
}

/** An item's heading: its first filled-in text or link label, else "Point 2". */
function itemTitle(field: ListField, item: Values, index: number) {
  for (const [key, sub] of Object.entries(field.fields)) {
    const value = item[key];
    const text =
      sub.kind === "text" || sub.kind === "longText"
        ? String(value ?? "")
        : sub.kind === "link"
          ? (value as { label?: string } | undefined)?.label ?? ""
          : "";
    if (text.trim()) return { text: text.trim(), filled: true };
  }
  return { text: `${field.itemLabel} ${index + 1}`, filled: false };
}

/** The grip that drags a list item. Space or enter picks it up from the keyboard. */
function DragHandle({ label, handle }: { label: string; handle: ReturnType<typeof useSortable> }) {
  return (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      aria-label={`Reorder ${label}`}
      className={cn(
        "flex size-7 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        handle.isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      {...handle.attributes}
      {...handle.listeners}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
}

function ListItem({
  sortId,
  label,
  className,
  children,
}: {
  sortId: string;
  label: string;
  className?: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const sortable = useSortable({ id: sortId });
  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn("relative bg-background", sortable.isDragging && "z-10 shadow-[0_8px_30px_rgb(0_0_0/0.12)]", className)}
    >
      {children(<DragHandle label={label} handle={sortable} />)}
    </li>
  );
}

function ListControl({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: ListField;
  value: Values[];
  onChange: (value: Values[]) => void;
}) {
  const entries = Object.entries(field.fields);
  // One text field per item (options, tags): a row each instead of a card.
  const inline = entries.length === 1 && entries[0][1].kind === "text";
  const full = field.max !== undefined && value.length >= field.max;

  // Items have no ids of their own, so each gets a key for dragging and for
  // remembering which card is open. Changes from outside (Discard) start them over.
  const counter = useRef(value.length);
  const nextKey = () => `${id}-${counter.current++}`;
  const [keys, setKeys] = useState(() => value.map((_, i) => `${id}-${i}`));
  let current = keys;
  if (keys.length !== value.length) {
    current = value.map(nextKey);
    setKeys(current);
  }
  // Cards open one at a time, so the list stays short enough to scan.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const set = (index: number, item: Values) => onChange(value.map((v, i) => (i === index ? item : v)));
  const move = (from: number, to: number) => {
    setKeys(arrayMove(current, from, to));
    onChange(arrayMove(value, from, to));
  };
  const remove = (index: number) => {
    setKeys(current.filter((_, i) => i !== index));
    onChange(value.filter((_, i) => i !== index));
  };
  const add = () => {
    const key = nextKey();
    setKeys([...current, key]);
    onChange([...value, defaultsOf(field.fields)]);
    if (!inline) setOpenKey(key);
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    move(current.indexOf(String(active.id)), current.indexOf(String(over.id)));
  }

  return (
    <FieldRow>
      <FieldLabel>{field.label}</FieldLabel>
      {field.help && <FieldDescription>{field.help}</FieldDescription>}
      {value.length > 0 && (
        <DndContext
          // A fixed id keeps its aria ids the same on the server and in the browser.
          id={`list-${id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={current} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {value.map((item, index) => {
                const key = current[index];
                const label = `${field.itemLabel.toLowerCase()} ${index + 1}`;
                if (inline) {
                  const [fieldKey] = entries[0];
                  return (
                    <ListItem key={key} sortId={key} label={label} className="flex items-center gap-1 rounded-lg">
                      {(handle) => (
                        <>
                          {handle}
                          <Input
                            aria-label={`${field.itemLabel} ${index + 1}`}
                            value={String(item[fieldKey] ?? "")}
                            onChange={(e) => set(index, { ...item, [fieldKey]: e.target.value })}
                          />
                          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label}`} onClick={() => remove(index)}>
                            <XIcon />
                          </Button>
                        </>
                      )}
                    </ListItem>
                  );
                }
                const open = openKey === key;
                const title = itemTitle(field, item, index);
                return (
                  <ListItem
                    key={key}
                    sortId={key}
                    label={label}
                    className={cn("rounded-lg ring-1 ring-border", open && "ring-foreground/40")}
                  >
                    {(handle) => (
                      <>
                        <div className="flex items-center gap-1 py-1 pr-1 pl-1">
                          {handle}
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`${key}-fields`}
                            onClick={() => setOpenKey(open ? null : key)}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className={cn("min-w-0 flex-1 truncate font-medium", !title.filled && "text-muted-foreground")}>
                              {title.text}
                            </span>
                            <ChevronDownIcon
                              aria-hidden
                              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                            />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${label}`} />}>
                              <MoreHorizontalIcon />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem disabled={index === 0} onClick={() => move(index, index - 1)}>
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setRemoving(index)}>Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {open && (
                          <div id={`${key}-fields`} className="border-t p-4">
                            <FieldsForm fields={field.fields} values={item} onChange={(next) => set(index, next)} idPrefix={`${id}-${index}`} />
                          </div>
                        )}
                      </>
                    )}
                  </ListItem>
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      <Button variant="ghost" size="sm" className="-ml-3 w-auto! self-start" disabled={full} onClick={add}>
        <PlusIcon data-icon="inline-start" />
        Add {field.itemLabel}
      </Button>
      <ConfirmRemoveDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${field.itemLabel}?`}
        description={
          removing !== null && value[removing]
            ? `“${itemTitle(field, value[removing], removing).text}” and everything in it go.`
            : "Everything in it goes."
        }
        onConfirm={() => removing !== null && remove(removing)}
      />
    </FieldRow>
  );
}

export function FieldControl({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
      return (
        <Labelled id={id} field={field}>
          <Input id={id} value={String(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Labelled>
      );
    case "longText":
      return (
        <Labelled id={id} field={field}>
          <Textarea id={id} value={String(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Labelled>
      );
    case "number":
      return (
        <Labelled id={id} field={field} className="sm:max-w-40">
          <Input
            id={id}
            type="number"
            value={Number(value)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isNaN(n)) return;
              onChange(Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, n)));
            }}
          />
        </Labelled>
      );
    case "toggle":
      return (
        <FieldRow orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
            {field.help && <FieldDescription>{field.help}</FieldDescription>}
          </FieldContent>
          <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
        </FieldRow>
      );
    case "segmented":
      return (
        <Labelled field={field}>
          <Segmented label={field.label} value={String(value)} options={field.options} onChange={onChange} />
        </Labelled>
      );
    case "select":
      return (
        <Labelled field={field} className="sm:max-w-xs">
          <Select
            items={Object.fromEntries(field.options.map((option) => [option.value, option.label]))}
            value={String(value)}
            onValueChange={(next) => onChange(next)}
          >
            <SelectTrigger className="w-full" aria-label={field.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labelled>
      );
    case "color":
      return (
        <Labelled id={id} field={field} className="sm:max-w-xs">
          <ColorControl id={id} label={field.label} value={String(value)} onChange={onChange} />
        </Labelled>
      );
    case "image":
      return (
        <Labelled id={id} field={field}>
          <ImagePicker id={id} value={String(value)} onChange={onChange} />
        </Labelled>
      );
    case "media":
      return (
        <Labelled id={id} field={field}>
          <MediaPicker id={id} value={value as Media} onChange={onChange} />
        </Labelled>
      );
    case "link": {
      const link = value as { label: string; href: string };
      return (
        <Labelled id={id} field={field}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input id={id} aria-label={`${field.label} text`} placeholder="Text" value={link.label} onChange={(e) => onChange({ ...link, label: e.target.value })} />
            <Input aria-label={`${field.label} URL`} placeholder="https:// or #section" value={link.href} onChange={(e) => onChange({ ...link, href: e.target.value })} />
          </div>
        </Labelled>
      );
    }
    case "list":
      return <ListControl id={id} field={field} value={value as Values[]} onChange={onChange} />;
    case "multi":
      return (
        <Labelled field={field}>
          <Chips options={field.options} value={value as string[]} onChange={onChange} />
        </Labelled>
      );
    case "skills":
      return (
        <Labelled field={field}>
          <SkillsControl value={value as string[]} onChange={onChange} />
        </Labelled>
      );
    case "lookups":
      return (
        <Labelled field={field}>
          <LookupsControl value={value as string[]} onChange={onChange} />
        </Labelled>
      );
  }
}

/** Options as chips; any number can be pressed. */
function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <ToggleChip
          key={option.value}
          pressed={value.includes(option.value)}
          onPressedChange={(pressed) =>
            onChange(pressed ? [...value, option.value] : value.filter((v) => v !== option.value))
          }
        >
          {option.label}
        </ToggleChip>
      ))}
    </div>
  );
}

/** What a generated section can recommend from: the workflow's lookups. Provided by the outcome editor. */
export const LookupOptions = createContext<LookupOption[]>([]);

function LookupsControl({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const options = use(LookupOptions);
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No lookups yet. Add one under Taste.</p>;
  }
  return <Chips options={options.map(({ id, name }) => ({ value: id, label: name }))} value={value} onChange={onChange} />;
}

/** Context's skills as chips; pressed ones are followed. */
function SkillsControl({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const { skills = [] } = use(EditorLibrary);
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">No skills yet. Add them in Context.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <ToggleChip
          key={skill.id}
          pressed={value.includes(skill.id)}
          onPressedChange={(pressed) => onChange(pressed ? [...value, skill.id] : value.filter((id) => id !== skill.id))}
        >
          {skill.title}
        </ToggleChip>
      ))}
    </div>
  );
}
