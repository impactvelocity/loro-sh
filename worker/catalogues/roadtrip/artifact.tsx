/**
 * The road trip's outcome: the drive to the festival, then the weekend.
 *
 * - The Road: their real route on a map, with the days and the totals.
 *   Static: it reads the Route step's public data, so it shows as soon
 *   as the route is planned.
 * - The Drive: day by day, where to stop for coffee, lunch and the night,
 *   from the places the Route step found in Qloo near each town.
 * - Road Mix: a side of a tape for each day's driving, from an artist
 *   lookup on their taste.
 *
 * The rest (ticket, Your Days from the Lineup step, note, callout) is the
 * Festival and Basic catalogues'.
 */
import { useState } from "react";
import { CassetteTapeIcon, ExternalLinkIcon, FuelIcon, MapIcon, MapPinIcon, MusicIcon, RouteIcon } from "lucide-react";
import { z } from "zod";

import { defineComponent, defineGenerated, type RenderContext } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { sampleIds } from "@core/outcome/samples";
import type { TasteEntity } from "@core/outcome/state";
import { cn } from "@/lib/utils";
import { artifactComponents as festivalArtifact } from "../festival/artifact";
import { Frame } from "../festival/artifact";
import { night, poster, quiet } from "../festival/shared";
import { RoadMap } from "./map";
import { type Trip, type TripStop, directionsLink, duration, isTrip, miles, sampleTrip } from "./trip";

export { artifactLayout } from "../festival/artifact";

const pulse = "animate-pulse rounded-(--radius) bg-muted";

function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}


/** The trip from the step a section picks from, or else from any step that made one. */
function tripFor(ctx: RenderContext, lookups: string[] = []): Trip | null {
  for (const id of lookups) {
    const data = ctx.outcome?.section(id).data;
    if (isTrip(data)) return data;
  }
  const step = ctx.outcome?.state.steps.find((s) => isTrip(s.data));
  return step && isTrip(step.data) ? step.data : null;
}

