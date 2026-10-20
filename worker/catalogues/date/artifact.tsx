/**
 * The Date catalogue's outcome: the date, planned for the person who's
 * taking someone out, around what that someone loves. Set on cream, with
 * the wine kept for the cover, the invite and how it was made.
 *
 * - Cover: the day and their match's name over a photo, the neighbourhood
 *   and the hours. While it's made it shows the search: whose favourites
 *   Qloo matched (theirs in blush, yours in cream) and the steps.
 * - Where You Overlap: pairs from the two lists that sit close together.
 * - The Plan: the hours stop by stop from the Date Plan step's places, each
 *   with its time, what to get, why it's there and the walk to the next,
 *   beside a map of the route and walking directions.
 * - Things to Ask: openers from their favourites and the plan.
 * - Afterwards: a spot if it runs late, and one to swap in if it rains.
 * - The Invite: the text to send them, with a copy button.
 * - How It Was Made: for demos, the run laid out.
 */
import { useState } from "react";
import { ArrowUpRightIcon, CheckIcon, CopyIcon, HeartIcon, MapPinIcon, MessageCircleQuestionIcon, MessageSquareTextIcon, MoonStarIcon, PanelTopIcon, RouteIcon, SparklesIcon, WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";

import { type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink } from "../basic/shared";
import { type DatePlan, type DateSlot, haversine, isDatePlan, samplePlan, walkMinutes, walkingLink, whose } from "./date";
import { Chip, Logo, Wash, body, button, dark, display, displayHeadings, ghost, light, quiet, wrap } from "./shared";

const pulse = "animate-pulse rounded-(--radius) bg-foreground/[0.08]";
const tokens = "Use {{first_name}}, {{answers.match}}, {{day}}, {{area}}, {{from}} or {{to}}.";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

/** The plan from the step a section picks from, or else from any step that made one. */
function planFor(ctx: RenderContext, lookups: string[] = []): DatePlan | null {
  for (const id of lookups) {
    const data = ctx.outcome?.section(id).data;
    if (isDatePlan(data)) return data;
  }
  const step = ctx.outcome?.state.steps.find((s) => isDatePlan(s.data));
  return step && isDatePlan(step.data) ? step.data : null;
}

/** The text with the plan's day, area and hours filled in, then the profile's tokens. */
function fillPlan(ctx: RenderContext, plan: DatePlan | null, text: string) {
  const filled = text
    .replaceAll("{{day}}", plan?.day ?? "The date")
    .replaceAll("{{area}}", plan?.area.split(",")[0] ?? "")
    .replaceAll("{{from}}", plan?.from ?? "")
    .replaceAll("{{to}}", plan?.to ?? "");
  return ctx.fill(filled);
}

/** Their match's first name, from the answers. */
function matchName(ctx: RenderContext) {
  const answer = ctx.answers.match;
  return typeof answer === "string" && answer.trim() ? answer.trim().split(/\s+/)[0] : "them";
}

const mapsLink = (entity: TasteEntity) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([entity.name, entity.address].filter(Boolean).join(", "))}`;

const placeMeta = (entity: TasteEntity) =>
  [entity.neighbourhood, entity.priceLevel ? "$".repeat(entity.priceLevel) : null, entity.tags[0]].filter(Boolean).join(" · ");

const rank = (tone: ReturnType<typeof whose>) => (tone === "theirs" ? 0 : tone === "yours" ? 1 : 2);

/** "Maya likes …" (with a heart) and "You like …", theirs first. */
function Because({ entity, plan, name, limit = 3 }: { entity: TasteEntity; plan: DatePlan | null; name: string; limit?: number }) {
  if (entity.because.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...entity.because]
        .sort((a, b) => rank(whose(a, plan)) - rank(whose(b, plan)))
        .slice(0, limit)
        .map((signal) => {
          const tone = whose(signal, plan);
          return (
            <Chip key={signal}>
              {tone === "theirs" && <HeartIcon aria-hidden className="size-3 fill-current text-[var(--wine)]" />}
              {tone === "yours" ? "You like" : tone === "theirs" ? `${name} likes` : "Like"} {signal}
            </Chip>
          );
        })}
    </div>
  );
}

/** A place's photo, or a pin when it has none or the link is dead (some of Qloo's are). */
function Thumb({ src, className }: { src: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src)
    return (
      <div className={cn("flex items-center justify-center bg-foreground/[0.07] opacity-70", className)}>
        <MapPinIcon className="size-5" />
      </div>
    );
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} className={cn("bg-foreground/[0.07] object-cover", className)} />;
}

/** Every outcome section but the plan: the heading in big serif on the left, sticky while you read; the section on the right. */
function Frame({ heading, side, children }: { heading: string; side?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-8 @4xl:grid-cols-12">
      <div className="@4xl:col-span-4">
        <div className="flex flex-col gap-5 @4xl:sticky @4xl:top-28">
          {heading && <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance")}>{heading}</h2>}
          {side}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-8 @4xl:col-span-8">{children}</div>
    </section>
  );
}

function PendingRows({ heading, rows }: { heading: string; rows: number }) {
  return (
    <Frame heading={heading}>
      <div className="flex flex-col border-t border-border" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5 border-b border-border py-6">
            <div className={cn(pulse, "h-5 w-1/3")} />
            <div className={cn(pulse, "h-4 w-5/6")} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "App name", default: "Overlap" }),
    logo: f.image({ label: "Logo" }),
    cta: f.link({ label: "Header button", default: { label: "Send the invite", href: "#invite" }, help: "Stays at the top as they read, once the page is ready." }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => {
    const ready = ctx.outcome?.status !== "running";
    return (
      <div style={light} className={cn("flex flex-1 flex-col antialiased", body)}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className={cn(wrap, "flex h-18 items-center justify-between gap-4")}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.6rem]" />
            <div className="flex min-w-0 items-center gap-5">
              {ctx.person && <span className={cn(quiet, "truncate @max-2xl:hidden")}>For {ctx.person.name || ctx.person.email}</span>}
              {ready && settings.cta.label && (
                <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, "h-10 animate-in px-5 whitespace-nowrap duration-700 fade-in")}>
                  {settings.cta.label}
                </CatalogueLink>
              )}
            </div>
          </div>
        </header>
        <main className={cn(wrap, "flex flex-1 flex-col gap-24 pt-3 pb-32 @3xl:gap-32", displayHeadings)}>{children}</main>
        <footer className="bg-[var(--deep)] text-[var(--deep-foreground)]">
          <div className={cn(wrap, "flex flex-col gap-3 py-10 text-sm opacity-75 @2xl:flex-row @2xl:justify-between")}>
            {settings.footer && <span>{settings.footer}</span>}
            <span>{settings.brand}</span>
          </div>
        </footer>
        <RunFooter ctx={ctx} />
      </div>
    );
  },
});

/** Favourites Qloo matched, split by whose they are. Before the plan says, by which answer names them. */
function splitFavourites(ctx: RenderContext, plan: DatePlan | null, matched: string[]) {
  if (plan) return { theirs: plan.theirs, yours: plan.yours };
  const read = (id: string) => String(ctx.answers[id] ?? "").toLowerCase();
  const theirs = matched.filter((name) => read("their_taste").includes(name.toLowerCase()));
  const yours = matched.filter((name) => !theirs.includes(name) && read("your_taste").includes(name.toLowerCase()));
  return { theirs, yours };
}

/** The last few steps the cover lists while the page is being made. */
const MAKING_LINES = 4;

/**
 * The cover while the page is being made: the heading with dots that keep
 * moving, whose favourites Qloo matched, a count of the places it's
 * weighing, then the run's steps as they finish. Only what the run has
 * actually done, in its own words.
 */
function Making({ outcome, heading, ctx, plan }: { outcome: OutcomeView; heading: string; ctx: RenderContext; plan: DatePlan | null }) {
  const taste = outcome.state.steps.find((step) => step.kind === "taste");
  const matched = (taste?.data as { matched?: string[] } | null)?.matched ?? [];
  const { theirs, yours } = splitFavourites(ctx, plan, matched);
  const places = Object.values(outcome.state.entities).filter((entity) => entity.type === "place");
  const lines = outcome.state.steps.filter((step) => !step.background && step.status !== "pending" && step.status !== "skipped").slice(-MAKING_LINES);
  const name = matchName(ctx);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-9">
      <h1 className={cn(display, "max-w-4xl text-[clamp(3rem,7.5cqi,7rem)] leading-[0.95] text-balance")}>
        {heading}
        <span aria-hidden className="inline-flex gap-[0.1em] pl-[0.1em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {(theirs.length > 0 || yours.length > 0) && (
        <div className="grid max-w-3xl gap-6 @3xl:grid-cols-2">
          {[
            { label: `What ${name} loves`, names: theirs, tone: "theirs" as const },
            { label: "What you love", names: yours, tone: "yours" as const },
          ]
            .filter((group) => group.names.length > 0)
            .map((group) => (
              <div key={group.tone} className="flex flex-col gap-3">
                <span className="text-sm opacity-70">{group.label}</span>
                <ul className="flex flex-wrap gap-2">
                  {group.names.map((n, i) => (
                    <li
                      key={n}
                      className={cn(
                        "animate-in rounded-full px-3.5 py-1.5 text-sm ring-1 backdrop-blur fill-mode-both fade-in zoom-in-95 duration-500",
                        group.tone === "theirs" ? "bg-[var(--blush)]/15 text-[var(--blush)] ring-[var(--blush)]/40" : "bg-white/10 ring-white/25",
                      )}
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
      {places.length > 0 && (
        <p className="text-sm opacity-75">
          {places.length} {places.length === 1 ? "place" : "places"} weighed{plan ? ` in ${plan.area.split(",")[0]}` : ""}
        </p>
      )}
      <ul className="flex max-w-md flex-col gap-2.5">
        {lines.map((step) => {
          const live = step.status === "running";
          return (
            <li key={step.id} className="flex animate-in items-center gap-3 text-[1.05rem] duration-500 fade-in slide-in-from-bottom-2">
              {live ? (
                <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
                  <span className="absolute size-5 animate-ping rounded-full bg-white/35 motion-reduce:animate-none" />
                  <span className="size-2.5 rounded-full bg-white" />
                </span>
              ) : (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--cream-foreground)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "opacity-100" : "opacity-70")}>
                {ctx.fill(step.message ?? step.label).replace(/ in Qloo\b/, "")}
                {live && (
                  <span aria-hidden className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The top of the page: the day and their match's name over a photo, the neighbourhood and the hours. */
const cover = defineComponent({
  type: "cover",
  name: "Cover",
  description: "The day and their match's name over a photo, with where and when. Shows the search while the page is made.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Title", default: "{{day}} with {{answers.match}}", help: tokens }),
    intro: f.longText({ label: "Intro", help: tokens }),
    image: f.image({ label: "Photo" }),
    link: f.link({ label: "Button", default: { label: "See the plan", href: "#plan" } }),
    making: f.text({ label: "While it's being made", default: "Planning the date with {{answers.match}}", help: "Shown in place of the title until the page is ready." }),
  },
  Component: ({ props, ctx }) => {
    const plan = planFor(ctx);
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    const when = plan ? [plan.area.split(",")[0], [plan.day, plan.date].filter(Boolean).join(", "), `${plan.from} to ${plan.to}`].join(" · ") : null;
    return (
      <header style={dark} className="relative isolate -mx-5 overflow-hidden @3xl:-mx-10 @6xl:mx-0">
        <Wash image={props.image} strength={making ? "strong" : "medium"} drift={Boolean(making)} />
        {/* While it's made, the run footer's fade covers the bottom of the page: keep the search above it. */}
        <div
          className={cn(
            "flex min-h-[min(80svh,48rem)] flex-col px-5 pt-40 @3xl:px-10 @6xl:px-14",
            making ? "justify-start pt-28 pb-64 @3xl:pt-32" : "justify-end pb-12 @3xl:pb-16",
          )}
        >
          {making ? (
            <Making outcome={making} heading={fillPlan(ctx, plan, props.making)} ctx={ctx} plan={plan} />
          ) : (
            <div className="flex animate-in flex-col items-center gap-7 text-center duration-1000 fade-in slide-in-from-bottom-4">
              {when && <p className="text-[0.95rem] opacity-85">{when}</p>}
              <h1 className={cn(display, "max-w-5xl text-[clamp(3.5rem,10cqi,9rem)] leading-[0.94] text-balance")}>{fillPlan(ctx, plan, props.title)}</h1>
              {props.intro && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-90">{fillPlan(ctx, plan, props.intro)}</p>}
              {props.link.label && (
                <CatalogueLink href={props.link.href} ctx={ctx} className={cn(button, "mt-1")}>
                  {props.link.label}
                </CatalogueLink>
              )}
            </div>
          )}
        </div>
      </header>
    );
  },
});

// Where You Overlap: the two lists, side by side, where they meet.

const overlap = defineGenerated({
  type: "overlap",
  name: "Where You Overlap",
  description: "Pairs from the two lists of favourites that sit close together, and what they share.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Where you overlap" }),
    count: f.number({ label: "Pairs", default: 3, min: 1, max: 4 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        line: z.string().describe("One sentence on where the two lists meet, naming one favourite from each"),
        pairs: z
          .array(
            z.object({
              theirs: z.string().describe("One of their match's favourites, exactly as written in their answer"),
              yours: z.string().describe("One of the planner's favourites, exactly as written in their answer. Empty if they gave none."),
              note: z.string().describe("One sentence: what the two share that you can hear, see or taste"),
            }),
          )
          .describe(`Up to ${props.count} pairs, closest first`),
      }),
    instructions: (props) =>
      `Read the two lists of favourites in the profile: what their match loves, and what the planner loves. Find up to ${props.count} pairs, ` +
      "one from each list, that sit close together, and say in one sentence what each pair shares that you could point at: " +
      "the instruments and the tempo, the city a film is set in, how a book or a menu is put together. " +
      "Write it as a fact about the two, not as advice about the evening; no 'suits', 'perfect for' or 'side of'. " +
      "Only names from their answers. If the planner gave none, pair each of their match's favourites with nothing and say what it tells you about a good evening. " +
      "If their match's answer names nothing real, return no pairs and an empty line; never write about the answers themselves. " +
      "Don't state facts about an artist, film or book you're not sure of. Don't name places; the plan does.",
    sample: () => ({
      line: "You both have Khruangbin on; Maya also lists Phoebe Bridgers and In the Mood for Love.",
      pairs: [
        { theirs: "Phoebe Bridgers", yours: "Big Thief", note: "Quiet guitars, close-up voices, songs you listen to with the lights low." },
        { theirs: "In the Mood for Love", yours: "Lost in Translation", note: "Two people, a city at night, a lot left unsaid." },
      ],
    }),
  },
  Pending: ({ props }) => <PendingRows heading={props.heading} rows={2} />,
  Component: ({ props, ctx, section }) => {
    const pairs = (section.data?.pairs ?? []).filter((pair) => pair?.theirs);
    const writing = section.status === "generating";
    const name = matchName(ctx);
    // Nothing named that pairs up (an answer like "x"): the plan carries the page, so leave this out.
    if (pairs.length === 0) return writing ? <PendingRows heading={props.heading} rows={2} /> : null;
    return (
      <Frame heading={props.heading} side={section.data?.line && <p className="text-lg leading-relaxed text-pretty opacity-80">{section.data.line}</p>}>
        <div className="grid grid-cols-2 gap-x-8 border-b border-border pb-3 text-sm opacity-70">
          <span className="text-[var(--blush)]">{name}</span>
          <span>You</span>
        </div>
        <ul className="-mt-8 flex flex-col">
          {pairs.map((pair, i) => (
            <li key={i} className="flex flex-col gap-3 border-b border-border py-7">
              <div className="grid grid-cols-2 items-baseline gap-x-8">
                <span className={cn(display, "text-[clamp(1.75rem,3.4cqi,2.75rem)] text-[var(--blush)] text-balance")}>{pair?.theirs}</span>
                <span className={cn(display, "text-[clamp(1.75rem,3.4cqi,2.75rem)] text-balance")}>{pair?.yours}</span>
              </div>
              {pair?.note && (
                <p className="max-w-2xl leading-relaxed text-pretty opacity-85">
                  {pair.note}
                  <Writing on={writing && i === pairs.length - 1} />
                </p>
              )}
            </li>
          ))}
        </ul>
      </Frame>
    );
  },
});

// The Plan: the hours stop by stop, with a map of the walk.

type PlanStop = { slot?: string; entity?: string; title?: string; note?: string; order?: string };
type PlanData = { headline?: string; stops?: (PlanStop | undefined)[]; tip?: string };

/** Web Mercator: a point to world pixels at a zoom, 256 px tiles. */
function project(p: { lat: number; lng: number }, z: number) {
  const size = 256 * 2 ** z;
  const sin = Math.sin((p.lat * Math.PI) / 180);
  return { x: ((p.lng + 180) / 360) * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
}

/**
 * The walk on a quiet street map: Esri's light grey canvas (streets, no
 * labels, from OpenStreetMap and others), toned to the page, the
 * route as a dashed line from stop to stop, each stop with its time. The
 * zoom fits the stops exactly; with one stop so far, it centres on it at
 * street level.
 */
function RouteMap({ plan, stops }: { plan: DatePlan; stops: { entity: TasteEntity; slot: DateSlot | null }[] }) {
  const W = 400;
  const H = 480;
  const PAD = 72;
  const placed = stops.filter((stop) => stop.entity.location);
  const points = placed.length ? placed.map(({ entity }) => entity.location!) : [plan.point];
  // Fit the stops exactly: a fractional zoom, drawn with the next tile level up, scaled down to it.
  const base = points.map((p) => project(p, 0));
  const spanX = Math.max(...base.map((p) => p.x)) - Math.min(...base.map((p) => p.x));
  const spanY = Math.max(...base.map((p) => p.y)) - Math.min(...base.map((p) => p.y));
  const fit = Math.log2(Math.min((W - PAD * 2) / Math.max(spanX, 1e-9), (H - PAD * 2) / Math.max(spanY, 1e-9)));
  // The plain base map stops at 16.
  const zoom = Math.max(12, Math.min(16, fit));
  const z = Math.ceil(zoom);
  const k = 2 ** (zoom - z);
  const px = points.map((p) => project(p, z));
  const cx = ((Math.min(...px.map((p) => p.x)) + Math.max(...px.map((p) => p.x))) / 2) * k;
  const cy = ((Math.min(...px.map((p) => p.y)) + Math.max(...px.map((p) => p.y))) / 2) * k;
  const xy = (p: { lat: number; lng: number }) => {
    const q = project(p, z);
    return [q.x * k - cx + W / 2, q.y * k - cy + H / 2] as const;
  };
  const T = 256 * k;
  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  const max = 2 ** z;
  for (let tx = Math.floor((cx - W / 2) / T); tx <= Math.floor((cx + W / 2) / T); tx++) {
    for (let ty = Math.floor((cy - H / 2) / T); ty <= Math.floor((cy + H / 2) / T); ty++) {
      if (ty < 0 || ty >= max) continue;
      tiles.push({ x: ((tx % max) + max) % max, y: ty, left: tx * T - cx + W / 2, top: ty * T - cy + H / 2 });
    }
  }
  const path = placed.map(({ entity }, i) => `${i ? "L" : "M"}${xy(entity.location!).join(" ")}`).join(" ");
  // Each label takes a side it fits on (right first, unless it's near the right edge) where it won't sit on
  // another; if neither side is free it drops below, with a hairline back to its pin.
  const labels: { x: number; y: number; ly: number; left: boolean }[] = [];
  for (const { entity, slot } of placed) {
    const [x, y] = xy(entity.location!);
    const width = Math.max((slot?.at.length ?? 4) * 10.5, Math.min(entity.name.length, 24) * 6) + 18;
    const clash = (left: boolean, ly: number) =>
      labels.some((l) => l.left === left && Math.abs(l.ly - ly) < 36 && Math.abs(l.x - x) < width + 20);
    const sides = (x > W * 0.55 ? [true, false] : [false, true]).filter((left) => (left ? x - width > 4 : x + width < W - 4));
    let pick = { left: sides[0] ?? x > W / 2, ly: y };
    search: for (let ly = y; ly < H - 40; ly += 36) {
      for (const left of sides) {
        if (!clash(left, ly)) {
          pick = { left, ly };
          break search;
        }
      }
    }
    labels.push({ x, y, ...pick });
  }
  // A round 100, 200 or 500 m bar, for scale.
  const metresPerPx = (156543.03 * Math.cos((points[0].lat * Math.PI) / 180)) / 2 ** zoom;
  const metres = [100, 200, 500, 1000].find((m) => m / metresPerPx >= 50) ?? 1000;
  const bar = metres / metresPerPx;
  const halo = { paintOrder: "stroke", stroke: "var(--cream)", strokeWidth: 4, strokeLinejoin: "round" } as const;
  return (
    <figure className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-[#ece7df]" role="img" aria-label={`Map of the walk in ${plan.area}`}>
        <g style={{ filter: "sepia(0.22) brightness(1.03) contrast(0.9)" }}>
          {tiles.map((tile) => (
            <image
              key={`${tile.x}-${tile.y}`}
              href={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${z}/${tile.y}/${tile.x}`}
              x={tile.left}
              y={tile.top}
              width={T + 0.5}
              height={T + 0.5}
            />
          ))}
        </g>
        {placed.length > 1 && <path d={path} fill="none" stroke="var(--wine)" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />}
        {placed.map(({ entity, slot }, i) => {
          const { x, y, ly, left } = labels[i];
          const dx = left ? -15 : 15;
          return (
            <g key={entity.id}>
              {ly !== y && <line x1={x} y1={y} x2={x + dx * 0.6} y2={ly - 6} stroke="var(--wine)" strokeWidth="1" />}
              <circle cx={x} cy={y} r="8" fill="var(--wine)" stroke="var(--cream)" strokeWidth="3" />
              <text x={x + dx} y={ly - 1} textAnchor={left ? "end" : "start"} style={halo} className="fill-[var(--wine)] font-display text-[19px]">
                {slot?.at ?? ""}
              </text>
              <text x={x + dx} y={ly + 15} textAnchor={left ? "end" : "start"} style={halo} className="fill-[var(--cream-foreground)] text-[11px]">
                {entity.name.length > 24 ? `${entity.name.slice(0, 23)}…` : entity.name}
              </text>
            </g>
          );
        })}
        <g transform={`translate(${W - 16 - bar} ${H - 30})`}>
          <line x1="0" x2={bar} y1="0" y2="0" stroke="var(--cream-foreground)" strokeWidth="1.5" />
          <text x={bar / 2} y="-6" textAnchor="middle" style={halo} className="fill-[var(--cream-foreground)] text-[10px]">
            {metres >= 1000 ? `${metres / 1000} km` : `${metres} m`}
          </text>
        </g>
        <text x="8" y={H - 8} style={halo} className="fill-[var(--cream-foreground)] text-[8.5px] opacity-80">
          Esri, © OpenStreetMap contributors
        </text>
      </svg>
      <figcaption className={quiet}>The walk through {plan.area.split(",")[0]}, stop by stop.</figcaption>
    </figure>
  );
}

