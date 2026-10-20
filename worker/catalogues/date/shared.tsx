/**
 * The Date catalogue's look, after Squarespace's Fayette: one deep wine
 * field, light high-contrast serif for the big moments (the hero, section
 * headings, the questions, the times on the plan), Inter set light and
 * tight for everything you read. Cream buttons with dark type, square
 * corners, photographs full bleed under a wine wash, hairlines instead of
 * cards. Sentence case, no pre-titles, no numbered steps.
 *
 * Colours come from the velvet theme's tokens (--wine, --deep, --blush,
 * --cream), so another theme can repaint it. Blush always means the person
 * they're taking out; cream means the one planning. Sections switch
 * between the wine and cream with the `light` and `dark` scopes, which
 * reset the tokens components read, so every component works on both.
 */

/** A cream section: wine type, wine buttons, a deeper blush. */
export const light = {
  "--background": "var(--cream)",
  "--foreground": "var(--cream-foreground)",
  "--border": "oklch(0.28 0.1 27 / 14%)",
  "--input": "oklch(0.28 0.1 27 / 28%)",
  "--muted-foreground": "oklch(0.28 0.1 27 / 66%)",
  // On cream, their colour is the wine: a brighter red reads as an error.
  "--blush": "var(--wine)",
  "--button": "var(--wine)",
  "--button-foreground": "var(--wine-foreground)",
  // Shared components (the run footer's bar) read the brand colour.
  "--brand": "var(--wine)",
  "--brand-foreground": "var(--wine-foreground)",
  background: "var(--background)",
  color: "var(--foreground)",
} as CSSProperties;

/** A wine section inside a cream page. */
export const dark = {
  "--background": "var(--wine)",
  "--foreground": "var(--wine-foreground)",
  "--border": "oklch(0.97 0.012 75 / 16%)",
  "--input": "oklch(0.97 0.012 75 / 32%)",
  "--muted-foreground": "oklch(0.97 0.012 75 / 68%)",
  "--blush": "var(--blush-light)",
  "--button": "var(--cream)",
  "--button-foreground": "var(--cream-foreground)",
  "--brand": "var(--cream)",
  "--brand-foreground": "var(--cream-foreground)",
  background: "var(--background)",
  color: "var(--foreground)",
} as CSSProperties;

/** For a section's tone field. */
export const toneStyle = (tone: string) => (tone === "light" ? light : tone === "dark" ? dark : undefined);
import type { ComponentType, CSSProperties, ReactNode } from "react";

import type { AnyDefinition } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

/** Display type: the serif, light. Size it where it's used. */
export const display = "font-display font-normal tracking-[-0.01em] leading-[1.02]";

/** On a layout: every h2 inside takes the display face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-normal [&_h2]:tracking-[-0.01em] [&_h2]:leading-[1.04]";

/** Reading text: Inter, light and a little tight, like Fayette's. */
export const body = "font-light tracking-[-0.015em]";

/** Supporting text: a walk time, a caption, a source. */
export const quiet = "text-sm font-light text-muted-foreground";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[88rem] px-5 @3xl:px-10 @6xl:px-16";

/** Fayette's button: square, small type. Cream on the wine, wine on the cream. */
export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-7 text-[0.9rem] font-normal tracking-[0.01em] transition-[opacity,transform] outline-none",
  "bg-[var(--button)] text-[var(--button-foreground)]",
  "hover:opacity-90 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--button)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
);

/** A quieter button: a cream outline. */
export const ghost = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-7 text-[0.9rem] font-normal ring-1 ring-current/35 transition-colors outline-none",
  "hover:bg-current/8 focus-visible:ring-2 focus-visible:ring-ring",
);

/** A text field on the wine: an underline in cream. */
export const line = cn(
  "w-full border-0 border-b border-foreground/35 bg-transparent px-0 font-light tracking-[-0.015em] outline-none transition-colors",
  "placeholder:text-foreground/45 focus:border-foreground aria-invalid:border-[var(--blush)]",
);

/** A small boxed field, for forms on a photo. */
export const field = cn(
  "h-12 w-full rounded-(--radius) border border-foreground/35 bg-black/10 px-4 text-base font-light outline-none transition-colors backdrop-blur-sm",
  "placeholder:text-foreground/55 focus-visible:border-foreground aria-invalid:border-[var(--blush)]",
);

/** "Overlap" in the serif, like Fayette's wordmark. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return <span className={cn("font-display leading-none tracking-[-0.01em]", className)}>{brand}</span>;
}

/** A section's opening: the label small on the left, the heading big on the right, like Fayette's location row. */
export function SectionHead({ label, title, aside, className }: { label?: string; title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-baseline", className)}>
      {/* Beside the heading only: stacked above it, it would read as a pre-title. */}
      {label && <p className={cn(body, "text-[0.95rem] opacity-80 @max-4xl:hidden @4xl:col-span-3")}>{label}</p>}
      <h2 className={cn(display, "text-[clamp(2.75rem,6.5cqi,5.75rem)] text-balance", label ? "@4xl:col-span-9" : "@4xl:col-span-8")}>{title}</h2>
      {aside && <div className={cn("@4xl:col-span-6", label ? "@4xl:col-start-4" : "")}>{aside}</div>}
    </div>
  );
}

/** A small rounded label: blush for their taste, cream for yours, plain for the rest. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "theirs" | "yours" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-normal",
        tone === "theirs" && "bg-[var(--blush)]/18 text-[var(--blush)] ring-1 ring-[var(--blush)]/35",
        tone === "yours" && "bg-foreground/10 text-foreground ring-1 ring-foreground/25",
        tone === "plain" && "bg-foreground/[0.07] text-foreground/70",
      )}
    >
      {children}
    </span>
  );
}

/** A photo under a wine wash, so type sits on it and the palette holds. Light keeps the photo's own colours. */
export function Wash({ image, strength = "medium", drift }: { image: string; strength?: "light" | "medium" | "strong"; drift?: boolean }) {
  if (!image) return null;
  return (
    <>
      <img
        src={image}
        alt=""
        fetchPriority="high"
        className={cn("absolute inset-0 -z-10 size-full object-cover", drift && "animate-drift motion-reduce:animate-none")}
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 bg-[var(--wine)] mix-blend-multiply",
          strength === "light" ? "opacity-25" : strength === "medium" ? "opacity-45" : "opacity-70",
        )}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/55 via-black/10 to-black/30" />
    </>
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
