/**
 * The Agency catalogue's outcome: one home an agent found for one buyer,
 * and the life around it. The home changes every run: the Listing step
 * (steps/listing.ts) reads it from the agent's link, and the static parts
 * here draw that step's data. The rest is written for the buyer from
 * their taste, matched in Qloo around the house.
 *
 * - Listing: the photos, address, price and rooms, and the agent's note.
 * - How It Fits: the listing against their answers, with what to check.
 * - Your Regulars: each place they love now, paired with one near the
 *   house that stands in for it, with the walk.
 * - Your Week Inside: their routines, room by room, from the listing.
 * - A Day From the Door: a walkable day of places near the house.
 * - Map and Agent: where it is, and who to call.
 *
 * Laid out like an architect's site: one wide photo, big tight headings,
 * and hairline rows of title, words and picture, in cool greys: the
 * facts and how it fits on blue-grey panels, the agent on slate.
 */
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  DiscIcon,
  FootprintsIcon,
  HouseIcon,
  LinkIcon,
  MapIcon,
  MapPinIcon,
  ScaleIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { type MouseEvent, type ReactNode, useState } from "react";
import { z } from "zod";

import { type RenderContext, defineComponent, defineGenerated, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { sampleEntities, sampleIds } from "@core/outcome/samples";
import type { OutcomeView, TasteEntity } from "@core/outcome/state";
import { RunFooter } from "../basic/run-footer";
import { CatalogueLink, Logo, brandStyle, button } from "../basic/shared";
import type { ListingData } from "../../steps/listing";
import { cn } from "@/lib/utils";

const pulse = "animate-pulse rounded-(--radius) bg-muted";
const display = "font-heading font-medium tracking-tight text-balance";
const sectionHeading = cn(display, "text-3xl leading-[1.05] @3xl:text-5xl");
const stepHelp = "The id of the Listing step under Workflow Settings.";

// Shared pieces.

/** The listing step's data, and whether it's still coming. */
function useListing(ctx: RenderContext, step: string) {
  const section = ctx.outcome?.section<ListingData>(step) ?? null;
  const data = section?.data && typeof section.data === "object" && "address" in section.data ? section.data : null;
  return {
    data,
    waiting: !data && (section?.status === "pending" || section?.status === "generating"),
    message: ctx.outcome?.state.steps.find((s) => s.id === step)?.message ?? null,
  };
}

/** "4 + den" reads "4 bed + den": the unit goes after the number. */
const count = (value: string, unit: string) =>
  value && (/^\d+(\.\d+)?/.test(value) ? value.replace(/^(\d+(?:\.\d+)?)\s*/, `$1 ${unit} `).trim() : value);

/** Straight-line distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** "6 min walk" from the house, allowing for streets not running straight. Past 25 minutes, "8 min drive". */
function fromHome(home: ListingData["point"] | undefined, entity: TasteEntity) {
  if (!home || !entity.location) return null;
  const km = distanceKm(home, entity.location) * 1.3;
  const walk = Math.max(1, Math.round((km / 5) * 60));
  if (walk <= 25) return `${walk} min walk`;
  return `${Math.max(2, Math.round((km / 35) * 60))} min drive`;
}

function mapsLink(entity: TasteEntity) {
  const query = [entity.name, entity.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const dollars = (level: number | null) => (level ? "$".repeat(level) : null);

const and = new Intl.ListFormat("en-GB", { type: "conjunction" });

/** "Ranked against Herkimer Coffee and Khruangbin": the person's own signals that pulled it up. */
function because(entity: TasteEntity) {
  const names = entity.because.slice(0, 2);
  return names.length ? `Ranked against ${and.format(names)}` : null;
}

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

function Heading({ text, intro, ctx }: { text: string; intro?: string | null; ctx: RenderContext }) {
  if (!text && !intro) return null;
  return (
    <div className="flex flex-col gap-4 @3xl:max-w-3xl">
      {text && <h2 className={sectionHeading}>{ctx.fill(text)}</h2>}
      {intro && <p className="text-lg text-muted-foreground text-pretty">{intro}</p>}
    </div>
  );
}

function Picture({ entity, className }: { entity: TasteEntity | null; className?: string }) {
  if (entity?.image) return <img src={entity.image} alt="" loading="lazy" className={cn("w-full bg-muted object-cover", className)} />;
  return (
    <div className={cn("flex w-full items-center justify-center bg-secondary text-muted-foreground", className)}>
      {entity?.type === "artist" ? <DiscIcon className="size-6" /> : <MapPinIcon className="size-6" />}
    </div>
  );
}

function PendingRows({ heading, ctx, rows }: { heading: string; ctx: RenderContext; rows: number }) {
  return (
    <section className="flex flex-col gap-10">
      <Heading text={heading} ctx={ctx} />
      <div className="flex flex-col" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-3 border-t py-6 @3xl:grid-cols-[2fr_3fr] @3xl:gap-10">
            <div className={cn(pulse, "h-6 w-2/3")} />
            <div className="flex flex-col gap-2">
              <div className={cn(pulse, "h-4 w-full")} />
              <div className={cn(pulse, "h-4 w-4/5")} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Links that leave the page stay put in the editor. */
const outLink = (ctx: RenderContext) => (event: MouseEvent) => {
  if (ctx.preview) event.preventDefault();
};

// How it was made: under the footer, the run laid open. For the people judging the page as much as for
// the buyer: what was read, what Qloo matched and ranked, and which of its picks made the page.

/** Every Qloo entity id a section's data points at, in page order. */
function usedEntities(outcome: OutcomeView) {
  const ids: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "entity" && typeof item === "string") ids.push(item);
      else walk(item);
    }
  };
  for (const step of outcome.state.steps) if (step.kind === "section") walk(step.data);
  return [...new Set(ids)].flatMap((id) => outcome.entity(id) ?? []);
}

const seconds = (step: { startedAt: number | null; endedAt: number | null } | undefined) =>
  step?.startedAt && step.endedAt ? `${Math.max(0.1, (step.endedAt - step.startedAt) / 1000).toFixed(1)}s` : null;

function MadeRow({ title, time, children }: { title: string; time?: string | null; children: ReactNode }) {
  return (
    <li className="grid gap-3 border-t border-white/15 py-7 @3xl:grid-cols-[2fr_5fr] @3xl:gap-16">
      <div className="flex items-baseline justify-between gap-4 @3xl:flex-col @3xl:justify-start @3xl:gap-1">
        <h3 className={cn(display, "text-xl @3xl:text-2xl")}>{title}</h3>
        {time && <span className="text-sm tabular-nums opacity-60">{time}</span>}
      </div>
      <div className="flex flex-col gap-4 text-pretty opacity-90">{children}</div>
    </li>
  );
}

function HowItWasMade({ ctx, step, title }: { ctx: RenderContext; step: string; title: string }) {
  const outcome = ctx.outcome;
  const { data: home } = useListing(ctx, step);
  if (!outcome || outcome.status !== "done") return null;
  const steps = outcome.state.steps;
  const read = steps.find((s) => s.id === step);
  const taste = steps.find((s) => s.kind === "taste");
  const sections = steps.filter((s) => s.kind === "section" && s.status === "done");
  const tasteData = taste?.data as { matched?: string[]; found?: number } | null | undefined;
  const matched = tasteData?.matched ?? [];
  const found = tasteData?.found ?? Object.keys(outcome.state.entities).length;
  const used = usedEntities(outcome);
  const skills = [...new Set(sections.flatMap((s) => s.skills ?? []))];
  const started = Math.min(...steps.flatMap((s) => (s.startedAt ? [s.startedAt] : [])));
  const ended = Math.max(...steps.filter((s) => !s.background).flatMap((s) => (s.endedAt ? [s.endedAt] : [])));
  const total = Number.isFinite(started) && Number.isFinite(ended) ? Math.round((ended - started) / 1000) : null;
  const name = ctx.person?.name.split(" ")[0] || "them";

  return (
    <details open className="group bg-[var(--brand)] text-[var(--brand-foreground)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-6 @3xl:px-10 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-1">
          <span className={cn(display, "text-xl @3xl:text-2xl")}>{title}</span>
          <span className="text-sm opacity-70">
            {total ? `Made in ${total} seconds. ` : ""}What we read, what Qloo matched, and why each place made the cut.
          </span>
        </span>
        <ChevronDownIcon className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <ol className="flex flex-col px-5 pb-16 @3xl:px-10">
        {home && (
          <MadeRow title="Read the listing" time={seconds(read)}>
            <p>
              The agent pasted one link. We read {home.host} for the address, price, rooms, {home.features.length} facts and{" "}
              {home.photos.length} photos, then put {home.address} on the map
              {home.point ? ` at ${home.point.lat.toFixed(4)}, ${home.point.lng.toFixed(4)}` : ""}. Every search below starts from that
              point.
            </p>
          </MadeRow>
        )}
        <MadeRow title="Matched their taste in Qloo" time={seconds(taste)}>
          <p>
            {matched.length
              ? `From what the agent told us about ${name}, Qloo matched ${matched.length} favourites to things it knows: places, and the music they play.`
              : `Nothing ${name} named could be matched in Qloo, so places were ranked by the profile alone.`}
          </p>
          {matched.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {matched.map((favourite) => (
                <li key={favourite} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20">
                  {favourite}
                </li>
              ))}
            </ul>
          )}
        </MadeRow>
        <MadeRow title="Ranked the neighbourhood">
          <p>
            Qloo ranked {found} places around the house against those favourites. {used.length} made this page. The bar is
            how close each one is to {name}'s taste.
          </p>
          {used.length > 0 && (
            <ul className="flex flex-col">
              {used.map((entity) => {
                const score = entity.affinity === null ? null : Math.round(entity.affinity * 100);
                return (
                  <li key={entity.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-t border-white/10 py-3 @2xl:grid-cols-[2fr_1.4fr_2fr]">
                    <span className="font-medium">{entity.name}</span>
                    <span className="flex items-center gap-2 text-sm tabular-nums @2xl:order-none">
                      {score !== null && (
                        <>
                          <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                            <span className="block h-full rounded-full bg-white" style={{ width: `${score}%` }} />
                          </span>
                          {score}% match
                        </>
                      )}
                    </span>
                    <span className="col-span-2 text-sm opacity-70 @2xl:col-span-1">
                      {[because(entity), fromHome(home?.point, entity)].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </MadeRow>
        <MadeRow title="Wrote the page" time={sections.length ? `${sections.length} sections` : null}>
          <p>
            Each section was written from the listing, the agent's answers and Qloo's ranked places, and could only
            recommend a place Qloo found{skills.length ? `. It followed the agency's skills: ${and.format(skills)}.` : "."}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-70">
            {sections.map((s) => (
              <li key={s.id}>
                {s.label} <span className="tabular-nums">{seconds(s)}</span>
              </li>
            ))}
          </ul>
        </MadeRow>
        <MadeRow title="Without Qloo">
          <p>
            The same listing and the same notes would get the most popular places near the house, the ones every buyer gets.
            With Qloo, each place above is ranked against what {name} already loves, so the café on this page stands in for
            theirs.
          </p>
        </MadeRow>
      </ol>
    </details>
  );
}

// Layout: a masthead with the agency and a way to book, the page, and where the facts came from.

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Agency", default: "Fieldhouse Realty" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#34465a" }),
    contact: f.link({ label: "Top button", default: { label: "Book a viewing", href: "#contact" } }),
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
    footer: f.longText({ label: "Footer note", help: "Where the listing came from is added after it." }),
    reveal: f.toggle({
      label: "How it was made",
      default: true,
      help: "Under the footer, once the page is ready: what was read, what Qloo matched and ranked, and which picks made the page.",
    }),
    revealTitle: f.text({ label: "Its title", default: "How this page was made" }),
  },
  Layout: ({ settings, ctx, children }) => {
    const { data } = useListing(ctx, settings.step);
    return (
      <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground">
        {/* Sticky, so the way to book is always one tap away. */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border/60 bg-background/85 px-5 py-3.5 backdrop-blur-md @3xl:px-10">
          <Logo brand={settings.brand} logo={settings.logo} />
          {settings.contact.label && (
            <CatalogueLink
              href={settings.contact.href}
              ctx={ctx}
              className="inline-flex h-9 items-center rounded-(--radius) bg-[var(--brand)] px-4 text-sm font-medium text-[var(--brand-foreground)] transition-opacity hover:opacity-90"
            >
              {settings.contact.label}
            </CatalogueLink>
          )}
        </header>
        {/* Sections stop below the header when a link jumps to them. */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-5 pt-6 pb-24 *:scroll-mt-24 @3xl:gap-32 @3xl:px-10">
          {children}
        </main>
        <footer className="flex flex-col gap-2 border-t px-5 py-10 text-sm text-muted-foreground @3xl:px-10">
          <span className="font-medium text-foreground">{settings.brand}</span>
          {settings.footer && <p className="max-w-2xl text-pretty">{ctx.fill(settings.footer)}</p>}
          {data && (
            <p>
              Listing details from{" "}
              <a href={data.url} target="_blank" rel="noreferrer" onClick={outLink(ctx)} className="underline underline-offset-4">
                {data.host}
              </a>
              , as published.
            </p>
          )}
        </footer>
        {settings.reveal && <HowItWasMade ctx={ctx} step={settings.step} title={settings.revealTitle} />}
        <RunFooter ctx={ctx} />
      </div>
    );
  },
});

// Listing: the home, from the run. While the page is being made, the photo is the stage for the run;
// when it's ready, the address, the agent's note and the way to book come up over it.

/** The last few steps the hero lists while it's being made. */
const MAKING_LINES = 4;

/**
 * The hero while the outcome is being made: the heading with dots that
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
    <div role="status" aria-live="polite" className="flex flex-col gap-6 @3xl:gap-8">
      <h1 className={cn(display, "max-w-3xl text-4xl leading-[1.02] @3xl:text-6xl")}>
        {heading}
        <span aria-hidden className="inline-flex gap-[0.1em] pl-[0.12em]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-pulse motion-reduce:animate-none" style={{ animationDelay: `${i * 200}ms` }}>
              .
            </span>
          ))}
        </span>
      </h1>
      {matched.length > 0 && (
        <ul aria-label="Favourites matched in Qloo" className="flex max-w-2xl flex-wrap gap-2">
          {matched.map((name, i) => (
            <li
              key={name}
              className="animate-in rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur fill-mode-both fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
      <ul className="flex max-w-lg flex-col gap-2.5">
        {lines.map((step) => {
          const live = step.status === "running";
          return (
            <li key={step.id} className="flex animate-in items-center gap-3 duration-500 fade-in slide-in-from-bottom-2">
              {live ? (
                <span aria-hidden className="relative flex size-5 shrink-0 items-center justify-center">
                  <span className="absolute size-5 animate-ping rounded-full bg-white/40 motion-reduce:animate-none" />
                  <span className="size-2.5 rounded-full bg-white" />
                </span>
              ) : step.status === "error" ? (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <XIcon className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[var(--brand)]">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
              <span className={cn("relative overflow-hidden", live ? "opacity-100" : "opacity-75")}>
                {step.message ?? step.label}
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

/** The page's own link, to send to whoever else is deciding. In the editor it does nothing. */
function CopyLink({ ctx, label }: { ctx: RenderContext; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-live="polite"
      onClick={async () => {
        if (ctx.preview) return;
        await navigator.clipboard.writeText(window.location.href).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }}
      className="inline-flex h-12 items-center gap-2 rounded-(--radius) px-5 font-medium ring-1 ring-current/25 transition-colors hover:bg-foreground/5"
    >
      {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4" />}
      {copied ? "Link copied" : label}
    </button>
  );
}

/** Rises in once, when the page is ready. Later items wait a beat longer (`after`). */
const rise = "animate-in fill-mode-both fade-in slide-in-from-bottom-4 duration-1000 motion-reduce:animate-none";
const after = (step: number) => ({ animationDelay: `${step * 120}ms` });

const listing = defineComponent({
  type: "listing",
  name: "Listing",
  description: "The home from the agent's link. While the page is made, it shows the run over the photo; then the address, their note and the way to book.",
  icon: HouseIcon,
  fields: {
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
    making: f.text({
      label: "While it's being made",
      default: "Planning your week from this front door",
      help: "Over the photo until the page is ready, with what Qloo matched and each step as it lands.",
    }),
    note: f.longText({
      label: "Note",
      default: "{{answers.note}}",
      help: "The agent's note, next to the listing. {{answers.note}} is the one they wrote when they started it.",
    }),
    signature: f.text({ label: "Signed", default: "Jordan Ellis, Fieldhouse Realty" }),
    cta: f.link({
      label: "Button",
      default: { label: "Book a viewing", href: "#contact" },
      help: "The page's main action, shown once it's ready.",
    }),
    copy: f.text({ label: "Copy link button", default: "Copy link to share", help: "Empty: no button." }),
    link: f.text({ label: "Listing link", default: "See the full listing" }),
  },
  Component: ({ props, ctx }) => {
    const { data, waiting } = useListing(ctx, props.step);
    const making = ctx.outcome?.status === "running" ? ctx.outcome : null;
    const note = ctx.fill(props.note).trim();
    const [first, ...rest] = data?.photos ?? [];

    // The photo, or the brand colour until the listing's been read. While it's made, the run sits on it.
    const stage = (
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-(--radius) bg-[var(--brand)] text-white",
          making ? "min-h-[30rem] @3xl:aspect-[2/1] @3xl:min-h-0" : "aspect-[3/2] @3xl:aspect-[2/1]",
        )}
      >
        {first && (
          <img
            src={first}
            alt={data ? `${data.address}, from the listing` : ""}
            className={cn(
              "absolute inset-0 -z-10 size-full animate-in object-cover fade-in duration-1000 transition-[filter,transform] ease-out",
              making ? "scale-[1.04] brightness-[0.5]" : "scale-100 brightness-100",
            )}
          />
        )}
        {making && (
          <>
            <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 @3xl:p-10">
              <Making outcome={making} heading={ctx.fill(props.making)} />
            </div>
          </>
        )}
      </div>
    );

    if (making || !data) {
      return (
        <header className="flex flex-col gap-8">
          {making || waiting ? (
            stage
          ) : (
            <h1 className={cn(display, "text-5xl leading-[0.95] @3xl:text-7xl")}>The home we found you</h1>
          )}
          {/* What they'll see when it's ready, held in place so the page doesn't jump. */}
          {making && (
            <div className="flex flex-col gap-4" aria-hidden>
              <div className={cn(pulse, "h-14 w-3/4 @3xl:h-20")} />
              <div className={cn(pulse, "h-5 w-1/2")} />
            </div>
          )}
          {!making && note && <p className="max-w-2xl text-xl text-pretty">{note}</p>}
        </header>
      );
    }

    const facts = [
      { label: data.status || "Price", value: data.price },
      { label: "Rooms", value: [count(data.beds, "bed"), count(data.baths, "bath")].filter(Boolean).join(", ") },
      { label: "Size", value: [data.size, data.kind].filter(Boolean).join(", ") },
      { label: "Where", value: data.area },
    ].filter((fact) => fact.value);

    return (
      <header className="flex flex-col gap-10">
        {stage}
        <h1 style={after(0)} className={cn(display, rise, "text-5xl leading-[0.95] @3xl:text-8xl")}>
          {data.address}
        </h1>
        <dl style={after(1)} className={cn(rise, "grid grid-cols-2 rounded-(--radius) bg-[var(--sand)] @3xl:grid-cols-4")}>
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 border-foreground/10 px-5 py-5 not-first:border-l @max-3xl:nth-3:border-l-0 @max-3xl:nth-[n+3]:border-t @3xl:px-7">
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="text-lg text-pretty tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-10 @3xl:grid-cols-2 @3xl:gap-16">
          <div style={after(2)} className={cn(rise, "flex flex-col items-start gap-8")}>
            {note && (
              <figure className="flex flex-col gap-4">
                <blockquote className={cn(display, "text-2xl leading-snug @3xl:text-3xl")}>{note}</blockquote>
                {props.signature && <figcaption className="text-muted-foreground">{props.signature}</figcaption>}
              </figure>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {props.cta.label && (
                <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "px-7")}>
                  {props.cta.label}
                </CatalogueLink>
              )}
              {props.copy && <CopyLink ctx={ctx} label={props.copy} />}
            </div>
          </div>
          <div style={after(3)} className={cn(rise, "flex flex-col items-start gap-5")}>
            {data.summary && <p className="text-lg text-pretty">{data.summary}</p>}
            {data.features.length > 0 && (
              <ul className="flex w-full flex-col border-t text-muted-foreground">
                {data.features.map((feature) => (
                  <li key={feature} className="border-b py-2.5">
                    {feature}
                  </li>
                ))}
              </ul>
            )}
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              onClick={outLink(ctx)}
              className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            >
              {props.link || "See the full listing"} on {data.host}
              <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
        </div>
        {rest.length > 0 && (
          <div
            style={after(4)}
            className={cn(rise, "-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 @3xl:-mx-10 @3xl:px-10")}
          >
            {rest.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-[78%] shrink-0 snap-start rounded-(--radius) bg-muted object-cover @3xl:w-[38%]"
              />
            ))}
          </div>
        )}
      </header>
    );
  },
});

// How it fits: the listing against their answers.

const fit = defineGenerated({
  type: "fit",
  name: "How It Fits",
  description: "What lines up with how they live, and what to check on a viewing. Written from the listing and their answers.",
  icon: ScaleIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "How it fits" }),
    tradeoffs: f.toggle({ label: "Include what to check", default: true }),
  },
  generate: {
    schema: (props) =>
      z.object({
        verdict: z.string().describe("One or two plain sentences: how well this home fits the week they described."),
        fits: z
          .array(z.object({ title: z.string().describe("Three to six words"), body: z.string().describe("One or two sentences") }))
          .describe("Three facts from the listing, each tied to something they told us"),
        ...(props.tradeoffs
          ? {
              weigh: z
                .array(z.object({ title: z.string().describe("Three to six words"), body: z.string().describe("One or two sentences") }))
                .describe("One or two honest things to check on a viewing, from the listing and their answers"),
            }
          : {}),
      }),
    instructions: (props) =>
      "Hold the listing up against the week they described. Open the verdict with the fact that matters most to them. " +
      "Each point names a fact the listing states (a room, the yard, " +
      "the views, parking, an update) and the answer it meets. Say what the listing doesn't settle rather than guess. " +
      "Don't name businesses or places nearby: other sections do. " +
      (props.tradeoffs ? "In what to check, say what to look at on a viewing, plainly. Never pushy, never alarming." : ""),
    sample: () => ({
      verdict:
        "The fenced backyard is the answer to Saturdays. Whether the third bedroom works as an office, and the drive to SeaTac, need a visit.",
      fits: [
        { title: "A yard with a fence", body: "The listing says fenced, with a patio. Two kids can run while you unload the market bags." },
        { title: "A third bedroom for work", body: "Three bedrooms leave one for Priya's desk, with a door that shuts on the days she's home." },
        { title: "The balcony faces west", body: "Evening light after the kids are down, with the territorial view the listing mentions." },
      ],
      weigh: [{ title: "The drive to SeaTac", body: "The listing doesn't say. Try it at the time Sam leaves, before you decide." }],
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={3} />,
  Component: ({ props, ctx, section }) => {
    const data = section.data;
    const writing = section.status === "generating";
    const fits = (data?.fits ?? []).filter(Boolean);
    const weigh = ((data as { weigh?: typeof fits } | undefined)?.weigh ?? []).filter(Boolean);
    const rows = (items: typeof fits, muted = false) => (
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li key={i} className="grid gap-2 border-t border-foreground/12 py-6 @3xl:grid-cols-[2fr_3fr] @3xl:gap-16">
            <h3 className={cn(display, "text-xl leading-snug @3xl:text-2xl", muted && "text-muted-foreground")}>{item?.title}</h3>
            <p className="text-lg text-pretty">{item?.body}</p>
          </li>
        ))}
      </ul>
    );
    return (
      <section className="-mx-5 flex flex-col gap-10 bg-[var(--sand)] px-5 py-12 @3xl:mx-0 @3xl:rounded-(--radius) @3xl:px-12 @3xl:py-14">
        <Heading text={props.heading} ctx={ctx} />
        {data?.verdict && (
          <p className={cn(display, "max-w-4xl text-2xl leading-snug @3xl:text-4xl")}>
            {data.verdict}
            <Writing on={writing && fits.length === 0} />
          </p>
        )}
        {fits.length > 0 && rows(fits)}
        {weigh.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm text-muted-foreground">Worth checking on a viewing</h3>
            {rows(weigh, true)}
          </div>
        )}
      </section>
    );
  },
});

