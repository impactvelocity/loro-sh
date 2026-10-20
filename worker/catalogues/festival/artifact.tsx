/**
 * The Festival catalogue's outcome: a guide to the weekend for one person,
 * set like the start page. A sunset header with their name and a pass
 * stub, then an index: every section's heading in a column on the left
 * (sticky as you read), the section itself on the right.
 *
 * - Ticket: the header, with the page's main call to action: share it
 *   with the friends you're going with. While the outcome is being made,
 *   it shows the run instead: what Qloo matched and each step as it lands.
 * - Your Days: their plan, day by day, from the Lineup step's ranked acts:
 *   must-sees (acts they picked), acts that are new to them and a strong
 *   match in Qloo, and the hard calls where two they'd want overlap.
 * - Worth a Detour: acts left off the plan they'd likely love.
 * - Note, Picks and Callout: the Basic catalogue's, drawn in this look.
 * - How It Was Made: for demos, the run laid out: what we read, what Qloo
 *   matched, the bill ranked (and the drive routed), the skills each
 *   section followed, and every pick with why it made the cut.
 *
 * Your Days and Worth a Detour pick from the Lineup step (under From) and
 * read its public data for set times and stages, so the page never
 * invents a time.
 */
import { useState, type ReactNode } from "react";
import { CalendarHeartIcon, CheckIcon, CompassIcon, ExternalLinkIcon, LinkIcon, MapPinIcon, Share2Icon, SplitIcon, TicketIcon, WorkflowIcon } from "lucide-react";
import { z } from "zod";

import {
  type ComponentProps,
  type GeneratedProps,
  type RenderContext,
  defineComponent,
  defineGenerated,
  defineLayout,
} from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { artifactComponents as basicArtifact } from "../basic/artifact";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink, brandStyle } from "../basic/shared";
import {
  type Timetable,
  type TimetableSet,
  clock,
  exampleId,
  findSet,
  isTimetable,
  minutes,
  stageColor,
} from "./lineup";
import { Accent, ActArt, Backdrop, Logo, Stage, Sun, night, pill, poster, posterHeadings, quiet, restyle, sky, wrap } from "./shared";

const pulse = "animate-pulse rounded-(--radius) bg-foreground/[0.06]";
const tokens = "Use {{first_name}}, {{name}} or {{answers.<id>}} to fill in from their profile.";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

/**
 * Every section of the guide: a hairline, its heading in big serif in the
 * left column (sticky while you read it, with anything in `side` under
 * it), and the section itself on the right.
 */
export function Frame({
  heading,
  ctx,
  side,
  children,
}: {
  heading: string;
  ctx: RenderContext;
  /** More for the left column, under the heading: a day index, say. */
  side?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-8 border-t border-border pt-8 @4xl:grid-cols-12">
      <div className="@4xl:col-span-4">
        <div className="flex flex-col gap-6 @4xl:sticky @4xl:top-10">
          {heading && <h2 className={cn(poster, "text-[clamp(2.75rem,5cqi,4.5rem)] text-balance")}>{ctx.fill(heading)}</h2>}
          {side}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-10 @4xl:col-span-8">{children}</div>
    </section>
  );
}

/** The timetable from the step a section picks from (its public data). */
function timetableFor(lookups: string[], ctx: RenderContext): Timetable | null {
  for (const id of lookups) {
    const data = ctx.outcome?.section(id).data;
    if (isTimetable(data)) return data;
  }
  return null;
}

const percent = (match: number | null | undefined) => (match ? `${Math.round(match * 100)}% match` : null);

function setLine(set: TimetableSet | null, timetable: Timetable | null) {
  if (!set) return null;
  const day = timetable?.days.find((d) => d.name === set.day);
  return { day: day?.name ?? set.day, time: `${clock(set.start)}–${clock(set.end, true)}` };
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const badge = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Festival name", default: "Mirage Valley" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#e0603a" }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
      <header style={{ background: "var(--sky-1)", color: "var(--sky-foreground)" }}>
        <div className={cn(wrap, "flex h-18 items-center justify-between gap-4")}>
          <Logo brand={settings.brand} logo={settings.logo} className="text-xl" />
          {ctx.person && <span className="truncate text-sm opacity-70">Guide for {ctx.person.name || ctx.person.email}</span>}
        </div>
      </header>
      <main className={cn(wrap, "flex flex-1 flex-col gap-24 pt-8 pb-32 @3xl:gap-32 @3xl:pt-10", posterHeadings)}>{children}</main>
      {settings.footer && (
        <footer style={night}>
          <div className={cn(wrap, "flex flex-col gap-2 py-10 text-sm opacity-75 @2xl:flex-row @2xl:justify-between")}>
            <span>{settings.footer}</span>
            <span>{settings.brand}</span>
          </div>
        </footer>
      )}
      <RunFooter ctx={ctx} />
    </div>
  ),
});

/**
 * Send the page to friends: the phone's share sheet where there is one,
 * else the link is copied. In the editor it does nothing.
 */
