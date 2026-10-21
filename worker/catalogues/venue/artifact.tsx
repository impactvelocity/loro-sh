/**
 * The Venue catalogue's outcome: one person's month at the venue, from the
 * shows that are really on, ranked against what they love.
 *
 * - Cover: the line huge over a photo printed pink, the month and how many shows are on.
 *   While it's made it shows the search: the favourites Qloo matched, how
 *   many shows it's ranking, and the steps.
 * - Your Nights: the shows picked for them, the first one big, each with
 *   the night, doors, price and why it's there, and a calendar file.
 * - The Month: every show on a calendar, their picks in pink.
 * - One You Wouldn't Pick: a show outside what they asked for, bridged
 *   from one of their favourites.
 * - Before Doors: dinner and a drink a short walk from the venue, from a
 *   Qloo lookup around it.
 * - Bring Someone: the text to send whoever's coming.
 * - How It Was Made: for demos, the run laid out.
 */
import { useState } from "react";
import { ArrowUpRightIcon, CalendarDaysIcon, CalendarPlusIcon, CheckIcon, CopyIcon, MapPinIcon, MessageSquareTextIcon, PanelTopIcon, SparklesIcon, StarIcon, TicketIcon, UtensilsIcon, WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";

import { type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { parsePoint } from "@core/outcome/lookups";
import { sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink } from "../basic/shared";
import {
  type Programme,
  type ProgrammeEvent,
  calendarFile,
  calendarWeeks,
  clock,
  dateLabel,
  dayOfMonth,
  eventKinds,
  eventStatuses,
  findEvent,
  isProgramme,
  price,
  rangeLabel,
  sampleProgramme,
} from "./programme";
import {
  Accent,
  Backdrop,
  Chip,
  DateStamp,
  Duotone,
  Grain,
  type Ink,
  Logo,
  Seal,
  body,
  button,
  display,
  displayHeadings,
  ghost,
  inks,
  logoFace,
  mono,
  quiet,
  tilt,
  torn,
  wrap,
} from "./shared";

const pulse = "animate-pulse bg-foreground/[0.08]";
const tokens = "Use {{first_name}}, {{venue}} or {{month}}.";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

/** The month from the step a section picks from, or else from any step that made one. */
function programmeFor(ctx: RenderContext, lookups: string[] = []): Programme | null {
  for (const id of lookups) {
    const data = ctx.outcome?.section(id).data;
    if (isProgramme(data)) return data;
  }
  const step = ctx.outcome?.state.steps.find((s) => isProgramme(s.data));
  return step && isProgramme(step.data) ? step.data : null;
}

/** The text with the venue and the month filled in, then the profile's tokens. */
function fillMonth(ctx: RenderContext, programme: Programme | null, text: string) {
  return ctx.fill(
    text
      .replaceAll("{{venue}}", programme?.venue ?? "the venue")
      .replaceAll("{{month}}", programme ? rangeLabel(programme.from, programme.to) : "the next four weeks"),
  );
}

/** The show ids the Your Nights section put on the page, in its order. */
function pickedIds(ctx: RenderContext) {
  const step = ctx.outcome?.state.steps.find((s) => s.type === "picks" && s.kind === "section");
  const picks = ((step?.data ?? {}) as { picks?: ({ entity?: string } | undefined)[] }).picks ?? [];
  return picks.map((pick) => pick?.entity).filter((id): id is string => Boolean(id));
}

const when = (event: ProgrammeEvent) =>
  [dateLabel(event.date), event.doors && event.doors !== event.start ? `doors ${clock(event.doors)}` : null, `starts ${clock(event.start)}`].filter(Boolean).join(", ");

/** "Because you like …", from Qloo's explanation. */
function Because({ event, limit = 3 }: { event: Pick<ProgrammeEvent, "because" | "named" | "seen">; limit?: number }) {
  if (!event.named && event.because.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {event.named && (
        <Chip tone="hot">
          <StarIcon aria-hidden className="size-3 fill-current" />
          {event.seen ? "On your past tickets" : "You named it"}
        </Chip>
      )}
      {event.because.slice(0, limit).map((signal) => (
        <Chip key={signal} tone="hot">
          You like {signal}
        </Chip>
      ))}
    </div>
  );
}

/** A photo printed in one ink, or a ticket when there's none or the link is dead (some of Qloo's are). */
function Thumb({ src, className, ink = "hot", icon: Icon = TicketIcon }: { src: string | null | undefined; className?: string; ink?: Ink; icon?: typeof TicketIcon }) {
  return <Duotone src={src} ink={ink} reveal className={cn("group", className)} fallback={<Icon className="size-6 text-[var(--paper)]" />} />;
}

/** The price, whether it's going, and the button to the box office when there's a link. */
function Tickets({ event, size = "md" }: { event: ProgrammeEvent; size?: "md" | "sm" }) {
  const sold = event.status === "sold-out";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {event.url && !sold && (
        <a href={event.url} target="_blank" rel="noreferrer" className={cn(button, size === "sm" && "h-10 px-5")}>
          Tickets, {price(event)}
          <ArrowUpRightIcon className="size-4" />
        </a>
      )}
      <span className={cn(mono, "text-[0.75rem] text-muted-foreground", event.status === "few-left" && "text-[var(--hot)]")}>
        {!event.url || sold ? `${price(event)} · ` : ""}
        {eventStatuses[event.status]}
        {event.age ? ` · ${event.age}` : ""}
      </span>
    </div>
  );
}

/** Every section but the picks: the heading big on the left, sticky while you read; the section on the right. */
function Frame({ heading, side, id, children }: { heading: string; side?: ReactNode; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-x-10 gap-y-8 @4xl:grid-cols-12">
      <div className="@4xl:col-span-4">
        <div className="flex flex-col gap-5 @4xl:sticky @4xl:top-28">
          {heading && <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,6.5cqi,5.75rem)] text-balance")}>{heading}</h2>}
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
    brand: f.text({ label: "Venue name", default: "The Wren" }),
    logo: f.image({ label: "Logo" }),
    cta: f.link({ label: "Header button", default: { label: "Your nights", href: "#picks" }, help: "Stays at the top as they read, once the page is ready." }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => {
    const ready = ctx.outcome?.status !== "running";
    return (
      <div className={cn("relative isolate flex flex-1 flex-col bg-background text-foreground antialiased", body)}>
        <header className="sticky top-0 z-30 border-b-2 border-foreground/10 bg-background/90 backdrop-blur-md">
          <div className={cn(wrap, "flex h-18 items-center justify-between gap-4")}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.85rem]" />
            <div className="flex min-w-0 items-center gap-5">
              {ctx.person && <span className={cn(mono, "truncate text-[0.78rem] opacity-70 @max-2xl:hidden")}>For {ctx.person.name || ctx.person.email}</span>}
              {ready && settings.cta.label && (
                <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, "h-10 animate-in px-4 text-[1.05rem] whitespace-nowrap duration-700 fade-in")}>
                  {settings.cta.label}
                </CatalogueLink>
              )}
            </div>
          </div>
        </header>
        <main className={cn(wrap, "flex flex-1 flex-col gap-24 pt-3 pb-32 @3xl:gap-32", displayHeadings)}>{children}</main>
        <footer className="bg-[var(--deep)] text-[var(--paper)]">
          <div className={cn(wrap, "flex flex-col gap-3 py-10 @2xl:flex-row @2xl:items-center @2xl:justify-between")}>
            {settings.footer && <span className={cn(mono, "text-[0.75rem] opacity-70")}>{settings.footer}</span>}
            <span className={cn(logoFace, "text-[1.75rem] text-[var(--hot)]")}>{settings.brand}</span>
          </div>
        </footer>
        <RunFooter ctx={ctx} />
        <Grain />
      </div>
    );
  },
});

