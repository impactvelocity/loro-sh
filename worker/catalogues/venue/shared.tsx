/**
 * The Venue catalogue's look, after the room it is on a Tuesday: black
 * walls, flyers pasted over flyers, a photocopy gone pink. Big Shoulders
 * Display in caps for anything on a poster (the hero, section headings,
 * questions, show titles), its stencil cut for the venue's name, Space
 * Mono for ticket facts (dates, doors, prices), Inter for what you read.
 *
 * Mostly ink. Colour comes in small doses: photos printed in one ink
 * (pink, orange or yellow), date stickers, the odd field of pink into
 * orange. Pink means "for you": a pick, a match, the button. Texture is
 * SVG noise from the gig theme (grain, dust, ink specks, worn print), so
 * there's nothing to download. Sentence case in the copy, no pre-titles,
 * no numbered steps.
 */
import { useId, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";

import type { AnyDefinition } from "@core/catalogue/define";
import { cn } from "@/lib/utils";
import { dayOfMonth, monthName } from "./programme";

/** Poster type: Big Shoulders Display, heavy, condensed, in caps. Size it where it's used. */
export const display = "font-display font-extrabold uppercase [line-height:0.86] tracking-[-0.004em]";

/** The venue's name: the stencil cut, like it was sprayed over the door. */
export const logoFace = "[font-family:var(--font-logo-face,var(--font-display-face))] font-extrabold uppercase tracking-[0.03em]";

/** Ticket facts: dates, doors, prices, counts. */
export const mono = "[font-family:var(--font-mono-face,ui-monospace)] tracking-[0.01em]";

/** On a layout: every h2 inside takes the poster face, Basic components included. */
export const displayHeadings = "[&_h2]:font-display [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:[line-height:0.88]";

/** Reading text: Inter, a little tight. */
export const body = "tracking-[-0.011em]";

/** Supporting text: a door time, a caption, a source. */
export const quiet = "text-sm text-muted-foreground";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[88rem] px-5 @3xl:px-10 @6xl:px-16";

/** The inks a flyer can be printed in. */
export type Ink = "hot" | "flare" | "acid" | "paper";
export const inks: Ink[] = ["hot", "flare", "acid"];
const inkColour = (ink: Ink) => `var(--${ink})`;

/** A stable number from a string, so a flyer sits the same way on every visit. */
function hash(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/** A small tilt, between -max and max degrees, the same for the same key. */
export const tilt = (key: string, max = 2) => Number(((hash(key) * 2 - 1) * max).toFixed(2));

/** One of a list, the same for the same key. */
export const pick = <T,>(key: string, list: readonly T[]) => list[Math.floor(hash(`${key}:pick`) * list.length) % list.length];

/** The box office button: pink, ink type, an orange block under it like a misprint. */
export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 px-6 font-display text-[1.2rem] font-extrabold tracking-[0.05em] uppercase outline-none",
  "bg-[var(--hot)] text-[var(--ink)] shadow-[4px_4px_0_var(--flare)] transition-[translate,box-shadow,background-color]",
  "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--flare)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  "focus-visible:ring-2 focus-visible:ring-[var(--acid)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
);

/** A quieter button: a cream outline that goes pink. */
export const ghost = cn(
  "inline-flex h-12 items-center justify-center gap-2 px-6 font-display text-[1.2rem] font-extrabold tracking-[0.05em] uppercase outline-none",
  "ring-2 ring-foreground/40 transition-[box-shadow,color] ring-inset hover:text-[var(--hot)] hover:ring-[var(--hot)] focus-visible:ring-[var(--acid)]",
);

/** A text field: a cream underline that turns pink. */
export const line = cn(
  "w-full border-0 border-b-2 border-foreground/30 bg-transparent px-0 outline-none transition-colors",
  "placeholder:text-foreground/35 focus:border-[var(--hot)] aria-invalid:border-red-400",
);

/** The venue's name, stencilled. Or their own logo. */
export function Logo({ brand, logo, className }: { brand: string; logo?: string; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return <span className={cn(logoFace, "[line-height:1]", className)}>{brand}</span>;
}

/** The last word of a line in pink, like a second pass through the press. */
export function Accent({ text }: { text: string }) {
  const at = text.trimEnd().lastIndexOf(" ");
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)} <span className="text-[var(--hot)]">{text.slice(at + 1)}</span>
    </>
  );
}

/** A section's opening: a small label on the left, the heading big on the right. */
export function SectionHead({ label, title, aside, className }: { label?: string; title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end", className)}>
      {/* Beside the heading only: stacked above it, it would read as a pre-title. */}
      {label && <p className={cn(mono, "text-[0.8rem] text-muted-foreground @max-4xl:hidden @4xl:col-span-3 @4xl:pb-3")}>{label}</p>}
      <h2 className={cn(display, "gig-worn text-[clamp(3.5rem,9cqi,8.5rem)] text-balance", label ? "@4xl:col-span-9" : "@4xl:col-span-8")}>{title}</h2>
      {aside && <div className={cn("@4xl:col-span-6", label ? "@4xl:col-start-4" : "")}>{aside}</div>}
    </div>
  );
}

/**
 * A date sticker slapped on a flyer: the month in mono, the day big.
 * Paper for any show, pink for theirs. Tilted a little, a bit worn.
 */
