/**
 * The Venue catalogue's questions: one a screen on the black, the question
 * in poster caps, and on wide screens a flyer beside it, a photo of the
 * house printed in a new ink for each question (the layout's photos, in
 * turn), torn down the edge.
 *
 * Taste is a question for favourites in their own words. Text, Choice,
 * Scale and Statement are the Basic catalogue's (same fields and answer
 * rules, so saved experiences keep working), drawn in this look.
 */
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, HeartIcon } from "lucide-react";
import { z } from "zod";

import { type ComponentProps, type InputProps, defineInput, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as basicIntake } from "../basic/intake";
import { Duotone, Grain, Logo, Tape, body, button, display, inks, line, mono, restyle, torn } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Venue name", default: "The Wren" }),
    logo: f.image({ label: "Logo" }),
    photos: f.list({
      label: "Photos",
      itemLabel: "Photo",
      max: 12,
      help: "Shown beside the questions, one per question in turn.",
      fields: { image: f.image({ label: "Photo" }) },
    }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "Find my nights" }),
  },
  Layout: ({ settings, nav, children }) => {
    const photos = settings.photos.filter((photo) => photo.image);
    const index = nav?.index ?? 0;
    const progress = nav ? (nav.index + 1) / Math.max(nav.total, 1) : 1;
    return (
      <div className={cn("relative isolate flex min-h-svh flex-1 bg-background text-foreground antialiased", body)}>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between gap-4 px-5 @3xl:px-10 @6xl:px-16">
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.9rem]" />
            {nav && (
              <span className={cn(mono, "text-[0.8rem] tabular-nums opacity-70")}>
                {nav.index + 1} of {nav.total}
              </span>
            )}
          </header>
          {nav && (
            <div className="h-1 bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={nav.total} aria-valuenow={nav.index + 1}>
              <div className="h-full bg-[var(--hot)] transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          <main className="flex flex-1 flex-col justify-center px-5 py-14 @3xl:px-10 @6xl:px-16">
            <div className="w-full max-w-2xl">{children}</div>
          </main>
          {nav?.error && (
            <p role="alert" className="max-w-2xl px-5 pb-3 text-sm text-red-300 @3xl:px-10 @6xl:px-16">
              {nav.error}
            </p>
          )}
          {nav && (
            <footer className="flex max-w-[calc(42rem+8rem)] items-center justify-between gap-3 px-5 pb-10 @3xl:px-10 @6xl:px-16">
              {nav.isFirst ? (
                <span />
              ) : (
                <button type="button" onClick={nav.back} className={cn(mono, "inline-flex h-12 items-center gap-2 px-1 text-[0.85rem] opacity-70 transition-opacity hover:opacity-100")}>
                  <ArrowLeftIcon className="size-4" />
                  Back
                </button>
              )}
              <button type="button" onClick={nav.next} disabled={nav.pending} className={cn(button, "h-14 px-8 text-[1.35rem]")}>
                {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
                {!nav.pending && <ArrowRightIcon className="size-4" strokeWidth={2.5} />}
              </button>
            </footer>
          )}
        </div>
        {photos.length > 0 && (
          <aside className="relative w-[40%] shrink-0 py-10 pr-10 @max-4xl:hidden @6xl:pr-16">
            <div className="relative h-full" style={{ rotate: "1deg" }}>
              <Tape className="-top-3 left-8" turn={-5} />
              <Tape className="-top-3 right-10" turn={4} />
              <div className="relative h-full" style={torn("bottom", 5, 14)}>
                {photos.map((photo, i) => (
                  <Duotone
                    key={i}
                    src={photo.image}
                    ink={inks[i % inks.length]}
                    eager
                    className={cn("absolute inset-0 transition-opacity duration-700 ease-out", i === index % photos.length ? "opacity-100" : "opacity-0")}
                  />
                ))}
                <div aria-hidden className="gig-dust absolute inset-0 opacity-60" />
              </div>
            </div>
          </aside>
        )}
        <Grain />
      </div>
    );
  },
});