/** The last few steps the cover lists while the page is being made. */
const MAKING_LINES = 4;

/**
 * The cover while the page is being made: the heading with dots that keep
 * moving, the favourites Qloo matched, how many shows it's ranking, then
 * the run's steps as they finish. Only what the run has actually done.
 */
function Making({ outcome, heading, ctx, programme }: { outcome: OutcomeView; heading: string; ctx: RenderContext; programme: Programme | null }) {
  const taste = outcome.state.steps.find((step) => step.kind === "taste");
  const matched = (taste?.data as { matched?: string[] } | null)?.matched ?? [];
  const lines = outcome.state.steps.filter((step) => !step.background && step.status !== "pending" && step.status !== "skipped").slice(-MAKING_LINES);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-9">
      <h1 className={cn(display, "gig-worn max-w-5xl text-[clamp(3.75rem,11cqi,10rem)] font-black [line-height:0.82] text-balance")}>
        {heading}
        <span aria-hidden className="inline-flex gap-[0.1em] pl-[0.1em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {matched.length > 0 && (
        <div className="flex max-w-3xl flex-col gap-3">
          <span className={cn(mono, "text-[0.78rem] opacity-70")}>What you love, as Qloo knows it</span>
          <ul className="flex flex-wrap gap-2.5">
            {matched.map((name, i) => (
              <li
                key={name}
                className="animate-in bg-[var(--paper)] px-3 py-1.5 text-[0.95rem] font-semibold text-[var(--ink)] fill-mode-both fade-in zoom-in-90 duration-500"
                style={{ animationDelay: `${i * 90}ms`, rotate: `${tilt(name, 2.5)}deg` }}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {programme && (
        <p className={cn(mono, "text-[0.8rem] opacity-75")}>
          {programme.events.length} shows on at {programme.venue}, {rangeLabel(programme.from, programme.to)}
        </p>
      )}
      <ul className="flex max-w-md flex-col gap-2.5">
        {lines.map((step) => {
          const live = step.status === "running";
          return (
            <li key={step.id} className="flex animate-in items-center gap-3 text-[1.05rem] duration-500 fade-in slide-in-from-bottom-2">
              {live ? (
                <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
                  <span className="absolute size-5 animate-ping bg-[var(--hot)]/40 motion-reduce:animate-none" />
                  <span className="size-2.5 bg-[var(--hot)]" />
                </span>
              ) : (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center bg-[var(--hot)] text-[var(--ink)]">
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

/** The top of the page: the line huge over the house, the month and how many shows are on. */
const cover = defineComponent({
  type: "cover",
  name: "Cover",
  description: "The line huge over a photo printed in pink, with the month on a ticket strip. Shows the search while the page is made.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Title", default: "Your month at {{venue}}", help: tokens }),
    intro: f.longText({ label: "Intro", help: tokens }),
    image: f.image({ label: "Photo" }),
    link: f.link({ label: "Button", default: { label: "See your nights", href: "#picks" } }),
    making: f.text({ label: "While it's being made", default: "Going through the month", help: "Shown in place of the title until the page is ready." }),
    stamp: f.text({ label: "Round stamp", default: "The Wren · Main Street · Vancouver", help: "Runs round the stamp. Empty to leave it off." }),
    mark: f.text({ label: "In the stamp", default: "1931" }),
  },
  Component: ({ props, ctx }) => {
    const programme = programmeFor(ctx);
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    const picked = pickedIds(ctx).length;
    const line = programme ? [rangeLabel(programme.from, programme.to), `${programme.events.length} shows on`, picked ? `${picked} for you` : null].filter(Boolean).join(" · ") : null;
    return (
      <header className="relative isolate -mx-5 overflow-hidden @3xl:-mx-10 @6xl:mx-0">
        <Backdrop image={props.image} strength={making ? "strong" : "medium"} drift={Boolean(making)} />
        {/* While it's made, the run footer's fade covers the bottom of the page: keep the search above it. */}
        <div
          className={cn(
            "relative flex min-h-[min(86svh,52rem)] flex-col px-5 @3xl:px-10 @6xl:px-14",
            making ? "justify-start pt-28 pb-64 @3xl:pt-32" : "justify-end pt-32 pb-12 @3xl:pb-16",
          )}
        >
          {making ? (
            <Making outcome={making} heading={fillMonth(ctx, programme, props.making)} ctx={ctx} programme={programme} />
          ) : (
            <>
              {props.stamp && (
                <Seal
                  text={fillMonth(ctx, programme, props.stamp)}
                  mark={props.mark}
                  className="absolute top-8 right-10 size-32 animate-in duration-700 fade-in zoom-in-125 @max-3xl:hidden @4xl:size-40 @6xl:right-14"
                />
              )}
              <div className="flex w-full animate-in flex-col items-start gap-7 duration-1000 fade-in slide-in-from-bottom-4">
                <h1 className={cn(display, "gig-worn max-w-[12ch] text-[clamp(4rem,13.5cqi,12.5rem)] font-black [line-height:0.8] text-balance")}>
                  <Accent text={fillMonth(ctx, programme, props.title)} />
                </h1>
                {line && (
                  <p className={cn(mono, "bg-[var(--paper)] px-3 py-1.5 text-[0.8rem] font-bold text-[var(--ink)]")} style={{ rotate: "-0.8deg" }}>
                    {line}
                  </p>
                )}
                {props.intro && <p className="max-w-xl text-lg leading-relaxed text-pretty @3xl:text-xl">{fillMonth(ctx, programme, props.intro)}</p>}
                {props.link.label && (
                  <CatalogueLink href={props.link.href} ctx={ctx} className={cn(button, "mt-1")}>
                    {props.link.label}
                  </CatalogueLink>
                )}
              </div>
            </>
          )}
        </div>
      </header>
    );
  },
});

// Your Nights: the shows picked for them.

type NightPick = { entity?: string; title?: string; note?: string; tip?: string };
type PicksData = { headline?: string; picks?: (NightPick | undefined)[] };

const picks = defineGenerated({
  type: "picks",
  name: "Your Nights",
  description: "The shows picked for them from the month, the first one big: when, the price, why it's there, and a calendar file.",
  icon: TicketIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your nights" }),
    count: f.number({ label: "Shows", default: 4, min: 2, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        headline: z.string().describe("Six to ten words naming what the picks are, in the order they're listed, e.g. A 35mm print, two seated gigs, a dance night"),
        picks: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id of a show from the month"),
              title: z.string().describe("Three to seven words on what the night is, without the show's name, a day or a date, e.g. Two guitars, no words sung"),
              note: z.string().describe("One or two sentences: why this show, pointing at one of their favourites by name"),
              tip: z.string().describe("One practical line: seated or standing and when to arrive, or that it's down to the last few. No times, dates or prices. Empty if nothing to add."),
            }),
          )
          .describe(`${props.count} shows, best first`),
      }),
    instructions: (props) =>
      `Pick ${props.count} shows for this person from the shortlist under Other context, in the shortlist's order: ` +
      "it's already ranked by Qloo's match and by what they said (shows they named first, then the kinds of night, the nights and the price they asked for). " +
      "Skip a shortlisted show only so that no two picks fall on the same night. If a pick misses something they asked for (a night they can't do, over their price), the note says so. " +
      "Mention a show's format only as the box office gives it. " +
      "Each note ties the show to one of their favourites by name, as they wrote it, and says what links them that you'd notice in the room: the instruments, the language, the era, how a film is shot. " +
      "Don't state facts about an artist, film or podcast you're not sure of, and never invent who's supporting, the setlist or a guest. " +
      "Never write a date, time or price anywhere; the page shows them next to every pick.",
    picks: () => 30,
    maxOutputTokens: () => 3000,
    effort: () => "low",
    sample: (props) => {
      const p = sampleProgramme();
      return {
        headline: "Guitars on Thursdays, a 35mm print, one late Saturday",
        picks: p.events.slice(0, props.count).map((event, i) => ({
          entity: event.id,
          title: ["A film you already know by heart", "Two guitars, a seated room", "A band from up the road", "Talking Heads until 2 AM"][i] ?? event.title,
          note: [
            "You named In the Mood for Love. This is it on a 35mm print, which is how it was made to be seen.",
            "You play Khruangbin: this is the same long, unhurried guitar, without a word sung.",
            "If Khruangbin is on your list, Destroyer's late records sit nearby: slow, warm, a lot of saxophone.",
            "You named Talking Heads; this is a night of nothing else.",
          ][i],
          tip: ["", "Seated, and down to the last few.", "Standing on the floor, seats upstairs.", ""][i],
        })),
      };
    },
  },
  Pending: ({ props }) => (
    <section id="picks" className="flex scroll-mt-24 flex-col gap-10">
      <h2 className={cn(display, "gig-worn text-[clamp(3.5rem,8cqi,7.5rem)]")}>{props.heading}</h2>
      <div className="grid gap-6 @3xl:grid-cols-2" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(pulse, i === 0 ? "h-96 @3xl:col-span-2" : "h-72")} />
        ))}
      </div>
    </section>
  ),
  Component: ({ props, ctx, section }) => {
    const programme = programmeFor(ctx, props.lookups);
    const data = section.data as PicksData | null;
    const writing = section.status === "generating";
    const seen = new Set<string>();
    const placed = (data?.picks ?? []).flatMap((pick) => {
      const event = findEvent(programme, pick?.entity);
      if (!pick || !event || seen.has(event.id)) return [];
      seen.add(event.id);
      return [{ pick, event }];
    });
    const [lead, ...rest] = placed;
    const calendar = programme && placed.length > 0 && section.status === "done" ? calendarFile(placed.map(({ event }) => event), programme.venue, programme.timeZone) : null;
    return (
      <section id="picks" className="flex scroll-mt-24 flex-col gap-12">
        <div className="grid gap-x-10 gap-y-6 @4xl:grid-cols-12 @4xl:items-end">
          <div className="flex flex-col gap-4 @4xl:col-span-8">
            <h2 className={cn(display, "gig-worn text-[clamp(3.5rem,8cqi,7.5rem)] text-balance")}>{props.heading}</h2>
            {data?.headline && <p className="text-xl font-medium text-pretty">{data.headline}</p>}
          </div>
          {calendar && (
            <div className="@4xl:col-span-4 @4xl:flex @4xl:justify-end">
              <a href={calendar} download={`${programme!.venue.toLowerCase().replace(/\W+/g, "-")}-nights.ics`} className={ghost}>
                <CalendarPlusIcon className="size-4" />
                Add {placed.length === 1 ? "it" : `all ${placed.length}`} to your calendar
              </a>
            </div>
          )}
        </div>

        {lead && (
          <article className="grid gap-x-12 gap-y-8 border-t-4 border-[var(--hot)] pt-10 @4xl:grid-cols-12">
            <div className="relative @4xl:col-span-7">
              <Thumb src={lead.event.image?.replace(/-\d+x-/, "-1080x-")} className="aspect-[4/3] w-full" />
              <DateStamp date={lead.event.date} ink="hot" size="lg" className="absolute top-4 right-4" />
            </div>
            <div className="flex flex-col gap-5 @4xl:col-span-5">
              <span className={cn(mono, "text-[0.78rem] text-[var(--hot)]")}>
                {eventKinds[lead.event.kind].one} · {when(lead.event)}
              </span>
              <h3 className={cn(display, "text-[clamp(3.5rem,6.5cqi,6rem)] font-black [line-height:0.84] text-balance")}>{lead.event.title}</h3>
              {lead.pick.title && <p className="text-xl font-medium tracking-[-0.02em] text-pretty">{lead.pick.title}</p>}
              {lead.pick.note && (
                <p className="text-lg leading-relaxed text-pretty opacity-90">
                  {lead.pick.note}
                  <Writing on={writing && rest.length === 0 && !lead.pick.tip} />
                </p>
              )}
              {lead.pick.tip && <p className="text-[0.95rem] text-pretty opacity-75">{lead.pick.tip}</p>}
              {lead.event.format && <p className={cn(mono, "text-[0.75rem] text-muted-foreground")}>{lead.event.format}</p>}
              <Because event={lead.event} />
              <Tickets event={lead.event} />
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <div className="grid gap-x-8 gap-y-14 @3xl:grid-cols-2 @6xl:grid-cols-3">
            {rest.map(({ pick, event }, i) => (
              <article key={event.id} className="flex flex-col gap-4 border-t-2 border-foreground/15 pt-6">
                <div className="relative">
                  <Thumb src={event.image?.replace(/-\d+x-/, "-640x-")} ink={inks[(i + 1) % inks.length]} className="aspect-[4/3] w-full" />
                  <DateStamp date={event.date} ink="hot" className="absolute top-3 right-3" />
                </div>
                <span className={cn(mono, "text-[0.75rem] text-[var(--hot)]")}>
                  {eventKinds[event.kind].one} · {when(event)}
                </span>
                <h3 className={cn(display, "text-[2.75rem] [line-height:0.88] text-balance")}>{event.title}</h3>
                {pick.title && <p className="font-medium tracking-[-0.015em] text-pretty">{pick.title}</p>}
                {pick.note && (
                  <p className="leading-relaxed text-pretty opacity-90">
                    {pick.note}
                    <Writing on={writing && i === rest.length - 1 && !pick.tip} />
                  </p>
                )}
                {pick.tip && <p className="text-[0.95rem] text-pretty opacity-75">{pick.tip}</p>}
                <Because event={event} limit={2} />
                <div className="mt-auto pt-2">
                  <Tickets event={event} size="sm" />
                </div>
              </article>
            ))}
          </div>
        )}
        {writing && placed.length < props.count && (
          <div className="grid gap-6 @3xl:grid-cols-2" aria-hidden>
            <div className={cn(pulse, "h-72")} />
          </div>
        )}
      </section>
    );
  },
});

