/**
 * The Stay catalogue's questions: one a screen, on cream paper. The
 * question in the serif, its hint under it, the answers as hairline rows;
 * beside them, an inset photo of the house and the coast that changes as
 * they go (the layout's photos, in turn).
 *
 * For most guests these are the booking form's questions and the booking
 * system sends the answers by API; this is how they look when a guest
 * answers them here instead.
 *
 * Text, Choice, Scale and Statement are the Basic catalogue's (same
 * fields and answer rules, so saved experiences keep working), drawn in
 * this look.
 */
import type { ReactNode } from "react";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import { type ComponentProps, type InputProps, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as basicIntake } from "../basic/intake";
import { brandStyle } from "../basic/shared";
import { Logo, button, display, restyle } from "./shared";

export const intakeLayout = defineLayout({
  fields: {
    brand: f.text({ label: "House name", default: "Low Tide House" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#9c9a81" }),
    photos: f.list({
      label: "Photos",
      itemLabel: "Photo",
      max: 12,
      help: "Shown beside the questions, one per question in turn.",
      fields: { image: f.image({ label: "Photo" }), caption: f.text({ label: "Caption" }) },
    }),
    next: f.text({ label: "Next button", default: "Next" }),
    submit: f.text({ label: "Last button", default: "Plan my stay" }),
  },
  Layout: ({ settings, nav, children }) => {
    const photos = settings.photos.filter((photo) => photo.image);
    const index = nav?.index ?? 0;
    const photo = photos[index % Math.max(photos.length, 1)];
    return (
      <div style={brandStyle(settings.accent)} className="flex min-h-svh flex-1 bg-background text-foreground antialiased">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-22 items-center justify-between gap-4 px-5 @3xl:px-10 @6xl:px-14">
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.35rem] @3xl:text-[1.6rem]" />
            {nav && (
              <span className="font-display text-[1.05rem] text-muted-foreground tabular-nums">
                {nav.index + 1} of {nav.total}
              </span>
            )}
          </header>
          {nav && (
            <div className="mx-5 h-px bg-border @3xl:mx-10 @6xl:mx-14" role="progressbar" aria-valuemin={0} aria-valuemax={nav.total} aria-valuenow={nav.index + 1}>
              <div
                className="h-full bg-foreground transition-[width] duration-500 ease-out"
                style={{ width: `${((nav.index + 1) / Math.max(nav.total, 1)) * 100}%` }}
              />
            </div>
          )}
          <main className="flex flex-1 flex-col justify-center px-5 py-14 @3xl:px-10 @6xl:px-14">
            <div className="mx-auto w-full max-w-xl">{children}</div>
          </main>
          {nav?.error && (
            <p role="alert" className="mx-auto w-full max-w-xl px-5 pb-3 text-sm text-red-700">
              {nav.error}
            </p>
          )}
          {nav && (
            <footer className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 pb-12 @3xl:px-0">
              {nav.isFirst ? (
                <span />
              ) : (
                <button
                  type="button"
                  onClick={nav.back}
                  className="inline-flex h-12 items-center gap-2 px-1 font-display text-[1.05rem] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeftIcon className="size-4" />
                  Back
                </button>
              )}
              <button type="button" onClick={nav.next} disabled={nav.pending} className={cn(button, "h-13 px-9")}>
                {nav.pending ? "One moment…" : nav.isLast ? settings.submit : settings.next}
              </button>
            </footer>
          )}
        </div>
        {photos.length > 0 && (
          <aside className="w-[40%] shrink-0 p-4 pl-0 @max-4xl:hidden">
            <figure className="sticky top-4 flex h-[calc(100svh-2rem)] flex-col gap-3">
              <div className="relative flex-1 overflow-hidden bg-[var(--sand)]">
                {photos.map((item, i) => (
                  <img
                    key={i}
                    src={item.image}
                    alt=""
                    className={cn(
                      "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
                      i === index % photos.length ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
              </div>
              {photo?.caption && <figcaption className="font-display text-[1rem] italic text-muted-foreground">{photo.caption}</figcaption>}
            </figure>
          </aside>
        )}
      </div>
    );
  },
});

/** The question in the serif, its hint, the answer, and any error. */
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
        <Label htmlFor={htmlFor} className={cn(display, "text-[clamp(2.2rem,4.6cqi,3.3rem)] text-balance")}>
          {question}
        </Label>
        {help && <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{help}</p>}
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

/** One answer you can pick: a hairline row in the serif, with a mark that fills sage. */
function Option({ on, multiple, onClick, children }: { on: boolean; multiple: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "-mt-px flex min-h-15 items-center justify-between gap-4 border-y border-border px-1 py-3 text-left font-display text-[1.3rem] font-[350] transition-colors outline-none",
        "focus-visible:bg-[var(--brand)]/10 hover:bg-foreground/[0.03]",
        on && "bg-[var(--brand)]/12",
      )}
    >
      <span className="text-pretty">{children}</span>
      <span
        className={cn(
          "mr-2 flex size-5 shrink-0 items-center justify-center ring-1 transition-colors",
          multiple ? "rounded-[2px]" : "rounded-full",
          on ? "bg-[var(--brand)] text-[var(--brand-foreground)] ring-[var(--brand)]" : "ring-foreground/30",
        )}
      >
        {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

type Common = { question: string; help: string; required: boolean };

const line =
  "w-full border-0 border-b border-foreground/30 bg-transparent px-0 font-display text-[1.6rem] font-[350] outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-foreground aria-invalid:border-red-600";

const text = restyle(
  basicIntake,
  "text",
  ({ props, field }: InputProps<any, string> & { props: Common & { size: "short" | "long"; placeholder: string } }) => (
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
          className={cn(line, "min-h-16 resize-none py-3 text-[1.35rem] leading-snug [field-sizing:content]")}
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
  ),
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
        {/* Two columns only for a long list of short answers, like the days of the week. */}
        <div
          className={cn("grid pt-px", props.options.length > 5 && props.options.every(({ label }) => label.length <= 14) && "@2xl:grid-cols-2 @2xl:gap-x-8")}
          role={props.multiple ? "group" : "radiogroup"}
        >
          {props.options.map(({ label }, i) => (
            <Option key={i} on={selected.includes(label)} multiple={props.multiple} onClick={() => toggle(label)}>
              {label}
            </Option>
          ))}
        </div>
        {props.multiple && <p className="-mt-5 text-sm text-muted-foreground">Pick as many as you like.</p>}
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
        <div className="grid border-l border-border" style={{ gridTemplateColumns: `repeat(${props.max}, minmax(0, 1fr))` }}>
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
                  "flex h-18 items-center justify-center border-y border-r border-border text-[1.9rem] tabular-nums transition-colors outline-none",
                  "focus-visible:bg-[var(--brand)]/10",
                  on ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-foreground/[0.03]",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between font-display text-[1.05rem] italic text-muted-foreground">
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
          <video src={props.media.url} className="aspect-[3/2] w-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={props.media.url} alt="" className="aspect-[3/2] w-full object-cover" />
        ))}
      <h2 className={cn(display, "text-[clamp(2.2rem,4.6cqi,3.3rem)] text-balance")}>{ctx.fill(props.title)}</h2>
      {props.body && <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
    </div>
  ),
);

export const intakeComponents = [text, choice, scale, statement];
