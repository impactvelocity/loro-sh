/**
 * The Basic catalogue's generated sections: written by the outcome
 * workflow for each person, streamed into the page as they're written.
 *
 * Each one shows the pattern a catalogue follows:
 * - `generate.schema` is what gets written, in reading order, with
 *   `.describe()` on what the model should know. `entity` fields point at
 *   Qloo entities, looked up with `ctx.outcome.entity(id)`.
 * - `generate.picks` makes it recommend things: it picks lookups under
 *   From, and chooses from their results. `generate.lookup` is the lookup
 *   it starts with when the workflow has none.
 * - `Pending` holds the section's shape until the first words arrive.
 * - `Component` draws partial data: any key can be missing while it streams.
 */
import { ExternalLinkIcon, MapPinIcon, MusicIcon, PenLineIcon, RouteIcon, SparklesIcon } from "lucide-react";
import { z } from "zod";

import { defineGenerated, type RenderContext } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { placeCategories } from "@core/outcome/lookups";
import { sampleEntities, sampleIds } from "@core/outcome/samples";
import type { EntityType, TasteEntity } from "@core/outcome/state";
import { signalTypes } from "@core/profiles";
import { cn } from "@/lib/utils";
import { heading } from "./shared";

const pulse = "animate-pulse rounded-(--radius) bg-muted";

/** A caret after text that's still being written. */
function Writing({ on }: { on: boolean }) {
  if (!on) return null;
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />;
}

function Heading({ text, ctx }: { text: string; ctx: RenderContext }) {
  return text ? <h2 className={heading}>{ctx.fill(text)}</h2> : null;
}

const dollars = (level: number | null) => (level ? "$".repeat(level) : null);

function placeMeta(entity: TasteEntity) {
  return [entity.neighbourhood, dollars(entity.priceLevel), entity.tags[0]].filter(Boolean).join(" · ");
}

function mapsLink(entity: TasteEntity) {
  const query = [entity.name, entity.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Note: a few paragraphs, no picks.

const note = defineGenerated({
  type: "note",
  name: "Written Note",
  description: "A few paragraphs written for them. No recommendations.",
  icon: PenLineIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Before you go" }),
    length: f.segmented({
      label: "Length",
      options: [
        { value: "short", label: "Short" },
        { value: "long", label: "Longer" },
      ],
    }),
  },
  generate: {
    schema: (props) =>
      z.object({
        paragraphs: z
          .array(z.string())
          .describe(props.length === "short" ? "One or two short paragraphs." : "Two or three paragraphs."),
      }),
    instructions: () =>
      "Write a short note that shows you listened: tie what they told us (the occasion, the pace, what to avoid) to how the rest of the page is put together. Don't recommend places or name businesses here; the sections below do that.",
    sample: () => ({
      paragraphs: [
        "You said your sister's visiting and you'd rather keep it slow, so this plan has two anchors a day and long gaps between them.",
        "Nothing starts before ten, and the late night is optional: it's there if Saturday's going well.",
      ],
    }),
  },
  Pending: ({ props, ctx }) => (
    <section className="flex flex-col gap-4">
      <Heading text={props.heading} ctx={ctx} />
      <div className="flex flex-col gap-3" aria-hidden>
        <div className={cn(pulse, "h-5 w-full")} />
        <div className={cn(pulse, "h-5 w-11/12")} />
        <div className={cn(pulse, "h-5 w-2/3")} />
      </div>
    </section>
  ),
  Component: ({ props, ctx, section }) => {
    const paragraphs = (section.data?.paragraphs ?? []).filter((p): p is string => Boolean(p));
    return (
      <section className="flex flex-col gap-4">
        <Heading text={props.heading} ctx={ctx} />
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-lg leading-relaxed text-pretty">
            {paragraph}
            <Writing on={section.status === "generating" && i === paragraphs.length - 1} />
          </p>
        ))}
      </section>
    );
  },
});

// Day plan: timed stops at real places.

