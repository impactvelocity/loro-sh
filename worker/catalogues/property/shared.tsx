/**
 * The Property catalogue's look: a listing told in black and white, like
 * a single-home site from a good agency. Archivo, bold and tight, for the
 * big moments only (the address, section headings, the questions, the
 * buyer's name), Inter for everything you read, the wordmark included.
 * Photographs full bleed and in their own colour, black rules instead of
 * boxes, square corners, sentence case everywhere, no pre-titles or
 * numbered steps. Colours come from the mono theme's tokens (--deep,
 * --sand), so another theme can repaint it.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";

import type { AnyDefinition, RenderContext } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

/**
 * Display type: bold and tight. Size it where it's used. The line height
 * is an arbitrary property, since cn() drops a leading-* when a text-[…]
 * size follows it; set another with [line-height:…].
 */
export const display = "font-display font-[680] tracking-[-0.04em] [line-height:0.95]";

/** On a layout: every h2 inside takes the display face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-[680] [&_h2]:tracking-[-0.04em] [&_h2]:[line-height:0.95]";

/** Supporting text: a distance, a caption, a source. */
export const quiet = "text-sm text-muted-foreground";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[88rem] px-5 @3xl:px-10 @6xl:px-16";

/** The deep harbour field: footer, agent. */
export const deep: CSSProperties = { background: "var(--deep)", color: "var(--deep-foreground)" };

export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-7 text-[0.95rem] font-medium tracking-[-0.01em] transition-[opacity,transform] outline-none",
  "bg-[var(--brand,var(--primary))] text-[var(--brand-foreground,var(--primary-foreground))]",
  "hover:opacity-90 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
);

/** A quieter button: an outline in the current colour. */
export const ghost = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-7 text-[0.95rem] font-medium ring-1 ring-current/30 transition-colors outline-none",
  "hover:bg-current/8 focus-visible:ring-2 focus-visible:ring-ring",
);

export const field = cn(
  "h-12 w-full rounded-(--radius) border border-input bg-background px-4 text-base outline-none transition-colors",
  "placeholder:text-muted-foreground/70 focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]/15 aria-invalid:border-red-600",
);

/** "Harbour & Grey" in the display face, bold. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return <span className={cn("font-display font-[720] [line-height:1] tracking-[-0.035em] whitespace-nowrap", className)}>{brand}</span>;
}

/** A section's opening: a big bold heading on the left, an optional line on the right. */
export function SectionHead({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end", className)}>
      <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance @4xl:col-span-7")}>{title}</h2>
      {aside && <div className="@4xl:col-span-4 @4xl:col-start-9 @4xl:pb-3">{aside}</div>}
    </div>
  );
}

/**
 * Every outcome section: a black rule, the heading big and bold on the
 * left (sticky while you read), the section on the right. In a narrow
 * layout it stacks.
 */
export function Frame({
  heading,
  ctx,
  side,
  children,
}: {
  heading: string;
  ctx: RenderContext;
  side?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-8 border-t border-foreground pt-8 @4xl:grid-cols-12">
      <div className="@4xl:col-span-4">
        <div className="flex flex-col gap-5 @4xl:sticky @4xl:top-28">
          {heading && <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance")}>{ctx.fill(heading)}</h2>}
          {side}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-8 @4xl:col-span-8">{children}</div>
    </section>
  );
}

/** A small square label for a taste signal or a review keyword. Sentence case, never caps. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "taste" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs leading-none",
        tone === "taste" ? "bg-foreground text-background" : "bg-foreground/[0.06] text-muted-foreground",
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
