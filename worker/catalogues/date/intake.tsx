/**
 * The Date catalogue's questions: one a screen on cream, the question
 * in big serif, and on wide screens a photo beside it that changes as
 * they go (the layout's photos, in turn).
 *
 * - Area Picker: where the date is. Neighbourhoods with a point each, or
 *   one they type; the Date Plan step finds either on the map.
 * - When Picker: times to pick, or any time typed or sent by an app.
 * - Taste: a question that names the person they're taking out ("What
 *   does Maya love?") from an earlier answer, with a plain label for the
 *   profile.
 *
 * Text, Choice, Scale and Statement are the Basic catalogue's (same
 * fields and answer rules, so saved experiences keep working), drawn in
 * this look.
 */
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ClockIcon, HeartIcon, MapPinIcon } from "lucide-react";
import { z } from "zod";

import { type ComponentProps, type InputProps, defineInput, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as basicIntake } from "../basic/intake";
import { areaFields } from "./date";
import { Logo, body, button, display, light, line, restyle } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "App name", default: "Overlap" }),
    logo: f.image({ label: "Logo" }),
    photos: f.list({
      label: "Photos",
      itemLabel: "Photo",
      max: 12,
      help: "Shown beside the questions, one per question in turn.",
      fields: { image: f.image({ label: "Photo" }) },
    }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "Plan the date" }),
  },
  Layout: ({ settings, nav, children }) => {
    const photos = settings.photos.filter((photo) => photo.image);
    const index = nav?.index ?? 0;
    const progress = nav ? (nav.index + 1) / Math.max(nav.total, 1) : 1;
    return (
      <div style={light} className={cn("flex min-h-svh flex-1 antialiased", body)}>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between gap-4 px-5 @3xl:px-10 @6xl:px-16">
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.75rem]" />
            {nav && (
              <span className="text-sm tabular-nums opacity-70">
                {nav.index + 1} of {nav.total}
              </span>
            )}
          </header>
          {nav && (
            <div className="h-px bg-foreground/15" role="progressbar" aria-valuemin={0} aria-valuemax={nav.total} aria-valuenow={nav.index + 1}>
              <div className="h-full bg-foreground transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          <main className="flex flex-1 flex-col justify-center px-5 py-14 @3xl:px-10 @6xl:px-16">
            <div className="w-full max-w-2xl">{children}</div>
          </main>
          {nav?.error && (
            <p role="alert" className="max-w-2xl px-5 pb-3 text-sm text-[var(--blush)] @3xl:px-10 @6xl:px-16">
              {nav.error}
            </p>
          )}
          {nav && (
            <footer className="flex max-w-[calc(42rem+8rem)] items-center justify-between gap-3 px-5 pb-10 @3xl:px-10 @6xl:px-16">
              {nav.isFirst ? (
                <span />
              ) : (
                <button type="button" onClick={nav.back} className="inline-flex h-12 items-center gap-2 px-1 opacity-70 transition-opacity hover:opacity-100">
                  <ArrowLeftIcon className="size-4" />
                  Back
                </button>
              )}
              <button type="button" onClick={nav.next} disabled={nav.pending} className={cn(button, "h-14 px-8")}>
                {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
                {!nav.pending && <ArrowRightIcon className="size-4" />}
              </button>
            </footer>
          )}
        </div>
        {photos.length > 0 && (
          <aside className="relative isolate w-[40%] shrink-0 overflow-hidden bg-[var(--deep)] @max-4xl:hidden">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo.image}
                alt=""
                className={cn(
                  "absolute inset-0 -z-10 size-full object-cover transition-opacity duration-1000 ease-out",
                  i === index % photos.length ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            <div aria-hidden className="absolute inset-0 -z-10 bg-[var(--wine)] opacity-20 mix-blend-multiply" />
          </aside>
        )}
      </div>
    );
  },
});

/** The question in big serif, its hint, the answer, and any error. */
function Question({ htmlFor, question, help, error, children }: { htmlFor?: string; question: string; help: string; error?: string; children: ReactNode }) {
  const Label = htmlFor ? "label" : "legend";
  return (
    <fieldset className="flex flex-col gap-9">
      <div className="flex flex-col gap-4">
        <Label htmlFor={htmlFor} className={cn(display, "text-[clamp(2.5rem,5.5cqi,4.25rem)] text-balance")}>
          {question}
        </Label>
        {help && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-75">{help}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-[var(--blush)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** One answer you can pick: a hairline row that fills with the button colour. */
function Option({ on, multiple, onClick, children }: { on: boolean; multiple: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-15 items-center justify-between gap-4 rounded-(--radius) px-5 py-3 text-left text-lg ring-1 transition-[background-color,color,box-shadow] outline-none",
        "focus-visible:ring-2 focus-visible:ring-foreground",
        on ? "bg-[var(--button)] text-[var(--button-foreground)] ring-[var(--button)]" : "ring-foreground/25 hover:bg-foreground/[0.06] hover:ring-foreground/50",
      )}
    >
      <span className="text-pretty">{children}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center ring-1 transition-colors",
          multiple ? "rounded-[2px]" : "rounded-full",
          on ? "bg-[var(--button-foreground)] text-[var(--button)] ring-[var(--button-foreground)]" : "ring-foreground/40",
        )}
      >
        {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Where the date is: a neighbourhood from the list, or their own. */
const area = defineInput({
  type: "area",
  name: "Area Picker",
  description: "Where the date is: a neighbourhood from the list, or one they type.",
  icon: MapPinIcon,
  fields: {
    question: f.text({ label: "Question", default: "Where are you meeting?" }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    other: f.toggle({ label: "Let them type another neighbourhood", default: true }),
    ...areaFields,
  },
  input: {
    schema: (props): z.ZodType<string> => {
      const names = props.options.map((option) => option.name);
      const answer = z.string().trim();
      const allowed = props.other ? answer : answer.refine((value) => !value || names.includes(value), "Pick a neighbourhood from the list");
      return props.required ? allowed.refine(Boolean, "Pick where you're meeting") : allowed;
    },
    label: (props) => props.question,
    shape: (props) =>
      props.other ? { kind: "text", placeholder: props.options[0]?.name ?? "West Village, New York" } : { kind: "one", options: props.options.map((option) => option.name) },
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.options[0]?.name ?? "West Village, New York",
  },
  Component: ({ props, field }) => {
    const listed = props.options.some((option) => option.name === field.value);
    // Grouped by city, the part after the comma.
    const cities = [...new Set(props.options.map((option) => option.name.split(",").slice(1).join(",").trim()))];
    return (
      <Question question={props.question} help={props.help} error={field.error}>
        <div className="flex flex-col gap-7" role="radiogroup" aria-label={props.question}>
          {cities.map((city) => (
            <div key={city} className="flex flex-col gap-2">
              {city && <span className="text-sm opacity-70">{city}</span>}
              <div className="grid gap-2 @xl:grid-cols-3">
                {props.options
                  .filter((option) => option.name.split(",").slice(1).join(",").trim() === city)
                  .map((option) => {
                    const on = field.value === option.name;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => field.pick(option.name)}
                        className={cn(
                          "flex min-h-24 flex-col items-start justify-between gap-3 rounded-(--radius) p-4 text-left ring-1 transition-[background-color,color,transform] outline-none",
                          "focus-visible:ring-2 focus-visible:ring-foreground",
                          on
                            ? "bg-[var(--button)] text-[var(--button-foreground)] ring-[var(--button)]"
                            : "ring-foreground/25 hover:bg-foreground/[0.06] hover:ring-foreground/50 active:scale-[0.98]",
                        )}
                      >
                        <span className={cn(display, "text-[1.65rem] leading-none")}>{option.name.split(",")[0]}</span>
                        {option.note && <span className={cn("text-sm leading-snug", on ? "opacity-80" : "opacity-65")}>{option.note}</span>}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        {props.other && (
          <label className="flex flex-col gap-2">
            <span className="text-sm opacity-70">Somewhere else?</span>
            <input
              value={listed ? "" : field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && field.submit()}
              placeholder="A neighbourhood and city, like Mount Pleasant, Vancouver"
              aria-invalid={Boolean(field.error)}
              className={cn(line, "h-14 text-xl")}
            />
          </label>
        )}
      </Question>
    );
  },
});

/**
 * When it starts: a few times to pick from, or their own. Any text goes
 * through, so an app can send "Friday at 8 PM" or an ISO time
 * ("2026-10-24T18:00"); the Date Plan step reads the day and the hour.
 */
const when = defineInput({
  type: "when",
  name: "When Picker",
  description: "When the date starts: times to pick from, or one they type. Takes an ISO time over the API.",
  icon: ClockIcon,
  fields: {
    question: f.text({ label: "Question", default: "When?" }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    other: f.toggle({ label: "Let them type another time", default: true }),
    options: f.list({ label: "Times", itemLabel: "Time", max: 8, fields: { label: f.text({ label: "Time", placeholder: "Saturday, from 6 PM" }) } }),
  },
  input: {
    schema: (props): z.ZodType<string> => {
      const labels = props.options.map((option) => option.label);
      const answer = z.string().trim();
      const allowed = props.other ? answer : answer.refine((value) => !value || labels.includes(value), "Pick one of the times");
      return props.required ? allowed.refine(Boolean, "Pick when you're starting") : allowed;
    },
    label: (props) => props.question,
    shape: (props) =>
      props.other ? { kind: "text", placeholder: props.options[0]?.label ?? "Saturday, from 6 PM" } : { kind: "one", options: props.options.map((option) => option.label) },
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.options[2]?.label ?? props.options[0]?.label ?? "Saturday, from 6 PM",
  },
  Component: ({ props, field }) => {
    const listed = props.options.some((option) => option.label === field.value);
    return (
      <Question question={props.question} help={props.help} error={field.error}>
        <div className="grid gap-2 @xl:grid-cols-2" role="radiogroup" aria-label={props.question}>
          {props.options.map(({ label }) => {
            const [day, ...rest] = label.split(",");
            return (
              <Option key={label} on={field.value === label} multiple={false} onClick={() => field.pick(label)}>
                <span className="flex flex-col">
                  <span className={cn(display, "text-[1.65rem] leading-tight")}>{day}</span>
                  {rest.length > 0 && <span className="text-sm opacity-75">{rest.join(",").trim()}</span>}
                </span>
              </Option>
            );
          })}
        </div>
        {props.other && (
          <label className="flex flex-col gap-2">
            <span className="text-sm opacity-70">Another time?</span>
            <input
              value={listed ? "" : field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && field.submit()}
              placeholder="Thursday at 7:30 PM"
              aria-invalid={Boolean(field.error)}
              className={cn(line, "h-14 text-xl")}
            />
          </label>
        )}
      </Question>
    );
  },
});

/**
 * A taste question that can name the person they're taking out: the
 * question is filled from earlier answers ("What does {{answers.match}}
 * love?"), the profile keeps a plain label.
 */
const taste = defineInput({
  type: "taste",
  name: "Taste",
  description: "Favourites in their own words: bands, films, books, places. The question can use an earlier answer, like their match's name.",
  icon: HeartIcon,
  fields: {
    question: f.text({ label: "Question", default: "What do they love?", help: "Use {{answers.<id>}} to fill in an earlier answer." }),
    label: f.text({ label: "On the profile", default: "What they love", help: "The question as it reads on the profile and to the workflow." }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    placeholder: f.text({ label: "Placeholder", help: "Also the sample answer for tests." }),
  },
  input: {
    schema: (props) => {
      const answer = z.string().trim().max(2000, "Keep it under 2,000 characters");
      return props.required ? answer.min(3, "Name at least one thing, like a band or a film") : answer;
    },
    label: (props) => props.label || props.question,
    shape: (props) => ({ kind: "text", long: true, placeholder: props.placeholder }),
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.placeholder || "Phoebe Bridgers, In the Mood for Love, natural wine",
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
        <div className={cn("grid gap-2", props.options.length > 5 && "@2xl:grid-cols-2")} role={props.multiple ? "group" : "radiogroup"}>
          {props.options.map(({ label }, i) => (
            <Option key={i} on={selected.includes(label)} multiple={props.multiple} onClick={() => toggle(label)}>
              {label}
            </Option>
          ))}
        </div>
        {props.multiple && <p className="-mt-4 text-sm opacity-65">Pick as many as you like.</p>}
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
                  "flex h-16 items-center justify-center rounded-(--radius) text-3xl tabular-nums ring-1 transition-[background-color,color,box-shadow] outline-none",
                  "focus-visible:ring-2 focus-visible:ring-foreground",
                  on ? "bg-[var(--button)] text-[var(--button-foreground)] ring-[var(--button)]" : "ring-foreground/25 hover:bg-foreground/[0.06]",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-sm opacity-70">
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
      <h2 className={cn(display, "text-[clamp(2.5rem,5.5cqi,4.25rem)] text-balance")}>{ctx.fill(props.title)}</h2>
      {props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-75">{ctx.fill(props.body)}</p>}
    </div>
  ),
);

export const intakeComponents = [area, when, taste, text, choice, scale, statement];