// Your regulars: each place they love now, and the one near the house that stands in for it.

const regulars = defineGenerated({
  type: "regulars",
  name: "Your Regulars",
  description: "Each place they love now, paired with one near the home that stands in for it, with the walk.",
  icon: FootprintsIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Your regulars, from this front door" }),
    count: f.number({ label: "How many", default: 5, min: 2, max: 8 }),
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence for them, leading in."),
        items: z
          .array(
            z.object({
              instead: z
                .string()
                .describe("What it stands in for, in a few of their words: a place they named (Herkimer Coffee) or a habit (Sundays at Green Lake)"),
              entity: z.string().describe("Candidate id"),
              why: z
                .string()
                .describe(
                  "One or two sentences pointing at something specific about the new place (a dish, the room, what people mention) and what they love about the old one",
                ),
            }),
          )
          .describe(`Up to ${props.count} pairs, the places they named first, in the order of a week`),
      }),
    instructions: (props) =>
      `Pair ${props.count} things they love now with a candidate near the home that would stand in for it. Start with ` +
      "the places they named, then the places in their week (Friday dinner out, Sundays at the lake). Only places and " +
      "habits that happen at a place: never an artist, a commute or a chore. Choose the candidate closest in " +
      "character to the original (a roaster for a roaster, a park with water for a lake), not just the same category. " +
      "Point at facts from the candidate (its keywords, tags, description), never generic praise. Each candidate once. " +
      "Skip chains, supermarkets, drive-thrus and hospital or office cafés: fewer, better picks beat a full list. " +
      "Don't describe the house.",
    picks: (props) => Math.min(24, props.count * 4),
    lookup: () => ({ name: "Places near the home", type: "place", near: "answer", answer: "listing_location", radius: 2, take: 18 }),
    sample: (props) => ({
      intro: "Five places you'd be at most weeks, each one standing in for somewhere you already go.",
      items: sampleIds.places.slice(0, props.count).map((entity, i) => ({
        instead: ["Herkimer Coffee", "Portage Bay Cafe", "Friday dinner out", "Sundays at Green Lake", "The farmers market"][i % 5],
        entity,
        why: `People mention the ${sampleEntities[entity]?.keywords[0] ?? sampleEntities[entity]?.tags[0]?.toLowerCase() ?? "room"}, and it keeps the same slow pace as the place you go now.`,
      })),
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.count, 4)} />,
  Component: ({ props, ctx, section }) => {
    const { data: home } = useListing(ctx, props.step || "listing");
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <section className="flex flex-col gap-10">
        <Heading text={props.heading} intro={section.data?.intro} ctx={ctx} />
        <ol className="flex flex-col">
          {items.map((item, i) => {
            const place = ctx.outcome?.entity(item?.entity) ?? null;
            const meta = place ? [fromHome(home?.point, place), place.tags[0], dollars(place.priceLevel)].filter(Boolean).join(" · ") : "";
            // Only when it says something the row above didn't.
            const ranked = place ? because(place) : null;
            const above = i > 0 ? ctx.outcome?.entity(items[i - 1]?.entity) : null;
            const fresh = ranked && ranked !== (above ? because(above) : null) ? ranked : null;
            return (
              <li key={i} className="grid gap-5 border-t py-8 @3xl:grid-cols-[2fr_2fr_1.4fr] @3xl:gap-10">
                <div className="flex flex-col gap-2">
                  {item?.instead && <span className="text-sm text-muted-foreground">In place of {item.instead}</span>}
                  {place ? (
                    <a
                      href={mapsLink(place)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={outLink(ctx)}
                      className={cn(display, "text-2xl leading-tight underline-offset-4 hover:underline @3xl:text-3xl")}
                    >
                      {place.name}
                    </a>
                  ) : (
                    <div className={cn(pulse, "h-8 w-2/3")} aria-hidden />
                  )}
                  {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
                </div>
                <div className="flex flex-col gap-3">
                  {item?.why && (
                    <p className="text-lg text-pretty">
                      {item.why}
                      <Writing on={writing && i === items.length - 1} />
                    </p>
                  )}
                  {fresh && <p className="text-sm text-muted-foreground">{fresh}</p>}
                </div>
                <Picture entity={place} className="aspect-[4/3] rounded-(--radius)" />
              </li>
            );
          })}
        </ol>
      </section>
    );
  },
});