const plan = defineGenerated({
  type: "plan",
  name: "The Plan",
  description: "The hours stop by stop, from the places the Date Plan step found: what to get, why it's there and the walk to the next, with a map.",
  icon: RouteIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The plan" }),
  },
  generate: {
    schema: () =>
      z.object({
        headline: z.string().describe("Five to nine words on the shape of the date, for the top of the plan"),
        stops: z
          .array(
            z.object({
              slot: z.string().describe("The stop's slot id from the plan under Other context, e.g. dinner"),
              entity: z.string().describe("Candidate id of a place listed under that slot"),
              title: z.string().describe("Three to six words: what you do there, e.g. Natural wine at the bar"),
              note: z.string().describe("One or two sentences: why this place, for their match, pointing at one of their favourites"),
              order: z.string().describe("What to get or look at, from what people mention about the place. Empty if nothing is mentioned."),
            }),
          )
          .describe("Exactly one stop for every slot in the plan's stops that has places, in order. Don't skip the first."),
        tip: z.string().describe("One practical line: book dinner ahead, bring cash, where to meet. Don't invent hours or prices."),
      }),
    instructions: () =>
      "Plan the date under Other context: one place for each slot in stops, in order, picked only from that slot's own places list. " +
      "A slot with no places is left out. " +
      "Choose so the walk between stops stays short and the evening builds: a first stop that's easy to find and to talk in, " +
      "dinner with the most of their match's taste in it, an ending that's easy to leave from. " +
      "Each note names one thing about the place from its candidate data (what people mention, its tags, its street) and ties it to " +
      "one of their match's favourites by name, or to something they asked for (a proper dinner, nothing too loud). " +
      "Talk about the room, the music, the food, not moods: never 'side of', 'cinematic', 'leans', 'settled', 'a good fit'. " +
      "When people mention a drink or a dish, put it in order. " +
      "Respect what they asked to steer around. Don't write times or walking minutes; the page shows them.",
    picks: () => 40,
    maxOutputTokens: () => 3500,
    effort: () => "low",
    sample: () => {
      const p = samplePlan(sampleIds.places);
      return {
        headline: "A drink, a long dinner, a record bar to end on",
        stops: p.slots.map((slot, i) => ({
          slot: slot.id,
          entity: slot.places[0] ?? "",
          title: ["A spritz at the bar", "Dinner, sharing everything", "Records before the last one", "One more, somewhere quiet"][i] ?? slot.role,
          note: [
            "Easy to find, easy to talk in. The patio is quiet enough that you'll hear each other.",
            "Maya loves In the Mood for Love; this is the closest thing on the block to a corner booth in a Hong Kong noodle bar.",
            "Phoebe Bridgers is on her list, and the back room plays records like hers.",
            "Two minutes from the train, so the night ends easily whenever it should.",
          ][i],
          order: ["The house spritz", "The tasting menu for two", "", "Something off the amaro list"][i],
        })),
        tip: "Book dinner a few days ahead. Saturday tables go early.",
      };
    },
  },
  Pending: ({ props }) => (
    <section id="plan" className="flex scroll-mt-24 flex-col gap-10 border-t border-border pt-10">
      <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)]")}>{props.heading}</h2>
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(pulse, "h-28")} />
        ))}
      </div>
    </section>
  ),
  Component: ({ props, ctx, section }) => {
    const datePlan = planFor(ctx, props.lookups);
    const data = section.data as PlanData | null;
    const writing = section.status === "generating";
    const name = matchName(ctx);
    const stops = (data?.stops ?? []).filter((stop): stop is PlanStop => Boolean(stop?.entity));
    // One stop per slot of the plan, in the plan's order; a stop for a slot that isn't in it (the after-hours one) is left for Afterwards.
    const seen = new Set<string>();
    const placed = stops
      .flatMap((stop) => {
        const entity = ctx.outcome?.entity(stop.entity) ?? null;
        const slot = datePlan ? (datePlan.slots.find((s) => s.id === stop.slot) ?? null) : null;
        if (!entity || (datePlan && !slot) || (slot && seen.has(slot.id))) return [];
        if (slot) seen.add(slot.id);
        return [{ stop, entity, slot }];
      })
      .sort((a, b) => (datePlan ? datePlan.slots.indexOf(a.slot!) - datePlan.slots.indexOf(b.slot!) : 0));
    const directions = walkingLink(placed.map(({ entity }) => entity));
    const legs = placed.map(({ entity }, i) => {
      const next = placed[i + 1]?.entity;
      return entity.location && next?.location ? walkMinutes(entity.location, next.location) : null;
    });
    const totalWalk = legs.reduce<number>((sum, m) => sum + (m ?? 0), 0);
    const span =
      placed.length > 1
        ? Math.max(...placed.flatMap(({ entity }) => placed.map(({ entity: other }) => (entity.location && other.location ? haversine(entity.location, other.location) : 0))))
        : 0;
    return (
      <section id="plan" className="flex scroll-mt-24 flex-col gap-12 border-t border-border pt-10">
        <div className="grid gap-x-10 gap-y-6 @4xl:grid-cols-12 @4xl:items-end">
          <div className="flex flex-col gap-4 @4xl:col-span-7">
            <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance")}>{props.heading}</h2>
            {data?.headline && <p className="text-xl text-pretty opacity-90">{data.headline}</p>}
          </div>
          <div className="flex flex-col gap-4 @4xl:col-span-5 @4xl:items-end @4xl:text-right">
            {datePlan && (
              <p className={quiet}>
                {[datePlan.area.split(",")[0], `${datePlan.from} to ${datePlan.slots.at(-1)?.until ?? datePlan.to}`, totalWalk ? `${totalWalk} min on foot in all` : null, span ? `${span.toFixed(1)} km end to end` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {directions && section.status === "done" && (
              <a href={directions} target="_blank" rel="noreferrer" className={cn(ghost, "self-start @4xl:self-end")}>
                Walking directions
                <ArrowUpRightIcon className="size-4" />
              </a>
            )}
          </div>
        </div>
        <div className="grid gap-x-12 gap-y-12 @5xl:grid-cols-12">
          <ol className="flex flex-col @5xl:col-span-7">
            {placed.map(({ stop, entity, slot }, i) => (
              <li key={`${entity.id}-${i}`} className="flex flex-col">
                <div className="grid gap-x-6 gap-y-4 border-t border-border py-8 @2xl:grid-cols-[8.5rem_1fr]">
                  <div className="flex flex-col gap-1">
                    <time className={cn(display, "text-[2.35rem] leading-none whitespace-nowrap")}>{slot?.at ?? ""}</time>
                    {slot && <span className={quiet}>until {slot.until}</span>}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-5">
                      <Thumb src={entity.image} className="aspect-[4/3] w-28 shrink-0 @3xl:w-40" />
                      <div className="flex min-w-0 flex-col gap-1.5">
                        {slot?.role && <span className="text-sm text-[var(--blush)]">{slot.role}</span>}
                        <a href={mapsLink(entity)} target="_blank" rel="noreferrer" className="self-start text-2xl font-normal tracking-[-0.025em] text-balance underline-offset-4 hover:underline">
                          {entity.name}
                        </a>
                        <span className={quiet}>{placeMeta(entity)}</span>
                      </div>
                    </div>
                    {stop.title && <h3 className="text-lg font-normal tracking-[-0.015em]">{stop.title}</h3>}
                    {stop.note && (
                      <p className="leading-relaxed text-pretty opacity-90">
                        {stop.note}
                        <Writing on={writing && i === placed.length - 1 && !stop.order} />
                      </p>
                    )}
                    {stop.order && (
                      <p className="text-[0.95rem] text-pretty">
                        <span className="opacity-60">Get </span>
                        {stop.order.replace(/^get\s+/i, "")}
                      </p>
                    )}
                    <Because entity={entity} plan={datePlan} name={name} />
                  </div>
                </div>
                {legs[i] != null && (
                  <div className="flex items-center gap-3 pb-1 pl-0 text-sm opacity-65 @2xl:pl-[9.5rem]">
                    <span aria-hidden className="h-6 border-l border-dashed border-[var(--blush)]" />
                    {legs[i]} min walk to {placed[i + 1]?.entity.name}
                  </div>
                )}
              </li>
            ))}
            {writing && placed.length < (datePlan?.slots.length ?? 4) && (
              <li className="flex flex-col gap-3 border-t border-border py-8" aria-hidden>
                <div className={cn(pulse, "h-10 w-24")} />
                <div className={cn(pulse, "h-20")} />
              </li>
            )}
            {data?.tip && <li className="border-t border-border pt-6 text-[0.95rem] text-pretty opacity-80">{data.tip}</li>}
          </ol>
          {datePlan && placed.length > 0 && (
            <div className="@5xl:col-span-5">
              <div className="@5xl:sticky @5xl:top-28">
                <RouteMap plan={datePlan} stops={placed.map(({ entity, slot }) => ({ entity, slot }))} />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
});

// Things to Ask: openers from their favourites and the plan.

const talk = defineGenerated({
  type: "talk",
  name: "Things to Ask",
  description: "Questions to ask, each from one of their favourites or a stop on the plan.",
  icon: MessageCircleQuestionIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Things to ask {{answers.match}}", help: tokens }),
    count: f.number({ label: "How many", default: 3, min: 2, max: 5 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        items: z
          .array(
            z.object({
              about: z.string().describe("One of their match's favourites, or a stop on the plan, by name"),
              ask: z.string().describe("One open question, the way a person would ask it across a table"),
              when: z.string().describe("Where in the date it fits, e.g. Over the first drink. Empty if anywhere."),
            }),
          )
          .describe(`${props.count} questions`),
      }),
    instructions: (props) =>
      `Write ${props.count} questions the planner could ask their match, each starting from one of the match's favourites or a stop on the plan. ` +
      "Open questions with a real answer, not quiz questions or pickup lines, and nothing about exes, money or looks. " +
      "Don't start with their name or with 'So'. Each question under 20 words, no lists of options. " +
      "Don't state facts about the artist, film or book in the question.",
    sample: () => ({
      items: [
        { about: "Phoebe Bridgers", ask: "Which song would you put on first for someone who's never heard her?", when: "Over the first drink" },
        { about: "In the Mood for Love", ask: "Do you watch it for the story or for the way it looks?", when: "At dinner" },
        { about: "The record bar", ask: "What's the album you'd save if you could only keep one?", when: "" },
      ],
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={ctx.fill(props.heading)} rows={3} />,
  Component: ({ props, ctx, section }) => {
    const items = (section.data?.items ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame heading={ctx.fill(props.heading)}>
        <ul className="flex flex-col border-t border-border">
          {items.map((item, i) => (
            <li key={i} className="grid gap-x-8 gap-y-2 border-b border-border py-7 @2xl:grid-cols-[12rem_1fr]">
              <span className="flex flex-col gap-1">
                <span className="text-[var(--blush)]">{item?.about}</span>
                {item?.when && <span className={quiet}>{item.when}</span>}
              </span>
              <p className={cn(display, "text-[clamp(1.6rem,3cqi,2.25rem)] leading-[1.15] text-pretty")}>
                {item?.ask}
                <Writing on={writing && i === items.length - 1} />
              </p>
            </li>
          ))}
        </ul>
      </Frame>
    );
  },
});

// Afterwards: a spot if it runs late, one to swap in if it rains.

const later = defineGenerated({
  type: "later",
  name: "Afterwards",
  description: "A place to go on to if it's going well, and one to swap in if it rains. From the Date Plan step.",
  icon: MoonStarIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "If it's going well" }),
  },
  generate: {
    schema: () =>
      z.object({
        goingWell: z
          .object({
            entity: z.string().describe("Candidate id from the afterwards list"),
            note: z.string().describe("One sentence: what to do there, for their match"),
          })
          .describe("Somewhere to go on to after the last stop"),
        rain: z
          .object({
            entity: z.string().describe("Candidate id of an indoor place not already on the plan"),
            swaps: z.string().describe("The slot id of the stop it replaces"),
            note: z.string().describe("One sentence: why it works instead"),
          })
          .describe("An indoor place to swap in if it rains"),
      }),
    instructions: () =>
      "First, pick one place from the afterwards list under Other context, for if the date is going well and they want to keep going. " +
      "Then pick one indoor place (a bar, a café, a gallery, a shop) from any slot's places, not already on the plan, to swap in if it rains, " +
      "and give the slot id of the stop it replaces. Both a short walk from where the plan ends. " +
      "Each note says one thing to do or get there, from what people mention about it.",
    picks: () => 16,
    sample: () => {
      const p = samplePlan(sampleIds.places);
      return {
        goingWell: { entity: p.extra?.places[0] ?? "", note: "A minute from the last stop, and the band starts at ten." },
        rain: { entity: p.slots[2]?.places[1] ?? "", swaps: "after", note: "If it's pouring, the records are indoors and so is the bar." },
      };
    },
  },
  Pending: ({ props }) => <PendingRows heading={props.heading} rows={2} />,
  Component: ({ props, ctx, section }) => {
    const datePlan = planFor(ctx, props.lookups);
    const name = matchName(ctx);
    const data = section.data;
    const swapped = datePlan?.slots.find((slot) => slot.id === data?.rain?.swaps);
    const items = [
      { label: `After ${datePlan?.slots.at(-1)?.until ?? "the last stop"}`, item: data?.goingWell },
      { label: `If it rains${swapped ? `, instead of ${swapped.role.toLowerCase()}` : ""}`, item: data?.rain },
    ].flatMap(({ label, item }) => {
      const entity = ctx.outcome?.entity(item?.entity) ?? null;
      return entity ? [{ label, note: item?.note, entity }] : [];
    });
    return (
      <Frame heading={props.heading}>
        <div className="grid gap-x-8 gap-y-10 border-t border-border pt-8 @3xl:grid-cols-2">
          {items.map(({ label, note, entity }) => (
            <div key={entity.id} className="flex flex-col gap-3">
              <span className="text-sm text-[var(--blush)]">{label}</span>
              <Thumb src={entity.image} className="aspect-[4/3] w-full" />
              <a href={mapsLink(entity)} target="_blank" rel="noreferrer" className="self-start text-2xl tracking-[-0.025em] underline-offset-4 hover:underline">
                {entity.name}
              </a>
              <span className={quiet}>{placeMeta(entity)}</span>
              {note && <p className="leading-relaxed text-pretty opacity-90">{note}</p>}
              <Because entity={entity} plan={datePlan} name={name} limit={2} />
            </div>
          ))}
        </div>
      </Frame>
    );
  },
});

// The Invite: the text to send.

const invite = defineGenerated({
  type: "invite",
  name: "The Invite",
  description: "The text to send their match: when, where to meet, and a nod to what the plan is built on.",
  icon: MessageSquareTextIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Send {{answers.match}} this", help: tokens }),
    body: f.longText({ label: "Under the heading" }),
  },
  generate: {
    schema: () =>
      z.object({
        message: z.string().describe("The text message, under 280 characters"),
      }),
    instructions: () =>
      "Write the text the planner sends their match to ask them out, in the planner's own voice (I, you), the way people text: " +
      "lower stakes, no greeting card. Say the day and start time, and where to meet: the first stop on the plan, by name. " +
      "Give one light nod to something the plan is built on from their match's favourites, without listing the rest of the plan " +
      "and without explaining why it fits: no 'side of things', 'a good fit', 'your kind of'. " +
      "Don't open with their name. Under 240 characters, no emoji, no sign-off.",
    sample: () => ({
      message:
        "Saturday at 6? Meet me at Bar Pisellino on Grove St. I've planned the rest around a certain Phoebe Bridgers fan and won't say more.",
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={ctx.fill(props.heading)} rows={1} />,
  Component: ({ props, ctx, section }) => {
    const [copied, setCopied] = useState(false);
    const message = section.data?.message ?? "";
    const done = section.status === "done";
    return (
      <section
        id="invite"
        style={dark}
        className="-mx-5 grid scroll-mt-24 gap-x-10 gap-y-10 px-5 py-14 @3xl:-mx-10 @3xl:px-10 @4xl:grid-cols-12 @6xl:mx-0 @6xl:px-14 @6xl:py-16"
      >
        <div className="flex flex-col gap-5 @4xl:col-span-5">
          <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance")}>{ctx.fill(props.heading)}</h2>
          {props.body && <p className="text-lg leading-relaxed text-pretty opacity-80">{ctx.fill(props.body)}</p>}
        </div>
        <div className="flex flex-col gap-5 @4xl:col-span-6 @4xl:col-start-7">
          <div className="relative max-w-lg self-start rounded-[1.5rem] rounded-bl-md bg-[var(--cream)] px-6 py-5 text-[1.15rem] leading-relaxed text-[var(--cream-foreground)] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
            {message}
            <Writing on={!done} />
          </div>
          {done && message && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={button}
                onClick={() => {
                  void navigator.clipboard?.writeText(message).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
              >
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? "Copied" : "Copy the text"}
              </button>
            </div>
          )}
        </div>
      </section>
    );
  },
});

// How It Was Made: for the hackathon's judges, read from the run.

/** Every string under `key` in a section's output: the entity ids it points at. */
function collect(data: unknown, key: string, into: Set<string>) {
  if (Array.isArray(data)) for (const item of data) collect(item, key, into);
  else if (data && typeof data === "object") {
    for (const [name, value] of Object.entries(data)) {
      if (name === key && typeof value === "string" && value.trim()) into.add(value.trim());
      else collect(value, key, into);
    }
  }
  return into;
}

const seconds = (step: { startedAt: number | null; endedAt: number | null }) =>
  step.startedAt && step.endedAt ? Math.max(1, Math.round((step.endedAt - step.startedAt) / 1000)) : null;

function Stage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-t border-foreground/25 pt-5">
      <h3 className="text-sm font-normal">{title}</h3>
      {children}
    </div>
  );
}

const made = defineComponent({
  type: "made",
  name: "How It Was Made",
  description: "For demos: how the answers, Qloo and the writing came together on this page, read from the run.",
  icon: WorkflowIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "How this page was made" }),
    body: f.longText({ label: "Intro" }),
  },
  Component: ({ props, ctx }) => {
    const outcome = ctx.outcome;
    if (!outcome || outcome.status === "running") return null;
    const { state } = outcome;
    const datePlan = planFor(ctx);
    const name = matchName(ctx);
    const taste = state.steps.find((step) => step.kind === "taste");
    const matched = ((taste?.data ?? {}) as { matched?: string[] }).matched ?? [];
    const { theirs, yours } = splitFavourites(ctx, datePlan, matched);
    const sections = state.steps.filter((step) => step.kind === "section" && step.status === "done");
    const picks = new Map<string, string>();
    for (const step of sections) for (const id of collect(step.data, "entity", new Set())) if (!picks.has(id)) picks.set(id, step.label);
    const picked = [...picks.entries()].flatMap(([id, section]) => {
      const entity = outcome.entity(id);
      return entity ? [{ entity, section, slot: datePlan?.slots.find((s) => s.places.includes(entity.id)) ?? null }] : [];
    });
    const weighed = datePlan ? [...datePlan.slots, ...(datePlan.extra ? [datePlan.extra] : [])] : [];
    const answers = ctx.profile.filter((row) => row.answer).slice(0, 8);
    const started = state.steps.map((step) => step.startedAt).filter((n): n is number => Boolean(n));
    const ended = state.steps.map((step) => step.endedAt).filter((n): n is number => Boolean(n));
    const total = started.length && ended.length ? Math.round((Math.max(...ended) - Math.min(...started)) / 1000) : null;

    return (
      <section
        id="how-it-was-made"
        style={{ ...dark, background: "var(--deep)" }}
        className="-mx-5 flex scroll-mt-24 flex-col gap-12 px-5 py-14 @3xl:-mx-10 @3xl:px-10 @6xl:mx-0 @6xl:px-14 @6xl:py-16">
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance @4xl:col-span-7")}>{props.heading}</h2>
          {props.body && <p className="leading-relaxed text-pretty opacity-75 @4xl:col-span-5">{ctx.fill(props.body)}</p>}
        </div>

        <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-4">
          <Stage title="What you told us">
            <dl className="flex flex-col gap-3">
              {answers.map((row) => (
                <div key={row.id} className="flex flex-col gap-0.5">
                  <dt className="text-xs opacity-60">{row.question}</dt>
                  <dd className="line-clamp-2 text-sm">{row.answer}</dd>
                </div>
              ))}
            </dl>
          </Stage>
          <Stage title="Matched in Qloo">
            {theirs.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs opacity-60">{name}'s, weighted 9</span>
                <div className="flex flex-wrap gap-1.5">
                  {theirs.map((n) => (
                    <Chip key={n} tone="theirs">
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {yours.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs opacity-60">Yours, weighted 3</span>
                <div className="flex flex-wrap gap-1.5">
                  {yours.map((n) => (
                    <Chip key={n} tone="yours">
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm leading-relaxed opacity-85">
              {theirs.length + yours.length > 0
                ? `Each favourite resolved to a Qloo entity. ${name}'s count three times yours, so the places lean their way and land where the two lists meet.`
                : "No favourites named that Qloo knows, so places were ranked by how well they're liked nearby."}
            </p>
          </Stage>
          <Stage title={datePlan ? `Searched in ${datePlan.area.split(",")[0]}` : "Searched nearby"}>
            <p className={cn(display, "text-5xl")}>{weighed.reduce((n, slot) => n + slot.places.length, 0)}</p>
            <p className="text-sm leading-relaxed opacity-85">
              places within a walk, open {datePlan?.day ?? "that day"}, ranked for the two of you, stop by stop. {picked.length} made the page.
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {weighed.map((slot) => (
                <li key={slot.id} className="flex justify-between gap-3">
                  <span>{slot.role}</span>
                  <span className="tabular-nums opacity-60">{slot.places.length}</span>
                </li>
              ))}
            </ul>
          </Stage>
          <Stage title="Written for you">
            <ul className="flex flex-col gap-3">
              {sections.map((step) => (
                <li key={step.id} className="flex flex-col gap-1">
                  <span className="flex justify-between gap-3 text-sm">
                    <span>{ctx.fill(step.label)}</span>
                    {seconds(step) && <span className="tabular-nums opacity-60">{seconds(step)}s</span>}
                  </span>
                  {(step.skills ?? []).length > 0 && <span className="text-xs opacity-60">{step.skills!.join(" · ")}</span>}
                </li>
              ))}
            </ul>
          </Stage>
        </div>

        {picked.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-normal">Every pick, and why Qloo surfaced it</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t border-foreground/25 text-left text-sm">
                <thead className="text-xs opacity-60">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Place</th>
                    <th className="py-3 pr-4 font-normal">Affinity</th>
                    <th className="py-3 pr-4 font-normal">Because</th>
                    <th className="py-3 font-normal">What people mention</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map(({ entity, section, slot }) => (
                    <tr key={entity.id} className="border-t border-foreground/15 align-top">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          <Thumb src={entity.image} className="size-10 shrink-0" />
                          <span className="flex flex-col">
                            <span>{entity.name}</span>
                            <span className="text-xs opacity-60">{slot ? `${slot.at}, ${slot.role.toLowerCase()}` : ctx.fill(section)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {entity.affinity != null ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/15">
                              <span className="block h-full bg-[var(--blush)]" style={{ width: `${Math.round(entity.affinity * 100)}%` }} />
                            </span>
                            <span className="tabular-nums">{Math.round(entity.affinity * 100)}%</span>
                          </span>
                        ) : (
                          <span className="opacity-60">n/a</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {entity.because.length ? (
                          entity.because.slice(0, 3).map((signal, i) => (
                            <span key={signal} className={whose(signal, datePlan) === "theirs" ? "text-[var(--blush)]" : ""}>
                              {i ? ", " : ""}
                              {signal}
                            </span>
                          ))
                        ) : (
                          <span className="opacity-60">Their segment</span>
                        )}
                      </td>
                      <td className="py-3 opacity-70">{entity.keywords.slice(0, 4).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-sm opacity-65">
          {total ? `Made in ${total} seconds. ` : ""}
          Every place on the page is a Qloo entity; the model could only pick from these candidates, and anything else was dropped.
        </p>
      </section>
    );
  },
});

export const artifactComponents = [cover, overlap, plan, talk, later, invite, made];