const plan = defineGenerated({
  type: "day-plan",
  name: "Day Plan",
  description: "Timed stops at real places, picked from Qloo for them.",
  icon: RouteIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The plan" }),
    span: f.segmented({
      label: "Covers",
      options: [
        { value: "weekend", label: "A weekend" },
        { value: "day", label: "One day" },
      ],
    }),
    stops: f.number({ label: "Stops per day", default: 3, min: 2, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        days: z
          .array(
            z.object({
              label: z.string().describe("The day, e.g. Saturday"),
              stops: z
                .array(
                  z.object({
                    time: z.string().describe("Rough time, e.g. 10:30 or Late"),
                    entity: z.string().describe("Candidate id"),
                    note: z.string().describe("One or two sentences: what to do there and why it fits them."),
                  }),
                )
                .describe(`${props.stops} stops, in order through the day`),
            }),
          )
          .describe(props.span === "day" ? "One day" : "Saturday and Sunday"),
      }),
    instructions: (props) =>
      `Plan ${props.span === "day" ? "one day" : "Saturday and Sunday"} with ${props.stops} stops a day, in a sensible order and pace for them. ` +
      "Mix kinds of place. Keep neighbours together where you can, using the neighbourhoods given. Respect anything they want to avoid.",
    picks: (props) => Math.min(16, props.stops * (props.span === "day" ? 1 : 2) + 4),
    lookup: () => ({ name: "Places nearby", type: "place", take: 16 }),
    sample: (props) => {
      const [cafe, coffee, records, swan, cactus] = sampleIds.places;
      const saturday = [
        { time: "10:30", entity: cafe, note: "Late brunch on the patio, then a slow walk down South Congress." },
        { time: "14:00", entity: records, note: "An hour in the vintage crates. Ask what's come in this week." },
        { time: "21:00", entity: swan, note: "Soul and jazz in a small room. Get there before the second set." },
      ];
      const sunday = [
        { time: "10:00", entity: coffee, note: "Coffee and a kolache to start, out back among the plants." },
        { time: "19:00", entity: cactus, note: "A quiet acoustic set to end the weekend." },
      ];
      return {
        days:
          props.span === "day"
            ? [{ label: "Saturday", stops: saturday }]
            : [
                { label: "Saturday", stops: saturday },
                { label: "Sunday", stops: sunday },
              ],
      };
    },
  },
  Pending: ({ props, ctx }) => (
    <section className="flex flex-col gap-6">
      <Heading text={props.heading} ctx={ctx} />
      <div className="flex flex-col divide-y border-y" aria-hidden>
        {Array.from({ length: Math.min(props.stops, 4) }, (_, i) => (
          <div key={i} className="grid grid-cols-[4rem_1fr] gap-4 py-5">
            <div className={cn(pulse, "h-4 w-12")} />
            <div className="flex flex-col gap-2">
              <div className={cn(pulse, "h-5 w-1/2")} />
              <div className={cn(pulse, "h-4 w-5/6")} />
            </div>
          </div>
        ))}
      </div>
    </section>
  ),
  Component: ({ props, ctx, section }) => {
    const days = section.data?.days ?? [];
    const writing = section.status === "generating";
    return (
      <section className="flex flex-col gap-8">
        <Heading text={props.heading} ctx={ctx} />
        {days.map((day, d) => (
          <div key={d} className="flex flex-col gap-3">
            {day?.label && <h3 className="font-heading text-xl font-medium">{day.label}</h3>}
            <ol className="flex flex-col divide-y border-y">
              {(day?.stops ?? []).map((stop, s) => {
                const place = ctx.outcome?.entity(stop?.entity) ?? null;
                const last = writing && d === days.length - 1 && s === (day?.stops?.length ?? 0) - 1;
                return (
                  <li key={s} className="grid grid-cols-[4rem_1fr] gap-4 py-5">
                    <time className="pt-0.5 text-sm text-muted-foreground tabular-nums">{stop?.time}</time>
                    <div className="flex flex-col gap-1.5">
                      {place ? (
                        <a
                          href={mapsLink(place)}
                          target="_blank"
                          rel="noreferrer"
                          className="self-start font-heading text-lg font-medium underline-offset-4 hover:underline"
                        >
                          {place.name}
                        </a>
                      ) : (
                        <div className={cn(pulse, "h-6 w-40")} aria-hidden />
                      )}
                      {place && placeMeta(place) && <span className="text-sm text-muted-foreground">{placeMeta(place)}</span>}
                      {stop?.note && (
                        <p className="text-pretty">
                          {stop.note}
                          <Writing on={last} />
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>
    );
  },
});

// Picks: a few things from its lookups, each with why.

/** Before lookups, Picks chose its own type and kind of place. Older configs start with a lookup that does the same. */
function legacyLookup(props: Record<string, unknown>) {
  const kind = typeof props.kind === "string" && props.kind in signalTypes ? (props.kind as EntityType) : "place";
  const category = typeof props.category === "string" && props.category in placeCategories ? props.category : null;
  if (kind !== "place") return { name: `${signalTypes[kind]}s they'd like`, type: kind };
  if (!category) return { name: "Places nearby", type: kind, take: 16 };
  const label = placeCategories[category as keyof typeof placeCategories].label;
  return { name: `${label} nearby`, type: kind, kinds: [category as keyof typeof placeCategories] };
}

const picks = defineGenerated({
  type: "picks",
  name: "Picks",
  description: "A few places, artists, films or books for them, with why.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "You might also like" }),
    count: f.number({ label: "How many", default: 3, min: 1, max: 6 }),
  },
  generate: {
    schema: (props) =>
      z.object({
        intro: z.string().describe("One sentence leading into the picks, for them."),
        items: z
          .array(
            z.object({
              entity: z.string().describe("Candidate id"),
              why: z.string().describe("Why it fits them, in one or two sentences."),
            }),
          )
          .describe(`${props.count} picks, best first`),
      }),
    instructions: (props) =>
      `Pick the ${props.count} candidate${props.count === 1 ? "" : "s"} that fit them best, and say why each one does. Prefer ones that connect to something they told us.`,
    picks: (props) => Math.min(12, props.count * 3),
    lookup: legacyLookup,
    sample: (props, { types }) => {
      const artists = types[0] === "artist";
      const ids = artists ? sampleIds.artists : sampleIds.places;
      return {
        intro: artists ? "For the drive in, three bands from the same corner of your record collection." : "If there's time left over:",
        items: ids.slice(0, props.count).map((entity) => ({
          entity,
          why: `Close to what you said you like about ${sampleEntities[entity]?.tags[0]?.toLowerCase() ?? "this"}, and easy to fit in.`,
        })),
      };
    },
  },
  Pending: ({ props, ctx }) => (
    <section className="flex flex-col gap-6">
      <Heading text={props.heading} ctx={ctx} />
      <div className="grid gap-4 @2xl:grid-cols-3" aria-hidden>
        {Array.from({ length: props.count }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className={cn(pulse, "aspect-[4/3] w-full")} />
            <div className={cn(pulse, "h-5 w-2/3")} />
            <div className={cn(pulse, "h-4 w-full")} />
          </div>
        ))}
      </div>
    </section>
  ),
  Component: ({ props, ctx, section }) => {
    const items = section.data?.items ?? [];
    const writing = section.status === "generating";
    return (
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Heading text={props.heading} ctx={ctx} />
          {section.data?.intro && <p className="text-lg text-muted-foreground text-pretty">{section.data.intro}</p>}
        </div>
        <ul className="grid gap-x-4 gap-y-8 @2xl:grid-cols-3">
          {items.map((item, i) => {
            const entity = ctx.outcome?.entity(item?.entity) ?? null;
            if (!entity) return <li key={i} className={cn(pulse, "aspect-[4/3] w-full")} aria-hidden />;
            const href = entity.type === "place" ? mapsLink(entity) : entity.website;
            const Icon = entity.type === "place" ? MapPinIcon : MusicIcon;
            return (
              <li key={entity.id} className="flex flex-col gap-3">
                {entity.image ? (
                  <img src={entity.image} alt="" className="aspect-[4/3] w-full rounded-(--radius) bg-muted object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-(--radius) bg-secondary text-muted-foreground">
                    <Icon className="size-6" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-lg leading-snug font-medium">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                        {entity.name}
                        <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
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
                  <p className="text-pretty">
                    {item.why}
                    <Writing on={writing && i === items.length - 1} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
});

export const generatedComponents = [note, plan, picks];
