import { useState } from "react";
import { useOutletContext } from "react-router";
import {
  AlignLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CircleDotIcon,
  HeartIcon,
  ListChecksIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RectangleVerticalIcon,
  SparklesIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";

import type { ExperienceContext } from "../experience";
import { type Question, type QuestionKind, funnelTypes, isInternal, questionKinds } from "@core/funnels";
import { type SignalType, signalTypes } from "@core/profiles";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { InternalNotice } from "@/admin-components/internal-notice";
import { FormSection } from "@/admin-components/form-section";
import { PreviewSheet } from "@/admin-components/preview-sheet";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Switch } from "@/admin-components/ui/switch";
import { cn } from "@/lib/utils";

const kindIcons: Record<QuestionKind, typeof TypeIcon> = {
  short_text: TypeIcon,
  long_text: AlignLeftIcon,
  single: CircleDotIcon,
  multi: ListChecksIcon,
  taste: HeartIcon,
  date: CalendarIcon,
};

const signalItems = { none: "Don't send", ...signalTypes };

const modes = {
  form: {
    icon: RectangleVerticalIcon,
    title: "Form",
    description: "One question per screen. Quick, and the same for everyone.",
  },
  chat: {
    icon: MessageCircleIcon,
    title: "Chat",
    description: "The agent asks these in conversation and follows up when an answer is vague.",
  },
} as const;
type Mode = keyof typeof modes;

/** Stands in for the agent's suggestion until it's connected. */
const suggestion: Omit<Question, "id"> = {
  kind: "single",
  prompt: "When do you get into town?",
  help: "So we only plan the time you're here.",
  options: ["Friday night", "Saturday morning", "Saturday afternoon"],
  required: true,
  signal: null,
};

function blank(kind: QuestionKind): Question {
  return {
    id: crypto.randomUUID(),
    kind,
    prompt: "",
    help: "",
    options: kind === "single" || kind === "multi" ? ["Option 1", "Option 2"] : [],
    required: false,
    signal: kind === "taste" ? "artist" : null,
  };
}