// Your week inside: their routines, room by room.

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
              when: z.string().describe("When they'd be there, from their week, e.g. Weekdays before the 8 AM drop-off"),
              space: z.string().describe("A space the listing names, e.g. Sunroom"),
              use: z.string().describe("One or two sentences on how they'd use it, tied to what they told us"),
            }),
          )
          .describe(`${props.count} spaces, in the order of their week`),
      }),
    instructions: (props) =>
      `Walk through ${props.count} spaces the listing names and say how this person would use each, from the week ` +
      "they described: where breakfast happens, where work happens, where friends end up. Only spaces the listing names.",
    sample: () => ({
      rooms: [
        { when: "Weekdays before the 8 AM drop-off", space: "Updated kitchen", use: "Breakfast for a two-year-old and a four-year-old, under the vaulted ceiling." },
        { when: "Three days a week, nine to five", space: "Third bedroom", use: "Priya's office, with the door shut on calls." },
        { when: "Saturday after the market", space: "Fenced backyard", use: "The kids run while the bags come in from the car." },
        { when: "Evenings, once they're asleep", space: "West-facing balcony", use: "The last of the light over the rooftops." },
      ],
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.count, 4)} />,
  Component: ({ props, ctx, section }) => {
    const items = (section.data?.rooms ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <section className="flex flex-col gap-10">
        <Heading text={props.heading} ctx={ctx} />
        <ol className="flex flex-col">
          {items.map((room, i) => (
            <li key={i} className="grid gap-2 border-t py-6 @3xl:grid-cols-[1fr_1fr_2fr] @3xl:gap-10">
              <span className="text-muted-foreground">{room?.when}</span>
              <h3 className={cn(display, "text-xl @3xl:text-2xl")}>{room?.space}</h3>
              {room?.use && (
                <p className="text-lg text-pretty">
                  {room.use}
                  <Writing on={writing && i === items.length - 1} />
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    );
  },
});

// A day from the door: a walkable day of places near the house.

const day = defineGenerated({
  type: "day",
  name: "A Day From the Door",
  description: "A day of places near the home, in order, with the walk from the house.",
  icon: CalendarDaysIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "A Saturday from the front door" }),
    stops: f.number({ label: "Stops", default: 4, min: 3, max: 6 }),
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence for them, leading in."),
        stops: z
          .array(
            z.object({
              time: z.string().describe("e.g. 8:30 AM"),
              entity: z.string().describe("Candidate id"),
              what: z.string().describe("One or two sentences: what they'd do there, fitted around their week and who they're with"),
            }),
          )
          .describe(`${props.stops} stops, in order through the day`),
      }),
    instructions: (props) =>
      `Plan ${props.stops} stops for the day in the heading ("${props.heading}"), leaving from the house and coming ` +
      "back to it. Only what they'd do on that day: no work or school runs on a weekend. Fit the times to what they " +
      "told us (naps, early nights, a market they go to), and use what each candidate is known for. " +
      "Skip chains, supermarkets, drive-thrus and hospital or office cafés.",
    picks: (props) => Math.min(20, props.stops * 4),
    lookup: () => ({ name: "Places near the home", type: "place", near: "answer", answer: "listing_location", radius: 3, take: 16 }),
    sample: (props) => ({
      intro: "One Saturday, door to door, at the pace of a four-year-old.",
      stops: sampleIds.places.slice(0, props.stops).map((entity, i) => ({
        time: ["8:30 AM", "10 AM", "12:30 PM", "3 PM", "5 PM", "6:30 PM"][i],
        entity,
        what: `Known for its ${sampleEntities[entity]?.keywords[0] ?? sampleEntities[entity]?.tags[0]?.toLowerCase() ?? "room"}. Back home in time for the afternoon nap.`,
      })),
    }),
  },
  Pending: ({ props, ctx }) => <PendingRows heading={props.heading} ctx={ctx} rows={Math.min(props.stops, 4)} />,
  Component: ({ props, ctx, section }) => {
    const { data: home } = useListing(ctx, props.step || "listing");
    const stops = section.data?.stops ?? [];
    const writing = section.status === "generating";
    return (
      <section className="flex flex-col gap-10">
        <Heading text={props.heading} intro={section.data?.intro} ctx={ctx} />
        <ol className="flex flex-col">
          {stops.map((stop, i) => {
            const place = ctx.outcome?.entity(stop?.entity) ?? null;
            const meta = place ? [fromHome(home?.point, place), place.tags[0]].filter(Boolean).join(" · ") : "";
            return (
              <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3 border-t py-6 @3xl:grid-cols-[8rem_2fr_3fr_8rem] @3xl:gap-10">
                <span className={cn(display, "text-lg tabular-nums")}>{stop?.time}</span>
                <div className="flex flex-col gap-1">
                  {place ? (
                    <a
                      href={mapsLink(place)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={outLink(ctx)}
                      className={cn(display, "text-xl underline-offset-4 hover:underline @3xl:text-2xl")}
                    >
                      {place.name}
                    </a>
                  ) : (
                    <div className={cn(pulse, "h-7 w-2/3")} aria-hidden />
                  )}
                  {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
                </div>
                {stop?.what && (
                  <p className="col-start-2 text-pretty @3xl:col-start-auto">
                    {stop.what}
                    <Writing on={writing && i === stops.length - 1} />
                  </p>
                )}
                <Picture entity={place} className="col-start-2 aspect-[4/3] rounded-(--radius) @3xl:col-start-auto" />
              </li>
            );
          })}
        </ol>
      </section>
    );
  },
});

