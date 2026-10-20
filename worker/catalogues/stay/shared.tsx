/**
 * The Stay catalogue's look: a small guest house's site, after
 * Squarespace's Suffolk. Cream paper, a light serif (Source Serif 4) for
 * headings, nav, buttons and the lines you linger on, Inter for forms and
 * small print. Headings sit centred over a narrow column; photos are inset
 * with room around them; italic serif names the small things. Sentence
 * case everywhere, no pre-titles, no numbered steps. Colours come from the
 * shore theme's tokens (--deep, --sand), so another theme can repaint it.
 */
import type { ComponentType, ReactNode } from "react";

import type { AnyDefinition, RenderContext } from "@core/catalogue/define";
import { cn } from "@/lib/utils";
import { CatalogueLink } from "../basic/shared";

/** Display type: the serif, light. Size it where it's used. */
// The line height is an arbitrary property so cn() keeps it when a text size follows.
export const display = "font-display font-[300] tracking-[-0.012em] [line-height:1.08]";

/** On a layout: every h2 inside takes the display face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-[300] [&_h2]:tracking-[-0.012em] [&_h2]:leading-[1.08]";

/** The serif for reading: an intro, a note from the hosts. */
export const lead = "font-display font-[350] text-[clamp(1.3rem,2.2cqi,1.6rem)] [line-height:1.55] text-pretty";

/** A small thing's name, in italic serif: "Not at Point Lobos". */
export const named = "font-display text-[1.6rem] font-[350] italic leading-tight";

/** Supporting text: a distance, a caption, a source. */
export const quiet = "text-sm text-muted-foreground";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[84rem] px-5 @3xl:px-10 @6xl:px-14";

export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-7 font-display text-[1.02rem] font-[400] tracking-[0.01em] transition-[opacity,transform] outline-none",
  "bg-[var(--brand,var(--primary))] text-[var(--brand-foreground,var(--primary-foreground))]",
  "hover:opacity-90 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
);

/** On a photo: white, with the ink on it. */
export const paper = cn(button, "bg-white text-foreground");

/** "Learn more": a serif link with a thin underline. */
export const textLink = "font-display text-[1.05rem] underline decoration-1 underline-offset-[5px] transition-[text-decoration-color] decoration-current/50 hover:decoration-current";

export const field = cn(
  "h-12 w-full rounded-(--radius) border border-input bg-background px-4 text-base outline-none transition-colors",
  "placeholder:text-muted-foreground/70 focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20 aria-invalid:border-red-600",
);

/** The wordmark: the name in the serif, like a sign on the gate. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return <span className={cn("font-display font-[380] tracking-[-0.01em] leading-none whitespace-nowrap", className)}>{brand}</span>;
}

/** "Your stay at Low Tide House" with the last word in italic. */
export function Accent({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em className="italic">{last}</em>
    </>
  );
}

/** A section's opening: the heading centred, with an optional line under it. */
export function SectionHead({ title, body, className }: { title: ReactNode; body?: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-3xl flex-col items-center gap-5 text-center", className)}>
      <h2 className={cn(display, "text-[clamp(2.4rem,5cqi,4rem)] text-balance")}>{title}</h2>
      {body && <div className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{body}</div>}
    </div>
  );
}

/** A link that's a button or a serif text link. Hidden when it has no label. */
export function Action({ link, ctx, kind = "button", className }: { link: { label: string; href: string }; ctx: RenderContext; kind?: "button" | "text" | "paper"; className?: string }) {
  if (!link.label) return null;
  const style = kind === "text" ? textLink : kind === "paper" ? paper : button;
  return (
    <CatalogueLink href={link.href} ctx={ctx} className={cn(style, className)}>
      {link.label}
    </CatalogueLink>
  );
}

/** A small rounded label for a taste signal or a review keyword. Sentence case, never caps. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "taste" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none",
        tone === "taste" ? "bg-[var(--brand)]/15 text-[color-mix(in_oklch,var(--brand),black_45%)]" : "bg-foreground/[0.06] text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

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

/** An Unsplash photo by id, cropped to a width (and a ratio, when given). */
export function unsplash(id: string, w = 1600, ratio?: number) {
  const size = ratio ? `&h=${Math.round(w / ratio)}&fit=crop` : "";
  return `https://images.unsplash.com/${id}?auto=format&q=80&w=${w}${size}`;
}
