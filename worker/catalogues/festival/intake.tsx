/**
 * The festival's intake: one question a screen, set like the start page.
 * The question in big serif, answers as quiet rows that fill with plum
 * when chosen, a hairline of progress under the header and the sun coming
 * up behind as they answer.
 *
 * The Artist Picker is this catalogue's own. Text, Choice and Scale are
 * the Basic catalogue's inputs (same fields and answer rules, so saved
 * experiences keep working) drawn in this look.
 */
import { useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { z } from "zod";

import { type InputProps, defineInput, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as basicIntake } from "../basic/intake";
import { brandStyle } from "../basic/shared";
import { Logo, Sun, night, pill, poster, restyle, wrap } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Festival name", default: "Mirage Valley" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#e0603a" }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "Plan my weekend" }),
  },
  Layout: ({ settings, nav, children }) => {
    const progress = nav ? (nav.index + 1) / Math.max(nav.total, 1) : 1;
    return (
      <div
        style={brandStyle(settings.accent)}
        className="relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground antialiased"
      >
        {/* The sun comes up as they answer. */}
        <Sun
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 w-[min(110cqi,46rem)] opacity-[0.16] transition-transform duration-700 ease-out"
          // translate is its own property, so it doesn't fight the transition.
          style={{ translate: `-50% ${Math.round(74 - progress * 40)}%` }}
        />
        {/* The night band, as on the start page, with progress along its bottom edge. */}
        <header style={night}>
          <div className={cn(wrap, "flex h-18 items-center justify-between gap-4")}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-xl" />
            {nav && (
              <span className="text-sm tabular-nums opacity-65">
                <span className="opacity-100">{String(nav.index + 1).padStart(2, "0")}</span> / {String(nav.total).padStart(2, "0")}
              </span>
            )}
          </div>
          {nav && (
            <div
              className="h-[3px] bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={nav.total}
              aria-valuenow={nav.index + 1}
            >
              <div className="h-full bg-[var(--brand)] transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </header>
        <main className="flex flex-1 flex-col justify-center py-14">
          <div className="mx-auto w-full max-w-3xl px-5 @3xl:px-10">{children}</div>
        </main>
        {nav?.error && (
          <p role="alert" className="mx-auto w-full max-w-3xl px-5 pb-3 text-right text-sm text-red-700 @3xl:px-10">
            {nav.error}
          </p>
        )}
        {nav && (
          <footer className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 pb-10 @3xl:px-10">
            {nav.isFirst ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={nav.back}
                className="inline-flex h-12 items-center gap-2 rounded-full px-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeftIcon className="size-4" />
                Back
              </button>
            )}
            <button type="button" onClick={nav.next} disabled={nav.pending} className={cn(pill, "h-14 px-8 text-base")}>
              {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
              {!nav.pending && <ArrowRightIcon className="size-4" />}
            </button>
          </footer>
        )}
      </div>
    );
  },
});

