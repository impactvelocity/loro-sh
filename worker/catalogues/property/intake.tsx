/**
 * The Property catalogue's questions: one a screen, split like a listing
 * brochure. The question in big serif on the left; on the right, a photo
 * of the house that changes as they answer (the layout's photos, in
 * turn), so they're picturing the place while they describe their week.
 *
 * Text, Choice, Scale and Statement are the Basic catalogue's (same
 * fields and answer rules, so saved experiences keep working), drawn in
 * this look.
 */
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";

import { type ComponentProps, type InputProps, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as basicIntake } from "../basic/intake";
import { brandStyle } from "../basic/shared";
import { Logo, button, display, restyle } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Agency name", default: "Harbour & Grey" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#24332f" }),
    photos: f.list({
      label: "Photos",
      itemLabel: "Photo",
      max: 12,
      help: "Shown beside the questions, one per question in turn.",
      fields: { image: f.image({ label: "Photo" }), caption: f.text({ label: "Caption" }) },
    }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "See your week here" }),
  },
  Layout: ({ settings, nav, children }) => {
    const photos = settings.photos.filter((photo) => photo.image);
    const index = nav?.index ?? 0;
    const progress = nav ? (nav.index + 1) / Math.max(nav.total, 1) : 1;
    return (
      <div style={brandStyle(settings.accent)} className="flex min-h-svh flex-1 bg-background text-foreground antialiased">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-18 items-center justify-between gap-4 px-5 @3xl:px-10 @6xl:px-16">
            <Logo brand={settings.brand} logo={settings.logo} className="text-lg" />
            {nav && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {nav.index + 1} of {nav.total}
              </span>
            )}
          </header>
          {nav && (
            <div className="h-px bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={nav.total} aria-valuenow={nav.index + 1}>
              <div className="h-full bg-[var(--brand)] transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          <main className="flex flex-1 flex-col justify-center px-5 py-14 @3xl:px-10 @6xl:px-16">
            <div className="w-full max-w-2xl">{children}</div>
          </main>
          {nav?.error && (
            <p role="alert" className="max-w-2xl px-5 pb-3 text-sm text-red-700 @3xl:px-10 @6xl:px-16">
              {nav.error}
            </p>
          )}
          {nav && (
            <footer className="flex max-w-[calc(42rem+8rem)] items-center justify-between gap-3 px-5 pb-10 @3xl:px-10 @6xl:px-16">
              {nav.isFirst ? (
                <span />
              ) : (
                <button
                  type="button"
                  onClick={nav.back}
                  className="inline-flex h-12 items-center gap-2 px-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeftIcon className="size-4" />
                  Back
                </button>
              )}
              <button type="button" onClick={nav.next} disabled={nav.pending} className={cn(button, "h-14 px-8 text-base")}>
                {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
                {!nav.pending && <ArrowRightIcon className="size-4" />}
              </button>
            </footer>
          )}
        </div>
        {photos.length > 0 && (
          <aside className="relative w-[42%] shrink-0 overflow-hidden bg-[var(--deep)] @max-4xl:hidden">
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo.image}
                alt=""
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
                  i === index % photos.length ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            {photos[index % photos.length]?.caption && (
              <p className="absolute right-6 bottom-6 left-6 text-sm text-white/85 drop-shadow">{photos[index % photos.length].caption}</p>
            )}
          </aside>
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
        <Label htmlFor={htmlFor} className={cn(display, "text-[clamp(2.5rem,5.5cqi,4rem)] leading-[1] text-balance")}>
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

/** One answer you can pick: a hairline row that fills with the brand colour. */
function Option({ on, multiple, onClick, children }: { on: boolean; multiple: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-15 items-center justify-between gap-4 rounded-(--radius) px-5 py-3 text-left text-lg ring-1 transition-[background-color,color,box-shadow] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
        on
          ? "bg-[var(--brand)] text-[var(--brand-foreground)] ring-[var(--brand)]"
          : "bg-card ring-border hover:ring-foreground/30",
      )}
    >
      <span className="text-pretty">{children}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center ring-1 transition-colors",
          multiple ? "rounded-[3px]" : "rounded-full",
          on ? "bg-[var(--brand-foreground)] text-[var(--brand)] ring-[var(--brand-foreground)]" : "ring-foreground/25",
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
      "w-full border-0 border-b border-foreground/25 bg-transparent px-0 text-2xl outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-[var(--brand)] aria-invalid:border-red-600";
    return (
      <Question htmlFor={field.name} question={props.question} help={props.help} error={field.error}>
        {props.size === "long" ? (
          // Grows with what they write (and the placeholder), from one line.
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
  ({ props, field }: InputProps<any, string | string[]> & { props: Common & { multiple: boolean; options: { label: string }[] } }) => {
    const selected = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
    const toggle = (label: string) => {
      if (!props.multiple) return field.pick(label);
      field.onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
    };
    return (
      <Question question={props.question} help={props.help} error={field.error}>
        <div className={cn("grid gap-2", props.options.length > 5 && "@2xl:grid-cols-2")} role={props.multiple ? "group" : "radiogroup"}>
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
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => field.pick(n)}
                className={cn(
                  "flex h-16 items-center justify-center rounded-(--radius) text-2xl tabular-nums ring-1 transition-[background-color,color,box-shadow] outline-none",
                  display,
                  "focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                  on ? "bg-[var(--brand)] text-[var(--brand-foreground)] ring-[var(--brand)]" : "bg-card ring-border hover:ring-foreground/30",
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

const statement = restyle(
  basicIntake,
  "statement",
  ({ props, ctx }: ComponentProps<any> & { props: { title: string; body: string; media: { type: "image" | "video"; url: string } } }) => (
    <div className="flex flex-col gap-6">
      {props.media.url &&
        (props.media.type === "video" ? (
          <video src={props.media.url} className="aspect-[16/9] w-full rounded-(--radius) object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={props.media.url} alt="" className="aspect-[16/9] w-full rounded-(--radius) object-cover" />
        ))}
      <h2 className={cn(display, "text-[clamp(2.5rem,5.5cqi,4rem)] leading-[1] text-balance")}>{ctx.fill(props.title)}</h2>
      {props.body && <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
    </div>
  ),
);

export const intakeComponents = [text, choice, scale, statement];
