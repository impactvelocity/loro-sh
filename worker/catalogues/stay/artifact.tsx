/**
 * The Stay catalogue's outcome: one guest's days at a holiday house,
 * planned from their booking answers and their taste. Usually started by
 * the booking system (POST /experiences/:slug/trigger) and emailed; set
 * like the start page, with each section's heading centred over a narrow
 * column. The house's facts live in the workflow prompt, so every section
 * can read them.
 *
 * - Cover: their name over the house, and the page's call to action
 *   (text the hosts). While the page is made it shows the search instead:
 *   the favourites matched, the places found near the house, the steps.
 * - A Note From the Hosts: a few lines written to them, as the hosts.
 * - Your Days: from dinner the night they arrive to coffee before
 *   check-out, timed stops at places Qloo found near the house, each
 *   saying whether the dog comes.
 * - Your Locals: places near the house for parts of their day, each
 *   standing in for a place they love at home, with the walk.
 * - For the Drive: artists for the road there, from their music.
 * - Notes and House Details: the start page's, headed with their dog's
 *   name and filled from their answers.
 * - How It Was Made: for demos, the run laid out: answers, Qloo, writing, every pick.
 */
import { CarIcon, CheckIcon, FootprintsIcon, MailOpenIcon, PanelTopIcon, RouteIcon, WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";

import { type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { parsePoint } from "@core/outcome/lookups";
import { sampleEntities, sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { RunFooter } from "../basic/run-footer";
import { brandStyle } from "../basic/shared";
import { Accent, Action, Chip, Logo, display, displayHeadings, lead, named, quiet, wrap } from "./shared";
import { details, notes } from "./start";

const pulse = "animate-pulse bg-foreground/[0.06]";
const tokens = "Use {{first_name}}, {{name}} or {{answers.<id>}} to fill in from their answers.";
const fromHelp = "The house, as lat, lng. Sets the walk and drive times.";
/** Added to every section that mentions the dog: models guess a sex otherwise. */
const dogRule = " We don't know the dog's sex: use their name or they, never he, she, him or her.";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

/** Every outcome section: the heading centred, an optional line under it, then the section in a narrow column. */
function Frame({ id, heading, intro, ctx, children }: { id?: string; heading: string; intro?: ReactNode; ctx: RenderContext; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col items-center gap-12">
      <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
        {heading && <h2 className={cn(display, "text-[clamp(2.4rem,5cqi,4rem)] text-balance")}>{ctx.fill(heading)}</h2>}
        {intro && <div className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{intro}</div>}
      </div>
      <div className="flex w-full max-w-4xl min-w-0 flex-col gap-10">{children}</div>
    </section>
  );
}

function PendingRows({ heading, ctx, rows }: { heading: string; ctx: RenderContext; rows: number }) {
  return (
    <Frame heading={heading} ctx={ctx}>
      <div className="flex flex-col border-t border-border" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-6 border-b border-border py-7 @2xl:grid-cols-[6rem_1fr_9rem]">
            <div className={cn(pulse, "h-6 w-16")} />
            <div className="flex flex-col gap-2.5">
              <div className={cn(pulse, "h-6 w-1/2")} />
              <div className={cn(pulse, "h-4 w-5/6")} />
            </div>
            <div className={cn(pulse, "aspect-[4/3] @max-2xl:hidden")} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Straight-line distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** "6 min walk" from the house, allowing for streets not running straight. Past 25 minutes on foot, "12 min drive". */
function fromHouse(from: string, entity: TasteEntity) {
  const home = parsePoint(from);
  if (!home || !entity.location) return null;
  const km = distanceKm(home, entity.location) * 1.3;
  const walking = Math.max(1, Math.round((km / 5) * 60));
  if (walking <= 25) return `${walking} min walk`;
  return `${Math.max(2, Math.round((km / 45) * 60))} min drive`;
}

/** True when Qloo's tags or reviews mention dogs: the only way the page says a place is dog-friendly. */
function dogsMentioned(entity: TasteEntity) {
  return [...entity.tags, ...entity.keywords].some((word) => /\bdogs?\b|dog[- ]friendly|pet[- ]friendly/i.test(word));
}

function mapsLink(entity: TasteEntity) {
  const query = [entity.name, entity.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** A day's stops with its spot visit put in at its time. */
function timeline(day: Day) {
  const rows: ({ kind: "stop"; stop: Stop | undefined } | { kind: "spot"; visit: Visit })[] = (day.stops ?? []).map((stop) => ({ kind: "stop", stop }));
  if (day.spot?.spot) {
    const at = minutesOf(day.spot.time);
    const index = rows.findIndex((row) => row.kind === "stop" && minutesOf(row.stop?.time) > at);
    rows.splice(index < 0 ? rows.length : index, 0, { kind: "spot", visit: day.spot });
  }
  return rows;
}

/** A Qloo photo, or the sand where one won't load. */
function Photo({ src, className, round }: { src: string; className?: string; round?: boolean }) {
  return (
    <span className={cn("block overflow-hidden bg-[var(--sand)]", round && "rounded-full", className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        className="size-full object-cover"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    </span>
  );
}

/** The names they gave in one answer that also pulled this pick up, so "because you like" names their own words. */
function becauseOf(entity: TasteEntity, ctx: RenderContext, answer: string) {
  const said = String(ctx.answers[answer] ?? "").toLowerCase();
  return entity.because.filter((name) => {
    const full = name.toLowerCase();
    const first = full.split(" ")[0];
    return said.includes(full) || (first.length >= 4 && said.includes(first));
  });
}

/** Their dog's name from the answers, or "the dog". */
function dogName(ctx: RenderContext) {
  const name = ctx.answers.dog;
  return typeof name === "string" && name.trim() ? name.trim() : "the dog";
}

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "House name", default: "Low Tide House" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#9c9a81" }),
    cta: f.link({ label: "Header button", default: { label: "Text your hosts", href: "" }, help: "Stays at the top as they read, once the page is ready." }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => {
    const ready = ctx.outcome?.status !== "running";
    return (
      <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
          <div className={cn(wrap, "flex h-20 items-center justify-between gap-4")}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-[1.3rem] @3xl:text-[1.5rem]" />
            <div className="flex min-w-0 items-center gap-5">
              {ctx.person && <span className="truncate font-display text-[1.05rem] italic text-muted-foreground @max-2xl:hidden">For {ctx.person.name || ctx.person.email}</span>}
              {ready && <Action link={settings.cta} ctx={ctx} className="h-10 animate-in px-4 text-[0.92rem] whitespace-nowrap duration-700 fade-in @3xl:px-5" />}
            </div>
          </div>
        </header>
        <main className={cn(wrap, "flex flex-1 flex-col gap-28 pb-32 @3xl:gap-36", displayHeadings)}>{children}</main>
        <footer className={cn(wrap, "flex flex-col gap-3 border-t border-border py-10 text-sm text-muted-foreground @2xl:flex-row @2xl:justify-between")}>
          {settings.footer && <span>{settings.footer}</span>}
          <span className="font-display text-base text-foreground">{settings.brand}</span>
        </footer>
        <RunFooter ctx={ctx} />
      </div>
    );
  },
});

/** The top of the page: their name over the house, centred on an inset photo, and the call to action. */
const cover = defineComponent({
  type: "cover",
  name: "Cover",
  description: "Their name centred over an inset photo of the house, with the button. Shows the search while the page is made.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Title", default: "Your stay, {{first_name}}", help: tokens }),
    details: f.text({ label: "Under the title", help: tokens }),
    intro: f.longText({ label: "Intro", help: tokens }),
    image: f.image({ label: "Photo" }),
    link: f.link({ label: "Button", default: { label: "Text your hosts", href: "" } }),
    making: f.text({
      label: "While it's being made",
      default: "Planning your days",
      help: "Shown in place of the title and button until the page is ready.",
    }),
  },
  Component: ({ props, ctx }) => {
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    return (
      <header className="relative isolate flex min-h-[min(80svh,48rem)] flex-col items-center justify-center overflow-hidden bg-[var(--deep)] px-6 py-24 text-center text-white">
        {props.image && (
          <>
            <img
              src={props.image}
              alt=""
              fetchPriority="high"
              className={cn(
                "absolute inset-0 -z-10 size-full object-cover transition-[filter] duration-1000",
                making ? "animate-drift brightness-[0.6] motion-reduce:animate-none" : "brightness-[0.82]",
              )}
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-radial from-black/40 via-black/20 to-transparent" />
          </>
        )}
        {making ? (
          <Making outcome={making} heading={ctx.fill(props.making)} />
        ) : (
          <div className="flex max-w-4xl animate-in flex-col items-center gap-6 duration-1000 fade-in slide-in-from-bottom-4">
            <h1 className={cn(display, "text-[clamp(2.9rem,7.5cqi,6rem)] [line-height:1.02] text-balance")}>
              <Accent text={ctx.fill(props.title)} />
            </h1>
            {props.details && <p className="font-display text-[1.25rem] opacity-95">{ctx.fill(props.details)}</p>}
            {props.intro && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-90">{ctx.fill(props.intro)}</p>}
            <Action link={props.link} ctx={ctx} kind="paper" className="mt-3 h-13 px-9" />
          </div>
        )}
      </header>
    );
  },
});

/** The last few steps the cover lists while the page is being made. */
const MAKING_LINES = 4;
/** How many of the places found it shows as photos. */
const MAKING_PLACES = 10;

/**
 * The cover while the page is being made: the heading with dots that keep
 * moving, the favourites Qloo matched, photos of the places it's found
 * near the house as they come in, then the run's steps as they finish,
 * the one under way shimmering. Only what the run has actually done.
 */
function Making({ outcome, heading }: { outcome: OutcomeView; heading: string }) {
  const taste = outcome.state.steps.find((step) => step.kind === "taste");
  const matched = (taste?.data as { matched?: string[] } | null)?.matched ?? [];
  const places = Object.values(outcome.state.entities).filter((entity) => entity.type === "place");
  const shown = places.filter((entity) => entity.image).slice(0, MAKING_PLACES);
  const lines = outcome.state.steps
    .filter((step) => !step.background && step.status !== "pending" && step.status !== "skipped")
    .slice(-MAKING_LINES);
  return (
    <div role="status" aria-live="polite" className="flex w-full max-w-3xl flex-col items-center gap-9">
      <h1 className={cn(display, "text-[clamp(2.6rem,6.5cqi,5rem)] text-balance")}>
        <Accent text={heading} />
        <span aria-hidden className="inline-flex gap-[0.1em] pl-[0.08em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {matched.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <span className="font-display text-[1.05rem] italic opacity-80">Matching what you love at home</span>
          <ul aria-label="Favourites matched" className="flex flex-wrap justify-center gap-2">
            {matched.map((name, i) => (
              <li
                key={name}
                className="animate-in rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur fill-mode-both fade-in zoom-in-95 duration-500"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {shown.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <span className="font-display text-[1.05rem] italic opacity-80">
            {places.length} {places.length === 1 ? "place" : "places"} found near the house
          </span>
          <ul aria-hidden className="flex flex-wrap justify-center gap-2">
            {shown.map((entity, i) => (
              <li
                key={entity.id}
                className="size-14 animate-in overflow-hidden bg-white/10 ring-1 ring-white/25 fill-mode-both fade-in zoom-in-90 duration-500 @3xl:size-16"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <img src={entity.image ?? ""} alt="" className="size-full object-cover" />
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="flex flex-col gap-2.5 text-left">
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
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[var(--deep)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "opacity-100" : "opacity-75")}>
                {/* The page speaks as the hosts; how it's made is the footer's to say. */}
                {(step.message ?? step.label).replace(/ in Qloo\b/, "")}
                {live && (
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden"
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

// A Note From the Hosts: a few lines, as the hosts, to this guest.

const welcome = defineGenerated({
  type: "welcome",
  name: "A Note From the Hosts",
  description: "A few lines from the hosts to this guest, from their answers. Signed.",
  icon: MailOpenIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "A note from your hosts" }),
    signature: f.text({ label: "Signed", placeholder: "Nell and Tomás" }),
  },
  generate: {
    schema: () =>
      z.object({
        note: z.string().describe("Three or four short sentences, as one paragraph."),
      }),
    instructions: () =>
      "Write the note the hosts would leave on the kitchen table for this guest, as the hosts, to them. " +
      "Greet them and their dog by name. Pick one or two things from their answers (who's coming, what they're here for, anything they asked us to plan around) " +
      "and tie each to one fact about the house from the brief: the fenced garden, the outdoor shower by the gate, the walk to the beach, the fire. " +
      "Don't name cafés, restaurants or shops; the plan below does. Don't sign it; the signature is added." + dogRule,
    effort: () => "low",
    sample: () => ({
      note: "Maya, we're glad you're bringing Juniper. The garden's fenced all the way round, so she can be off the lead from the minute you arrive, and the outdoor shower by the gate runs warm for when you both come back sandy. Happy anniversary for Saturday. We've planned it so you're not rushing anywhere.",
    }),
  },
  Pending: ({ props, ctx }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3" aria-hidden>
        {[95, 100, 88, 60].map((w, i) => (
          <div key={i} className={cn(pulse, "h-6")} style={{ width: `${w}%` }} />
        ))}
      </div>
    </Frame>
  ),
  Component: ({ props, ctx, section }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className={cn(lead, "text-[clamp(1.4rem,2.5cqi,1.85rem)] [line-height:1.5]")}>
          {section.data?.note}
          <Writing on={section.status === "generating"} />
        </p>
        {props.signature && section.status === "done" && <p className={cn(named, "text-xl text-muted-foreground")}>{props.signature}</p>}
      </div>
    </Frame>
  ),
});

// Your Days: from the first dinner to the last coffee.

type Stop = { time?: string; entity?: string; note?: string; dog?: boolean };
type Visit = { time?: string; spot?: string; note?: string };
type Day = { label?: string; headline?: string; spot?: Visit; stops?: (Stop | undefined)[] };
type Spot = { name: string; detail: string; image: string };
/** What the model writes. `spot` is only asked for when the house has spots. */
type DaysOutput = {
  days: {
    label: string;
    headline: string;
    spot?: { time: string; spot: string; note: string };
    stops: { time: string; entity: string; note: string; dog: boolean }[];
  }[];
};

/** "8:30 PM" as minutes after midnight, to put a spot among the stops. Unknown times go last. */
function minutesOf(time: string | undefined) {
  if (!time) return 24 * 60;
  if (/noon/i.test(time)) return 12 * 60;
  const match = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(time);
  if (!match) return 24 * 60;
  let hours = Number(match[1]) % 12;
  if (/pm/i.test(match[3] ?? "")) hours += 12;
  return hours * 60 + Number(match[2] ?? 0);
}

function spotLink(name: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Carmel-by-the-Sea, CA`)}`;
}

const days = defineGenerated({
  type: "days",
  name: "Your Days",
  description: "Day by day, from the night they arrive to check-out: timed stops near the house, saying where the dog comes.",
  icon: RouteIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your days" }),
    perDay: f.number({ label: "Stops on a full day", default: 4, min: 2, max: 6 }),
    maxDays: f.number({ label: "Days, at most", default: 4, min: 1, max: 7 }),
    from: f.text({ label: "Walk from", placeholder: "36.5527, -121.9252", help: fromHelp }),
    spots: f.list({
      label: "The house's spots",
      itemLabel: "Spot",
      max: 6,
      help: "Places the plan can send them once a day that Qloo doesn't list, like the beach.",
      fields: {
        name: f.text({ label: "Name", placeholder: "Carmel Beach" }),
        detail: f.text({ label: "Detail", placeholder: "10 min walk · dogs off-leash" }),
        image: f.image({ label: "Photo" }),
      },
    }),
  },
  generate: {
    schema: (props) => {
      const names = props.spots.map((spot) => spot.name.trim()).filter(Boolean);
      const visit = names.length
        ? {
            spot: z
              .object({
                time: z.string().describe("e.g. 7:30 AM"),
                spot: z.enum(names as [string, ...string[]]),
                note: z.string().describe("One or two sentences: what to do there with the dog. Call the dog by name or they, never he or she."),
              })
              .describe("Once a day, a visit to one of the house's own spots"),
          }
        : {};
      return z.object({
        days: z
          .array(
            z.object({
              label: z.string().describe("The day of the week, e.g. Friday"),
              headline: z.string().describe("Under ten words, what the day is, e.g. Dinner, then the beach at dusk"),
              ...visit,
              stops: z
                .array(
                  z.object({
                    time: z.string().describe("e.g. 8 AM, noon, 6:30 PM"),
                    entity: z.string().describe("Candidate id"),
                    note: z.string().describe("One or two sentences: what to do or order there, and why it's for them. The dog is they, never he or she."),
                    dog: z.boolean().describe("True if the dog comes along for this stop"),
                  }),
                )
                .describe(`Up to ${props.perDay} stops at candidates, in order through the day`),
            }),
          )
          .describe(`One per day of their stay, at most ${props.maxDays}`),
      }) as unknown as z.ZodType<DaysOutput>;
    },
    instructions: (props) =>
      "Plan their stay day by day, from the day they arrive to the day they leave, using the arrival day and number of nights in their answers. " +
      `At most ${props.maxDays} days; for a longer stay, plan the first days and the last. ` +
      "The first day starts after check-in at 4 PM, so it's dinner and maybe one more stop. The last day ends at check-out, 11 AM: coffee or breakfast, nothing after noon. " +
      `Their pace answer runs 1 to 5. On a full day, 1 or 2 means two stops, 3 means three, and 4 or 5 means up to ${props.perDay}; never more. ` +
      "On slow days the beach and the house fill the gaps; say so in the notes. " +
      "Keep neighbours together. Each candidate appears once in the whole plan, across all the days: two dinners are two different restaurants. " +
      "Match each stop to what it's for, by the candidate's tags: lunch and dinner at a restaurant, coffee at a coffee shop or bakery, a drink at a bar or wine bar. " +
      "Set dog to true only when the dog would come: walks, parks, or a place whose tags or reviews mention dogs. Otherwise the dog stays at the house; say so once a day at most, not on every stop. " +
      (props.spots.some((spot) => spot.name)
        ? `Each day also has one visit to one of the house's own spots (${props.spots.map((spot) => [spot.name, spot.detail].filter(Boolean).join(", ")).join("; ")}), at a time that suits the day; the beach goes there, never in a stop. `
        : "") +
      "A stop is only ever a candidate, and its note is about that place." +
      dogRule,
    picks: (props) => Math.min(24, props.perDay * props.maxDays + 4),
    maxOutputTokens: () => 5000,
    effort: () => "low",
    lookup: () => ({ name: "Places near the house", type: "place", near: "place", radius: 3, take: 18 }),
    sample: (props) => {
      const [a, b, c, d, e] = sampleIds.places;
      const spot = props.spots[0]?.name ?? "";
      const all: DaysOutput["days"] = [
        {
          label: "Friday",
          headline: "Dinner, then the beach at dusk",
          spot: { time: "8:30 PM", spot, note: "Ten minutes down Ocean Avenue for the last of the light. Juniper can run." },
          stops: [{ time: "7 PM", entity: a, note: "A table on the patio. Order what the person next to you is having.", dog: false }],
        },
        {
          label: "Saturday",
          headline: "A slow anniversary",
          spot: { time: "7:30 AM", spot, note: "Before the beach gets busy, so you and Juniper have most of it to yourselves." },
          stops: [
            { time: "9 AM", entity: b, note: "Coffee on the way back, while Juniper dries off on the patio.", dog: true },
            { time: "12:30 PM", entity: c, note: "A long lunch in the shade. Juniper's napping at the house.", dog: false },
            { time: "7:30 PM", entity: d, note: "Book ahead for this one. It's your anniversary.", dog: false },
          ],
        },
        {
          label: "Sunday",
          headline: "Coffee and a last walk",
          stops: [{ time: "9 AM", entity: e, note: "Pastries for the drive, and one more lap of the beach.", dog: true }],
        },
      ];
      return { days: all.slice(0, props.maxDays).map((day) => (spot ? day : { ...day, spot: undefined })) };
    },
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={4} />,
  Component: ({ props, ctx, section }) => {
    const list = (section.data?.days ?? []).filter(Boolean) as Day[];
    const writing = section.status === "generating";
    const dog = dogName(ctx);
    return (
      <Frame id="days" heading={props.heading} ctx={ctx}>
        {list.map((day, d) => (
          <div key={d} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h3 className={cn(display, "text-[clamp(2.2rem,4.4cqi,3.2rem)] italic")}>{day.label}</h3>
              {day.headline && <p className="font-display text-[1.15rem] text-muted-foreground">{day.headline}</p>}
            </div>
            <ol className="flex flex-col border-t border-border">
              {timeline(day).map((row, s, rows) => {
                const last = writing && d === list.length - 1 && s === rows.length - 1;
                if (row.kind === "spot") {
                  const spot = props.spots.find((item: Spot) => item.name === row.visit.spot);
                  if (!row.visit.spot) return null;
                  return (
                    <li key={s} className="grid gap-x-8 gap-y-3 border-b border-border py-7 @2xl:grid-cols-[6.5rem_1fr_10rem]">
                      <time className={cn(display, "text-[1.6rem] italic")}>{row.visit.time}</time>
                      <div className="flex min-w-0 flex-col gap-2">
                        <a
                          href={spotLink(row.visit.spot)}
                          target="_blank"
                          rel="noreferrer"
                          className="self-start font-display text-[1.7rem] leading-tight font-[380] underline-offset-[6px] decoration-1 hover:underline"
                        >
                          {row.visit.spot}
                        </a>
                        {spot?.detail && <span className={quiet}>{spot.detail}</span>}
                        {row.visit.note && (
                          <p className="leading-relaxed text-pretty">
                            {row.visit.note}
                            <Writing on={last} />
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Chip tone="taste">{dog === "the dog" ? "The dog comes too" : `${dog} comes too`}</Chip>
                        </div>
                      </div>
                      {spot?.image && <Photo src={spot.image} className="aspect-[4/3] w-full @max-2xl:hidden" />}
                    </li>
                  );
                }
                const stop = row.stop;
                const place = ctx.outcome?.entity(stop?.entity) ?? null;
                const away = place ? fromHouse(props.from, place) : null;
                return (
                  <li key={s} className="grid gap-x-8 gap-y-3 border-b border-border py-7 @2xl:grid-cols-[6.5rem_1fr_10rem]">
                    <time className={cn(display, "text-[1.6rem] italic")}>{stop?.time}</time>
                    <div className="flex min-w-0 flex-col gap-2">
                      {place ? (
                        <a
                          href={mapsLink(place)}
                          target="_blank"
                          rel="noreferrer"
                          className="self-start font-display text-[1.7rem] leading-tight font-[380] underline-offset-[6px] decoration-1 hover:underline"
                        >
                          {place.name}
                        </a>
                      ) : (
                        <div className={cn(pulse, "h-7 w-48")} aria-hidden />
                      )}
                      {place && <span className={quiet}>{[away, place.neighbourhood, place.tags[0]].filter(Boolean).join(" · ")}</span>}
                      {stop?.note && (
                        <p className="leading-relaxed text-pretty">
                          {stop.note}
                          <Writing on={last} />
                        </p>
                      )}
                      {place && (stop?.dog || dogsMentioned(place)) && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {stop?.dog && <Chip tone="taste">{dog === "the dog" ? "The dog comes too" : `${dog} comes too`}</Chip>}
                          {dogsMentioned(place) && <Chip>People mention dogs here</Chip>}
                        </div>
                      )}
                    </div>
                    {place?.image && <Photo src={place.image} className="aspect-[4/3] w-full @max-2xl:hidden" />}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </Frame>
    );
  },
});

// Your Locals: places near the house, each standing in for one they love at home.

const locals = defineGenerated({
  type: "locals",
  name: "Your Locals",
  description: "Places near the house for parts of their day, each standing in for a place they love at home, with the walk.",
  icon: FootprintsIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your locals" }),
    count: f.number({ label: "How many", default: 4, min: 2, max: 6 }),
    from: f.text({ label: "Walk from", placeholder: "36.5527, -121.9252", help: fromHelp }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence leading in, naming the places they love at home if they gave any."),
        items: z
          .array(
            z.object({
              role: z.string().describe("The part of their day it's for, e.g. Morning coffee, A glass of wine at six"),
              entity: z.string().describe("Candidate id"),
              standsIn: z
                .string()
                .describe("Just the name of the place they named that this one stands in for, e.g. Sightglass, with no city. Empty if none fits."),
              why: z.string().describe("One or two sentences: what the two have in common, naming a dish, drink or detail from the candidate"),
            }),
          )
          .describe(`${props.count} places, each for a different part of the day, in the order of a day`),
      }),
    instructions: (props) =>
      `Pick the ${props.count} candidates they'd go back to every day of the stay, one for each part of the day ` +
      "(the morning coffee, lunch, a drink before dinner, something sweet). When they named places they love at home, set standsIn to the one each pick " +
      "stands in for and say what the two have in common, using the candidate's tags and review keywords: a dish, a drink, the room. " +
      "Each place they named stands in for one pick at most. Skip places Your days already uses. No superlatives, no repeats." + dogRule,
    picks: (props) => Math.min(20, props.count * 4),
    lookup: () => ({ name: "Places near the house", type: "place", near: "place", radius: 2, take: 16 }),
    sample: (props) => ({
      intro: "Four places a short walk from the house that do what Sightglass and Zuni Café do for you at home.",
      items: sampleIds.places.slice(0, props.count).map((entity, i) => ({
        role: ["Morning coffee", "Lunch", "A glass of wine at six", "Something sweet"][i % 4],
        entity,
        standsIn: ["Sightglass", "", "Zuni Café", ""][i % 4],
        why: `People mention the ${sampleEntities[entity]?.keywords[0] ?? "patio"}, and it's the same unhurried room you go back to at home.`,
      })),
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.count, 4)} />,
  Component: ({ props, ctx, section }) => {
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <Frame id="locals" heading={props.heading} ctx={ctx} intro={section.data?.intro}>
        <ol className="grid gap-x-10 gap-y-14 @2xl:grid-cols-2">
          {items.map((item, i) => {
            const place = ctx.outcome?.entity(item?.entity) ?? null;
            const away = place ? fromHouse(props.from, place) : null;
            return (
              <li key={i} className="flex flex-col gap-3">
                {place?.image ? (
                  <Photo src={place.image} className="aspect-[3/2] w-full" />
                ) : (
                  <div className={cn(pulse, "aspect-[3/2] w-full")} aria-hidden />
                )}
                {item?.role && <span className="mt-2 text-sm font-semibold">{item.role}</span>}
                {place ? (
                  <a
                    href={mapsLink(place)}
                    target="_blank"
                    rel="noreferrer"
                    className="self-start font-display text-[1.9rem] leading-tight font-[350] underline-offset-[6px] decoration-1 hover:underline"
                  >
                    {place.name}
                  </a>
                ) : (
                  <div className={cn(pulse, "h-8 w-48")} aria-hidden />
                )}
                {place && <span className={quiet}>{[away, place.neighbourhood, place.priceLevel ? "$".repeat(place.priceLevel) : null].filter(Boolean).join(" · ")}</span>}
                {item?.standsIn && <p className={cn(named, "text-[1.35rem] text-muted-foreground")}>In place of {item.standsIn}</p>}
                {item?.why && (
                  <p className="leading-relaxed text-pretty">
                    {item.why}
                    <Writing on={writing && i === items.length - 1} />
                  </p>
                )}
                {place && (place.because.length > 0 || place.keywords.length > 0) && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {becauseOf(place, ctx, "favourites").slice(0, 2).map((name) => (
                      <Chip key={name} tone="taste">
                        Because you like {name}
                      </Chip>
                    ))}
                    {place.keywords.slice(0, 3).map((word) => (
                      <Chip key={word}>{word}</Chip>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Frame>
    );
  },
});

// For the Drive: artists for the road there.

const drive = defineGenerated({
  type: "drive",
  name: "For the Drive",
  description: "Artists for the road there, picked from their music, one line each.",
  icon: CarIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "For the drive" }),
    count: f.number({ label: "How many", default: 6, min: 3, max: 10 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence on the drive there, naming an artist they gave if any."),
        artists: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id"),
              line: z.string().describe("One sentence: when on the drive to play it, and one thing you can hear in it."),
            }),
          )
          .describe(`${props.count} artists, in the order of the drive`),
      }),
    instructions: (props) =>
      `Pick ${props.count} artists for the drive to the house, in the order you'd play them: the open road first, the last stretch of coast road at the end. ` +
      "Lean on artists they'd likely not know yet, introduced through one they named. Don't state facts about an artist's records, members or history. " +
      "Vary the lines: no two start with the same word, no sequence words (first, next, then, last), since the order shows it, and say what you can hear in plain words (a slow bassline, a falsetto, a drum machine), never \"-adjacent\" or a stack of genres.",
    picks: (props) => Math.min(20, props.count * 2 + 4),
    lookup: () => ({ name: "Music for the drive", type: "artist", take: 16 }),
    sample: (props) => ({
      intro: "Two hours of Highway 1, starting where Khruangbin leaves off.",
      artists: sampleIds.artists.slice(0, props.count).map((entity) => ({
        entity,
        line: "For the stretch past the fields, when the windows are down: slow bass and a guitar that takes its time.",
      })),
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={3} />,
  Component: ({ props, ctx, section }) => {
    const artists = section.data?.artists ?? [];
    const writing = section.status === "generating";
    return (
      <Frame id="drive" heading={props.heading} ctx={ctx} intro={section.data?.intro}>
        <ol className="grid gap-x-10 border-t border-border @2xl:grid-cols-2">
          {artists.map((item, i) => {
            const artist = ctx.outcome?.entity(item?.entity) ?? null;
            return (
              <li key={i} className="flex items-start gap-5 border-b border-border py-6">
                {artist?.image ? (
                  <Photo src={artist.image} round className="size-16 shrink-0" />
                ) : (
                  <span aria-hidden className={cn(pulse, "size-16 shrink-0 rounded-full")} />
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                  {artist ? <span className="font-display text-[1.5rem] leading-tight font-[380]">{artist.name}</span> : <div className={cn(pulse, "h-6 w-32")} aria-hidden />}
                  {item?.line && (
                    <p className="leading-relaxed text-pretty">
                      {item.line}
                      <Writing on={writing && i === artists.length - 1} />
                    </p>
                  )}
                  {artist && becauseOf(artist, ctx, "music").length > 0 && (
                    <div className="mt-1">
                      <Chip tone="taste">Because you like {becauseOf(artist, ctx, "music")[0]}</Chip>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Frame>
    );
  },
});

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

/** A small heading for each stage of the explainer. */
function Stage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-t border-foreground/20 pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Behind the page, for the hackathon's judges: what the run did between
 * the booking and the page, read from the run itself. Their answers, the
 * favourites Qloo matched, the places it weighed near the house, how each
 * section was written (time and skills), then every pick with Qloo's
 * affinity and the signals that surfaced it. Only shown once the page is
 * ready, and set apart from the hosts' page.
 */
const made = defineComponent({
  type: "made",
  name: "How It Was Made",
  description: "For demos: how the answers, Qloo and the writing came together on this page, read from the run.",
  icon: WorkflowIcon,
  fields: {
    label: f.text({ label: "Label", default: "For the Loro demo" }),
    heading: f.text({ label: "Heading", default: "How this page was made" }),
    body: f.longText({ label: "Intro" }),
  },
  Component: ({ props, ctx }) => {
    const outcome = ctx.outcome;
    if (!outcome || outcome.status === "running") return null;
    const { state } = outcome;
    const taste = state.steps.find((step) => step.kind === "taste");
    const tasteData = (taste?.data ?? {}) as { matched?: string[]; found?: number };
    const sections = state.steps.filter((step) => step.kind === "section" && step.status === "done");
    // Each pick, and the first section it appears in.
    const picks = new Map<string, string>();
    for (const step of sections) for (const id of collect(step.data, "entity", new Set())) if (!picks.has(id)) picks.set(id, step.label);
    const picked = [...picks.entries()].flatMap(([id, section]) => {
      const entity = outcome.entity(id);
      return entity ? [{ entity, section }] : [];
    });
    const places = Object.values(state.entities).filter((entity) => entity.type === "place");
    const artists = Object.values(state.entities).filter((entity) => entity.type === "artist");
    const answers = ctx.profile.filter((row) => row.answer).slice(0, 7);
    const started = state.steps.map((step) => step.startedAt).filter((n): n is number => Boolean(n));
    const ended = state.steps.map((step) => step.endedAt).filter((n): n is number => Boolean(n));
    const total = started.length && ended.length ? Math.round((Math.max(...ended) - Math.min(...started)) / 1000) : null;

    return (
      <section id="how-it-was-made" className="flex scroll-mt-24 flex-col gap-12 border border-dashed border-foreground/25 p-6 @3xl:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          {props.label && <Chip tone="taste">{props.label}</Chip>}
          <h2 className={cn(display, "text-[clamp(2.2rem,4.5cqi,3.4rem)] text-balance")}>{props.heading}</h2>
          {props.body && <p className="max-w-2xl leading-relaxed text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
        </div>

        <div className="grid gap-8 @3xl:grid-cols-2 @6xl:grid-cols-4">
          <Stage title="Their answers">
            <dl className="flex flex-col gap-3">
              {answers.map((row) => (
                <div key={row.id} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{row.question}</dt>
                  <dd className="line-clamp-2 text-sm">{row.answer}</dd>
                </div>
              ))}
            </dl>
          </Stage>
          <Stage title="Matched in Qloo">
            {(tasteData.matched ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tasteData.matched!.map((name) => (
                  <Chip key={name} tone="taste">
                    {name}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className={quiet}>No named favourites, so Qloo ranked by their answers.</p>
            )}
            <p className="text-sm leading-relaxed">
              Favourites resolved to Qloo entities and used as weighted signals
              {tasteData.found ? `, which surfaced ${tasteData.found} candidates` : ""}.
            </p>
          </Stage>
          <Stage title="Searched around the house">
            <p className={cn(display, "text-5xl")}>{places.length}</p>
            <p className="text-sm leading-relaxed">
              places weighed around the house's coordinates, from the beach to the coast road, plus {artists.length} artists for the drive. {picked.length} made the page.
            </p>
          </Stage>
          <Stage title="Written for them">
            <ul className="flex flex-col gap-3">
              {sections.map((step) => (
                <li key={step.id} className="flex flex-col gap-1">
                  <span className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{step.label}</span>
                    {seconds(step) && <span className="text-muted-foreground tabular-nums">{seconds(step)}s</span>}
                  </span>
                  {(step.skills ?? []).length > 0 && <span className="text-xs text-muted-foreground">{step.skills!.join(" · ")}</span>}
                </li>
              ))}
            </ul>
          </Stage>
        </div>

        {picked.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Every pick, and why Qloo surfaced it</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t border-foreground/20 text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Pick</th>
                    <th className="py-3 pr-4 font-normal">Affinity</th>
                    <th className="py-3 pr-4 font-normal">Because they like</th>
                    <th className="py-3 font-normal">What people mention</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map(({ entity, section }) => (
                    <tr key={entity.id} className="border-t border-border align-top">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          {entity.image ? (
                            <img src={entity.image} alt="" loading="lazy" className={cn("size-10 shrink-0 object-cover", entity.type === "artist" && "rounded-full")} />
                          ) : (
                            <span className="size-10 shrink-0 bg-[var(--sand)]" />
                          )}
                          <span className="flex flex-col">
                            <span className="font-medium">{entity.name}</span>
                            <span className="text-xs text-muted-foreground">{section}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {entity.affinity != null ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/10">
                              <span className="block h-full bg-[var(--brand)]" style={{ width: `${Math.round(entity.affinity * 100)}%` }} />
                            </span>
                            <span className="tabular-nums">{Math.round(entity.affinity * 100)}%</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">n/a</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{entity.because.slice(0, 3).join(", ") || <span className="text-muted-foreground">Their answers</span>}</td>
                      <td className="py-3 text-muted-foreground">{entity.keywords.slice(0, 4).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className={quiet}>
          {total ? `Made in ${total} seconds. ` : ""}
          Every place and artist on the page is a Qloo entity; the model could only pick from these candidates, and anything else was dropped.
        </p>
      </section>
    );
  },
});

export const artifactComponents = [cover, welcome, days, locals, drive, notes, details, made];