/** The question in big serif, its hint, the answer, and any error. */
function Question({
  htmlFor,
  question,
  help,
  error,
  children,
}: {
  htmlFor?: string;
  question: string;
  help: string;
  error?: string;
  children: ReactNode;
}) {
  const Label = htmlFor ? "label" : "legend";
  return (
    <fieldset className="flex flex-col gap-9">
      <div className="flex flex-col gap-4">
        <Label htmlFor={htmlFor} className={cn(poster, "text-[clamp(2.5rem,6cqi,4.25rem)] leading-[0.98] text-balance")}>
          {question}
        </Label>
        {help && <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{help}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** One answer you can pick: a quiet row that fills with plum. */
function Option({
  on,
  multiple,
  onClick,
  children,
}: {
  on: boolean;
  multiple: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-16 items-center justify-between gap-4 rounded-(--radius) px-5 py-3 text-left text-lg ring-1 transition-[background-color,color,box-shadow] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
        on
          ? "bg-[var(--plum)] text-[var(--plum-foreground)] ring-[var(--plum)]"
          : "bg-card/70 ring-border hover:bg-card hover:ring-foreground/25",
      )}
    >
      <span className="text-pretty">{children}</span>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center ring-1 transition-colors",
          multiple ? "rounded-md" : "rounded-full",
          on ? "bg-[var(--sun)] text-[var(--plum)] ring-[var(--sun)]" : "ring-foreground/25",
        )}
      >
        {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

type Common = { question: string; help: string; required: boolean };

const text = restyle(
  basicIntake,
  "text",
  ({ props, field }: InputProps<any, string> & { props: Common & { size: "short" | "long"; placeholder: string } }) => {
    const line =
      "w-full border-0 border-b-2 border-foreground/20 bg-transparent px-0 text-2xl outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--brand)] aria-invalid:border-red-600";
    return (
      <Question htmlFor={field.name} question={props.question} help={props.help} error={field.error}>
        {props.size === "long" ? (
          <textarea
            id={field.name}
            rows={3}
            placeholder={props.placeholder}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            aria-invalid={Boolean(field.error)}
            className={cn(line, "resize-none py-3 leading-relaxed")}
          />
        ) : (
          <input
            id={field.name}
            placeholder={props.placeholder}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && field.submit()}
            aria-invalid={Boolean(field.error)}
            className={cn(line, "h-16")}
          />
        )}
      </Question>
    );
  },
);

const choice = restyle(
  basicIntake,
  "choice",
  ({
    props,
    field,
  }: InputProps<any, string | string[]> & { props: Common & { multiple: boolean; options: { label: string }[] } }) => {
    const selected = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
    const toggle = (label: string) => {
      if (!props.multiple) return field.pick(label);
      field.onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
    };
    return (
      <Question question={props.question} help={props.help} error={field.error}>
        <div className={cn("grid gap-2.5", props.options.length > 4 && "@2xl:grid-cols-2")} role={props.multiple ? "group" : "radiogroup"}>
          {props.options.map(({ label }, i) => (
            <Option key={i} on={selected.includes(label)} multiple={props.multiple} onClick={() => toggle(label)}>
              {label}
            </Option>
          ))}
        </div>
        {props.multiple && <p className="-mt-4 text-sm text-muted-foreground">Pick as many as you like.</p>}
      </Question>
    );
  },
);

const scale = restyle(
  basicIntake,
  "scale",
  ({ props, field }: InputProps<any, number | null> & { props: Common & { max: number; low: string; high: string } }) => (
    <Question question={props.question} help={props.help} error={field.error}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${props.max}, minmax(0, 1fr))` }}>
          {Array.from({ length: props.max }, (_, i) => i + 1).map((n) => {
            const on = field.value === n;
            const below = field.value !== null && n < field.value;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => field.pick(n)}
                className={cn(
                  "flex aspect-square max-h-24 items-center justify-center rounded-full text-2xl font-medium tabular-nums ring-1 transition-[background-color,color,box-shadow] outline-none @2xl:text-3xl",
                  "focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                  on
                    ? "bg-[var(--plum)] text-[var(--plum-foreground)] ring-[var(--plum)]"
                    : below
                      ? "bg-[var(--sun)]/35 ring-transparent"
                      : "bg-card/70 ring-border hover:ring-foreground/25",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{props.low}</span>
          <span>{props.high}</span>
        </div>
      </div>
    </Question>
  ),
);

/** An act's face on its pill. Picked, it turns to a check on the sun; no photo, their initial. */
function Avatar({ src, name, on }: { src: string; name: string; on: boolean }) {
  const [failed, setFailed] = useState(false);
  const box = "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full";
  if (on)
    return (
      <span className={cn(box, "bg-[var(--sun)] text-[var(--plum)]")}>
        <CheckIcon className="size-4" strokeWidth={3} />
      </span>
    );
  if (failed) return <span className={cn(box, "bg-secondary text-sm font-semibold")}>{name[0]}</span>;
  return (
    <span className={cn(box, "bg-secondary")}>
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
    </span>
  );
}

/** Acts from the bill, as pills with their faces: who they're there for. Saved as a list of names. */
const acts = defineInput({
  type: "acts",
  name: "Artist Picker",
  description: "Pick the acts they're there for, from the lineup.",
  icon: SparklesIcon,
  fields: {
    question: f.text({ label: "Question", default: "Who are you most excited to see?" }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    max: f.number({ label: "Most they can pick", default: 0, min: 0, max: 20, help: "0 for no limit." }),
    options: f.list({
      label: "Acts",
      itemLabel: "Act",
      max: 120,
      fields: { label: f.text({ label: "Name" }), image: f.image({ label: "Photo", help: "Small, round, beside the name." }) },
    }),
  },
  input: {
    schema: (props): z.ZodType<string[]> => {
      const names = props.options.map((option) => option.label);
      let answer = z.array(z.string().refine((value) => names.includes(value), "Pick from the lineup"));
      if (props.max > 0) answer = answer.max(props.max, `Pick up to ${props.max}`);
      return props.required ? answer.min(1, "Pick at least one") : answer;
    },
    label: (props) => props.question,
    shape: (props) => ({ kind: "many", options: props.options.map((option) => option.label) }),
    required: (props) => props.required,
    empty: () => [],
    sample: (props) => props.options.slice(0, 3).map((option) => option.label),
  },
  Component: function Acts({ props, field }) {
    const [query, setQuery] = useState("");
    const selected = field.value;
    const full = props.max > 0 && selected.length >= props.max;
    const shown = props.options.filter(({ label }) => label.toLowerCase().includes(query.trim().toLowerCase()));
    const toggle = (label: string) =>
      field.onChange(selected.includes(label) ? selected.filter((l) => l !== label) : full ? selected : [...selected, label]);

    return (
      <Question question={props.question} help={props.help} error={field.error}>
        {props.options.length > 12 && (
          <label className="relative">
            <span className="sr-only">Find an act</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-0 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find an act"
              className="h-14 w-full border-0 border-b-2 border-foreground/20 bg-transparent pr-2 pl-8 text-xl outline-none placeholder:text-muted-foreground/60 focus:border-[var(--brand)]"
            />
          </label>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label={props.question}>
          {shown.map(({ label, image }) => {
            const on = selected.includes(label);
            return (
              <button
                key={label}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={!on && full}
                onClick={() => toggle(label)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full pr-4 text-[0.95rem] ring-1 transition-[transform,background-color,color] outline-none",
                  image ? "pl-1.5" : "pl-4",
                  "focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-40",
                  on
                    ? "bg-[var(--plum)] text-[var(--plum-foreground)] ring-[var(--plum)]"
                    : "bg-card/70 ring-border hover:bg-card hover:ring-foreground/25 active:scale-[0.97]",
                )}
              >
                {image && <Avatar src={image} name={label} on={on} />}
                {on && !image && <CheckIcon className="size-3.5 text-[var(--sun)]" strokeWidth={3} />}
                {label}
              </button>
            );
          })}
          {shown.length === 0 && <p className="text-muted-foreground">No one on the bill by that name.</p>}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {selected.length === 0 ? (
            "Pick as many as you like."
          ) : (
            <>
              <span className="text-foreground">{selected.length} picked</span>
              {props.max > 0 ? ` of ${props.max}` : ""}: {selected.join(", ")}
            </>
          )}
        </p>
      </Question>
    );
  },
});

const statement = basicIntake.find((definition) => definition.type === "statement")!;

export const intakeComponents = [acts, text, choice, scale, statement];
