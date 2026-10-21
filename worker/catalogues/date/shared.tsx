/**
 * The Date catalogue's look: a dating app's, loud and flat. Bubblegum,
 * yellow, lime and lilac fields, black 2px rules around everything,
 * square corners, photographs in a black frame. Bebas Neue in capitals
 * for the big moments only (the hero, section headings, the questions,
 * the times on the plan); DM Sans for everything you read. Sentence case
 * in the copy, no pre-titles, no numbered steps.
 *
 * Colours come from the pop theme's tokens (--ink, --pink, --yellow,
 * --lime, --lilac, --cream, --heart), so another theme can repaint it.
 * Pink always means the person they're taking out; lime means the one
 * planning. Sections pick a field with `fill`, which resets the tokens
 * components read, so every component works on all of them.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";

import type { AnyDefinition } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

export type Field = "cream" | "card" | "pink" | "yellow" | "lime" | "lilac" | "ink";

/** A section's colour: the field, black type and rules, black buttons. Ink turns it over. */
export function fill(field: Field): CSSProperties {
  if (field === "ink")
    return {
      "--background": "var(--ink)",
      "--foreground": "var(--cream)",
      "--muted-foreground": "oklch(0.955 0.03 82 / 66%)",
      "--border": "oklch(0.955 0.03 82 / 28%)",
      "--input": "var(--cream)",
      "--button": "var(--cream)",
      "--button-foreground": "var(--ink)",
      "--brand": "var(--cream)",
      "--brand-foreground": "var(--ink)",
      "--theirs": "var(--pink)",
      background: "var(--background)",
      color: "var(--foreground)",
    } as CSSProperties;
  return {
    "--background": `var(--${field})`,
    "--foreground": "var(--ink)",
    "--muted-foreground": "oklch(0.17 0.005 300 / 68%)",
    "--border": "var(--ink)",
    "--input": "var(--ink)",
    "--button": "var(--ink)",
    "--button-foreground": "var(--cream)",
    // Shared components (the run footer's bar) read the brand colour.
    "--brand": "var(--ink)",
    "--brand-foreground": "var(--cream)",
    // Their colour, as a highlighter: on the pink it has to be something else.
    "--theirs": field === "pink" ? "var(--card)" : "var(--pink)",
    background: "var(--background)",
    color: "var(--foreground)",
  } as CSSProperties;
}

/** For a section's background field. Older pages say "light" (now cream) or "wine" (now pink). */
export const toneStyle = (tone: string) => fill(tone === "light" ? "cream" : tone === "wine" ? "pink" : (tone as Field));

/** The fields a start page section can sit on. */
export const toneOptions = [
  { value: "cream", label: "Cream" },
  { value: "pink", label: "Pink" },
  { value: "yellow", label: "Yellow" },
  { value: "lime", label: "Lime" },
  { value: "lilac", label: "Lilac" },
];

/**
 * Display type: Bebas, in capitals. Size it where it's used. The line
 * height is an arbitrary property, since cn() drops a leading-* when a
 * text-[…] size follows it; set another with [line-height:…].
 */
export const display = "font-display font-normal uppercase tracking-[0.01em] [line-height:0.88]";

/** On a layout: every h2 inside takes the display face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-normal [&_h2]:uppercase [&_h2]:tracking-[0.01em] [&_h2]:[line-height:0.9]";

/** Reading text: DM Sans, a touch tight. */
export const body = "tracking-[-0.01em]";

/** Supporting text: a walk time, a caption, a source. */
export const quiet = "text-sm text-muted-foreground";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[88rem] px-5 @3xl:px-10 @6xl:px-16";

/** A photograph in its black frame. */
export const framed = "border-2 border-[var(--ink)] bg-[var(--card)] object-cover";

/** The black rule: around blocks, under headers, between cells. */
export const rule = "border-[var(--ink)]";

