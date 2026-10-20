/**
 * The Festival catalogue's look: an editorial desert. Instrument Serif
 * for the big moments only (the name, section headings, the questions),
 * with the last word in italic where it's a name; Inter for everything
 * else, the logo included, sentence case everywhere (no shouty labels or numbered steps),
 * hairlines instead of boxes, flat
 * fields of plum and sand, and the sunset (sky gradient, striped sun and
 * a faded photo of the desert) kept for the big moments. Colours come from the desert
 * theme's tokens (--sky-1…4, --plum, --sun), so another theme can repaint it.
 */
import { useId, type ComponentType, type CSSProperties, type ReactNode } from "react";

import type { AnyDefinition } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

export const sky: CSSProperties = {
  backgroundImage: "linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 42%, var(--sky-3) 74%, var(--sky-4) 100%)",
  color: "var(--sky-foreground)",
};

/** The same sky, sideways, for strips. */
export const band: CSSProperties = {
  backgroundImage: "linear-gradient(90deg, var(--sky-1), var(--sky-2) 45%, var(--sky-3) 80%, var(--sky-4))",
  color: "var(--sky-foreground)",
};

/** The night band: a flat field of plum. */
export const night: CSSProperties = { background: "var(--plum)", color: "var(--plum-foreground)" };

/** Display type: the serif, tight, for anything big. Size it where it's used. */
export const poster = "font-display font-normal tracking-[-0.018em] leading-[0.92]";

/** On a layout: the Basic catalogue's section headings take the display face too. */
export const posterHeadings = "[&_h2]:font-display [&_h2]:font-normal [&_h2]:tracking-[-0.018em] [&_h2]:leading-[0.95]";

/** Small supporting text: a date, a stage, a drive time. Quiet, in sentence case, on any background. */
export const quiet = "text-sm opacity-65";

/** The page's width: wide, with room at the edges. */
export const wrap = "mx-auto w-full max-w-[88rem] px-5 @3xl:px-10 @6xl:px-16";

export const pill = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[0.95rem] font-medium transition-[transform,opacity,background-color] outline-none",
  "bg-[var(--brand,var(--primary))] text-[var(--brand-foreground,var(--primary-foreground))]",
  "hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
);

/** A quieter pill: an outline in the current colour. */
export const ghostPill = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[0.95rem] font-medium ring-1 ring-current/30 transition-colors outline-none",
  "hover:bg-current/8 focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * The festival's mark: the striped sun beside the name in Inter, or their
 * own logo. Sized by its font size, so it scales from header to footer.
 * `sun={false}` leaves the sun off, for the big name in the footer.
 */
export function Logo({ brand, logo, sun = true, className }: { brand: string; logo?: string; sun?: boolean; className?: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-8 w-auto max-w-44 object-contain" />;
  return (
    <span className={cn("inline-flex items-center gap-[0.4em] font-semibold leading-none tracking-[-0.03em]", className)}>
      {sun && <Sun className="size-[1.25em] shrink-0" />}
      {brand}
    </span>
  );
}

/** "Mirage Valley" with "Valley" in italic: one word set apart, like a poster. */
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

/**
 * A section's opening: the heading in big serif, with an optional line
 * or control on the right. Lines up with every other
 * section on the page.
 */
export function SectionHead({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-6 @4xl:grid-cols-12 @4xl:items-end", className)}>
      <h2 className={cn(poster, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance @4xl:col-span-7")}>{title}</h2>
      {aside && <div className="@4xl:col-span-4 @4xl:col-start-9 @4xl:pb-2">{aside}</div>}
    </div>
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

/** A setting sun, cut by the stripes of a heat haze. */
export function Sun({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const stripes = [46, 55, 63, 70, 76, 81, 86, 90, 94];
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className} style={style}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.93 0.13 92)" />
          <stop offset="55%" stopColor="oklch(0.8 0.16 62)" />
          <stop offset="100%" stopColor="oklch(0.66 0.2 28)" />
        </linearGradient>
        <mask id={`${id}-cut`}>
          <rect width="100" height="100" fill="white" />
          {stripes.map((y, i) => (
            <rect key={y} x="0" y={y} width="100" height={0.7 + i * 0.42} fill="black" />
          ))}
        </mask>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-fill)`} mask={`url(#${id}-cut)`} />
    </svg>
  );
}

/** One contour of a hill: a ring round (cx, cy), wobbled so no two look alike. */
function contour(cx: number, cy: number, r: number, seed: number) {
  const steps = 72;
  const points = Array.from({ length: steps }, (_, k) => {
    const a = (k / steps) * Math.PI * 2;
    const wobble = 1 + 0.15 * Math.sin(3 * a + seed) + 0.07 * Math.sin(5 * a - seed * 1.7);
    return `${(cx + Math.cos(a) * r * wobble * 1.3).toFixed(1)},${(cy + Math.sin(a) * r * wobble).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

/** Two hills' contours, one in each corner, and the route between them. */
const hills = [
  ...Array.from({ length: 9 }, (_, i) => contour(170, 25, 8 + i * 9, 0.4 + i * 0.3)),
  ...Array.from({ length: 7 }, (_, i) => contour(15, 190, 10 + i * 10, 2.1 + i * 0.25)),
];

/**
 * A topographic map behind the sign-up: contour lines in the corners and a
 * dashed route climbing to a pin, faint enough to read over.
 */
export function Contours({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 size-full", className)}>
      <g fill="none" stroke="var(--plum)" strokeOpacity="0.08" strokeWidth="0.6" vectorEffect="non-scaling-stroke">
        {hills.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <path
        d="M-5 175 C 40 150, 60 185, 95 140 S 140 95, 176 30"
        fill="none"
        stroke="var(--brand)"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeDasharray="1 5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="176" cy="30" r="3.5" fill="var(--brand)" fillOpacity="0.12" />
      <circle cx="176" cy="30" r="1.5" fill="var(--brand)" fillOpacity="0.45" />
    </svg>
  );
}

/** A photo from Unsplash's CDN, sized for the screen. */
export const unsplash = (id: string, width = 2000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

/**
 * A photo faded into the sky behind a big moment: blended into the
 * gradient so the palette holds whatever the photo, and (with `night`)
 * sinking into the plum band at the bottom, so the sun sets into it
 * (`long`: over the lower 60%, for a hero that runs into the night band).
 * Place it first inside a relative, isolated box that has the sky.
 */
export function Backdrop({ src, night: toNight = false, long = false }: { src: string; night?: boolean; long?: boolean }) {
  return (
    <>
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover opacity-55 mix-blend-soft-light"
          fetchPriority="high"
        />
      )}
      {toNight && (
        <div
          aria-hidden
          className={cn("absolute inset-x-0 bottom-0 z-[-5] bg-linear-to-b from-transparent to-[var(--plum)]", long ? "h-3/5" : "h-2/5")}
        />
      )}
    </>
  );
}

/** An act's photo from Qloo, or a tile in their stage's colour with their initials. */
export function ActArt({
  name,
  image,
  color,
  className,
}: {
  name: string;
  image: string | null | undefined;
  color: string;
  className?: string;
}) {
  if (image) return <img src={image} alt="" className={cn("bg-muted object-cover", className)} />;
  const initials = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <div
      aria-hidden
      className={cn("flex items-end justify-start overflow-hidden p-2", className)}
      style={{ backgroundImage: `linear-gradient(150deg, ${color}, color-mix(in oklch, ${color} 45%, var(--plum)))` }}
    >
      <span className="text-[1.6em] font-semibold tracking-tight text-white/90">{initials}</span>
    </div>
  );
}

/** A coloured dot and the stage's name. */
export function Stage({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}