/** The question in poster caps, its hint, the answer, and any error. */
function Question({ htmlFor, question, help, error, children }: { htmlFor?: string; question: string; help: string; error?: string; children: ReactNode }) {
  const Label = htmlFor ? "label" : "legend";
  return (
    <fieldset className="flex flex-col gap-9">
      <div className="flex flex-col gap-4">
        <Label htmlFor={htmlFor} className={cn(display, "gig-worn text-[clamp(3.25rem,7.5cqi,6rem)] text-balance")}>
          {question}
        </Label>
        {help && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-75">{help}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** One answer you can pick: a square box that fills pink, with an orange misprint under it. */
function Option({ on, multiple, onClick, children }: { on: boolean; multiple: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-15 items-center justify-between gap-4 px-5 py-3 text-left text-lg font-medium ring-2 transition-[background-color,color,box-shadow,translate] outline-none ring-inset",
        "focus-visible:ring-[var(--acid)]",
        on
          ? "-translate-x-[2px] -translate-y-[2px] bg-[var(--hot)] text-[var(--ink)] shadow-[4px_4px_0_var(--flare)] ring-[var(--hot)]"
          : "ring-foreground/20 hover:bg-foreground/[0.05] hover:ring-foreground/50",
      )}
    >
      <span className="text-pretty">{children}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center ring-2 transition-colors ring-inset",
          multiple ? "" : "rounded-full",
          on ? "bg-[var(--ink)] text-[var(--hot)] ring-[var(--ink)]" : "ring-foreground/40",
        )}
      >
        {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Favourites in their own words, with a plain label for the profile. */
const taste = defineInput({
  type: "taste",
  name: "Taste",
  description: "Favourites in their own words: bands, films, podcasts, comedians. Qloo matches each one.",
  icon: HeartIcon,
  fields: {
    question: f.text({ label: "Question", default: "Who's on repeat?" }),
    label: f.text({ label: "On the profile", default: "What they play", help: "The question as it reads on the profile and to the workflow." }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    placeholder: f.text({ label: "Placeholder", help: "Also the sample answer for tests." }),
  },
  input: {
    schema: (props) => {
      const answer = z.string().trim().max(2000, "Keep it under 2,000 characters");
      return props.required ? answer.min(3, "Name at least one, like a band or a film") : answer;
    },
    label: (props) => props.label || props.question,
    shape: (props) => ({ kind: "text", long: true, placeholder: props.placeholder }),
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.placeholder || "Khruangbin, Arooj Aftab, Talking Heads",
  },
  Component: ({ props, field, ctx }) => (
    <Question htmlFor={field.name} question={ctx.fill(props.question)} help={ctx.fill(props.help)} error={field.error}>
      <textarea
        id={field.name}
        rows={1}
        placeholder={props.placeholder}
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        aria-invalid={Boolean(field.error)}
        className={cn(line, "min-h-16 resize-none py-3 text-xl leading-snug [field-sizing:content] @2xl:text-2xl")}
      />
    </Question>
  ),
});

type Common = { question: string; help: string; required: boolean };

const text = restyle(
  basicIntake,
  "text",
  ({ props, field, ctx }: InputProps<any, string> & { props: Common & { size: "short" | "long"; placeholder: string } }) => (
    <Question htmlFor={field.name} question={ctx.fill(props.question)} help={ctx.fill(props.help)} error={field.error}>
      {props.size === "long" ? (
        <textarea
          id={field.name}
          rows={1}
          placeholder={props.placeholder}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          aria-invalid={Boolean(field.error)}
          className={cn(line, "min-h-16 resize-none py-3 text-xl leading-snug [field-sizing:content] @2xl:text-2xl")}
        />
      ) : (
        <input
          id={field.name}
          placeholder={props.placeholder}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && field.submit()}
          aria-invalid={Boolean(field.error)}
          className={cn(line, "h-16 text-2xl")}
        />
      )}
    </Question>
  ),
);

const choice = restyle(
  basicIntake,
  "choice",
  ({ props, field, ctx }: InputProps<any, string | string[]> & { props: Common & { multiple: boolean; options: { label: string }[] } }) => {
    const selected = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
    const toggle = (label: string) => {
      if (!props.multiple) return field.pick(label);
      field.onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
    };
    return (
      <Question question={ctx.fill(props.question)} help={ctx.fill(props.help)} error={field.error}>
        <div className={cn("grid gap-2", props.options.length > 4 && "@2xl:grid-cols-2")} role={props.multiple ? "group" : "radiogroup"}>
          {props.options.map(({ label }, i) => (
            <Option key={i} on={selected.includes(label)} multiple={props.multiple} onClick={() => toggle(label)}>
              {label}
            </Option>
          ))}
        </div>
        {props.multiple && <p className={cn(mono, "-mt-4 text-[0.78rem] opacity-65")}>Pick as many as you like.</p>}
      </Question>
    );
  },
);

const scale = restyle(
  basicIntake,
  "scale",
  ({ props, field, ctx }: InputProps<any, number | null> & { props: Common & { max: number; low: string; high: string } }) => (
    <Question question={ctx.fill(props.question)} help={ctx.fill(props.help)} error={field.error}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${props.max}, minmax(0, 1fr))` }}>
          {Array.from({ length: props.max }, (_, i) => i + 1).map((n) => {
            const on = field.value === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => field.pick(n)}
                className={cn(
                  display,
                  "flex h-16 items-center justify-center text-[2.25rem] tabular-nums ring-2 transition-[background-color,color,box-shadow] outline-none ring-inset",
                  "focus-visible:ring-[var(--acid)]",
                  on ? "bg-[var(--hot)] text-[var(--ink)] shadow-[4px_4px_0_var(--flare)] ring-[var(--hot)]" : "ring-foreground/20 hover:bg-foreground/[0.05]",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className={cn(mono, "flex justify-between text-[0.78rem] opacity-70")}>
          <span>{props.low}</span>
          <span>{props.high}</span>
        </div>
      </div>
    </Question>
  ),
);

const statement = restyle(
  basicIntake,
  "statement",
  ({ props, ctx }: ComponentProps<any> & { props: { title: string; body: string; media: { type: "image" | "video"; url: string } } }) => (
    <div className="flex flex-col gap-6">
      {props.media.url &&
        (props.media.type === "video" ? (
          <video src={props.media.url} className="aspect-[16/9] w-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={props.media.url} alt="" className="aspect-[16/9] w-full object-cover" />
        ))}
      <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,7.5cqi,6rem)] text-balance")}>{ctx.fill(props.title)}</h2>
      {props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-75">{ctx.fill(props.body)}</p>}
    </div>
  ),
);

export const intakeComponents = [taste, text, choice, scale, statement];