const mapsLink = (entity: TasteEntity) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([entity.name, entity.address].filter(Boolean).join(", "))}`;

const placeMeta = (entity: TasteEntity) =>
  [entity.tags[0], entity.priceLevel ? "$".repeat(entity.priceLevel) : null, entity.rating ? `${entity.rating}★` : null]
    .filter(Boolean)
    .join(" · ");

/** A place's photo, or a pin when it has none or the link is dead (some of Qloo's are). */
function Thumb({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = "size-16 shrink-0 rounded-[calc(var(--radius)*0.6)] @2xl:size-20";
  if (src && failed !== src) return <img src={src} alt="" onError={() => setFailed(src)} className={cn(box, "bg-muted object-cover")} />;
  return (
    <div className={cn(box, "flex items-center justify-center bg-secondary text-muted-foreground")}>
      <MapPinIcon className="size-5" />
    </div>
  );
}

// The Road: the map and the numbers.

const road = defineComponent({
  type: "road",
  name: "The Road",
  description: "Their route on a map, with each day's drive and the totals. From the Route step.",
  icon: MapIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The road" }),
    body: f.longText({ label: "Intro" }),
  },
  Component: ({ props, ctx }) => {
    const trip = tripFor(ctx);
    if (!trip) {
      if (!ctx.outcome || ctx.outcome.status === "done") return null;
      return (
        <Frame heading={props.heading} ctx={ctx}>
          <div className={cn(pulse, "aspect-[4/3] w-full")} />
          <p className="text-sm text-muted-foreground">Planning the route…</p>
        </Frame>
      );
    }
    const stops = trip.legs.flatMap((leg) => leg.stops);
    const overnights = stops.filter((stop) => stop.role === "overnight");
    const link = directionsLink([trip.origin, ...stops.filter((s) => s.role !== "arrive"), trip.destination]);
    const label = (town: string) => town.split(",")[0];
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {props.body && <p className="text-lg text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
        {/* A small map beside the numbers: enough to see the shape of the drive. */}
        <div className="grid items-start gap-10 @2xl:grid-cols-[minmax(0,17rem)_1fr]">
          <RoadMap
            title={`The drive from ${trip.origin.town} to ${trip.destination.town}`}
            route={trip.line}
            marks={[
              { ...trip.origin, label: label(trip.origin.town) },
              ...stops.filter((s) => s.role === "break").map((s) => ({ ...s })),
              ...overnights.map((s) => ({ ...s, label: label(s.town) })),
              { ...trip.destination, label: trip.destination.town },
            ]}
            className="mx-auto max-w-xs rounded-[calc(var(--radius)*1.6)] ring-1 ring-border @2xl:max-w-none"
          />
          <div className="flex flex-col gap-8">
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {[
                ["miles", miles(trip.km).toLocaleString("en-US")],
                ["of driving", `${Math.floor(trip.hours)}h ${String(Math.round((trip.hours % 1) * 60)).padStart(2, "0")}`],
                [trip.legs.length === 1 ? "day on the road" : "days on the road", String(trip.legs.length)],
              ].map(([term, value]) => (
                <div key={term} className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-muted-foreground">{term}</dt>
                  <dd className="text-4xl leading-none font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <ol className="flex flex-col divide-y divide-border border-y border-border">
              {trip.legs.map((leg, i) => (
                <li key={i} className="flex flex-col gap-0.5 py-3.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {leg.day} <span className="font-normal text-muted-foreground">{leg.date}</span>
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {miles(leg.km)} mi · {duration(leg.hours)}
                    </span>
                  </span>
                  <span className="text-pretty">
                    {label(leg.from)} <span className="text-muted-foreground">to</span> {label(leg.to)}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2">
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start font-medium underline-offset-4 hover:underline"
              >
                Open the route in Google Maps
                <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
              </a>
              <span className="text-sm text-muted-foreground">
                {trip.source === "estimate"
                  ? "Rough times: the route is a straight-line estimate."
                  : `Up to ${trip.perDay} hours a day, as you asked.`}
              </span>
            </div>
          </div>
        </div>
      </Frame>
    );
  },
});

// The Drive: day by day, the places to stop.

const whens = {
  morning: "Breakfast",
  coffee: "Coffee",
  lunch: "Lunch",
  stretch: "Stretch your legs",
  dinner: "Dinner",
  late: "Later",
} as const;
type When = keyof typeof whens;

const roles: Record<TripStop["role"], string> = {
  start: "Setting off",
  break: "On the way",
  overnight: "Tonight",
  arrive: "Rolling in",
};

/** Which town on the trip a place was found in. */
function townOf(trip: Trip | null, entity: string | undefined) {
  if (!trip || !entity) return null;
  const key = entity.toLowerCase();
  for (const leg of trip.legs) for (const stop of leg.stops) if (stop.places.some((id) => id.toLowerCase() === key)) return stop;
  return null;
}

const drive = defineGenerated({
  type: "drive",
  name: "The Drive",
  description: "Day by day, where to stop for coffee, lunch and the night, from places Qloo found near each town. From the Route step.",
  icon: RouteIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The drive" }),
    perDay: f.number({ label: "Stops a day, at most", default: 4, min: 1, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        days: z
          .array(
            z.object({
              day: z.string().describe("The day's name exactly as in the route under Other context, e.g. Wednesday"),
              headline: z.string().describe("Five to nine words on the shape of that day's drive"),
              stops: z
                .array(
                  z.object({
                    entity: z.string().describe("Candidate id of a place listed under that day's towns, or the night before's town for the morning"),
                    when: z
                      .enum(["morning", "coffee", "lunch", "stretch", "dinner", "late"])
                      .describe("morning: before leaving the town they slept in. stretch: a shop, a view or a walk"),
                    note: z.string().describe("One or two sentences: why this place, for them, and what to get or do there"),
                  }),
                )
                .describe(`Up to ${props.perDay} places that day, in the order they'd reach them`),
              tip: z.string().describe("One practical line for that day: when to leave, where the road climbs or gets hot, where to fill up"),
            }),
          )
          .describe("One entry per driving day in the route, in order"),
      }),
    instructions: (props) =>
      "Plan each driving day of the route under Other context. Each day starts where they slept (startsIn) and ends at endsIn; " +
      "the towns under it are on the way, in order. For each day, only pick places listed under that day's towns, " +
      "and on a day after a night on the road, a morning pick may come from the town they slept in. " +
      `At most ${props.perDay} places a day, in the order they'd reach them. Match what they told us they stop for, ` +
      "who's in the car and how they sleep. If a town has no places, plan around it and say so plainly in the tip. " +
      "On the last day they roll in to the festival: if the route lists places for the night before, end with dinner there. " +
      "Don't write miles or drive times; the page shows them. Name a road or a pass only if you're sure it's on this route.",
    picks: () => 72,
    // Several days of stops, each with an id and a note, runs past the default.
    maxOutputTokens: (props) => 2500 + props.perDay * 800,
    sample: () => {
      const trip = sampleTrip(sampleIds.places);
      const [first, second, third] = trip.legs;
      const at = (leg: typeof first | undefined, role: TripStop["role"]) => leg?.stops.find((s) => s.role === role)?.places ?? [];
      const pick = (leg: typeof first | undefined, role: TripStop["role"], i: number) => at(leg, role)[i] ?? "";
      return {
        days: [
          {
            day: first.day,
            headline: "Out of the city early, over the mountains by dark",
            stops: [
              { entity: pick(first, "break", 0), when: "coffee" as When, note: "Your first stop, two and a half hours in. Get something for the road too." },
              { entity: pick(first, "break", 1), when: "stretch" as When, note: "Twenty minutes in the crates is the right amount of break." },
              { entity: pick(first, "overnight", 0), when: "dinner" as When, note: "A proper dinner after the passes. You'll have earned it." },
            ],
            tip: "Leave by nine to clear the city before traffic, and fill up before the climb.",
          },
          {
            day: second?.day ?? "Wednesday",
            headline: "The long flat middle, broken up well",
            stops: [
              { entity: pick(first, "overnight", 1), when: "morning" as When, note: "Coffee before you go. The valley is long and the next good cup is hours away." },
              { entity: pick(second, "break", 0), when: "lunch" as When, note: "Halfway, and the best lunch on the route." },
            ],
            tip: "Afternoons in the valley run hot: keep water in the car.",
          },
          ...(third
            ? [
                {
                  day: third.day,
                  headline: "Down into the desert by sunset",
                  stops: [],
                  tip: "The last hour is all wind farms and mountains. Time it for the light.",
                },
              ]
            : []),
        ],
      };
    },
  },
  Pending: ({ props, ctx }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="flex flex-col gap-3" aria-hidden>
        <div className={cn(pulse, "h-8 w-40")} />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={cn(pulse, "h-24")} />
        ))}
      </div>
    </Frame>
  ),
  Component: ({ props, ctx, section }) => {
    const trip = tripFor(ctx, props.lookups);
    const days = (section.data?.days ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {days.map((day, d) => {
          // Models sometimes write "Wednesday, April 14": match on the name.
          const leg = trip?.legs.find((l) => day?.day?.startsWith(l.day)) ?? trip?.legs[d];
          const items = (day?.stops ?? []).filter((stop) => stop?.entity);
          // Consecutive stops in the same town share a heading.
          const groups: { stop: TripStop | null; items: typeof items }[] = [];
          for (const item of items) {
            const stop = townOf(trip, item?.entity);
            const last = groups.at(-1);
            if (last && last.stop?.id === stop?.id) last.items.push(item);
            else groups.push({ stop, items: [item] });
          }
          const lastDay = d === days.length - 1;
          return (
            <div key={d} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 border-b-2 border-foreground pb-3">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className={cn(poster, "text-[clamp(3rem,6cqi,4.5rem)] leading-none")}>{leg?.day ?? day?.day}</h3>
                  {leg && <span className="text-sm font-medium text-muted-foreground">{leg.date}</span>}
                </div>
                {leg && (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {leg.from.split(",")[0]} to {leg.to.split(",")[0]} · {miles(leg.km)} mi · {duration(leg.hours)}
                  </p>
                )}
                {day?.headline && <p className="text-lg text-pretty">{day.headline}</p>}
              </div>
              {groups.map((group, g) => {
                // A town that isn't on today's leg is where they slept: the morning before setting off.
                const slept = group.stop && leg && !leg.stops.some((stop) => stop.id === group.stop?.id);
                const morning = slept || group.items.every((item) => item?.when === "morning");
                const role = group.stop ? (morning ? "Before you leave" : roles[group.stop.role]) : null;
                return (
                  <div key={g} className="flex flex-col gap-3">
                    {group.stop && (
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xl font-semibold tracking-[-0.02em]">{group.stop.town}</span>
                        <span className={quiet}>{role?.toLowerCase()}</span>
                      </div>
                    )}
                    <ol className="flex flex-col gap-3">
                      {group.items.map((item, i) => {
                        const place = ctx.outcome?.entity(item?.entity) ?? null;
                        const end = writing && lastDay && g === groups.length - 1 && i === group.items.length - 1 && !day?.tip;
                        return (
                          <li key={i} className="flex gap-4 rounded-(--radius) bg-card p-3 ring-1 ring-border @2xl:p-4">
                            <Thumb src={place?.image} />
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="text-sm font-medium text-muted-foreground">{item?.when ? whens[item.when as When] : ""}</span>
                              {place ? (
                                <a
                                  href={mapsLink(place)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="self-start font-heading text-lg leading-snug font-medium underline-offset-4 hover:underline"
                                >
                                  {place.name}
                                </a>
                              ) : (
                                <div className={cn(pulse, "h-6 w-40")} aria-hidden />
                              )}
                              {place && placeMeta(place) && <span className="text-sm text-muted-foreground">{placeMeta(place)}</span>}
                              {item?.note && (
                                <p className="text-pretty">
                                  {item.note}
                                  <Writing on={end} />
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
              {day?.tip && (
                <p className="flex gap-3 rounded-(--radius) bg-secondary p-4 text-pretty">
                  <FuelIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {day.tip}
                    <Writing on={writing && lastDay} />
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </Frame>
    );
  },
});

// Road Mix: a side of tape per day.

const sideNames = ["Side A", "Side B", "Side C", "Side D", "Side E"];

const mixtape = defineGenerated({
  type: "mixtape",
  name: "Road Mix",
  description: "A tape for the car: one side per day of driving, from artists Qloo matched to their taste.",
  icon: CassetteTapeIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Road mix" }),
    perSide: f.number({ label: "Artists a side", default: 3, min: 2, max: 5 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence leading in, for them"),
        sides: z
          .array(
            z.object({
              title: z.string().describe("Two to five words for that stretch of road, e.g. Valley heat, windows down"),
              day: z.string().describe("The driving day it's for, as in the route, e.g. Wednesday"),
              artists: z
                .array(
                  z.object({
                    entity: z.string().describe("Candidate id of the artist"),
                    note: z.string().describe("One sentence: why this one for this stretch, tied to an artist they love"),
                  }),
                )
                .describe(`${props.perSide} artists`),
            }),
          )
          .describe("One side per driving day in the route, at most four. A one-day drive gets two sides: the way in and the last hour"),
      }),
    instructions: () =>
      "Make them a road mix from the candidates: one side per driving day under Other context, each side fitted to that " +
      "day's road (the morning, the long middle, the last hour into the desert). Order a side the way it should play. " +
      "Don't use an artist twice. Say why each one fits by comparison with someone they told us they love.",
    picks: () => 24,
    lookup: () => ({ name: "Music for the drive", type: "artist", take: 20 }),
    sample: (props) => {
      const trip = sampleTrip();
      const ids = sampleIds.artists;
      return {
        intro: "Three days of road, three sides. Start slow; the desert side is for the last hour.",
        sides: trip.legs.slice(0, 2).map((leg, i) => ({
          title: ["Up and over the pass", "Valley heat, windows down"][i],
          day: leg.day,
          artists: ids.slice(0, props.perSide).map((entity, j) => ({
            entity,
            note: [
              "The same loose groove you love in Khruangbin, made for open road.",
              "Hypnotic and patient: it fills a long straight stretch.",
              "Warm surf guitar for when the sun gets low.",
            ][(i + j) % 3],
          })),
        })),
      };
    },
  },
  Pending: ({ props, ctx }) => (
    <Frame heading={props.heading} ctx={ctx}>
      <div className="grid gap-4 @2xl:grid-cols-2" aria-hidden>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={cn(pulse, "h-64")} />
        ))}
      </div>
    </Frame>
  ),
  Component: ({ props, ctx, section }) => {
    const sides = (section.data?.sides ?? []).filter(Boolean);
    const writing = section.status === "generating";
    return (
      <Frame heading={props.heading} ctx={ctx}>
        {section.data?.intro && (
          <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground text-pretty">{section.data.intro}</p>
        )}
        <div className="grid gap-4 @2xl:grid-cols-2">
          {sides.map((side, s) => (
            <article key={s} className="flex flex-col overflow-hidden rounded-(--radius) bg-card shadow-sm ring-1 ring-border">
              {/* The tape's label: a strip of sunset with the side and its stretch of road. */}
              <header style={night} className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
                <span className="flex items-center justify-between gap-3 text-sm text-[var(--sun)]">
                  <span>{sideNames[s] ?? `Side ${s + 1}`}</span>
                  {side?.day && <span>{side.day}</span>}
                </span>
                <h3 className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{side?.title}</h3>
              </header>
              <ol className="flex flex-col divide-y">
                {(side?.artists ?? []).map((item, i) => {
                  const artist = ctx.outcome?.entity(item?.entity) ?? null;
                  const listen = artist && `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`;
                  return (
                    <li key={i} className="flex gap-3 px-5 py-4">
                      {artist?.image ? (
                        <img src={artist.image} alt="" className="size-12 shrink-0 rounded-full bg-muted object-cover" />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <MusicIcon className="size-4" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col gap-0.5">
                        {artist && listen ? (
                          <a
                            href={listen}
                            target="_blank"
                            rel="noreferrer"
                            className="self-start font-heading text-lg leading-snug font-medium underline-offset-4 hover:underline"
                          >
                            {artist.name}
                          </a>
                        ) : (
                          <div className={cn(pulse, "h-6 w-32")} aria-hidden />
                        )}
                        {artist && artist.tags.length > 0 && (
                          <span className="text-sm text-muted-foreground">{artist.tags.slice(0, 2).join(" · ")}</span>
                        )}
                        {item?.note && (
                          <p className="text-pretty">
                            {item.note}
                            <Writing on={writing && s === sides.length - 1 && i === (side?.artists?.length ?? 0) - 1} />
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </Frame>
    );
  },
});

export const artifactComponents = [road, drive, mixtape, ...festivalArtifact];