// Map: where it is.

const map = defineComponent({
  type: "map",
  name: "Map",
  description: "Where the home is, on OpenStreetMap.",
  icon: MapIcon,
  fields: {
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
    heading: f.text({ label: "Heading", default: "Where it is" }),
    zoom: f.segmented({
      label: "Show",
      default: "street",
      options: [
        { value: "street", label: "The street" },
        { value: "area", label: "The area" },
      ],
    }),
  },
  Component: ({ props, ctx }) => {
    const { data, waiting } = useListing(ctx, props.step);
    if (!data?.point) return waiting ? <div className={cn(pulse, "aspect-[16/9] w-full")} aria-hidden /> : null;
    const { lat, lng } = data.point;
    const d = props.zoom === "area" ? 0.03 : 0.01;
    const bbox = [lng - d * 1.6, lat - d, lng + d * 1.6, lat + d].map((n) => n.toFixed(5)).join(",");
    return (
      <section className="grid gap-6 @3xl:grid-cols-[2fr_3fr] @3xl:gap-16">
        <div className="flex flex-col gap-4">
          {props.heading && <h2 className={sectionHeading}>{ctx.fill(props.heading)}</h2>}
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={outLink(ctx)}
            className="inline-flex items-center gap-1.5 self-start text-lg underline-offset-4 hover:underline"
          >
            {[data.address, data.area].filter(Boolean).join(", ")}
            <ArrowUpRightIcon className="size-4 shrink-0" />
          </a>
        </div>
        <iframe
          title={`Map of ${data.address}`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-(--radius) border bg-muted"
        />
      </section>
    );
  },
});

// Agent: who found it, and the next step. Its id is the anchor the top button scrolls to.

const agent = defineComponent({
  type: "agent",
  name: "Agent",
  description: "The agent who sent it, with a button to book a viewing.",
  icon: UserRoundIcon,
  fields: {
    step: f.text({ label: "Listing step", default: "listing", help: stepHelp }),
    heading: f.text({ label: "Heading", default: "Want to walk through it, {{first_name}}?" }),
    message: f.longText({ label: "Message", default: "Reply to this email or book a time, and I'll get you in this week." }),
    photo: f.image({ label: "Photo" }),
    name: f.text({ label: "Name", default: "Your agent" }),
    role: f.text({ label: "Role", placeholder: "Buyer's agent, Fieldhouse Realty" }),
    email: f.text({ label: "Email", placeholder: "agent@example.com" }),
    phone: f.text({ label: "Phone", placeholder: "+1 206 555 0134" }),
    button: f.text({ label: "Button", default: "Book a viewing" }),
  },
  Component: ({ props, ctx }) => {
    const { data } = useListing(ctx, props.step);
    const subject = `Viewing: ${data?.address ?? "the home you sent"}`;
    const href = props.email ? `mailto:${props.email}?subject=${encodeURIComponent(subject)}` : "";
    return (
      <section className="-mx-5 grid gap-10 bg-[var(--deep)] px-5 py-12 text-[var(--deep-foreground)] @3xl:mx-0 @3xl:grid-cols-[3fr_2fr] @3xl:gap-16 @3xl:rounded-(--radius) @3xl:px-12 @3xl:py-14">
        <div className="flex flex-col items-start gap-5">
          {props.heading && <h2 className={sectionHeading}>{ctx.fill(props.heading)}</h2>}
          {props.message && <p className="max-w-xl text-lg text-pretty">{ctx.fill(props.message)}</p>}
          {href && props.button && (
            <CatalogueLink href={href} ctx={ctx} className={cn(button, "mt-2 bg-[var(--deep-foreground)] text-[var(--deep)]")}>
              {props.button}
            </CatalogueLink>
          )}
        </div>
        <div className="flex items-start gap-4">
          {props.photo ? (
            <img src={props.photo} alt={props.name} className="size-16 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/10">
              <UserRoundIcon className="size-6" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className={cn(display, "text-xl")}>{props.name}</p>
            {props.role && <p className="opacity-70">{props.role}</p>}
            {props.phone && (
              <a href={`tel:${props.phone.replace(/[^\d+]/g, "")}`} className="mt-2 underline-offset-4 hover:underline">
                {props.phone}
              </a>
            )}
            {props.email && (
              <a href={href} className="underline-offset-4 hover:underline">
                {props.email}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  },
});

export const artifactComponents = [listing, fit, regulars, rooms, day, map, agent];