export function DateStamp({ date, ink = "paper", size = "md", className }: { date: string; ink?: Ink; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "gig-worn flex shrink-0 flex-col items-center justify-center gap-0.5 text-[var(--ink)]",
        size === "sm" ? "size-14" : size === "md" ? "size-16" : "size-22",
        className,
      )}
      style={{ background: inkColour(ink), rotate: `${tilt(date, 6)}deg` }}
    >
      <span className={cn(mono, "text-[0.62rem] font-bold tracking-[0.14em] uppercase [line-height:1]")}>{monthName(date).slice(0, 3)}</span>
      <span className={cn(display, size === "sm" ? "text-[1.75rem]" : size === "md" ? "text-[2.2rem]" : "text-[3rem]", "[line-height:0.8]")}>{dayOfMonth(date)}</span>
    </span>
  );
}

/** A small square label: pink for what's theirs, plain for the rest. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "hot" }) {
  return (
    <span
      className={cn(
        mono,
        "inline-flex items-center gap-1 px-2 py-1 text-[0.7rem] [line-height:1]",
        tone === "hot" ? "bg-[var(--hot)]/12 text-[var(--hot)] ring-1 ring-[var(--hot)]/50" : "bg-foreground/[0.08] text-foreground/75",
      )}
    >
      {children}
    </span>
  );
}

/**
 * A photo printed in one ink on black: the light parts take the colour,
 * the dark stay black, with print dots over it. With `reveal`, hovering
 * its group shows the photo as it is. Falls back to `fallback` when
 * there's no photo or the link is dead (some of Qloo's are).
 */
export function Duotone({
  src,
  ink = "hot",
  reveal,
  dim,
  eager,
  fallback,
  className,
}: {
  src: string | null | undefined;
  ink?: Ink;
  reveal?: boolean;
  dim?: boolean;
  eager?: boolean;
  fallback?: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const shown = Boolean(src) && failed !== src;
  return (
    <div className={cn("relative isolate overflow-hidden bg-[var(--deep)]", className)}>
      {shown ? (
        <img
          src={src!}
          alt=""
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(src!)}
          className={cn(
            "absolute inset-0 size-full object-cover grayscale contrast-[1.25] brightness-[1.15]",
            dim && "brightness-[0.7]",
            reveal && "transition-[filter] duration-500 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100",
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--ink)]/70">{fallback}</div>
      )}
      <div
        aria-hidden
        className={cn("absolute inset-0 mix-blend-multiply", reveal && shown && "transition-opacity duration-500 group-hover:opacity-0")}
        style={{ background: inkColour(ink) }}
      />
      <div aria-hidden className={cn("gig-dots absolute inset-0 opacity-30 mix-blend-multiply", reveal && shown && "transition-opacity duration-500 group-hover:opacity-0")} />
    </div>
  );
}

/**
 * Behind a hero: the photo dark and printed pink into orange, dust over it,
 * fading into the page at the bottom so the type sits on it.
 */
export function Backdrop({ image, drift, strength = "medium" }: { image: string; drift?: boolean; strength?: "medium" | "strong" }) {
  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[var(--deep)]" />
      {image && (
        <img
          src={image}
          alt=""
          fetchPriority="high"
          className={cn(
            "absolute inset-0 -z-10 size-full object-cover grayscale contrast-[1.35]",
            strength === "strong" ? "brightness-[0.5]" : "brightness-[0.85]",
            drift && "animate-drift motion-reduce:animate-none",
          )}
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-150 from-[var(--hot)] via-[var(--hot)] to-[var(--flare)] mix-blend-multiply" />
      <div aria-hidden className="gig-dots absolute inset-0 -z-10 opacity-35 mix-blend-multiply" />
      <div aria-hidden className="gig-dust absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-background via-background/20 to-background/40" />
    </>
  );
}

/** A strip of masking tape holding something to the wall. Place it with className. */
export function Tape({ className, turn = -3 }: { className?: string; turn?: number }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute z-10 h-6 w-24 bg-[var(--paper)]/60 mix-blend-screen", className)}
      style={{ rotate: `${turn}deg`, clipPath: "polygon(2% 8%, 98% 0, 100% 28%, 97% 52%, 100% 78%, 98% 100%, 1% 94%, 3% 66%, 0 40%)" }}
    />
  );
}

/** A ragged edge, like paper torn off a wall: a clip-path for a block's top, bottom or both. */
export function torn(edge: "top" | "bottom" | "both", seed = 1, depth = 12): CSSProperties {
  let s = seed * 7919;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const steps = 56;
  const top = Array.from({ length: steps + 1 }, (_, i) => `${((i / steps) * 100).toFixed(2)}% ${edge === "bottom" ? 0 : (rand() * depth).toFixed(1)}px`);
  const bottom = Array.from(
    { length: steps + 1 },
    (_, i) => `${(100 - (i / steps) * 100).toFixed(2)}% calc(100% - ${edge === "top" ? 0 : (rand() * depth).toFixed(1)}px)`,
  );
  return { clipPath: `polygon(${[...top, ...bottom].join(", ")})` };
}

/**
 * A round rubber stamp: the words run round the edge, a big mark in the
 * middle. Decoration; the same facts are on the page in words.
 */
export function Seal({ text, mark, className }: { text: string; mark: string; className?: string }) {
  const ring = `${text.trim()} · `;
  const id = useId();
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={cn("gig-worn text-[var(--hot)]", className)} style={{ rotate: `${tilt(text, 12)}deg` }}>
      <defs>
        <path id={id} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="100" r="54" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text fill="currentColor" style={{ fontFamily: "var(--font-mono-face)", fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <textPath href={`#${id}`} textLength={452} lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{ fontFamily: "var(--font-display-face)", fontSize: 50, fontWeight: 900, textTransform: "uppercase" }}
      >
        {mark}
      </text>
    </svg>
  );
}

/** Grain over a whole layout. Put it last inside a `relative isolate` root. */
export function Grain() {
  return <div aria-hidden className="gig-grain pointer-events-none absolute inset-0 z-40" />;
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
