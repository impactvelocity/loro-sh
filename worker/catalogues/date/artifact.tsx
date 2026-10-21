/**
 * The Date catalogue's outcome: the date, planned for the person who's
 * taking someone out, around what that someone loves. Every section is a
 * block of colour in a black outline on the cream, like the app's own
 * screens.
 *
 * - Cover: the day and their match's name in big capitals on the pink,
 *   then when, where, the walk and what they love in ruled cells. While it's made it
 *   shows the search: whose favourites Qloo matched and the steps.
 * - Where You Overlap: the two lists as two circles, with what they share
 *   where they cross.
 * - The Plan: the hours stop by stop from the Date Plan step's places, on
 *   one line from the first to the last: each stop's time, what to get and
 *   why it's there, and the walk to the next. Walking directions for all.
 * - Things to Ask: openers from their favourites and the plan.
 * - Afterwards: a spot if it runs late, and one to swap in if it rains.
 * - The Invite: the text to send them, with a copy button.
 * - How It Was Made: for demos, the run laid out.
 */
import { Fragment, useState } from "react";
import { ArrowDownIcon, ArrowUpRightIcon, CheckIcon, CopyIcon, MapPinIcon, MessageCircleQuestionIcon, MessageSquareTextIcon, MoonStarIcon, PanelTopIcon, RouteIcon, SparklesIcon, WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";

import { type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink } from "../basic/shared";
import { type DatePlan, isDatePlan, samplePlan, walkMinutes, walkingLink, whose } from "./date";
import { Block, Chip, type Field, Logo, body, button, display, displayHeadings, fill, framed, ghost, heart, quiet, rule, theirs as highlight, wrap } from "./shared";

const pulse = "animate-pulse bg-foreground/[0.1]";
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

/** "a", "a and b", "a, b and c". */
const and = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

/**
 * Whose favourites Qloo surfaced a place for, as a phrase: "Ben's Kinfolk
 * and Mac DeMarco, and your Japanese Breakfast". Theirs first, in their colour.
 */
function PickedFor({ entity, plan, name, limit = 3 }: { entity: TasteEntity; plan: DatePlan | null; name: string; limit?: number }) {
  const rank = (signal: string) => {
    const tone = whose(signal, plan);
    return tone === "theirs" ? 0 : tone === "yours" ? 1 : 2;
  };
  const signals = [...entity.because].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
  const theirs = signals.filter((s) => whose(s, plan) === "theirs");
  const yours = signals.filter((s) => whose(s, plan) === "yours");
  const other = signals.filter((s) => whose(s, plan) === null);
  const parts = [
    theirs.length > 0 && <span className={highlight}>{`${name}'s ${and(theirs)}`}</span>,
    yours.length > 0 && `your ${and(yours)}`,
    other.length > 0 && and(other),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (i === parts.length - 1 ? (theirs.length > 1 || yours.length > 1 ? ", and " : " and ") : ", ")}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/** A place's photo. When it has none or the link is dead (some of Qloo's are): a pin, or nothing where a pin would just be a grey box. */
function Thumb({ src, className, empty = "pin" }: { src: string | null | undefined; className?: string; empty?: "pin" | "none" }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src)
    return empty === "none" ? null : (
      <div className={cn(framed, "flex items-center justify-center text-[var(--ink)]", className)}>
        <MapPinIcon className="size-5" />
      </div>
    );
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} className={cn(framed, className)} />;
}

/** Most outcome sections: a block of colour, the heading in big capitals on the left, sticky while you read; the section on the right. */
function Frame({ heading, field, side, children }: { heading: string; field: Field; side?: ReactNode; children: ReactNode }) {
  return (
    <Block field={field} className="grid gap-x-10 gap-y-8 @4xl:grid-cols-12">
      <div className="@4xl:col-span-4">
        <div className="flex flex-col gap-5 @4xl:sticky @4xl:top-28">
          {heading && <h2 className={cn(display, "text-[clamp(3rem,6cqi,5.25rem)] text-balance")}>{heading}</h2>}
          {side}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-8 @4xl:col-span-8">{children}</div>
    </Block>
  );
}