function hasOptions(kind: QuestionKind) {
  return kind === "single" || kind === "multi";
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  return (
    <Field>
      <FieldLabel>Options</FieldLabel>
      <ul className="flex flex-col gap-2">
        {options.map((option, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              value={option}
              aria-label={`Option ${i + 1}`}
              onChange={(e) => onChange(options.map((o, j) => (j === i ? e.target.value : o)))}
              className="h-10"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${option || `option ${i + 1}`}`}
              disabled={options.length <= 2}
              onClick={() => onChange(options.filter((_, j) => j !== i))}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 self-start"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
      >
        <PlusIcon data-icon="inline-start" />
        Add Option
      </Button>
    </Field>
  );
}

function QuestionCard({
  question,
  index,
  total,
  open,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  question: Question;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onChange: (question: Question) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const Icon = kindIcons[question.kind];
  const set = <K extends keyof Question>(key: K, value: Question[K]) =>
    onChange({ ...question, [key]: value });

  return (
    <ExpandableCard
      open={open}
      onToggle={onToggle}
      leading={
        <CardIcon>
          <Icon />
        </CardIcon>
      }
      title={
        <>
          <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
          {question.prompt || <span className="text-disabled-foreground">Untitled question</span>}
        </>
      }
      meta={
        <span className="flex flex-wrap items-center gap-2 text-xs">
          {questionKinds[question.kind]}
          {question.required && <span>· Required</span>}
          {question.signal && (
            <Badge variant="outline" className="h-5 px-2">
              <SparklesIcon data-icon="inline-start" />
              Qloo {signalTypes[question.signal].toLowerCase()}
            </Badge>
          )}
        </span>
      }
      actions={
        <>
          <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUpIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDownIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${question.id}-prompt`}>Question</FieldLabel>
          <Input
            id={`${question.id}-prompt`}
            value={question.prompt}
            placeholder="What would you like to ask?"
            onChange={(e) => set("prompt", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${question.id}-help`}>Hint</FieldLabel>
          <Input
            id={`${question.id}-help`}
            value={question.help}
            placeholder="Optional. Shown under the question."
            onChange={(e) => set("help", e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Answer type</FieldLabel>
            <Select
              items={questionKinds}
              value={question.kind}
              onValueChange={(value) => {
                const kind = value as QuestionKind;
                onChange({
                  ...question,
                  kind,
                  options: hasOptions(kind) && question.options.length < 2 ? ["Option 1", "Option 2"] : question.options,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(questionKinds) as QuestionKind[]).map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {questionKinds[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Send to Qloo as</FieldLabel>
            <Select
              items={signalItems}
              value={question.signal ?? "none"}
              onValueChange={(value) => set("signal", value === "none" ? null : (value as SignalType))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(signalItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {hasOptions(question.kind) && (
          <OptionsEditor options={question.options} onChange={(options) => set("options", options)} />
        )}
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={`${question.id}-required`}>Required</FieldLabel>
            <FieldDescription>People can't continue without answering.</FieldDescription>
          </FieldContent>
          <Switch
            id={`${question.id}-required`}
            checked={question.required}
            onCheckedChange={(checked) => set("required", checked)}
          />
        </Field>
      </FieldGroup>
    </ExpandableCard>
  );
}

/** How the open question looks to a guest, roughly. */
function QuestionPreview({
  question,
  index,
  total,
  mode,
  fill,
  onNext,
}: {
  question?: Question;
  index: number;
  total: number;
  mode: Mode;
  /** Fill a device frame instead of drawing its own card. */
  fill?: boolean;
  onNext?: () => void;
}) {
  const frame = fill ? "h-full overflow-y-auto p-6 @2xl:px-12 @2xl:py-16" : "aspect-[9/14] rounded-2xl bg-secondary/60 p-5";
  const surface = fill ? "bg-secondary" : "bg-background";

  if (!question) {
    return (
      <div className={cn("flex items-center justify-center text-center text-sm text-muted-foreground", frame)}>
        Open a question to preview it.
      </div>
    );
  }

  const answer = (() => {
    switch (question.kind) {
      case "single":
      case "multi":
        return (
          <div className="flex flex-col gap-2">
            {question.options.map((option, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg border px-3.5 text-sm",
                  surface,
                  i === 0 && "border-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-4 shrink-0 border",
                    question.kind === "single" ? "rounded-full" : "rounded-sm",
                    i === 0 && "border-4 border-foreground",
                  )}
                />
                {option}
              </span>
            ))}
          </div>
        );
      case "taste":
        return (
          <div className="flex flex-col gap-2">
            <span className={cn("flex h-11 items-center rounded-lg px-3.5 text-sm text-muted-foreground", surface)}>
              Search artists, places, films
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["Hermanos Gutiérrez", "Waterloo Records"].map((name) => (
                <Badge key={name} variant="default">{name}</Badge>
              ))}
            </div>
          </div>
        );
      case "long_text":
        return <span className={cn("block h-24 rounded-lg", surface)} />;
      default:
        return <span className={cn("block h-11 rounded-lg", surface)} />;
    }
  })();

  if (mode === "chat") {
    return (
      <div className={cn("flex flex-col justify-end gap-3", frame)}>
        <div className={cn("mx-auto flex w-full max-w-xl flex-col gap-3", fill && "flex-1 justify-end")}>
          <div className={cn("max-w-[85%] self-start rounded-2xl rounded-bl-sm px-4 py-3 text-sm", surface)}>
            {question.prompt || "Untitled question"}
            {question.help && <span className="mt-1 block text-muted-foreground">{question.help}</span>}
          </div>
          {hasOptions(question.kind) && (
            <div className="flex flex-wrap gap-1.5">
              {question.options.map((option, i) => (
                <span key={i} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", surface)}>
                  {option}
                </span>
              ))}
            </div>
          )}
          <span className={cn("flex h-11 items-center rounded-full px-4 text-sm text-muted-foreground", surface)}>
            Reply
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", frame)}>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5">
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-foreground" : "bg-border-strong")} />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-heading text-lg leading-snug font-medium text-balance @2xl:text-3xl">
            {question.prompt || "Untitled question"}
          </span>
          {question.help && <span className="text-sm text-muted-foreground">{question.help}</span>}
        </div>
        {answer}
        <button
          type="button"
          tabIndex={onNext ? undefined : -1}
          onClick={onNext}
          className="mt-auto flex h-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground @2xl:mt-4"
        >
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default function ExperienceIntake() {
  const { funnel } = useOutletContext<ExperienceContext>();
  const [mode, setMode] = useState<Mode>(funnel.intakeMode);
  const [questions, setQuestions] = useState<Question[]>(funnel.intake);
  const [openId, setOpenId] = useState<string | null>(funnel.intake[0]?.id ?? null);
  const [suggesting, setSuggesting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const openIndex = questions.findIndex((q) => q.id === openId);

  function update(id: string, question: Question) {
    setQuestions((current) => current.map((q) => (q.id === id ? question : q)));
  }

  function move(index: number, by: -1 | 1) {
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  function add(question: Question) {
    setQuestions((current) => [...current, question]);
    setOpenId(question.id);
  }

  if (isInternal(funnel.type)) return <InternalNotice typeName={funnelTypes[funnel.type].name} />;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-10">
        <div role="radiogroup" aria-label="Format" className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(modes) as Mode[]).map((key) => {
            const { icon: Icon, title, description } = modes[key];
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={mode === key}
                onClick={() => setMode(key)}
                className="flex items-start gap-4 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
              >
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <FormSection title="Questions">
          <ol className="flex flex-col gap-3">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                total={questions.length}
                open={openId === question.id}
                onToggle={() => setOpenId(openId === question.id ? null : question.id)}
                onChange={(next) => update(question.id, next)}
                onMove={(by) => move(index, by)}
                onDuplicate={() => {
                  const copy = { ...question, id: crypto.randomUUID() };
                  setQuestions((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
                  setOpenId(copy.id);
                }}
                onRemove={() => setQuestions((current) => current.filter((q) => q.id !== question.id))}
              />
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
                <PlusIcon data-icon="inline-start" />
                Add Question
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {(Object.keys(questionKinds) as QuestionKind[]).map((kind) => {
                  const Icon = kindIcons[kind];
                  return (
                    <DropdownMenuItem key={kind} onClick={() => add(blank(kind))}>
                      <Icon />
                      {questionKinds[kind]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              disabled={suggesting}
              onClick={() => {
                setSuggesting(true);
                setTimeout(() => {
                  add({ ...suggestion, id: crypto.randomUUID() });
                  setSuggesting(false);
                }, 1200);
              }}
            >
              {suggesting ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
              {suggesting ? "Thinking" : "Suggest a Question"}
            </Button>
          </div>
        </FormSection>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Preview</h2>
          <PreviewSheet
            title={`${funnel.name} · Intake`}
            onOpenChange={(open) => open && setPreviewIndex(Math.max(0, openIndex))}
            footer={
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={previewIndex === 0}
                  onClick={() => setPreviewIndex((i) => i - 1)}
                >
                  Back
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Question {previewIndex + 1} of {questions.length}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={previewIndex >= questions.length - 1}
                  onClick={() => setPreviewIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
            }
          >
            {() => (
              <QuestionPreview
                fill
                question={questions[previewIndex]}
                index={previewIndex}
                total={questions.length}
                mode={mode}
                onNext={() => setPreviewIndex((i) => Math.min(questions.length - 1, i + 1))}
              />
            )}
          </PreviewSheet>
        </div>
        <QuestionPreview
          question={questions[openIndex]}
          index={Math.max(0, openIndex)}
          total={questions.length}
          mode={mode}
        />
        <p className="text-xs text-muted-foreground">
          {questions.filter((q) => q.signal).length} of {questions.length} answers are sent to Qloo
          as taste signals.
        </p>
      </aside>
    </div>
  );
}
