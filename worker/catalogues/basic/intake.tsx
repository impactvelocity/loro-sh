import { ArrowLeftIcon, CheckIcon, GaugeIcon, ListChecksIcon, MessageSquareTextIcon, TypeIcon } from "lucide-react";
import { z } from "zod";

import { defineComponent, defineInput, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { Logo, brandStyle, button, input } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Brand name", default: "Loro" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#1f1f1f" }),
    background: f.image({ label: "Background", help: "Sits behind every question, faded." }),
    progress: f.segmented({
      label: "Progress",
      options: [
        { value: "bar", label: "Bar" },
        { value: "count", label: "Count" },
        { value: "none", label: "None" },
      ],
    }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "See My Results" }),
  },
  Layout: ({ settings, nav, children }) => (
    <div style={brandStyle(settings.accent)} className="relative isolate flex flex-1 flex-col bg-background text-foreground">
      {settings.background && (
        <>
          <img src={settings.background} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-background/85 backdrop-blur-sm" />
        </>
      )}
      <header className="flex items-center justify-between gap-4 px-5 py-4 @3xl:px-10">
        <Logo brand={settings.brand} logo={settings.logo} />
        {nav && settings.progress === "count" && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {nav.index + 1} of {nav.total}
          </span>
        )}
      </header>
      {nav && settings.progress === "bar" && (
        <div className="h-1 bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={nav.total} aria-valuenow={nav.index + 1}>
          <div
            className="h-full bg-[var(--brand)] transition-[width] duration-300"
            style={{ width: `${((nav.index + 1) / Math.max(nav.total, 1)) * 100}%` }}
          />
        </div>
      )}
      <main className="flex flex-1 flex-col justify-center px-5 py-10 @3xl:px-10">
        <div className="mx-auto w-full max-w-xl">{children}</div>
      </main>
      {nav?.error && (
        <p role="alert" className="mx-auto w-full max-w-xl px-5 pb-3 text-right text-sm text-red-600">
          {nav.error}
        </p>
      )}
      {nav && (
        <footer className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 pb-8">
          {nav.isFirst ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={nav.back}
              className="inline-flex h-12 items-center gap-2 rounded-(--radius) px-3 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </button>
          )}
          <button type="button" onClick={nav.next} disabled={nav.pending} className={button}>
            {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
          </button>
        </footer>
      )}
    </div>
  ),
});

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
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "legend";
  return (
    <fieldset className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor={htmlFor} className="font-heading text-3xl leading-tight font-medium text-balance">
          {question}
        </Label>
        {help && <p className="text-muted-foreground text-pretty">{help}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const common = {
  question: f.text({ label: "Question", default: "Your question" }),
  help: f.text({ label: "Hint" }),
  required: f.toggle({ label: "Required", default: true }),
};

const text = defineInput({
  type: "text",
  name: "Text",
  description: "A short answer or a paragraph.",
  icon: TypeIcon,
  fields: {
    ...common,
    size: f.segmented({
      label: "Answer",
      options: [
        { value: "short", label: "Short" },
        { value: "long", label: "Paragraph" },
      ],
    }),
    placeholder: f.text({ label: "Placeholder" }),
  },
  input: {
    schema: (props) => {
      const answer = z.string().trim().max(2000, "Keep it under 2,000 characters");
      return props.required ? answer.min(1, "This one's needed") : answer;
    },
    label: (props) => props.question,
    shape: (props) => ({ kind: "text", long: props.size === "long", placeholder: props.placeholder }),
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.placeholder || "Something specific",
  },
  Component: ({ props, field }) => (
    <Question htmlFor={field.name} question={props.question} help={props.help} error={field.error}>
      {props.size === "long" ? (
        <textarea
          id={field.name}
          rows={5}
          placeholder={props.placeholder}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          aria-invalid={Boolean(field.error)}
          className={cn(input, "resize-none py-3")}
        />
      ) : (
        <input
          id={field.name}
          placeholder={props.placeholder}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && field.submit()}
          aria-invalid={Boolean(field.error)}
          className={cn(input, "h-14 text-lg")}
        />
      )}
    </Question>
  ),
});

const choice = defineInput({
  type: "choice",
  name: "Choice",
  description: "Pick one, or pick a few.",
  icon: ListChecksIcon,
  fields: {
    ...common,
    multiple: f.toggle({ label: "Allow more than one" }),
    options: f.list({
      label: "Options",
      itemLabel: "Option",
      max: 12,
      fields: { label: f.text({ label: "Label" }) },
      default: [{ label: "Option one" }, { label: "Option two" }, { label: "Option three" }],
    }),
  },
  input: {
    schema: (props): z.ZodType<string | string[]> => {
      const labels = props.options.map((option) => option.label);
      const one = z.string().refine((value) => labels.includes(value), "Pick one of the options");
      if (props.multiple) {
        const many = z.array(one);
        return props.required ? many.min(1, "Pick at least one") : many;
      }
      return props.required ? one : z.union([one, z.literal("")]);
    },
    label: (props) => props.question,
    shape: (props) => ({ kind: props.multiple ? "many" : "one", options: props.options.map((option) => option.label) }),
    required: (props) => props.required,
    empty: (props) => (props.multiple ? [] : ""),
    sample: (props) => {
      const labels = props.options.map((option) => option.label);
      return props.multiple ? labels.slice(0, 2) : (labels[0] ?? "");
    },
  },
  Component: ({ props, field }) => {
    const selected = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
    const toggle = (label: string) => {
      if (!props.multiple) return field.pick(label);
      field.onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
    };
    return (
      <Question question={props.question} help={props.help} error={field.error}>
        <div className="flex flex-col gap-2" role={props.multiple ? "group" : "radiogroup"}>
          {props.options.map(({ label }, i) => {
            const on = selected.includes(label);
            return (
              <button
                key={i}
                type="button"
                role={props.multiple ? "checkbox" : "radio"}
                aria-checked={on}
                onClick={() => toggle(label)}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-3 rounded-(--radius) border bg-card px-4 text-left text-lg transition-colors outline-none",
                  "hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
                  on && "border-[var(--brand)] ring-1 ring-[var(--brand)]",
                )}
              >
                {label}
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center border",
                    props.multiple ? "rounded-md" : "rounded-full",
                    on && "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]",
                  )}
                >
                  {on && <CheckIcon className="size-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        {props.multiple && <p className="-mt-2 text-sm text-muted-foreground">Pick as many as you like.</p>}
      </Question>
    );
  },
});

const scale = defineInput({
  type: "scale",
  name: "Scale",
  description: "A number from one to five, or more.",
  icon: GaugeIcon,
  fields: {
    ...common,
    max: f.number({ label: "Highest number", min: 3, max: 10, default: 5 }),
    low: f.text({ label: "Low label", default: "Not at all" }),
    high: f.text({ label: "High label", default: "Very" }),
  },
  input: {
    schema: (props): z.ZodType<number | null> => {
      const answer = z.number("Pick a number").int().min(1).max(props.max);
      return props.required ? answer : answer.nullable();
    },
    label: (props) => props.question,
    shape: (props) => ({ kind: "number", min: 1, max: props.max, low: props.low, high: props.high }),
    required: (props) => props.required,
    empty: () => null,
    sample: (props) => Math.ceil(props.max * 0.7),
  },
  Component: ({ props, field }) => (
    <Question question={props.question} help={props.help} error={field.error}>
      <div className="flex flex-col gap-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${props.max}, minmax(0, 1fr))` }}>
          {Array.from({ length: props.max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={field.value === n}
              onClick={() => field.pick(n)}
              className={cn(
                "flex h-14 items-center justify-center rounded-(--radius) border bg-card text-lg tabular-nums transition-colors outline-none",
                "hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
                field.value === n && "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{props.low}</span>
          <span>{props.high}</span>
        </div>
      </div>
    </Question>
  ),
});

/** Not a question: a screen between them, to set up the next few. */
const statement = defineComponent({
  type: "statement",
  name: "Statement",
  description: "A screen with no question, between sections.",
  icon: MessageSquareTextIcon,
  fields: {
    title: f.text({ label: "Title", default: "A few more" }),
    body: f.longText({ label: "Text" }),
    media: f.media({ label: "Image or video" }),
  },
  Component: ({ props, ctx }) => (
    <div className="flex flex-col gap-5">
      {props.media.url &&
        (props.media.type === "video" ? (
          <video src={props.media.url} className="aspect-video w-full rounded-(--radius) object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={props.media.url} alt="" className="aspect-video w-full rounded-(--radius) object-cover" />
        ))}
      <h2 className="font-heading text-3xl leading-tight font-medium text-balance">{ctx.fill(props.title)}</h2>
      {props.body && <p className="text-lg text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
    </div>
  ),
});

export const intakeComponents = [text, choice, scale, statement];
