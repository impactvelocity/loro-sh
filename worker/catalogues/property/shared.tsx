/**
 * The Property catalogue's look: an editorial listing, like a single-home
 * site from a good agency. Cormorant Garamond for the big moments only
 * (the address, section headings, the questions, the buyer's name), Inter
 * for everything you read, the wordmark included. Photographs full bleed,
 * hairlines instead of boxes, sentence case everywhere, no pre-titles or
 * numbered steps. Colours come from the coast theme's tokens (--deep,
 * --sand), so another theme can repaint it.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";

import type { AnyDefinition, RenderContext } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

/** Display type: the serif, light and tight. Size it where it's used. */
export const display = "font-display font-[420] tracking-[-0.015em] leading-[0.95]";

/** On a layout: every h2 inside takes the display face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-[420] [&_h2]:tracking-[-0.015em] [&_h2]:leading-[0.98]";

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

/** "Harbour & Grey": Inter, with the ampersand in italic serif. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  const parts = brand.split(/(\s&\s|\sand\s)/);
  return (
    <span className={cn("inline-flex items-baseline font-semibold leading-none tracking-[-0.03em]", className)}>
      {parts.map((part, i) =>
        /&|\sand\s/.test(part) ? (
          <span key={i} className="px-[0.22em] font-display text-[1.3em] font-[420] italic">
            &amp;
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

/** "West 2nd Avenue" with the last word in italic: one word set apart. */
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

/** A section's opening: a big serif heading on the left, an optional line on the right. */
export function SectionHead({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end", className)}>
      <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance @4xl:col-span-7")}>{title}</h2>
      {aside && <div className="@4xl:col-span-4 @4xl:col-start-9 @4xl:pb-3">{aside}</div>}
    </div>
  );
}

/**
 * Every outcome section: a hairline, the heading in big serif on the left
 * (sticky while you read), the section on the right. In a narrow layout
 * (the Agency catalogue's) it stacks.
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
    <section className="grid gap-x-10 gap-y-8 border-t border-border pt-8 @4xl:grid-cols-12">
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

/** A small rounded label for a taste signal or a review keyword. Sentence case, never caps. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "taste" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none",
        tone === "taste" ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "bg-foreground/[0.06] text-muted-foreground",
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