function ShareBar({ ctx, line, label, title, text }: { ctx: RenderContext; line: string; label: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (ctx.preview) return;
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  const share = async () => {
    if (ctx.preview) return;
    const data = { title, text, url: window.location.href };
    if (navigator.share && (navigator.canShare?.(data) ?? true)) {
      try {
        return await navigator.share(data);
      } catch (error) {
        // They closed the sheet: nothing to do.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy();
  };
  return (
    <div className="flex flex-col gap-4">
      {line && <p className="max-w-md text-lg leading-relaxed text-pretty opacity-90">{line}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={share} className={cn(pill, "h-14 px-8 text-base")}>
          <Share2Icon className="size-4" />
          {label}
        </button>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className="inline-flex h-14 items-center gap-2 rounded-full px-6 text-[0.95rem] font-medium ring-1 ring-current/35 transition-colors hover:bg-white/10"
        >
          {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4" />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

/** The header: their name in big serif over the sunset, a pass stub, and the share. */
const ticket = defineComponent({
  type: "ticket",
  name: "Ticket",
  description: "The guide's header: their name over a desert sunset, with a pass stub.",
  icon: TicketIcon,
  fields: {
    title: f.text({ label: "Title", default: "{{first_name}}'s weekend", help: tokens }),
    intro: f.longText({ label: "Intro" }),
    pass: f.text({ label: "Pass", default: "3-Day Pass" }),
    dates: f.text({ label: "Dates", placeholder: "April 16–18, 2027" }),
    stub: f.text({ label: "Stub line", default: "{{answers.days}}", help: "Under the dates, e.g. the days they're coming." }),
    image: f.image({ label: "Photo", help: "Faded into the sky behind their name." }),
    share: f.toggle({ label: "Share button", default: true, help: "The page's main call to action: send it to friends." }),
    shareLine: f.text({ label: "Share line", default: "Going with friends? Send them your plan.", help: tokens }),
    shareLabel: f.text({ label: "Share button label", default: "Share with friends" }),
    shareText: f.text({
      label: "Share message",
      default: "Here's my plan.",
      help: "What the message says above the link.",
    }),
    making: f.text({
      label: "While it's being made",
      default: "Planning your weekend",
      help: "Shown in place of the title and share until the page is ready.",
    }),
  },
  Component: ({ props, ctx }) => {
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    return (
      <header className="flex flex-col gap-10">
        <div className="relative isolate overflow-hidden rounded-[calc(var(--radius)*2.4)]" style={sky}>
          <Backdrop src={props.image} night />
          <Sun
            className={cn(
              "pointer-events-none absolute right-[-8%] bottom-6 -z-10 w-[min(70cqi,30rem)] @4xl:right-[6%] @4xl:bottom-2 @4xl:w-[min(36cqi,32rem)]",
              making && "animate-breathe motion-reduce:animate-none",
            )}
          />
          <div className="grid min-h-[30rem] gap-10 p-7 pb-32 @3xl:min-h-[36rem] @3xl:p-12 @3xl:pb-40 @4xl:grid-cols-12">
            {making ? (
              <Making outcome={making} heading={ctx.fill(props.making)} />
            ) : (
              <div className="flex animate-in flex-col justify-end gap-10 duration-1000 fade-in slide-in-from-bottom-4 @4xl:col-span-8">
                <h1 className={cn(poster, "text-[clamp(3.5rem,9cqi,8.5rem)] leading-[0.85] text-balance")}>
                  <Accent text={ctx.fill(props.title)} />
                </h1>
                {props.share && (
                  <ShareBar
                    ctx={ctx}
                    line={ctx.fill(props.shareLine)}
                    label={props.shareLabel}
                    title={ctx.fill(props.title)}
                    text={ctx.fill(props.shareText)}
                  />
                )}
              </div>
            )}
            <div className="self-end @4xl:col-span-4">
              <div className="relative ml-auto flex max-w-xs flex-col gap-3 rounded-(--radius) bg-card/95 p-5 text-foreground shadow-xl backdrop-blur">
                {/* The perforation down the stub's edge. */}
                <span aria-hidden className="absolute inset-y-3 left-0 border-l-2 border-dashed border-border" />
                <span className="text-sm font-medium text-[var(--brand)]">{ctx.fill(props.pass)}</span>
                {props.dates && <span className="text-2xl font-semibold tracking-[-0.02em]">{ctx.fill(props.dates)}</span>}
                {props.stub && <span className="text-sm text-muted-foreground">{ctx.fill(props.stub)}</span>}
              </div>
            </div>
          </div>
        </div>
        {props.intro && (
          <div className="grid @4xl:grid-cols-12">
            <p className="text-xl leading-relaxed text-muted-foreground text-pretty @4xl:col-span-7 @4xl:col-start-4">
              {ctx.fill(props.intro)}
            </p>
          </div>
        )}
      </header>
    );
  },
});

/** The last few steps the hero lists while it's being made. */
const MAKING_LINES = 4;

/**
 * The ticket while the outcome is being made: the heading with dots that
 * keep moving, the favourites Qloo matched (once Taste lands), then the
 * run's steps as they finish, the one under way shimmering. Only what the
 * run has actually done, in its own words.
 */
function Making({ outcome, heading }: { outcome: OutcomeView; heading: string }) {
  const taste = outcome.state.steps.find((step) => step.kind === "taste");
  const matched = (taste?.data as { matched?: string[] } | null)?.matched ?? [];
  const lines = outcome.state.steps
    .filter((step) => !step.background && step.status !== "pending" && step.status !== "skipped")
    .slice(-MAKING_LINES);
  return (
    <div role="status" aria-live="polite" className="flex flex-col justify-end gap-8 @4xl:col-span-8">
      <h1 className={cn(poster, "text-[clamp(3rem,7cqi,6.5rem)] leading-[0.9] text-balance")}>
        <Accent text={heading} />
        <span aria-hidden className="inline-flex gap-[0.12em] pl-[0.15em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse text-[var(--sun)] motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {matched.length > 0 && (
        <ul aria-label="Favourites matched in Qloo" className="flex max-w-xl flex-wrap gap-2">
          {matched.map((name, i) => (
            <li
              key={name}
              className="animate-in rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur fill-mode-both fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
      <ul className="flex max-w-md flex-col gap-2.5">
        {lines.map((step) => {
          const live = step.status === "running";
          return (
            <li key={step.id} className="flex animate-in items-center gap-3 text-[1.05rem] duration-500 fade-in slide-in-from-bottom-2">
              {live ? (
                <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
                  <span className="absolute size-5 animate-ping rounded-full bg-[var(--sun)]/40 motion-reduce:animate-none" />
                  <span className="size-2.5 rounded-full bg-[var(--sun)]" />
                </span>
              ) : (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-[var(--plum)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "opacity-100" : "opacity-75")}>
                {step.message ?? step.label}
                {live && (
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/15 to-transparent motion-reduce:hidden"
                  />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PickBadge({ pick, match }: { pick: string | undefined; match: number | null | undefined }) {
  if (pick === "must") return <span className={cn(badge, "bg-[var(--brand)] text-[var(--brand-foreground)]")}>Must-see</span>;
  if (pick === "discover")
    return (
      <span className={cn(badge, "bg-[var(--plum)] text-[var(--sun)]")}>
        New to you{percent(match) ? ` · ${percent(match)}` : ""}
      </span>
    );
  if (pick === "maybe") return <span className={cn(badge, "text-muted-foreground ring-1 ring-border")}>If you're close</span>;
  return null;
}

type PlanDay = {
  day: string;
  headline: string;
  sets: { entity: string; pick: "must" | "discover" | "maybe"; note: string }[];
  calls: { entity: string; skip: { entity: string }; why: string }[];
};

/** One act on the plan: the time in serif, the photo, the act, why. */
function PlanSet({
  item,
  set,
  entity,
  timetable,
  writing,
}: {
  item: Partial<PlanDay["sets"][number]> | undefined;
  set: TimetableSet | null;
  entity: TasteEntity | null;
  timetable: Timetable | null;
  writing: boolean;
}) {
  const name = entity?.name ?? set?.artist;
  const color = set ? stageColor(timetable?.stages ?? [], set.stage) : "var(--primary)";
  const because = entity?.because.length ? `Because you like ${entity.because.join(", ")}` : null;
  return (
    <li
      className={cn(
        "grid grid-cols-[3.75rem_1fr] gap-x-4 gap-y-4 py-7 @2xl:grid-cols-[5.5rem_6.5rem_1fr] @2xl:gap-x-6",
        item?.pick === "maybe" && "opacity-80",
      )}
    >
      <div className="flex flex-col">
        {set ? (
          <>
            <span className="text-2xl leading-none font-medium tracking-[-0.02em] tabular-nums @2xl:text-[1.75rem]">{clock(set.start)}</span>
            <span className="pt-1.5 text-xs text-muted-foreground tabular-nums">to {clock(set.end, true)}</span>
          </>
        ) : (
          <div className={cn(pulse, "h-8 w-12")} aria-hidden />
        )}
      </div>
      <div className="@max-2xl:hidden">
        {name ? (
          <ActArt name={name} image={entity?.image} color={color} className="size-[6.5rem] rounded-(--radius) text-sm" />
        ) : (
          <div className={cn(pulse, "size-[6.5rem]")} aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {name ? (
            <h4 className="text-xl leading-tight font-semibold tracking-[-0.02em] @2xl:text-2xl">{name}</h4>
          ) : (
            <div className={cn(pulse, "h-8 w-44")} aria-hidden />
          )}
          <PickBadge pick={item?.pick} match={entity?.affinity ?? set?.match} />
        </div>
        {set && <Stage name={set.stage} color={color} className="text-sm text-muted-foreground" />}
        {item?.note && (
          <p className="max-w-2xl pt-1 text-[1.05rem] leading-relaxed text-pretty">
            {item.note}
            <Writing on={writing} />
          </p>
        )}
        {item?.pick === "discover" && because && <p className="text-sm text-muted-foreground">{because}</p>}
      </div>
    </li>
  );
}

const schedule = defineGenerated({
  type: "schedule",
  name: "Your Days",
  description: "Their plan, day by day: must-sees, new acts that fit them, and the hard calls. From the Lineup step.",
  icon: CalendarHeartIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your days" }),
    perDay: f.number({ label: "Sets a day, at most", default: 6, min: 3, max: 10 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        days: z
          .array(
            z.object({
              day: z.string().describe("The day's name exactly as in the timetable, e.g. Friday"),
              headline: z.string().describe("Five to nine words on the shape of their day"),
              sets: z
                .array(
                  z.object({
                    entity: z.string().describe("Candidate id of the act"),
                    pick: z
                      .enum(["must", "discover", "maybe"])
                      .describe("must: they picked or named it. discover: new to them and a strong match. maybe: worth it if they're close by"),
                    note: z.string().describe("One sentence: why this act for them, or what to do (when to arrive, where to stand, when to leave)"),
                  }),
                )
                .describe(`Up to ${props.perDay} sets that day, in time order`),
              calls: z
                .array(
                  z.object({
                    entity: z.string().describe("Candidate id of the act to go to"),
                    skip: z.object({ entity: z.string().describe("Candidate id of the act it clashes with") }),
                    why: z.string().describe("One sentence on the call, e.g. catch the first half of one, then cross over"),
                  }),
                )
                .describe("Zero to two hard choices that day, where two acts they'd want overlap"),
            }),
          )
          .describe("Only the days they're coming, in festival order"),
      }),
    instructions: (props) =>
      `Plan the days they're coming from the festival timetable under Other context (times, stages, match, theyPicked). ` +
      `Point at every act by its candidate id. Put every act they picked on its day as a must. Fill the gaps with ` +
      `acts that are new to them and score a high match, as discover, more of them if they told us they want to ` +
      `discover. Add a maybe only where it fits between the others. At most ${props.perDay} sets a day, in time order. ` +
      "Two sets on the plan must never overlap unless one is a maybe; allow about ten minutes to cross between stages. " +
      "When two acts they'd want overlap, add a call. Respect how late they go and how they like to do a festival. " +
      "Don't write set times or stage names in the notes: the page shows them.",
    picks: () => 50,
    // A few days of sets, each with an id and a note, runs past the default.
    maxOutputTokens: (props) => 2000 + props.perDay * 600,
    sample: () => ({
      days: [
        {
          day: "Friday",
          headline: "Ease in, then two big ones back to back",
          sets: [
            { entity: exampleId("Men I Trust"), pick: "discover" as const, note: "Soft and slow, the right way to start in the heat. Get a spot in the shade at the back." },
            { entity: exampleId("Beach House"), pick: "must" as const, note: "You picked them. Move up close for the second half when the light goes." },
            { entity: exampleId("Khruangbin"), pick: "must" as const, note: "Head over as Beach House finishes: you'll miss the first song, not the groove." },
            { entity: exampleId("LCD Soundsystem"), pick: "maybe" as const, note: "Stay for the first few songs if you've still got legs." },
          ],
          calls: [
            {
              entity: exampleId("Khruangbin"),
              skip: { entity: exampleId("Nilüfer Yanya") },
              why: "They overlap by half an hour. Khruangbin is the one you came for.",
            },
          ],
        },
        {
          day: "Saturday",
          headline: "Daylight discoveries, Tame Impala to close",
          sets: [
            { entity: exampleId("Toro y Moi"), pick: "discover" as const, note: "Sunny and loose, the same warm guitar sound you like in Khruangbin." },
            { entity: exampleId("Mac DeMarco"), pick: "discover" as const, note: "Lazy afternoon songs at Palm Court. Sit on the grass." },
            { entity: exampleId("Tame Impala"), pick: "must" as const, note: "Leave Jamie xx ten minutes early for a good spot." },
          ],
          calls: [
            {
              entity: exampleId("Tame Impala"),
              skip: { entity: exampleId("Four Tet") },
              why: "Four Tet plays the same slot. Catch Jamie xx before it instead.",
            },
          ],
        },
      ],
    }),
  },
  Pending: ({ props, ctx }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="flex flex-col divide-y divide-border" aria-hidden>
        <div className={cn(pulse, "mb-4 h-12 w-48")} />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid grid-cols-[3.75rem_1fr] gap-4 py-7 @2xl:grid-cols-[5.5rem_6.5rem_1fr] @2xl:gap-6">
            <div className={cn(pulse, "h-9 w-14")} />
            <div className={cn(pulse, "size-[6.5rem] @max-2xl:hidden")} />
            <div className="flex flex-col gap-3">
              <div className={cn(pulse, "h-9 w-3/5")} />
              <div className={cn(pulse, "h-4 w-5/6")} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  ),
  Component: ({ id, props, ctx, section }) => {
    const timetable = timetableFor(props.lookups, ctx);
    const days = (section.data?.days ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame
        heading={props.heading}
        ctx={ctx}
        side={
          days.length > 1 && (
            <nav aria-label="Days" className="flex gap-x-5 gap-y-1 @4xl:flex-col">
              {days.map((day, d) =>
                day?.day ? (
                  <CatalogueLink
                    key={d}
                    href={`#${id}-${slug(day.day)}`}
                    ctx={ctx}
                    className="text-lg font-medium opacity-55 transition-opacity hover:opacity-100"
                  >
                    {day.day}
                  </CatalogueLink>
                ) : null,
              )}
            </nav>
          )
        }
      >
        <div className="flex flex-col gap-16">
          {days.map((day, d) => {
            const date = timetable?.days.find((x) => x.name === day?.day)?.date;
            const items = (day?.sets ?? [])
              .filter(Boolean)
              .map((item) => ({ item, set: findSet(timetable, item?.entity) }))
              .toSorted((a, b) => (a.set ? minutes(a.set.start) : Infinity) - (b.set ? minutes(b.set.start) : Infinity));
            const calls = (day?.calls ?? []).filter((call) => call?.entity && call.why);
            const lastDay = d === days.length - 1;
            return (
              <div key={d} id={day?.day ? `${id}-${slug(day.day)}` : undefined} className="flex scroll-mt-10 flex-col">
                <div className="flex flex-col gap-3 border-b-2 border-foreground pb-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className={cn(poster, "text-[clamp(3rem,6cqi,4.5rem)] leading-none")}>{day?.day}</h3>
                    {date && <span className={cn(quiet, "shrink-0")}>{date}</span>}
                  </div>
                  {day?.headline && <p className="text-lg text-muted-foreground text-pretty">{day.headline}</p>}
                </div>
                <ol className="flex flex-col divide-y divide-border">
                  {items.map(({ item, set }, i) => (
                    <PlanSet
                      key={i}
                      item={item}
                      set={set}
                      entity={ctx.outcome?.entity(item?.entity) ?? null}
                      timetable={timetable}
                      writing={writing && lastDay && i === items.length - 1 && calls.length === 0}
                    />
                  ))}
                </ol>
                {calls.length > 0 && (
                  <div style={night} className="mt-2 flex flex-col gap-6 rounded-[calc(var(--radius)*1.6)] p-7 @2xl:p-9">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--sun)]">
                      <SplitIcon className="size-4" />
                      The hard {calls.length === 1 ? "call" : "calls"}
                    </span>
                    {calls.map((call, i) => {
                      const go = findSet(timetable, call?.entity);
                      const skip = findSet(timetable, call?.skip?.entity);
                      const name = (entity: string | undefined, set: TimetableSet | null) =>
                        ctx.outcome?.entity(entity)?.name ?? set?.artist;
                      return (
                        <div key={i} className="flex flex-col gap-2">
                          <p className="text-xl leading-snug font-semibold tracking-[-0.02em]">
                            {name(call?.entity, go)}
                            {skip && (
                              <span className="opacity-60">
                                {" "}
                                <em className="italic">over</em> {name(call?.skip?.entity, skip)}
                              </span>
                            )}
                          </p>
                          {skip && (
                            <span className="text-xs tabular-nums opacity-60">
                              {name(call?.skip?.entity, skip)} plays {clock(skip.start, true)} at {skip.stage}
                            </span>
                          )}
                          {call?.why && (
                            <p className="max-w-2xl leading-relaxed opacity-85 text-pretty">
                              {call.why}
                              <Writing on={writing && lastDay && i === calls.length - 1} />
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Frame>
    );
  },
});

const spotlight = defineGenerated({
  type: "spotlight",
  name: "Worth a Detour",
  description: "Acts left off their plan that they'd likely love, each with when and why. From the Lineup step.",
  icon: CompassIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Worth a detour" }),
    count: f.number({ label: "How many", default: 3, min: 1, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence leading in, for them."),
        items: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id of the act"),
              why: z.string().describe("One or two sentences: what they sound like, tied to an artist they love"),
            }),
          )
          .describe(`${props.count} acts, best match first`),
      }),
    instructions: (props) =>
      `Pick ${props.count} acts from the Candidates list only, by id: they're the acts not already on their plan. ` +
      "The timetable under Other context is for reference; an act that isn't a candidate will be dropped. " +
      "Choose ones they'd likely love but didn't pick, preferring a high match and " +
      "acts on the days they're coming. For each, say what they sound like by comparison with an artist they told us " +
      "they love. Don't write set times or stages: the page shows them.",
    picks: (props) => Math.min(20, props.count * 4),
    sample: (props) => ({
      intro: "Three more that sit close to what you love, if a set runs short or plans change.",
      items: ["Hermanos Gutiérrez", "Altın Gün", "Hiatus Kaiyote"].slice(0, props.count).map((artist, i) => ({
        entity: exampleId(artist),
        why: [
          "Two brothers playing slow, cinematic desert guitar. If you love Khruangbin's instrumentals, this is the purest version of it.",
          "Turkish folk songs played as warm psych-rock. The same hypnotic bass lines that pull you into Khruangbin.",
          "Future soul with a band that can turn on a dime. Closer to Beach House's dreaminess than it sounds on paper.",
        ][i],
      })),
    }),
  },
  Pending: ({ props, ctx }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="grid gap-x-6 gap-y-10 @2xl:grid-cols-3" aria-hidden>
        {Array.from({ length: props.count }, (_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className={cn(pulse, "aspect-[4/5] w-full")} />
            <div className={cn(pulse, "h-8 w-2/3")} />
            <div className={cn(pulse, "h-4 w-full")} />
          </div>
        ))}
      </div>
    </Frame>
  ),
  Component: ({ props, ctx, section }) => {
    const timetable = timetableFor(props.lookups, ctx);
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {section.data?.intro && (
          <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground text-pretty">
            {section.data.intro}
          </p>
        )}
        <ul className="grid gap-x-6 gap-y-12 @2xl:grid-cols-3">
          {items.map((item, i) => {
            const set = findSet(timetable, item?.entity);
            const entity = ctx.outcome?.entity(item?.entity) ?? null;
            const name = set?.artist ?? entity?.name;
            if (!name) return <li key={i} className={cn(pulse, "aspect-[4/5] w-full")} aria-hidden />;
            const color = set ? stageColor(timetable?.stages ?? [], set.stage) : "var(--primary)";
            const when = setLine(set, timetable);
            const match = percent(entity?.affinity ?? set?.match);
            return (
              <li key={i} className="flex flex-col gap-4">
                <div className="relative">
                  <ActArt name={name} image={entity?.image} color={color} className="aspect-[4/5] w-full rounded-(--radius) text-4xl" />
                  {match && <span className={cn(badge, "absolute top-3 left-3 bg-[var(--plum)] text-[var(--sun)]")}>{match}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">{name}</h3>
                  {set && when && (
                    <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                      <span>
                        {when.day} · {when.time}
                      </span>
                      <Stage name={set.stage} color={color} />
                    </span>
                  )}
                </div>
                {item?.why && (
                  <p className="leading-relaxed text-pretty">
                    {item.why}
                    <Writing on={writing && i === items.length - 1} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Frame>
    );
  },
});

// The Basic catalogue's sections the guide uses, in this look. Same fields and writing, so saved guides keep working.

type Generated<T, P = Record<string, never>> = GeneratedProps<any, T> & {
  props: P & { heading: string; lookups: string[]; prompt: string; skills: string[] };
};

const note = restyle(
  basicArtifact,
  "note",
  ({ props, ctx, section }: Generated<{ paragraphs: string[] }>) => {
    const paragraphs = (section.data?.paragraphs ?? []).filter((p): p is string => Boolean(p));
    const [lead, ...rest] = paragraphs;
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        <div className="flex max-w-3xl flex-col gap-6">
          {lead && (
            <p className="text-[clamp(1.35rem,2.2cqi,1.75rem)] leading-snug font-medium tracking-[-0.015em] text-pretty">
              {lead}
              <Writing on={writing && rest.length === 0} />
            </p>
          )}
          {rest.map((paragraph, i) => (
            <p key={i} className="text-lg leading-relaxed text-muted-foreground text-pretty">
              {paragraph}
              <Writing on={writing && i === rest.length - 1} />
            </p>
          ))}
        </div>
      </Frame>
    );
  },
  ({ props, ctx }: { props: { heading: string }; ctx: RenderContext }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="flex max-w-3xl flex-col gap-3" aria-hidden>
        <div className={cn(pulse, "h-9 w-full")} />
        <div className={cn(pulse, "h-9 w-4/5")} />
        <div className={cn(pulse, "mt-3 h-5 w-full")} />
        <div className={cn(pulse, "h-5 w-2/3")} />
      </div>
    </Frame>
  ),
);

const placeMeta = (entity: TasteEntity) =>
  [entity.neighbourhood, entity.priceLevel ? "$".repeat(entity.priceLevel) : null, entity.tags[0]].filter(Boolean).join(" · ");

const mapsLink = (entity: TasteEntity) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([entity.name, entity.address].filter(Boolean).join(", "))}`;

/** A place's photo, or a pin when it has none or the link is dead. */
function PlaceArt({ src }: { src: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = "aspect-[4/3] w-full rounded-(--radius)";
  if (src && failed !== src) return <img src={src} alt="" onError={() => setFailed(src)} className={cn(box, "bg-muted object-cover")} />;
  return (
    <div className={cn(box, "flex items-center justify-center bg-secondary text-muted-foreground")}>
      <MapPinIcon className="size-6" />
    </div>
  );
}

const picks = restyle(
  basicArtifact,
  "picks",
  ({ props, ctx, section }: Generated<{ intro: string; items: { entity: string; why: string }[] }, { count: number }>) => {
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {section.data?.intro && (
          <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground text-pretty">{section.data.intro}</p>
        )}
        <ul className="grid gap-x-6 gap-y-12 @2xl:grid-cols-3">
          {items.map((item, i) => {
            const entity = ctx.outcome?.entity(item?.entity) ?? null;
            if (!entity) return <li key={i} className={cn(pulse, "aspect-[4/3] w-full")} aria-hidden />;
            const href = entity.type === "place" ? mapsLink(entity) : entity.website;
            return (
              <li key={entity.id} className="flex flex-col gap-4">
                <PlaceArt src={entity.image} />
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-baseline gap-2 underline-offset-4 hover:underline">
                        {entity.name}
                        <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
                      </a>
                    ) : (
                      entity.name
                    )}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {entity.type === "place" ? placeMeta(entity) : entity.tags.slice(0, 2).join(" · ")}
                  </span>
                </div>
                {item?.why && (
                  <p className="leading-relaxed text-pretty">
                    {item.why}
                    <Writing on={writing && i === items.length - 1} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Frame>
    );
  },
  ({ props, ctx }: { props: { heading: string; count: number }; ctx: RenderContext }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="grid gap-x-6 gap-y-10 @2xl:grid-cols-3" aria-hidden>
        {Array.from({ length: props.count }, (_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className={cn(pulse, "aspect-[4/3] w-full")} />
            <div className={cn(pulse, "h-8 w-2/3")} />
            <div className={cn(pulse, "h-4 w-full")} />
          </div>
        ))}
      </div>
    </Frame>
  ),
);

type CalloutProps = { tone: "soft" | "accent" | "outline"; title: string; body: string; link: { label: string; href: string } };

const callout = restyle(basicArtifact, "callout", ({ props, ctx }: ComponentProps<any> & { props: CalloutProps }) => (
  <aside
    style={props.tone === "accent" ? night : undefined}
    className={cn(
      "grid gap-6 rounded-[calc(var(--radius)*2)] p-8 @3xl:p-12 @4xl:grid-cols-12 @4xl:items-end",
      props.tone === "soft" && "bg-secondary",
      props.tone === "outline" && "ring-1 ring-border",
    )}
  >
    <h2 className={cn(poster, "text-[clamp(2.5rem,5cqi,4rem)] leading-[0.95] text-balance @4xl:col-span-6")}>
      <Accent text={ctx.fill(props.title)} />
    </h2>
    <div className="flex flex-col items-start gap-5 @4xl:col-span-5">
      {props.body && <p className="text-lg leading-relaxed text-pretty opacity-85">{ctx.fill(props.body)}</p>}
      {props.link.label && (
        <CatalogueLink href={props.link.href} ctx={ctx} className={pill}>
          {props.link.label}
        </CatalogueLink>
      )}
    </div>
  </aside>
));

const restyled = new Set(["note", "picks", "callout"]);

// How It Was Made: the run, laid out for the demo.

/** Every `entity` a section points at, leaving out the acts a clash call skips. */
function picksIn(data: unknown, into: Set<string>) {
  if (Array.isArray(data)) for (const item of data) picksIn(item, into);
  else if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (key === "entity" && typeof value === "string" && value.trim()) into.add(value.trim());
      else if (key !== "skip") picksIn(value, into);
    }
  }
  return into;
}

const seconds = (step: { startedAt: number | null; endedAt: number | null }) =>
  step.startedAt && step.endedAt ? Math.max(1, Math.round((step.endedAt - step.startedAt) / 1000)) : null;

const miles = (km: number) => Math.round(km * 0.621).toLocaleString("en-US");

type RouteData = { km: number; legs: { day: string; from: string; to: string; km: number; stops: { places: string[] }[] }[] };
const isRoute = (data: unknown): data is RouteData =>
  Boolean(data && typeof data === "object" && Array.isArray((data as RouteData).legs) && typeof (data as RouteData).km === "number");

/** One stage of the run: a hairline, a small title, then what happened. */
function MadeStage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-t border-current/20 pt-5">
      <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Behind the page, for the hackathon's judges: what the run did between
 * the questions and the page, read from the run itself. Their answers,
 * the favourites Qloo matched, the bill ranked against them (and the
 * drive routed, on a road trip), each section's time and skills, then
 * every pick with its Qloo match and why it surfaced. Shown once the
 * page is ready, on the night band, so it reads as apart from the guide.
 */
const made = defineComponent({
  type: "made",
  name: "How It Was Made",
  description: "For demos: what the run read, what Qloo matched and ranked, and why each pick made the cut.",
  icon: WorkflowIcon,
  fields: {
    label: f.text({ label: "Label", default: "For the Loro demo" }),
    heading: f.text({ label: "Heading", default: "How this page was made" }),
    body: f.longText({ label: "Intro", help: "Follows how long it took, e.g. \"Made in 30 seconds.\"" }),
  },
  Component: ({ props, ctx }) => {
    const outcome = ctx.outcome;
    if (!outcome || outcome.status === "running") return null;
    const { state } = outcome;
    const taste = state.steps.find((step) => step.kind === "taste");
    const tasteData = (taste?.data ?? {}) as { matched?: string[]; found?: number };
    const code = state.steps.filter((step) => step.kind === "code" && step.status === "done");
    const timetable = code.map((step) => step.data).find(isTimetable) ?? null;
    const route = code.map((step) => step.data).find(isRoute) ?? null;
    const sections = state.steps.filter((step) => step.kind === "section" && step.status === "done");

    // Each pick, and the first section it's in.
    const picks = new Map<string, string>();
    for (const step of sections) for (const id of picksIn(step.data, new Set())) if (!picks.has(id)) picks.set(id, step.label);
    const setFor = (entity: TasteEntity) =>
      timetable?.sets.find((set) => set.id === entity.id || set.artist.toLowerCase() === entity.name.toLowerCase()) ?? null;
    const picked = [...picks.entries()].flatMap(([id, section]) => {
      const entity = outcome.entity(id);
      if (!entity) return [];
      const set = setFor(entity);
      return [{ entity, section, set, match: entity.affinity ?? set?.match ?? null }];
    });

    const ranked = (timetable?.sets ?? []).filter((set) => typeof set.match === "number").toSorted((a, b) => (b.match ?? 0) - (a.match ?? 0));
    const answers = ctx.profile.filter((row) => row.answer).slice(0, 6);
    const started = state.steps.map((step) => step.startedAt).filter((n): n is number => Boolean(n));
    const ended = state.steps.map((step) => step.endedAt).filter((n): n is number => Boolean(n));
    const total = started.length && ended.length ? Math.round((Math.max(...ended) - Math.min(...started)) / 1000) : null;
    const intro = [total ? `Made in ${total} seconds.` : "", ctx.fill(props.body)].filter(Boolean).join(" ");

    return (
      <section id="how-it-was-made" style={night} className="flex scroll-mt-24 flex-col gap-12 rounded-[calc(var(--radius)*2.4)] p-6 @3xl:p-12">
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <div className="flex flex-col items-start gap-5 @4xl:col-span-7">
            {props.label && (
              <span className="rounded-full bg-[var(--sun)] px-3 py-1 text-sm font-semibold text-[var(--plum)]">{props.label}</span>
            )}
            <h2 className={cn(poster, "text-[clamp(2.75rem,5.5cqi,5rem)] text-balance")}>
              <Accent text={ctx.fill(props.heading)} />
            </h2>
          </div>
          {intro && <p className="text-lg leading-relaxed text-pretty opacity-80 @4xl:col-span-5">{intro}</p>}
        </div>

        <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
          <MadeStage title="What we read">
            <dl className="flex flex-col gap-3">
              {answers.map((row) => (
                <div key={row.id} className="flex flex-col gap-0.5">
                  <dt className="text-xs opacity-60">{row.question}</dt>
                  <dd className="line-clamp-2 text-sm">{row.answer}</dd>
                </div>
              ))}
            </dl>
          </MadeStage>
          <MadeStage title="What Qloo matched">
            {(tasteData.matched ?? []).length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {tasteData.matched!.map((name) => (
                  <li key={name} className="rounded-full bg-white/10 px-2.5 py-1 text-sm ring-1 ring-white/15">
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-60">No named favourites, so Qloo ranked by their answers.</p>
            )}
            <p className="text-sm leading-relaxed opacity-80">
              Each favourite resolved to a Qloo entity and used as a weighted taste signal
              {tasteData.found ? `, which surfaced ${tasteData.found} candidates` : ""}.
            </p>
          </MadeStage>
          {ranked.length > 0 && (
            <MadeStage title="The bill, ranked">
              <p className={cn(poster, "text-6xl text-[var(--sun)]")}>{ranked.length}</p>
              <p className="text-sm leading-relaxed opacity-80">acts scored against their taste in one Qloo call. The top of the list:</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {ranked.slice(0, 5).map((set) => (
                  <li key={set.artist} className="flex items-baseline justify-between gap-3">
                    <span className="truncate">
                      {set.artist}
                    </span>
                    <span className="tabular-nums opacity-70">{Math.round((set.match ?? 0) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </MadeStage>
          )}
          {route && (
            <MadeStage title="The drive, routed">
              <p className={cn(poster, "text-6xl text-[var(--sun)]")}>{miles(route.km)}</p>
              <p className="text-sm leading-relaxed opacity-80">
                miles on the real road, split into {route.legs.length} {route.legs.length === 1 ? "day" : "days"}, with{" "}
                {route.legs.reduce((sum, leg) => sum + leg.stops.reduce((n, stop) => n + stop.places.length, 0), 0)} Qloo places
                found near the towns on the way.
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {route.legs.map((leg) => (
                  <li key={leg.day} className="flex items-baseline justify-between gap-3">
                    <span>
                      {leg.from.split(",")[0]} to {leg.to.split(",")[0]}
                    </span>
                    <span className="shrink-0 tabular-nums opacity-70">{miles(leg.km)} mi</span>
                  </li>
                ))}
              </ul>
            </MadeStage>
          )}
          <MadeStage title="Written for them">
            <ul className="flex flex-col gap-3.5">
              {sections.map((step) => (
                <li key={step.id} className="flex flex-col gap-1">
                  <span className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{step.label}</span>
                    {seconds(step) && <span className="tabular-nums opacity-60">{seconds(step)}s</span>}
                  </span>
                  {(step.skills ?? []).length > 0 && <span className="text-xs text-[var(--sun)]">{step.skills!.join(" · ")}</span>}
                </li>
              ))}
            </ul>
          </MadeStage>
        </div>

        {picked.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-[-0.01em]">Every pick, and why it made the cut</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-t border-current/20 text-left text-sm">
                <thead className="text-xs opacity-60">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Pick</th>
                    <th className="py-3 pr-4 font-normal">Qloo match</th>
                    <th className="py-3 pr-4 font-normal">Why it surfaced</th>
                    <th className="py-3 font-normal">What Qloo knows</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map(({ entity, section, set, match }) => (
                    <tr key={entity.id} className="border-t border-current/10 align-top">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          {entity.image ? (
                            <img src={entity.image} alt="" loading="lazy" className="size-10 shrink-0 rounded-(--radius) object-cover" />
                          ) : (
                            <span className="size-10 shrink-0 rounded-(--radius) bg-white/10" />
                          )}
                          <span className="flex flex-col">
                            <span className="font-medium">{entity.name}</span>
                            <span className="text-xs opacity-60">{section}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {match != null ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                              <span className="block h-full bg-[var(--sun)]" style={{ width: `${Math.round(match * 100)}%` }} />
                            </span>
                            <span className="tabular-nums">{Math.round(match * 100)}%</span>
                          </span>
                        ) : (
                          // Qloo leaves the signals themselves out of its ranking.
                          <span className="opacity-50">{set?.named ? "Their pick" : "n/a"}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {set?.named
                          ? "They picked it"
                          : entity.because.length
                            ? `They like ${entity.because.slice(0, 3).join(", ")}`
                            : set
                              ? "Ranked high against their favourites"
                              : <span className="opacity-50">Their answers</span>}
                      </td>
                      <td className="py-3 opacity-70">{(entity.keywords.length ? entity.keywords : entity.tags).slice(0, 4).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-sm opacity-60">
          Every act and place on the page is a Qloo entity. The model could only pick from those candidates, and anything else was dropped.
        </p>
      </section>
    );
  },
});

export const artifactComponents = [
  ticket,
  schedule,
  spotlight,
  note,
  picks,
  callout,
  made,
  ...basicArtifact.filter((definition) => !restyled.has(definition.type)),
];