// The Month: every show on a calendar, their picks in pink.

const month = defineComponent({
  type: "month",
  name: "The Month",
  description: "Every show in the month on a calendar, with their picks in pink and how well the rest match them.",
  icon: CalendarDaysIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Everything that's on" }),
    body: f.longText({ label: "Intro", help: tokens }),
  },
  Component: ({ props, ctx }) => {
    const programme = programmeFor(ctx);
    if (!programme) return null;
    const picked = new Set(pickedIds(ctx));
    const byDay = new Map<string, ProgrammeEvent[]>();
    for (const event of programme.events) byDay.set(event.date, [...(byDay.get(event.date) ?? []), event]);
    const weeks = calendarWeeks(programme.from, programme.to);
    // Qloo's matches aren't comparable across kinds (films score against films), so close means the top half of its own kind.
    const close = new Set(
      [...new Set(programme.events.map((event) => event.type))].flatMap((type) => {
        const ranked = programme.events.filter((event) => event.type === type && event.match != null).toSorted((a, b) => (b.match ?? 0) - (a.match ?? 0));
        return ranked.slice(0, Math.ceil(ranked.length / 2)).map((event) => event.id);
      }),
    );
    const tone = (event: ProgrammeEvent) => (picked.has(event.id) ? "pick" : event.named ? "named" : close.has(event.id) ? "close" : "rest");
    const Entry = ({ event }: { event: ProgrammeEvent }) => {
      const t = tone(event);
      return (
        <span
          className={cn(
            "flex flex-col gap-0.5 px-2 py-1.5 text-left text-[0.8rem] leading-tight",
            t === "pick" && "bg-[var(--hot)] text-[var(--ink)]",
            t === "named" && "ring-2 ring-[var(--hot)] ring-inset",
            t === "close" && "bg-foreground/[0.07]",
            t === "rest" && "opacity-55",
          )}
        >
          <span className="line-clamp-2 font-semibold">{event.title}</span>
          <span className={cn(mono, "text-[0.68rem] opacity-75")}>
            {clock(event.start)}
            {event.status === "sold-out" ? " · Sold out" : ""}
          </span>
        </span>
      );
    };
    return (
      <section id="month" className="flex scroll-mt-24 flex-col gap-10">
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,6.5cqi,5.75rem)] text-balance @4xl:col-span-7")}>{props.heading}</h2>
          <div className="flex flex-col gap-4 @4xl:col-span-5">
            {props.body && <p className="leading-relaxed text-pretty opacity-80">{fillMonth(ctx, programme, props.body)}</p>}
            <ul className={cn(mono, "flex flex-wrap gap-x-5 gap-y-2 text-[0.72rem] opacity-85")}>
              <li className="flex items-center gap-2">
                <span className="size-3 bg-[var(--hot)]" />
                Picked for you
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 ring-2 ring-[var(--hot)] ring-inset" />
                You named it
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 bg-foreground/15" />
                A close match
              </li>
            </ul>
          </div>
        </div>

        {/* Wide: the month as a calendar. */}
        <div className="@max-4xl:hidden">
          <div className={cn(mono, "grid grid-cols-7 border-t border-l border-border text-[0.7rem] opacity-60")}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day} className="border-r border-border px-2 py-2">
                {day}
              </span>
            ))}
          </div>
          {weeks.map((week, i) => (
            <div key={i} className="grid grid-cols-7 border-l border-border">
              {week.map((day, j) =>
                day ? (
                  <div key={day} className="flex min-h-32 flex-col gap-1.5 border-r border-b border-border p-1.5">
                    <span className={cn(mono, "px-1 text-[0.75rem] tabular-nums", (byDay.get(day) ?? []).some((e) => picked.has(e.id)) ? "font-bold text-[var(--hot)]" : "opacity-60")}>
                      {dayOfMonth(day) === 1 || day === programme.from ? dateLabel(day, true).split(", ")[1] : dayOfMonth(day)}
                    </span>
                    {(byDay.get(day) ?? []).map((event) => (
                      <Entry key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div key={`${i}-${j}`} className="border-r border-b border-border bg-foreground/[0.02]" />
                ),
              )}
            </div>
          ))}
        </div>

        {/* Narrow: day by day. */}
        <ol className="flex flex-col border-t border-border @4xl:hidden">
          {[...byDay.entries()].map(([day, events]) => (
            <li key={day} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-border py-3">
              <span className={cn(mono, "text-[0.75rem]", events.some((e) => picked.has(e.id)) ? "font-bold text-[var(--hot)]" : "opacity-65")}>{dateLabel(day, true)}</span>
              <span className="flex flex-col gap-1.5">
                {events.map((event) => (
                  <Entry key={event.id} event={event} />
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className={quiet}>
          {programme.source === "demo" ? "An example month, laid out from today." : `From ${programme.venue}'s box office.`} Matches are Qloo's, against what you told us.
        </p>
      </section>
    );
  },
});

// One You Wouldn't Pick: a show outside what they asked for.

const stretch = defineGenerated({
  type: "stretch",
  name: "One You Wouldn't Pick",
  description: "A show outside the kinds of night they asked for, bridged from one of their favourites.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "One you wouldn't pick" }),
    count: f.number({ label: "Shows", default: 2, min: 1, max: 3 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        items: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id of a show from the month, not already on the page"),
              from: z.string().describe("The favourite that leads to it: one name from the show's because list, exactly as written there"),
              note: z.string().describe("Two sentences: what the favourite and the show share, and what the night is like"),
            }),
          )
          .describe(`${props.count} shows`),
      }),
    instructions: (props) =>
      `Pick ${props.count} shows from the month that this person wouldn't find on their own. ` +
      "Pick only shows marked notAKindTheyPicked, as long as there are enough of them; otherwise the lowest-matched shows that still link to a favourite. " +
      "Each needs a real link to one of their favourites: a live podcast about how songs are made for someone who plays a band, a dance night built on an artist near theirs, a concert film of a band they love. " +
      "Not a show already on the page, and nothing sold out. " +
      "The favourite it comes from must be in that show's because list, which is Qloo's reason; skip shows with an empty list. " +
      "Say in plain words what the night is and what it has in common with that favourite that you could hear or see. Don't oversell it: no 'you'll love', 'trust us', 'outside your comfort zone'. " +
      "Don't state facts about an artist, film or podcast you're not sure of, and never claim a song is in a film. Never write a date, time or price; the page shows them.",
    picks: () => 30,
    effort: () => "low",
    sample: () => {
      const p = sampleProgramme();
      return {
        items: [
          { entity: p.events[5]?.id ?? "", from: "Khruangbin", note: "Khruangbin built a sound out of records from everywhere; this hour of radio-style storytelling takes songs apart the same way. Seated, with the band's own stems played through the house speakers." },
          { entity: p.events[9]?.id ?? "", from: "Talking Heads", note: "You named Talking Heads. This is their concert film with the seats taken out, so the room dances along to it." },
        ],
      };
    },
  },
  Pending: ({ props }) => <PendingRows heading={props.heading} rows={2} />,
  Component: ({ props, ctx, section }) => {
    const programme = programmeFor(ctx, props.lookups);
    const writing = section.status === "generating";
    const items = (section.data?.items ?? []).flatMap((item) => {
      const event = findEvent(programme, item?.entity);
      return item && event ? [{ item, event }] : [];
    });
    if (items.length === 0) return writing ? <PendingRows heading={props.heading} rows={2} /> : null;
    return (
      <Frame heading={props.heading} side={<p className="leading-relaxed text-pretty opacity-75">Outside what you asked for, one step from what you love.</p>}>
        <ul className="flex flex-col border-t-2 border-foreground/15">
          {items.map(({ item, event }, i) => (
            <li key={event.id} className="grid gap-x-8 gap-y-4 border-b-2 border-foreground/15 py-8 @2xl:grid-cols-[11rem_1fr]">
              <div className="relative">
                <Thumb src={event.image} ink={i % 2 ? "flare" : "acid"} className="aspect-square w-full @max-2xl:aspect-[4/3]" />
                <DateStamp date={event.date} size="sm" className="absolute top-2 right-2" />
              </div>
              <div className="flex flex-col gap-3">
                {item.from && (
                  <span className={cn(mono, "text-[0.75rem] text-[var(--hot)]")}>
                    {eventKinds[event.kind].one}, if you like {item.from}
                  </span>
                )}
                <h3 className={cn(display, "text-[2.75rem] [line-height:0.88] text-balance")}>{event.title}</h3>
                <span className={cn(mono, "text-[0.75rem] text-muted-foreground")}>{when(event)}</span>
                {item.note && (
                  <p className="leading-relaxed text-pretty opacity-90">
                    {item.note}
                    <Writing on={writing && i === items.length - 1} />
                  </p>
                )}
                <Tickets event={event} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      </Frame>
    );
  },
});

// Before Doors: dinner and a drink a walk from the venue.

const rad = (deg: number) => (deg * Math.PI) / 180;
function walkMinutes(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  const km = 12742 * Math.asin(Math.sqrt(h));
  return Math.max(1, Math.round(((km * 1.3) / 5) * 60));
}

const mapsLink = (entity: TasteEntity) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([entity.name, entity.address].filter(Boolean).join(", "))}`;

const placeMeta = (entity: TasteEntity) =>
  [entity.neighbourhood, entity.priceLevel ? "$".repeat(entity.priceLevel) : null, entity.tags[0]].filter(Boolean).join(" · ");

const before = defineGenerated({
  type: "before",
  name: "Before Doors",
  description: "Dinner before their first night and somewhere for after, a short walk from the venue, from a Qloo lookup around it.",
  icon: UtensilsIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Before doors" }),
    from: f.text({ label: "Venue point", placeholder: "49.2509, -123.1010", help: "Latitude, longitude: walking times are from here." }),
    count: f.number({ label: "Places", default: 3, min: 2, max: 4 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        line: z.string().describe("One sentence: which of their nights this is for, by the show's name"),
        items: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id of a place near the venue"),
              when: z.string().describe("Before, or After"),
              note: z.string().describe("One sentence: what the place is and why it works on this night, from its data"),
              order: z.string().describe("What to get, from what people mention about the place. Empty if nothing is mentioned."),
            }),
          )
          .describe(`${props.count} places: dinner or a drink before, and one for after`),
      }),
    instructions: (props) =>
      `For the first show on their page (in Your Nights, written earlier), pick ${props.count} places near the venue: ` +
      "dinner before doors, maybe a drink, and one place for after the show. Before is somewhere you can eat and still make doors; after is open late, a bar or somewhere for dessert. " +
      "Each note says what the place is from its candidate data (what people mention, its tags) and why it works on the night: room to talk before a film, quick enough for doors, open after. " +
      "Don't link food or drink to their bands or films, and don't write times or prices. " +
      "When people mention a dish or a drink, put it in order. Never invent opening hours, prices or menu items. Don't write walking times; the page shows them.",
    picks: () => 14,
    effort: () => "low",
    sample: () => ({
      line: "For Hermanos Gutiérrez on Thursday.",
      items: sampleIds.places.slice(0, 3).map((entity, i) => ({
        entity,
        when: i < 2 ? "Before" : "After",
        note: ["Small plates and a long counter, ten minutes from the doors.", "A record bar with low light, for one before you go in.", "Open late, a minute up the street."][i],
        order: ["The mole", "Mezcal, neat", ""][i],
      })),
    }),
  },
  Pending: ({ props }) => <PendingRows heading={props.heading} rows={3} />,
  Component: ({ props, ctx, section }) => {
    const venue = parsePoint(props.from);
    const writing = section.status === "generating";
    const items = (section.data?.items ?? []).flatMap((item) => {
      const entity = ctx.outcome?.entity(item?.entity) ?? null;
      return item && entity ? [{ item, entity }] : [];
    });
    return (
      <Frame heading={props.heading} side={section.data?.line && <p className="text-lg leading-relaxed text-pretty opacity-80">{section.data.line}</p>}>
        <div className="grid gap-x-8 gap-y-12 border-t-2 border-foreground/15 pt-8 @3xl:grid-cols-2 @6xl:grid-cols-3">
          {items.map(({ item, entity }, i) => (
            <div key={entity.id} className="flex flex-col gap-3">
              <span className={cn(mono, "text-[0.75rem] text-[var(--hot)]")}>
                {/^after/i.test(item.when ?? "") ? "After the show" : "Before doors"}
                {venue && entity.location ? ` · ${walkMinutes(venue, entity.location)} min walk` : ""}
              </span>
              <Thumb src={entity.image} ink={inks[(i + 1) % inks.length]} icon={MapPinIcon} className="aspect-[4/3] w-full" />
              <a href={mapsLink(entity)} target="_blank" rel="noreferrer" className={cn(display, "self-start text-[2.25rem] [line-height:0.9] decoration-[var(--hot)] decoration-2 underline-offset-4 hover:underline")}>
                {entity.name}
              </a>
              <span className={cn(mono, "text-[0.75rem] text-muted-foreground")}>{placeMeta(entity)}</span>
              {item.note && (
                <p className="leading-relaxed text-pretty opacity-90">
                  {item.note}
                  <Writing on={writing && i === items.length - 1 && !item.order} />
                </p>
              )}
              {item.order && (
                <p className="text-[0.95rem] font-medium text-pretty">
                  <span className="opacity-60">Get </span>
                  {item.order.replace(/^get\s+/i, "")}
                </p>
              )}
            </div>
          ))}
        </div>
      </Frame>
    );
  },
});

// Bring Someone: the text to send whoever's coming.

const bring = defineGenerated({
  type: "bring",
  name: "Bring Someone",
  description: "The text to send whoever they'd take to their first night: the show, the night, the plan.",
  icon: MessageSquareTextIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Bring someone" }),
    body: f.longText({ label: "Under the heading", help: tokens }),
  },
  generate: {
    schema: () => z.object({ message: z.string().describe("The text message, under 260 characters") }),
    instructions: () =>
      "Write the text this person sends a friend to bring them to the first show in Your Nights, in their own voice (I, you), the way people text. " +
      "Say the show and the night, and where to meet first if Before Doors picked somewhere: by name. " +
      "At most one short reason, as a fact about the show (seated, a 35mm print, last few tickets), never why it suits anyone. Don't open with a greeting or the friend's name. Under 200 characters, no emoji, no hashtags, no sign-off.",
    sample: () => ({ message: "Hermanos Gutiérrez at The Wren on Thursday? Seated, and nearly gone. Dinner at Anh and Chi first at 6, my treat if you get the tickets." }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={ctx.fill(props.heading)} rows={1} />,
  Component: ({ props, ctx, section }) => {
    const [copied, setCopied] = useState(false);
    const programme = programmeFor(ctx);
    const message = section.data?.message ?? "";
    const done = section.status === "done";
    return (
      <section
        id="bring"
        style={torn("both", 11, 14)}
        className="relative isolate -mx-5 grid scroll-mt-24 gap-x-10 gap-y-10 overflow-hidden bg-linear-160 from-[var(--hot)] to-[var(--flare)] px-5 py-20 text-[var(--ink)] @3xl:-mx-10 @3xl:px-10 @4xl:grid-cols-12 @6xl:mx-0 @6xl:px-14 @6xl:py-24"
      >
        <div aria-hidden className="gig-ink absolute inset-0 -z-10" />
        <div className="flex flex-col gap-5 @4xl:col-span-5">
          <h2 className={cn(display, "gig-worn text-[clamp(3.5rem,8cqi,7rem)] font-black [line-height:0.84] text-balance")}>{fillMonth(ctx, programme, props.heading)}</h2>
          {props.body && <p className="text-lg leading-relaxed font-medium text-pretty">{fillMonth(ctx, programme, props.body)}</p>}
        </div>
        <div className="flex flex-col gap-6 @4xl:col-span-6 @4xl:col-start-7 @4xl:justify-center">
          <div className="relative max-w-lg self-start rounded-[1.4rem] rounded-bl-[4px] bg-[var(--ink)] px-6 py-5 text-[1.15rem] leading-relaxed text-[var(--paper)] shadow-[6px_6px_0_var(--acid)]">
            {message}
            <Writing on={!done} />
          </div>
          {done && message && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={cn(button, "bg-[var(--ink)] text-[var(--paper)] shadow-[4px_4px_0_var(--acid)] hover:shadow-[2px_2px_0_var(--acid)]")}
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
    <div className="flex min-w-0 flex-col gap-4 border-t-2 border-[var(--hot)] pt-5">
      <h3 className={cn(mono, "text-[0.8rem] font-bold")}>{title}</h3>
      {children}
    </div>
  );
}

const made = defineComponent({
  type: "made",
  name: "How It Was Made",
  description: "For demos: how the box office's month, the answers, Qloo and the writing came together on this page, read from the run.",
  icon: WorkflowIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "How this page was made" }),
    body: f.longText({ label: "Intro" }),
  },
  Component: ({ props, ctx }) => {
    const outcome = ctx.outcome;
    if (!outcome || outcome.status === "running") return null;
    const { state } = outcome;
    const programme = programmeFor(ctx);
    const taste = state.steps.find((step) => step.kind === "taste");
    const matched = ((taste?.data ?? {}) as { matched?: string[] }).matched ?? [];
    const sections = state.steps.filter((step) => step.kind === "section" && step.status === "done");
    const picks = new Map<string, string>();
    for (const step of sections) for (const id of collect(step.data, "entity", new Set())) if (!picks.has(id)) picks.set(id, step.label);
    const picked = [...picks.entries()].flatMap(([id, section]) => {
      const entity = outcome.entity(id);
      return entity ? [{ entity, section, event: findEvent(programme, id) }] : [];
    });
    const ranked = (programme?.events ?? []).filter((event) => event.match != null).toSorted((a, b) => Number(b.fits.kind) - Number(a.fits.kind) || (b.match ?? 0) - (a.match ?? 0));
    const kinds = programme ? [...new Set(programme.events.map((event) => event.kind))] : [];
    const answers = ctx.profile.filter((row) => row.answer).slice(0, 8);
    const started = state.steps.map((step) => step.startedAt).filter((n): n is number => Boolean(n));
    const ended = state.steps.map((step) => step.endedAt).filter((n): n is number => Boolean(n));
    const total = started.length && ended.length ? Math.round((Math.max(...ended) - Math.min(...started)) / 1000) : null;

    return (
      <section id="how-it-was-made" className="relative isolate -mx-5 flex scroll-mt-24 flex-col gap-12 bg-[var(--deep)] px-5 py-14 text-[var(--paper)] @3xl:-mx-10 @3xl:px-10 @6xl:mx-0 @6xl:px-14 @6xl:py-16">
        <div aria-hidden className="gig-dust absolute inset-0 -z-10 opacity-30" />
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,6.5cqi,5.75rem)] text-balance @4xl:col-span-7")}>{props.heading}</h2>
          {props.body && <p className="leading-relaxed text-pretty opacity-75 @4xl:col-span-5">{ctx.fill(props.body)}</p>}
        </div>

        <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-4">
          <Stage title={programme?.source === "api" ? "Read from the box office" : "The month, from the events API"}>
            <p className={cn(display, "text-[4.5rem] font-black [line-height:0.85] text-[var(--hot)]")}>{programme?.events.length ?? 0}</p>
            <p className="text-sm leading-relaxed opacity-85">
              shows at {programme?.venue ?? "the venue"}, {programme ? rangeLabel(programme.from, programme.to) : "this month"}
              {programme?.source === "demo" ? ", from the demo programme the code step serves in place of a real box office." : "."}
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {kinds.map((kind) => (
                <li key={kind} className="flex justify-between gap-3">
                  <span>{eventKinds[kind].label}</span>
                  <span className="tabular-nums opacity-60">{programme!.events.filter((event) => event.kind === kind).length}</span>
                </li>
              ))}
            </ul>
          </Stage>
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
          <Stage title="Ranked in Qloo">
            {matched.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {matched.map((name) => (
                  <Chip key={name} tone="hot">
                    {name}
                  </Chip>
                ))}
              </div>
            )}
            <p className="text-sm leading-relaxed opacity-85">
              {matched.length
                ? `Your favourites resolved to Qloo entities, then every show's band, film or podcast was scored against them, one call per kind. ${ranked.length} came back ranked.`
                : "No favourites named that Qloo knows, so shows were ranked by what's popular."}
            </p>
            <ol className="flex flex-col gap-1 text-sm">
              {ranked.slice(0, 5).map((event) => (
                <li key={event.id} className="flex justify-between gap-3">
                  <span className="truncate">{event.title}</span>
                  <span className="tabular-nums opacity-60">{Math.round((event.match ?? 0) * 100)}%</span>
                </li>
              ))}
            </ol>
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
            <h3 className={cn(mono, "text-[0.8rem] font-bold")}>Every pick, and why Qloo surfaced it</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t border-foreground/25 text-left text-sm">
                <thead className="text-xs opacity-60">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Pick</th>
                    <th className="py-3 pr-4 font-normal">Match</th>
                    <th className="py-3 pr-4 font-normal">Because</th>
                    <th className="py-3 font-normal">From</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map(({ entity, section, event }) => (
                    <tr key={entity.id} className="border-t border-foreground/15 align-top">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          <Thumb src={entity.image} className="size-10 shrink-0" />
                          <span className="flex flex-col">
                            <span>{entity.name}</span>
                            <span className="text-xs opacity-60">{event ? `${dateLabel(event.date, true)}, ${eventKinds[event.kind].one.toLowerCase()}` : placeMeta(entity)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {entity.affinity != null ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden bg-foreground/15">
                              <span className="block h-full bg-[var(--hot)]" style={{ width: `${Math.round(entity.affinity * 100)}%` }} />
                            </span>
                            <span className="tabular-nums">{Math.round(entity.affinity * 100)}%</span>
                          </span>
                        ) : (
                          <span className="opacity-60">{event?.seen ? "Seen here" : event?.named ? "Named" : "n/a"}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{entity.because.length ? entity.because.slice(0, 3).join(", ") : <span className="opacity-60">{event?.seen ? "On their past tickets" : event?.named ? "They named it" : "Popular nearby"}</span>}</td>
                      <td className="py-3 opacity-70">{event ? "The month" : "Places near the venue"} · {ctx.fill(section)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-sm opacity-65">
          {total ? `Made in ${total} seconds. ` : ""}
          Every show is on the venue's calendar and every place is a Qloo entity; the model could only pick from these, and anything else was dropped.
        </p>
      </section>
    );
  },
});

export const artifactComponents = [cover, picks, month, stretch, before, bring, made];