function PendingRows({ heading, field, rows }: { heading: string; field: Field; rows: number }) {
  return (
    <Frame heading={heading} field={field}>
      <div className={cn("flex flex-col border-t-2", rule)} aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={cn("flex flex-col gap-2.5 border-b-2 py-6", rule)}>
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
      <div style={fill("cream")} className={cn("flex flex-1 flex-col antialiased", body)}>
        {/* The bar in cells split by black rules, like the app's own. */}
        <header className={cn("sticky top-0 z-30 border-b-2 bg-[var(--card)]", rule)}>
          <div className={cn(wrap, "flex h-16 items-stretch justify-between")}>
            <span className={cn("flex items-center border-r-2 pr-6 @3xl:pr-10", rule)}>
              <Logo brand={settings.brand} logo={settings.logo} className="text-[2rem]" />
            </span>
            <div className="flex min-w-0 items-stretch">
              {ctx.person && (
                <span className={cn("flex items-center truncate border-l-2 px-6 text-sm font-medium @max-2xl:hidden", rule)}>
                  For {ctx.person.name || ctx.person.email}
                </span>
              )}
              {ready && settings.cta.label && (
                <span className={cn("flex items-center pl-5 @2xl:border-l-2", rule)}>
                  <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, heart, "h-10 animate-in px-5 whitespace-nowrap duration-700 fade-in")}>
                    {settings.cta.label}
                  </CatalogueLink>
                </span>
              )}
            </div>
          </div>
        </header>
        <main className={cn(wrap, "flex flex-1 flex-col gap-6 pt-6 pb-24 @3xl:gap-8 @3xl:pt-10", displayHeadings)}>{children}</main>
        <footer style={fill("ink")}>
          <div className={cn(wrap, "flex flex-col gap-3 py-10 text-sm opacity-80 @2xl:flex-row @2xl:justify-between")}>
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
      <h1 className={cn(display, "max-w-5xl text-[clamp(3.5rem,9cqi,8.5rem)] [line-height:0.88] text-balance")}>
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
                <span className="text-sm font-semibold">{group.label}</span>
                <ul className="flex flex-wrap gap-2">
                  {group.names.map((n, i) => (
                    <li
                      key={n}
                      className={cn(
                        "animate-in rounded-full border-2 border-[var(--ink)] px-3.5 py-1 text-sm font-medium fill-mode-both fade-in zoom-in-95 duration-500",
                        group.tone === "theirs" ? "bg-[var(--card)]" : "bg-[var(--lime)]",
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
        <p className="text-sm font-medium">
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
                  <span className="absolute size-5 animate-ping rounded-full bg-[var(--ink)]/30 motion-reduce:animate-none" />
                  <span className="size-3 rounded-full border-2 border-[var(--ink)] bg-[var(--yellow)]" />
                </span>
              ) : (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--cream)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "font-semibold" : "opacity-75")}>
                {ctx.fill(step.message ?? step.label).replace(/ in Qloo\b/, "")}
                {live && (
                  <span aria-hidden className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-[var(--card)]/70 to-transparent motion-reduce:hidden" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The plan section's output, wherever the page puts it: the cover counts its stops. */
function planData(ctx: RenderContext): PlanData | null {
  const step = ctx.outcome?.state.steps.find((s) => s.kind === "section" && Array.isArray((s.data as PlanData | null)?.stops));
  return (step?.data as PlanData | undefined) ?? null;
}

/**
 * The top of the page, on the cream: the day and their match's name, big,
 * with the intro and the button beside it, then when, where, the walk and
 * what they love in a row under a hairline.
 */
const cover = defineComponent({
  type: "cover",
  name: "Cover",
  description: "The day and their match's name in big type, then when, where, the walk and what they love. Shows the search while the page is made.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Title", default: "{{day}} with {{answers.match}}", help: tokens }),
    intro: f.longText({ label: "Intro", help: tokens }),
    link: f.link({ label: "Button", default: { label: "See the plan", href: "#plan" } }),
    making: f.text({ label: "While it's being made", default: "Planning the date with {{answers.match}}", help: "Shown in place of the title until the page is ready." }),
  },
  Component: ({ props, ctx }) => {
    const plan = planFor(ctx);
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    if (making)
      return (
        // While it's made, the run footer's fade covers the bottom of the page: keep the search above it.
        <header style={fill("pink")} className={cn("-mx-5 mb-52 flex min-h-[min(72svh,44rem)] flex-col border-y-2 px-5 pt-14 pb-14 @3xl:mx-0 @3xl:border-2 @3xl:px-12 @3xl:pt-16", rule)}>
          <Making outcome={making} heading={fillPlan(ctx, plan, props.making)} ctx={ctx} plan={plan} />
        </header>
      );
    const name = matchName(ctx);
    const { placed, totalWalk } = placeStops(ctx, plan, planData(ctx));
    const [place, city] = (plan?.area ?? "").split(",").map((part) => part.trim());
    const stops = placed.length || plan?.slots.length || 0;
    const facts = plan
      ? [
          { label: "When", lines: [[plan.day, plan.date].filter(Boolean).join(", "), `${plan.from} to ${plan.slots.at(-1)?.until ?? plan.to}`] },
          { label: "Where", lines: [place, city] },
          { label: "The walk", lines: [`${stops} stops`, totalWalk ? `${totalWalk} min on foot in all` : "Each a short walk on"] },
          { label: `${name} loves`, lines: plan.theirs.slice(0, 3) },
        ].filter((fact) => fact.lines.some(Boolean))
      : [];
    return (
      <header
        style={fill("pink")}
        className={cn("-mx-5 flex animate-in flex-col gap-12 border-y-2 px-5 pt-12 pb-5 duration-1000 fade-in slide-in-from-bottom-3 @3xl:mx-0 @3xl:gap-16 @3xl:border-2 @3xl:px-12 @3xl:pt-16 @3xl:pb-12", rule)}
      >
        <div className="grid gap-x-10 gap-y-8 @4xl:grid-cols-12 @4xl:items-end">
          <h1 className={cn(display, "text-[clamp(4.5rem,13cqi,12.5rem)] [line-height:0.82] text-balance @4xl:col-span-8")}>{fillPlan(ctx, plan, props.title)}</h1>
          <div className="flex flex-col items-start gap-7 @4xl:col-span-4 @4xl:pb-3">
            {props.intro && <p className="max-w-md text-lg leading-relaxed text-pretty">{fillPlan(ctx, plan, props.intro)}</p>}
            {props.link.label && (
              <CatalogueLink href={props.link.href} ctx={ctx} className={button}>
                {props.link.label}
                <ArrowDownIcon className="size-4" />
              </CatalogueLink>
            )}
          </div>
        </div>
        {facts.length > 0 && (
          <dl className={cn("grid grid-cols-2 border-2 bg-[var(--card)] @4xl:grid-cols-4", rule)}>
            {facts.map((fact, i) => (
              <div
                key={fact.label}
                className={cn(
                  "flex flex-col gap-2 px-5 py-5 @4xl:px-7",
                  rule,
                  i % 2 === 1 && "border-l-2",
                  i === 2 && "@4xl:border-l-2",
                  i >= 2 && "@max-4xl:border-t-2",
                )}
              >
                <dt className="text-sm font-semibold">{fact.label}</dt>
                <dd className="flex flex-col text-lg leading-snug">
                  {fact.lines.filter(Boolean).map((text) => (
                    <span key={text}>{text}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </header>
    );
  },
});

// Where You Overlap: the two lists as two circles, what they share where they cross.

/** Favourites from an answer, as they wrote them: "a, b and c" is three. */
function favourites(answer: unknown) {
  const text = Array.isArray(answer) ? answer.join(", ") : typeof answer === "string" ? answer : "";
  const parts = text.split(/[,;\n]+/).map((part) => part.trim()).filter(Boolean);
  return parts
    .flatMap((part, i) => (i === parts.length - 1 && parts.length > 1 ? part.split(/\s+and\s+/i) : [part]))
    .map((item) => item.replace(/^and\s+/i, "").replace(/[.!]+$/, "").trim())
    .filter(Boolean);
}

/** One circle's list: whose it is in big capitals, then their favourites. */
function Circle({ label, items, tone, className }: { label: string; items: string[]; tone: "theirs" | "yours"; className: string }) {
  return (
    <div className={cn("absolute flex flex-col items-center gap-[clamp(0.5rem,1.4cqi,1rem)] text-center", className)}>
      <span className={cn(display, "text-[clamp(2rem,5.6cqi,3.75rem)] [line-height:1]")}>{label}</span>
      <ul className="flex flex-col gap-1 text-[clamp(0.9rem,1.75cqi,1.125rem)] leading-snug font-medium">
        {items.map((item) => (
          <li key={item} className="text-balance">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Two circles, their match's in pink and the planner's in lime, each
 * holding their favourites; where they cross, in the heart's red, what
 * the two lists share. Black outlines over all three.
 * Side by side when there's room, one above the other on a phone. The
 * type scales with the circles, so it stays inside them.
 */
function Venn({ name, theirs, yours, shared, pending }: { name: string; theirs: string[]; yours: string[]; shared: string[]; pending?: boolean }) {
  const R = 49.5;
  // Centres 62 apart on a 100 circle: a lens about a quarter of the width.
  const gap = 62;
  const half = Math.sqrt(R * R - (gap / 2) ** 2);
  const middle = (
    <ul className="flex flex-col gap-[clamp(0.6rem,1.6cqi,1.1rem)] text-[var(--heart-foreground)]">
      {shared.map((text, i) => (
        <li
          key={`${i}-${text}`}
          className={cn(display, "animate-in text-[clamp(1.2rem,2.7cqi,1.9rem)] [line-height:0.95] text-balance duration-700 fill-mode-both fade-in")}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          {text}
        </li>
      ))}
    </ul>
  );
  const figure = (vertical: boolean) => {
    const [w, h] = vertical ? [100, 100 + gap] : [100 + gap, 100];
    const [a, b] = vertical ? [{ x: 50, y: 50 }, { x: 50, y: 50 + gap }] : [{ x: 50, y: 50 }, { x: 50 + gap, y: 50 }];
    const lens = vertical
      ? `M${50 - half} ${50 + gap / 2}A${R} ${R} 0 0 1 ${50 + half} ${50 + gap / 2}A${R} ${R} 0 0 1 ${50 - half} ${50 + gap / 2}Z`
      : `M${50 + gap / 2} ${50 - half}A${R} ${R} 0 0 1 ${50 + gap / 2} ${50 + half}A${R} ${R} 0 0 1 ${50 + gap / 2} ${50 - half}Z`;
    return (
      <figure
        aria-label={`${name}'s favourites and yours${shared.length ? `, and where they meet: ${shared.join(", ")}` : ""}`}
        className={cn(
          "@container relative mx-auto w-full",
          vertical ? "aspect-[100/162] max-w-[24rem] @3xl:hidden" : "hidden aspect-[162/100] max-w-[56rem] @3xl:block",
        )}
      >
        <svg viewBox={`0 0 ${w} ${h}`} aria-hidden className="absolute inset-0 size-full overflow-visible">
          {[a, b].map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={R} className={i === 0 ? "fill-[var(--pink)]" : "fill-[var(--lime)]"} />
          ))}
          <path d={lens} className={cn("fill-[var(--heart)]", pending && "animate-pulse opacity-70 motion-reduce:animate-none")} />
          {[a, b].map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={R} fill="none" stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <Circle
          label={name}
          items={theirs}
          tone="theirs"
          className={vertical ? "inset-x-[14%] top-[19%] -translate-y-1/2" : "top-[29%] left-[5.5%] w-[27%]"}
        />
        <div className={cn("absolute -translate-y-1/2 text-center", vertical ? "inset-x-[25%] top-1/2" : "top-1/2 left-1/2 w-[15%] -translate-x-1/2")}>{middle}</div>
        <Circle
          label="You"
          items={yours}
          tone="yours"
          className={vertical ? "inset-x-[14%] top-[81%] -translate-y-1/2" : "top-[29%] right-[5.5%] w-[27%]"}
        />
      </figure>
    );
  };
  return (
    <div className="@container">
      {figure(false)}
      {figure(true)}
    </div>
  );
}

type Pair = { theirs?: string; yours?: string; shared?: string; note?: string };

/** Before the pairs are written: the two circles from the answers, the middle still filling in. */
function OverlapPending({ heading, ctx }: { heading: string; ctx: RenderContext }) {
  const yours = favourites(ctx.answers.your_taste).slice(0, 5);
  if (yours.length === 0) return <PendingRows heading={heading} field="yellow" rows={2} />;
  return (
    <Block field="yellow" className="flex flex-col gap-12 @3xl:gap-16">
      <h2 className={cn(display, "text-center text-[clamp(3.5rem,8cqi,7.5rem)] text-balance")}>{heading}</h2>
      <Venn name={matchName(ctx)} theirs={favourites(ctx.answers.their_taste).slice(0, 5)} yours={yours} shared={[]} pending />
    </Block>
  );
}

const overlap = defineGenerated({
  type: "overlap",
  name: "Where You Overlap",
  description: "Their match's favourites and the planner's as two circles, with what they share where they cross.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Where you overlap" }),
    count: f.number({ label: "Pairs", default: 3, min: 1, max: 4 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        pairs: z
          .array(
            z.object({
              theirs: z.string().describe("One of their match's favourites, exactly as written in their answer"),
              yours: z.string().describe("One of the planner's favourites, exactly as written in their answer. Empty if they gave none."),
              shared: z.string().describe("Two to four words for what the two share, said plainly, e.g. Quiet guitars or A city at night"),
              note: z.string().describe("One sentence: what the two share that you can hear, see or taste"),
            }),
          )
          .describe(`Up to ${props.count} pairs, closest first`),
      }),
    instructions: (props) =>
      `Read the two lists of favourites in the profile: what their match loves, and what the planner loves. Find up to ${props.count} pairs, ` +
      "one from each list, that sit close together. Use each favourite in one pair at most. " +
      "For each, name what they share in two to four words, the way you'd say it across a table ('Quiet guitars', 'A city at night', 'Food you share'), " +
      "then say it in one sentence that you could point at: the instruments and the tempo, the city a film is set in, how a book or a menu is put together. " +
      "Write it as a fact about the two, not as advice about the evening; no 'suits', 'perfect for' or 'side of'. " +
      "Only names from their answers. If the planner gave none, pair each of their match's favourites with nothing and say what it tells you about a good evening. " +
      "If their match's answer names nothing real, return no pairs; never write about the answers themselves. " +
      "Don't state facts about an artist, film or book you're not sure of. Don't name places; the plan does.",
    sample: () => ({
      pairs: [
        { theirs: "Phoebe Bridgers", yours: "Big Thief", shared: "Quiet guitars", note: "Close-up voices and songs you listen to with the lights low." },
        { theirs: "In the Mood for Love", yours: "Lost in Translation", shared: "A city at night", note: "Two people, a city after dark, a lot left unsaid." },
      ],
    }),
  },
  Pending: ({ props, ctx }) => <OverlapPending heading={props.heading} ctx={ctx} />,
  Component: ({ props, ctx, section }) => {
    const pairs = ((section.data?.pairs ?? []) as (Pair | undefined)[]).filter((pair): pair is Pair => Boolean(pair?.theirs));
    const writing = section.status === "generating";
    const name = matchName(ctx);
    const datePlan = planFor(ctx);
    // Nothing named that pairs up (an answer like "x"): the plan carries the page, so leave this out.
    if (pairs.length === 0) return writing ? <OverlapPending heading={props.heading} ctx={ctx} /> : null;
    // The circles hold what each of them wrote; failing that, what Qloo matched and what was paired.
    const theirs = favourites(ctx.answers.their_taste);
    const yours = favourites(ctx.answers.your_taste);
    const listed = (from: string[], fallback: string[]) => [...new Set(from.length ? from : fallback)].slice(0, 5);
    const ours = listed(yours, [...(datePlan?.yours ?? []), ...pairs.map((pair) => pair.yours ?? "")].filter(Boolean));
    const notes = (
      <ul className={cn("grid gap-x-10 gap-y-8", pairs.length > 1 && "@3xl:grid-cols-2", pairs.length > 2 && "@5xl:grid-cols-3")}>
        {pairs.map((pair, i) => (
          <li key={i} className={cn("flex flex-col gap-2 border-2 bg-[var(--card)] p-5", rule)}>
            <p className="font-semibold text-balance">
              <span className={highlight}>{pair.theirs}</span>
              {pair.yours ? ` and ${pair.yours}` : ""}
            </p>
            {pair.note && (
              <p className="leading-relaxed text-pretty">
                {pair.note}
                <Writing on={writing && i === pairs.length - 1} />
              </p>
            )}
          </li>
        ))}
      </ul>
    );
    // The planner gave nothing of theirs: one circle isn't an overlap, so just what their match's favourites say.
    if (ours.length === 0)
      return (
        <Frame heading={props.heading} field="yellow">
          {notes}
        </Frame>
      );
    return (
      <Block field="yellow" className="flex flex-col gap-12 @3xl:gap-16">
        <h2 className={cn(display, "text-center text-[clamp(3.5rem,8cqi,7.5rem)] text-balance")}>{props.heading}</h2>
        <Venn
          name={name}
          theirs={listed(theirs, [...(datePlan?.theirs ?? []), ...pairs.map((pair) => pair.theirs ?? "")].filter(Boolean))}
          yours={ours}
          // Older pages have no short line for each pair: name the pair instead.
          shared={pairs.map((pair) => pair.shared?.trim() || [pair.theirs, pair.yours].filter(Boolean).join(" & "))}
        />
        {notes}
      </Block>
    );
  },
});

// The Plan: the hours stop by stop, on one line from the first to the last.

type PlanStop = { slot?: string; entity?: string; note?: string; order?: string };
type PlanData = { headline?: string; stops?: (PlanStop | undefined)[]; tip?: string };

/**
 * The plan's stops with their places and slots: one per slot, in the
 * slot's order (a stop for a slot that isn't in it, the after-hours one,
 * is left for Afterwards), and the walk from each to the next.
 */
function placeStops(ctx: RenderContext, datePlan: DatePlan | null, data: PlanData | null) {
  const stops = (data?.stops ?? []).filter((stop): stop is PlanStop => Boolean(stop?.entity));
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
  const legs = placed.map(({ entity }, i) => {
    const next = placed[i + 1]?.entity;
    return entity.location && next?.location ? walkMinutes(entity.location, next.location) : null;
  });
  const totalWalk = legs.reduce<number>((sum, m) => sum + (m ?? 0), 0);
  return { placed, legs, totalWalk };
}

/** The line the stops hang on: solid while you're somewhere, dashed while you walk. */
const rail = "relative pl-8 @4xl:pl-11";
const dot = "absolute left-0 size-5 -translate-x-1/2 rounded-full border-2 border-[var(--ink)] ring-4 ring-background";
/** Each stop's dot takes the next colour. */
const dots = ["var(--pink)", "var(--yellow)", "var(--lime)", "var(--lilac)"];

/** A row of the plan: the time on the left, the stop on the line, the photo on the right. */
const row = "grid @4xl:grid-cols-12 @4xl:gap-x-10";

const plan = defineGenerated({
  type: "plan",
  name: "The Plan",
  description: "The hours stop by stop, from the places the Date Plan step found: what to get, why it's there and the walk to the next.",
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
      "When people mention a drink or a dish, put it in order, as a thing to get ('The house spritz'), not an instruction. " +
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
    <Block field="card" id="plan" className="flex flex-col gap-12">
      <h2 className={cn(display, "text-[clamp(3.5rem,8cqi,7.5rem)]")}>{props.heading}</h2>
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={row}>
            <div className={cn(pulse, "hidden h-10 @4xl:col-span-2 @4xl:block")} />
            <div className={cn(pulse, "h-36 @4xl:col-span-7")} />
          </div>
        ))}
      </div>
    </Block>
  ),
  Component: ({ props, ctx, section }) => {
    const datePlan = planFor(ctx, props.lookups);
    const data = section.data as PlanData | null;
    const writing = section.status === "generating";
    const name = matchName(ctx);
    const { placed, legs } = placeStops(ctx, datePlan, data);
    const directions = walkingLink(placed.map(({ entity }) => entity));
    return (
      <Block field="card" id="plan" className="flex flex-col gap-12 @3xl:gap-16">
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div className="flex flex-col gap-4">
            <h2 className={cn(display, "text-[clamp(3.5rem,8cqi,7.5rem)] text-balance")}>{props.heading}</h2>
            {data?.headline && <p className="text-xl font-medium text-pretty">{data.headline}</p>}
          </div>
          {directions && section.status === "done" && (
            <a href={directions} target="_blank" rel="noreferrer" className={cn(ghost, "self-start @3xl:self-auto")}>
              Walking directions
              <ArrowUpRightIcon className="size-4" />
            </a>
          )}
        </div>
        <ol className="flex flex-col">
          {placed.map(({ stop, entity, slot }, i) => {
            const order = stop.order?.replace(/^get\s+/i, "").trim();
            const picked = <PickedFor entity={entity} plan={datePlan} name={name} />;
            const last = i === placed.length - 1;
            return (
              <Fragment key={`${entity.id}-${i}`}>
                <li className={row}>
                  <div className="hidden flex-col gap-2 pt-1 @4xl:col-span-2 @4xl:flex">
                    <time className={cn(display, "text-[3.75rem] [line-height:0.85] whitespace-nowrap")}>{slot?.at ?? ""}</time>
                    {slot?.role && <span className="text-sm font-semibold">{slot.role}</span>}
                  </div>
                  <div className={cn(rail, "flex min-w-0 flex-col gap-5 @4xl:col-span-7", last ? "pb-2" : "pb-10")}>
                    {placed.length > 1 && (
                      <span aria-hidden className={cn("absolute left-0 w-0.5 -translate-x-1/2 bg-[var(--ink)]", i === 0 ? "top-4" : "top-0", last ? "h-4" : "bottom-0")} />
                    )}
                    <span aria-hidden className={cn(dot, "top-2")} style={{ background: dots[i % dots.length] }} />
                    <div className="flex items-baseline gap-3 @4xl:hidden">
                      <time className={cn(display, "text-[2.75rem] [line-height:1] whitespace-nowrap")}>{slot?.at ?? ""}</time>
                      {slot?.role && <span className={quiet}>{slot.role}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <a
                        href={mapsLink(entity)}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance underline-offset-4 hover:underline"
                      >
                        {entity.name}
                      </a>
                      <span className={quiet}>{placeMeta(entity)}</span>
                    </div>
                    <Thumb src={entity.image} empty="none" className="aspect-[3/2] w-full @4xl:hidden" />
                    {stop.note && (
                      <p className="max-w-[40rem] leading-relaxed text-pretty">
                        {stop.note}
                        <Writing on={writing && last && !order} />
                      </p>
                    )}
                    {(order || entity.because.length > 0) && (
                      <dl className="grid grid-cols-[2.75rem_1fr] gap-x-3 gap-y-2 text-[0.95rem] leading-relaxed">
                        {order && (
                          <>
                            <dt className="font-semibold">Get</dt>
                            <dd className="text-pretty first-letter:uppercase">{order}</dd>
                          </>
                        )}
                        {entity.because.length > 0 && (
                          <>
                            <dt className="font-semibold">For</dt>
                            <dd className="text-pretty">{picked}</dd>
                          </>
                        )}
                      </dl>
                    )}
                  </div>
                  <div className="hidden pt-1 @4xl:col-span-3 @4xl:block">
                    <Thumb src={entity.image} empty="none" className="aspect-[4/3] w-full" />
                  </div>
                </li>
                {legs[i] != null && (
                  <li className={row}>
                    <p className={cn(rail, "-ml-px border-l-2 border-dashed border-[var(--ink)] py-4 text-sm font-medium @4xl:col-span-7 @4xl:col-start-3")}>
                      {legs[i]} min walk to {placed[i + 1]?.entity.name}
                    </p>
                  </li>
                )}
              </Fragment>
            );
          })}
          {writing && placed.length < (datePlan?.slots.length ?? 4) && (
            <li className={cn(row, "pt-6")} aria-hidden>
              <div className={cn(pulse, "hidden h-10 @4xl:col-span-2 @4xl:block")} />
              <div className={cn(pulse, "h-36 @4xl:col-span-7")} />
            </li>
          )}
        </ol>
        {data?.tip && (
          <div className={row}>
            <p className={cn(rail, "-mt-4 max-w-[40rem] text-[0.95rem] text-pretty text-muted-foreground @4xl:col-span-7 @4xl:col-start-3")}>{data.tip}</p>
          </div>
        )}
      </Block>
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
  Pending: ({ props, ctx }) => <PendingRows heading={ctx.fill(props.heading)} field="lilac" rows={3} />,
  Component: ({ props, ctx, section }) => {
    const items = (section.data?.items ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame heading={ctx.fill(props.heading)} field="lilac">
        <ul className="flex flex-col gap-4">
          {items.map((item, i) => (
            <li key={i} className={cn("grid gap-x-8 gap-y-3 border-2 bg-[var(--card)] p-5 @2xl:grid-cols-[11rem_1fr] @2xl:p-6", rule)}>
              <span className="flex flex-col items-start gap-1.5">
                <span className="text-sm font-semibold">{item?.about}</span>
                {item?.when && <span className={quiet}>{item.when}</span>}
              </span>
              <p className="text-[clamp(1.35rem,2.4cqi,1.75rem)] leading-[1.2] font-semibold tracking-[-0.025em] text-pretty">
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
  Pending: ({ props }) => <PendingRows heading={props.heading} field="lime" rows={2} />,
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
      <Frame heading={props.heading} field="lime">
        <div className="grid gap-5 @3xl:grid-cols-2">
          {items.map(({ label, note, entity }) => (
            <div key={entity.id} className={cn("flex flex-col gap-4 border-2 bg-[var(--card)] p-5", rule)}>
              <span className="self-start rounded-full border-2 border-[var(--ink)] bg-[var(--yellow)] px-3 py-0.5 text-sm font-semibold">{label}</span>
              <Thumb src={entity.image} empty="none" className="aspect-[3/2] w-full" />
              <div className="flex flex-col gap-1.5">
                <a href={mapsLink(entity)} target="_blank" rel="noreferrer" className="self-start text-[1.6rem] leading-tight font-semibold tracking-[-0.03em] text-balance underline-offset-4 hover:underline">
                  {entity.name}
                </a>
                <span className={quiet}>{placeMeta(entity)}</span>
              </div>
              {note && <p className="leading-relaxed text-pretty">{note}</p>}
              {entity.because.length > 0 && (
                <p className="text-[0.95rem] leading-relaxed text-pretty">
                  <span className="font-semibold">For </span>
                  <PickedFor entity={entity} plan={datePlan} name={name} limit={2} />
                </p>
              )}
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
  Pending: ({ props, ctx }) => <PendingRows heading={ctx.fill(props.heading)} field="pink" rows={1} />,
  Component: ({ props, ctx, section }) => {
    const [copied, setCopied] = useState(false);
    const message = section.data?.message ?? "";
    const done = section.status === "done";
    return (
      <Block field="pink" id="invite" className="grid gap-x-10 gap-y-10 @4xl:grid-cols-12">
        <div className="flex flex-col gap-5 @4xl:col-span-5">
          <h2 className={cn(display, "text-[clamp(3rem,6cqi,5.25rem)] text-balance")}>{ctx.fill(props.heading)}</h2>
          {props.body && <p className="text-lg leading-relaxed text-pretty">{ctx.fill(props.body)}</p>}
        </div>
        <div className="flex flex-col gap-5 @4xl:col-span-6 @4xl:col-start-7">
          <div className={cn("relative max-w-lg self-start rounded-[1.75rem] rounded-bl-none border-2 bg-[var(--card)] px-6 py-5 text-[1.2rem] leading-relaxed font-medium text-[var(--ink)] shadow-[0_4px_0_var(--ink)]", rule)}>
            {message}
            <Writing on={!done} />
          </div>
          {done && message && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={cn(button, heart)}
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
      </Block>
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
    <div className="flex min-w-0 flex-col gap-4 border-t-2 border-current/30 pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
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
      <Block field="ink" id="how-it-was-made" className="flex flex-col gap-12">
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <h2 className={cn(display, "text-[clamp(3rem,6cqi,5.25rem)] text-balance @4xl:col-span-7")}>{props.heading}</h2>
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
            <h3 className="text-sm font-semibold">Every pick, and why Qloo surfaced it</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t-2 border-current/30 text-left text-sm">
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
                            <span className="h-2 w-16 overflow-hidden rounded-full bg-current/15">
                              <span className="block h-full bg-[var(--pink)]" style={{ width: `${Math.round(entity.affinity * 100)}%` }} />
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
                            <span key={signal} className={whose(signal, datePlan) === "theirs" ? "text-[var(--pink)]" : ""}>
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
      </Block>
    );
  },
});

export const artifactComponents = [cover, overlap, plan, talk, later, invite, made];
