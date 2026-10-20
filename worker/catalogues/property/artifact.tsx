/**
 * The Property catalogue's outcome: how one listing fits one buyer, set
 * like the start page. A cover with their name over the house, then an
 * index: every section's heading in big serif on the left (sticky as you
 * read), the section on the right. The listing's facts live in the
 * workflow prompt, so every section can read them; the buyer's answers
 * come from the profile.
 *
 * - Cover: their name over the house, and the page's main call to action.
 *   While the page is made it shows the search instead: the favourites
 *   matched, the places found near the house, the steps as they finish.
 * - How It Fits: what lines up with how they live, and what to weigh.
 * - Your New Regulars: places near the house for each part of their week,
 *   each with the place it stands in for, why Qloo picked it and a walk time.
 * - Your Week Inside: where their routines happen in the house.
 * - Day Plan: the Basic catalogue's, drawn in this look.
 * - Listing Recap: the home in one card, with the viewing button.
 * - How It Was Made: for demos, the run laid out: answers, Qloo, writing, every pick.
 */
import { ArrowRightIcon, Building2Icon, CheckIcon, FootprintsIcon, HouseIcon, MapPinIcon, PanelTopIcon, ScaleIcon, WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";

import { type GeneratedProps, type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { parsePoint } from "@core/outcome/lookups";
import { sampleEntities, sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { artifactComponents as basicArtifact } from "../basic/artifact";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink, brandStyle } from "../basic/shared";
import { Accent, Chip, Frame, Logo, button, deep, display, displayHeadings, ghost, quiet, restyle, wrap } from "./shared";

const pulse = "animate-pulse rounded-(--radius) bg-foreground/[0.06]";
const tokens = "Use {{first_name}}, {{name}} or {{answers.<id>}} to fill in from their profile.";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

function PendingRows({ heading, ctx, rows }: { heading: string; ctx: RenderContext; rows: number }) {
  return (
    <Frame heading={heading} ctx={ctx}>
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

/** Straight-line distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** "6 min walk", allowing for streets not running straight there. Nothing past an hour. */
function walk(from: string, entity: TasteEntity) {
  const home = parsePoint(from);
  if (!home || !entity.location) return null;
  const km = distanceKm(home, entity.location);
  const minutes = Math.max(1, Math.round(((km * 1.3) / 5) * 60));
  return minutes > 60 ? null : `${minutes} min walk`;
}

function mapsLink(entity: TasteEntity) {
  const query = [entity.name, entity.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const dollars = (level: number | null) => (level ? "$".repeat(level) : null);

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Agency name", default: "Harbour & Grey" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#24332f" }),
    cta: f.link({ label: "Header button", default: { label: "Book a private viewing", href: "#viewing" }, help: "Stays at the top as they read, once the page is ready." }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => {
    const ready = ctx.outcome?.status !== "running";
    return (
      <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className={cn(wrap, "flex h-18 items-center justify-between gap-4")}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-lg" />
            <div className="flex min-w-0 items-center gap-5">
              {ctx.person && <span className={cn(quiet, "truncate @max-2xl:hidden")}>For {ctx.person.name || ctx.person.email}</span>}
              {ready && settings.cta.label && (
                <CatalogueLink
                  href={settings.cta.href}
                  ctx={ctx}
                  className={cn(button, "h-10 animate-in px-5 text-sm whitespace-nowrap duration-700 fade-in")}
                >
                  {settings.cta.label}
                  <ArrowRightIcon className="size-3.5" />
                </CatalogueLink>
              )}
            </div>
          </div>
        </header>
        <main className={cn(wrap, "flex flex-1 flex-col gap-24 pt-3 pb-32 @3xl:gap-32", displayHeadings)}>{children}</main>
        <footer style={deep}>
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

/** The top of the page: their name over the house, and the main call to action. */
const cover = defineComponent({
  type: "cover",
  name: "Cover",
  description: "Their name over a full-bleed photo of the home, with the viewing button. Shows the search while the page is made.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Title", default: "Your week here, {{first_name}}", help: tokens }),
    intro: f.longText({ label: "Intro", help: tokens }),
    details: f.text({ label: "Under the title", placeholder: "2-3768 West 2nd Avenue · $3,968,000" }),
    image: f.image({ label: "Photo" }),
    link: f.link({ label: "Button", default: { label: "Book a private viewing", href: "#viewing" } }),
    making: f.text({
      label: "While it's being made",
      default: "Finding your week here",
      help: "Shown in place of the title and button until the page is ready.",
    }),
  },
  Component: ({ props, ctx }) => {
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    return (
      <header className="relative isolate -mx-5 overflow-hidden bg-[var(--deep)] text-white @3xl:-mx-10 @6xl:mx-0 @6xl:rounded-(--radius)">
        {props.image && (
          <>
            <img
              src={props.image}
              alt=""
              fetchPriority="high"
              className={cn(
                "absolute inset-0 -z-10 size-full object-cover transition-[filter] duration-1000",
                making && "animate-drift brightness-75 motion-reduce:animate-none",
              )}
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/35 to-black/5" />
          </>
        )}
        <div className="flex min-h-[min(78svh,46rem)] flex-col justify-end px-5 pt-40 pb-10 @3xl:px-10 @3xl:pb-14 @6xl:px-14">
          {making ? (
            <Making outcome={making} heading={ctx.fill(props.making)} />
          ) : (
            <div className="flex animate-in flex-col gap-6 duration-1000 fade-in slide-in-from-bottom-4">
              <h1 className={cn(display, "max-w-5xl text-[clamp(3.25rem,8.5cqi,8rem)] leading-[0.9] text-balance")}>
                <Accent text={ctx.fill(props.title)} />
              </h1>
              {props.details && <p className="text-lg font-medium opacity-90">{ctx.fill(props.details)}</p>}
              {props.intro && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-85">{ctx.fill(props.intro)}</p>}
              {props.link.label && (
                <CatalogueLink href={props.link.href} ctx={ctx} className={cn(button, "mt-2 h-14 self-start bg-white px-8 text-base text-black")}>
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

/** The last few steps the cover lists while the page is being made. */
const MAKING_LINES = 4;
/** How many of the places found it shows as photos. */
const MAKING_PLACES = 10;

/**
 * The cover while the page is being made: the heading with dots that keep
 * moving, the favourites Qloo matched, photos of the places it's found
 * near the house as they come in, then the run's steps as they finish,
 * the one under way shimmering. Only what the run has actually done, in
 * its own words.
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
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <h1 className={cn(display, "max-w-4xl text-[clamp(3rem,7cqi,6.5rem)] leading-[0.92] text-balance")}>
        <Accent text={heading} />
        <span aria-hidden className="inline-flex gap-[0.12em] pl-[0.12em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {matched.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm opacity-70">Matching what you love</span>
          <ul aria-label="Favourites matched" className="flex max-w-2xl flex-wrap gap-2">
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
        </div>
      )}
      {shown.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm opacity-70">
            {places.length} {places.length === 1 ? "place" : "places"} found near the house
          </span>
          <ul aria-hidden className="flex flex-wrap gap-2">
            {shown.map((entity, i) => (
              <li
                key={entity.id}
                className="size-14 animate-in overflow-hidden rounded-(--radius) bg-white/10 ring-1 ring-white/25 fill-mode-both fade-in zoom-in-90 duration-500 @3xl:size-16"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <img src={entity.image ?? ""} alt="" className="size-full object-cover" />
              </li>
            ))}
          </ul>
        </div>
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
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[var(--deep)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "opacity-100" : "opacity-70")}>
                {/* The page speaks as the agency; how it's made is the footer's to say. */}
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

// How It Fits: what lines up, and what to weigh.

const point = z.object({ title: z.string().describe("Three to six words"), body: z.string().describe("One or two sentences") });

const fit = defineGenerated({
  type: "fit",
  name: "How It Fits",
  description: "What lines up with how they live, and what to weigh. Written from the listing and their answers.",
  icon: ScaleIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "How it fits" }),
    tradeoffs: f.toggle({ label: "Include what to weigh", default: true }),
  },
  generate: {
    schema: (props) =>
      z.object({
        verdict: z.string().describe("One plain sentence: how well this home fits the way they live, and the one thing to check."),
        fits: z.array(point).describe("Three things about the home or its street, each tied to something they told us"),
        ...(props.tradeoffs ? { weigh: z.array(point).describe("One or two honest things to weigh") } : {}),
      }),
    instructions: (props) =>
      "Write to the buyer as the agent who found the home: specific and calm, never a pitch. " +
      "Compare the listing facts in the brief with their answers. Each point ties one fact from the listing " +
      "(a room, a floor, the outdoor space, the views, parking, the schools, the walk to the beaches) to one answer, and says which. " +
      "Don't invent anything about the house, the street or the schools; if the listing doesn't say, say that. " +
      "Don't name businesses; the sections below do." +
      (props.tradeoffs ? " What to weigh is honest and specific: stairs over three floors, no named office, the price against how they'd use the space." : ""),
    sample: () => ({
      verdict: "A close fit for two people who work from home and have friends over most weekends. Check where you'd each take calls.",
      fits: [
        { title: "Two floors apart for calls", body: "You both work from home. The family room is on the main floor and the rec room is two floors up." },
        { title: "Hosting has its own floor", body: "You have people over most weekends. The rec room, wet bar and two decks keep the party away from the bedrooms." },
        { title: "The beach before work", body: "You swim in the mornings. Jericho and Locarno are a few blocks down the hill." },
      ],
      weigh: [{ title: "No room called an office", body: "The listing names a family room and a rec room, not an office. Stand in both on a viewing and picture a call." }],
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={3} />,
  Component: ({ props, ctx, section }) => {
    const data = section.data;
    const writing = section.status === "generating";
    const fits = (data?.fits ?? []).filter(Boolean);
    const weigh = ((data as { weigh?: typeof fits } | undefined)?.weigh ?? []).filter(Boolean);
    const List = ({ items, muted }: { items: typeof fits; muted?: boolean }) => (
      <ul className="flex flex-col border-t border-border">
        {items.map((item, i) => (
          <li key={i} className="grid gap-2 border-b border-border py-6 @2xl:grid-cols-[2fr_3fr] @2xl:gap-8">
            <h3 className={cn("text-lg font-semibold tracking-[-0.015em] text-balance", muted && "text-muted-foreground")}>{item?.title}</h3>
            <p className="leading-relaxed text-pretty">{item?.body}</p>
          </li>
        ))}
      </ul>
    );
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {data?.verdict && (
          <p className={cn(display, "text-[clamp(1.9rem,3.6cqi,2.75rem)] leading-[1.1] text-pretty")}>
            {data.verdict}
            <Writing on={writing && fits.length === 0} />
          </p>
        )}
        {fits.length > 0 && <List items={fits} />}
        {weigh.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className={quiet}>Worth weighing</h3>
            <List items={weigh} muted />
          </div>
        )}
      </Frame>
    );
  },
});

// Your New Regulars: places near the house, each standing in for one they love now.

const regulars = defineGenerated({
  type: "regulars",
  name: "Your New Regulars",
  description: "Places near the home for each part of their week, with the place each stands in for and a walk time.",
  icon: FootprintsIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your new regulars" }),
    count: f.number({ label: "How many", default: 5, min: 2, max: 8 }),
    from: f.text({ label: "Walk from", placeholder: "49.2704, -123.1869", help: "The home, as lat, lng. Sets the walk times." }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence leading in, naming the places they love now if they gave any."),
        items: z
          .array(
            z.object({
              role: z.string().describe("The part of their week it fills, e.g. Weekday coffee, Friday dinner"),
              entity: z.string().describe("Candidate id"),
              standsIn: z
                .string()
                .describe("Just the name of the place they named that this one stands in for, e.g. Monmouth Coffee, with no city or occasion. Empty if none fits."),
              why: z.string().describe("One or two sentences: what the two have in common, naming a dish, drink or detail from the candidate"),
            }),
          )
          .describe(`${props.count} places, each filling a different part of their week, in the order of a week`),
      }),
    instructions: (props) =>
      `Pick the ${props.count} candidates that would become their regulars, one for each part of the week they described ` +
      "(mornings, workdays, Friday night, the weekend). When they named places they love now, set standsIn to the one each pick " +
      "replaces and say what the two have in common, using the candidate's tags and review keywords: a dish, a drink, the room. " +
      "No superlatives, no 'hidden gem', no repeats.",
    picks: (props) => Math.min(20, props.count * 3),
    lookup: () => ({ name: "Places near the home", type: "place", near: "place", radius: 1.5, take: 18 }),
    sample: (props) => ({
      intro: "Five places near the house that do what Pilot Coffee, Bar Raval and Pizzeria Libretto do for you now.",
      items: sampleIds.places.slice(0, props.count).map((entity, i) => ({
        role: ["Weekday coffee", "A working lunch", "Friday dinner", "Saturday brunch", "Sunday evening"][i % 5],
        entity,
        standsIn: ["Pilot Coffee", "", "Pizzeria Libretto", "", "Bar Raval"][i % 5],
        why: `People mention the ${sampleEntities[entity]?.keywords[0] ?? "patio"}, and it has the same unhurried room you described.`,
      })),
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.count, 4)} />,
  Component: ({ props, ctx, section }) => {
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx} side={section.data?.intro && <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{section.data.intro}</p>}>
        <ol className="flex flex-col border-t border-border">
          {items.map((item, i) => {
            const place = ctx.outcome?.entity(item?.entity) ?? null;
            const minutes = place ? walk(props.from, place) : null;
            return (
              <li key={i} className="grid gap-5 border-b border-border py-7 @2xl:grid-cols-[11rem_1fr] @2xl:gap-8">
                {place?.image ? (
                  <img src={place.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-(--radius) bg-muted object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-(--radius) bg-[var(--sand)] text-muted-foreground">
                    <MapPinIcon className="size-5" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {item?.role && <span className="text-sm font-medium text-[var(--brand)]">{item.role}</span>}
                  {place ? (
                    <a
                      href={mapsLink(place)}
                      target="_blank"
                      rel="noreferrer"
                      className="self-start text-2xl font-semibold tracking-[-0.025em] underline-offset-4 hover:underline"
                    >
                      {place.name}
                    </a>
                  ) : (
                    <div className={cn(pulse, "h-7 w-48")} aria-hidden />
                  )}
                  {place && (
                    <span className={quiet}>
                      {[minutes, place.neighbourhood, dollars(place.priceLevel), place.tags[0]].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {item?.standsIn && <p className={cn(display, "text-2xl italic")}>In place of {item.standsIn}</p>}
                  {item?.why && (
                    <p className="leading-relaxed text-pretty">
                      {item.why}
                      <Writing on={writing && i === items.length - 1} />
                    </p>
                  )}
                  {place && (place.because.length > 0 || place.keywords.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {place.because.slice(0, 2).map((name) => (
                        <Chip key={name} tone="taste">
                          Because you like {name}
                        </Chip>
                      ))}
                      {place.keywords.slice(0, 3).map((word) => (
                        <Chip key={word}>{word}</Chip>
                      ))}
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

/** Every string under `key` in a section's output: the entity ids it points at, the places it stands in for. */
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
      <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Behind the page, for the hackathon's judges: what the run did between
 * the questions and the page, read from the run itself. Their answers,
 * the favourites Qloo matched, the places it weighed near the house, how
 * each section was written (time and skills), then every pick with
 * Qloo's affinity and the signals that surfaced it. Only shown once the
 * page is ready, and set apart from the agency's page.
 */
const explainer = defineComponent({
  type: "explainer",
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
    const areas = new Map<string, number>();
    for (const place of places) if (place.neighbourhood) areas.set(place.neighbourhood, (areas.get(place.neighbourhood) ?? 0) + 1);
    const topAreas = [...areas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const answers = ctx.profile.filter((row) => row.answer).slice(0, 6);
    const started = state.steps.map((step) => step.startedAt).filter((n): n is number => Boolean(n));
    const ended = state.steps.map((step) => step.endedAt).filter((n): n is number => Boolean(n));
    const total = started.length && ended.length ? Math.round((Math.max(...ended) - Math.min(...started)) / 1000) : null;

    return (
      <section id="how" className="flex scroll-mt-24 flex-col gap-12 rounded-[calc(var(--radius)*2)] border border-dashed border-foreground/25 p-6 @3xl:p-10">
        <div className="grid gap-x-10 gap-y-5 @4xl:grid-cols-12 @4xl:items-end">
          <div className="flex flex-col items-start gap-4 @4xl:col-span-7">
            {props.label && <Chip tone="taste">{props.label}</Chip>}
            <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance")}>{props.heading}</h2>
          </div>
          {props.body && <p className="leading-relaxed text-muted-foreground text-pretty @4xl:col-span-5">{ctx.fill(props.body)}</p>}
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
              <p className={quiet}>No named favourites; Qloo ranked by their answers and segment.</p>
            )}
            <p className="text-sm leading-relaxed">
              Favourites resolved to Qloo entities and used as weighted signals
              {tasteData.found ? `, which surfaced ${tasteData.found} candidates` : ""}.
            </p>
          </Stage>
          <Stage title="Searched near the house">
            <p className={cn(display, "text-5xl")}>{places.length}</p>
            <p className="text-sm leading-relaxed">
              places weighed within walking distance of the home's coordinates, ranked for them. {picked.length} made the page.
            </p>
            {topAreas.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {topAreas.map(([area, count]) => (
                  <li key={area} className="flex justify-between gap-3">
                    <span>{area}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            )}
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
            <h3 className="text-sm font-semibold tracking-[-0.01em]">Every pick, and why Qloo surfaced it</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t border-foreground/20 text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-normal">Place</th>
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
                            <img src={entity.image} alt="" loading="lazy" className="size-10 shrink-0 rounded-(--radius) object-cover" />
                          ) : (
                            <span className="size-10 shrink-0 rounded-(--radius) bg-[var(--sand)]" />
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
                      <td className="py-3 pr-4">{entity.because.slice(0, 3).join(", ") || <span className="text-muted-foreground">Their segment</span>}</td>
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
          Every place on the page is a Qloo entity; the model could only pick from these candidates, and anything else was dropped.
        </p>
      </section>
    );
  },
});

// Your Week Inside: their week, room by room.

const rooms = defineGenerated({
  type: "rooms",
  name: "Your Week Inside",
  description: "Where their routines happen in the house, room by room. Written from the listing.",
  icon: HouseIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your week, room by room" }),
    count: f.number({ label: "How many rooms", default: 4, min: 2, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        rooms: z
          .array(
            z.object({
              space: z.string().describe("A space named in the listing, e.g. Top-floor decks"),
              when: z.string().describe("When they'd be there, e.g. Saturday nights"),
              use: z.string().describe("One or two sentences on how they'd use it, tied to their answers"),
            }),
          )
          .describe(`${props.count} spaces, in the order of a week`),
      }),
    instructions: (props) =>
      `Walk through ${props.count} spaces the listing names and say how this person would use each, from their answers: ` +
      "where the coffee happens, where each of them takes calls, where friends end up. Only spaces from the listing; " +
      "don't invent finishes, sizes or furniture.",
    sample: () => ({
      rooms: [
        { space: "Kitchen", when: "Weekday mornings", use: "Coffee at the quartzite island after your swim, with the Eclipse doors open to the patio." },
        { space: "Family room", when: "Weekdays, 9 to 5", use: "One of you takes calls here, two floors from the other." },
        { space: "Rec room and wet bar", when: "Saturday nights", use: "Where your friends end up, a floor above the bedrooms." },
        { space: "Top-floor decks", when: "Sunday evenings", use: "A glass of wine with the mountains in view." },
      ],
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.count, 4)} />,
  Component: ({ props, ctx, section }) => {
    const items = (section.data?.rooms ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        <ol className="grid gap-x-8 border-t border-border @2xl:grid-cols-2">
          {items.map((room, i) => (
            <li key={i} className="flex flex-col gap-2 border-b border-border py-6">
              <span className={quiet}>{room?.when}</span>
              <h3 className={cn(display, "text-3xl")}>{room?.space}</h3>
              {room?.use && (
                <p className="leading-relaxed text-pretty">
                  {room.use}
                  <Writing on={writing && i === items.length - 1} />
                </p>
              )}
            </li>
          ))}
        </ol>
      </Frame>
    );
  },
});

// Day Plan: the Basic catalogue's, as a timeline in this look.

type DayPlanData = { days?: ({ label?: string; stops?: ({ time?: string; entity?: string; note?: string } | undefined)[] } | undefined)[] };

const dayPlan = restyle(
  basicArtifact,
  "day-plan",
  ({ props, ctx, section }: GeneratedProps<any, DayPlanData> & { props: { heading: string } }) => {
    const days = section.data?.days ?? [];
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {days.map((day, d) => (
          <div key={d} className="flex flex-col gap-2">
            {days.length > 1 && day?.label && <h3 className="text-lg font-semibold">{day.label}</h3>}
            <ol className="relative flex flex-col border-l border-foreground/20 pl-8">
              {(day?.stops ?? []).map((stop, s) => {
                const place = ctx.outcome?.entity(stop?.entity) ?? null;
                const last = writing && d === days.length - 1 && s === (day?.stops?.length ?? 0) - 1;
                return (
                  <li key={s} className="relative grid gap-4 pb-10 @2xl:grid-cols-[1fr_9rem] @2xl:gap-8">
                    <span aria-hidden className="absolute top-2 -left-[2.32rem] size-2.5 rounded-full bg-[var(--brand)] ring-4 ring-background" />
                    <div className="flex flex-col gap-1.5">
                      <time className={cn(display, "text-2xl italic")}>{stop?.time}</time>
                      {place ? (
                        <a
                          href={mapsLink(place)}
                          target="_blank"
                          rel="noreferrer"
                          className="self-start text-xl font-semibold tracking-[-0.02em] underline-offset-4 hover:underline"
                        >
                          {place.name}
                        </a>
                      ) : (
                        <div className={cn(pulse, "h-6 w-40")} aria-hidden />
                      )}
                      {place && <span className={quiet}>{[place.neighbourhood, place.tags[0]].filter(Boolean).join(" · ")}</span>}
                      {stop?.note && (
                        <p className="leading-relaxed text-pretty">
                          {stop.note}
                          <Writing on={last} />
                        </p>
                      )}
                    </div>
                    {place?.image && <img src={place.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-(--radius) object-cover @max-2xl:hidden" />}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </Frame>
    );
  },
  ({ props, ctx }: { props: { heading: string }; ctx: RenderContext }) => <PendingRows heading={props.heading} ctx={ctx} rows={4} />,
);

/** The home again, with the viewing button: the page's way back to the agent. */
const recap = defineComponent({
  type: "recap",
  name: "Listing Recap",
  description: "The home in one card: photo, address, price and the viewing button.",
  icon: Building2Icon,
  fields: {
    image: f.image({ label: "Photo" }),
    address: f.text({ label: "Address" }),
    details: f.text({ label: "Details", placeholder: "3 bed · 5 bath · 2,353 sq ft" }),
    price: f.text({ label: "Price" }),
    body: f.longText({ label: "Note", help: tokens }),
    link: f.link({ label: "Button", default: { label: "Book a private viewing", href: "" } }),
    phone: f.text({ label: "Phone" }),
  },
  Component: ({ props, ctx }) => (
    <aside id="viewing" style={deep} className="-mx-5 grid scroll-mt-24 overflow-hidden @3xl:-mx-10 @4xl:grid-cols-12 @6xl:mx-0 @6xl:rounded-(--radius)">
      {props.image && <img src={props.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover @4xl:col-span-6 @4xl:aspect-auto @4xl:h-full" />}
      <div className="flex flex-col items-start gap-5 px-5 py-12 @3xl:px-10 @4xl:col-span-6 @4xl:py-16 @6xl:px-14">
        <h2 className={cn(display, "text-[clamp(2.5rem,5cqi,4.25rem)] text-balance")}>
          <Accent text={props.address} />
        </h2>
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-lg">
          {props.price && <span className="font-semibold tabular-nums">{props.price}</span>}
          {props.details && <span className="opacity-75">{props.details}</span>}
        </p>
        {props.body && <p className="max-w-md leading-relaxed text-pretty opacity-80">{ctx.fill(props.body)}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {props.link.label && (
            <CatalogueLink href={props.link.href} ctx={ctx} className={cn(button, "h-14 bg-[var(--deep-foreground)] px-8 text-base text-[var(--deep)]")}>
              {props.link.label}
            </CatalogueLink>
          )}
          {props.phone && (
            <a href={`tel:${props.phone.replace(/[^\d+]/g, "")}`} className={cn(ghost, "h-14 tabular-nums")}>
              {props.phone}
            </a>
          )}
        </div>
      </div>
    </aside>
  ),
});

const others = basicArtifact.filter((definition) => definition.type !== "day-plan");

export const artifactComponents = [cover, fit, regulars, rooms, dayPlan, recap, explainer, ...others];