/** A chunky square button with a black outline: black on the fields, cream on the ink. It lifts on hover. */
export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 border-2 border-[var(--ink)] px-6 text-[0.95rem] font-semibold tracking-[-0.01em] transition-[transform,box-shadow,opacity] outline-none",
  "bg-[var(--button)] text-[var(--button-foreground)]",
  "hover:-translate-y-0.5 hover:shadow-[0_3px_0_var(--ink)] active:translate-y-0 active:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
);

/** The heart: the one hot button on a page, for the action that matters. Add it to `button`. */
export const heart = "[--button:var(--heart)] [--button-foreground:var(--heart-foreground)]";

/** A quieter button: the outline only. */
export const ghost = cn(
  "inline-flex h-12 items-center justify-center gap-2 border-2 border-current px-6 text-[0.95rem] font-semibold transition-colors outline-none",
  "hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-ring",
);

/** A text field as a thick underline. */
export const line = cn(
  "w-full border-0 border-b-2 border-[var(--input)] bg-transparent px-0 outline-none transition-colors",
  "placeholder:text-foreground/40 focus:border-b-[var(--heart)] aria-invalid:border-b-[var(--heart)]",
);

/** A boxed field, white with a black outline. */
export const field = cn(
  "h-12 w-full border-2 border-[var(--ink)] bg-[var(--card)] px-4 text-base text-[var(--ink)] outline-none transition-shadow",
  "placeholder:text-[var(--ink)]/45 focus-visible:shadow-[0_3px_0_var(--ink)] aria-invalid:border-[var(--heart)]",
);

/** Their favourites, picked out like a highlighter. */
export const theirs = "bg-[var(--theirs)] px-1 text-[var(--ink)] [box-decoration-break:clone]";

/** "Overlap" in Bebas, like a sticker. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return <span className={cn("font-display leading-none tracking-[0.01em] uppercase", className)}>{brand}</span>;
}

/** A section's opening: the label small on the left, the heading big on the right. */
export function SectionHead({ label, title, aside, className }: { label?: string; title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-baseline", className)}>
      {/* Beside the heading only: stacked above it, it would read as a pre-title. */}
      {label && <p className="text-[0.95rem] font-medium opacity-80 @max-4xl:hidden @4xl:col-span-3">{label}</p>}
      <h2 className={cn(display, "text-[clamp(3.25rem,8cqi,7.5rem)] text-balance", label ? "@4xl:col-span-9" : "@4xl:col-span-8")}>{title}</h2>
      {aside && <div className={cn("@4xl:col-span-6", label ? "@4xl:col-start-4" : "")}>{aside}</div>}
    </div>
  );
}

/**
 * An outcome section as a block of colour in a black outline. Full width
 * on a phone (rules top and bottom), boxed from @3xl.
 */
export function Block({ field: tone, id, className, children }: { field: Field; id?: string; className?: string; children: ReactNode }) {
  return (
    <section
      id={id}
      style={fill(tone)}
      className={cn("-mx-5 scroll-mt-24 border-y-2 px-5 py-12 @3xl:mx-0 @3xl:border-2 @3xl:px-12 @3xl:py-14", rule, className)}
    >
      {children}
    </section>
  );
}

/** A small round sticker: pink for their taste, lime for yours, white for the rest. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "theirs" | "yours" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-[var(--ink)] px-2.5 py-0.5 text-xs leading-normal font-medium text-[var(--ink)]",
        tone === "theirs" && "bg-[var(--pink)]",
        tone === "yours" && "bg-[var(--lime)]",
        tone === "plain" && "bg-[var(--card)]",
      )}
    >
      {children}
    </span>
  );
}

export const unsplash = (id: string, width = 2000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

/**
 * A Basic component in this catalogue's look: the same type, fields,
 * answer rules and writing (so saved experiences keep working), a
 * different Component, and for a generated one, its own Pending.
 */
export function restyle(
  from: AnyDefinition[],
  type: string,
  Component: ComponentType<any>,
  Pending?: ComponentType<any>,
): AnyDefinition {
  const base = from.find((definition) => definition.type === type);
  if (!base) throw new Error(`No ${type} to restyle`);
  return { ...base, Component, ...(Pending && { Pending }) } as AnyDefinition;
}
