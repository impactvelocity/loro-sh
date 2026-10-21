/**
 * A code step for venues: reads the month's shows from the venue's events
 * API, then ranks every one for this person in Qloo, after Taste, so the
 * outcome only ever recommends shows that are really on.
 *
 * 1. The shows: GET the events API (JSON, `{ events: [...] }` in the shape
 *    of catalogues/venue/programme.ts `venueEvent`), or the demo
 *    programme when no API is set. Only the next `days` days are kept.
 * 2. Every show is about one thing Qloo knows (its subject: the band, the
 *    film, the podcast). Subjects without a Qloo id are found by name.
 * 3. One Qloo call per type scores every subject against their taste
 *    (`filter.results.entities`). Qloo leaves out what they named
 *    themselves, so those, and anything they've seen here, are must-sees.
 * 4. Each show is checked against what they said: the kinds of night,
 *    the nights they're free, what they'll spend.
 *
 * Every show becomes a candidate (must-sees, then best fit), so a section
 * can put any of them on the page. The month goes to every section as
 * context, and to the page as public data, which is how the calendar and
 * the ticket details show.
 */
import { CalendarDaysIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f } from "@core/catalogue/fields";
import type { EntityType, TasteEntity } from "@core/outcome/state";
import {
  type Programme,
  type ProgrammeEvent,
  type VenueEvent,
  addDays,
  budgetOf,
  byDate,
  clock,
  dateLabel,
  demoProgramme,
  eventKinds,
  eventStatuses,
  kindsOf,
  localToday,
  nightsOf,
  price,
  qlooImage,
  sampleProgramme,
  venueEvent,
  weekday,
} from "../catalogues/venue/programme";

/** Subjects looked up by name per run, at most: each is a Qloo call. */
const MAX_SEARCHES = 12;

/** The shows from the venue's events API. Anything that doesn't fit the shape is skipped. */
async function fetchEvents(url: string): Promise<VenueEvent[]> {
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`The events API answered ${response.status}`);
  const body = (await response.json()) as unknown;
  const list = Array.isArray(body) ? body : ((body as { events?: unknown[] } | null)?.events ?? []);
  return list.flatMap((item) => {
    const parsed = venueEvent.safeParse(item);
    return parsed.success ? [parsed.data as VenueEvent] : [];
  });
}

const words = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

/** A name in a free-text answer, as a whole phrase. */
const mentions = (answer: string, name: string) => Boolean(name.trim()) && ` ${words(answer)} `.includes(` ${words(name)} `);

const text = (answer: unknown) => (Array.isArray(answer) ? answer.join(", ") : typeof answer === "string" ? answer : "");

export default defineStep({
  type: "programme",
  name: "What's On",
  description: "Reads the next month's shows from the venue's events API and ranks every one for this person in Qloo.",
  icon: CalendarDaysIcon,
  at: "after-taste",
  provides: "artist",
  required: true,
  fields: {
    url: f.text({
      label: "Events API",
      placeholder: "https://boxoffice.example.com/api/events",
      help: "Returns { events: [...] }: id, title, kind, date, start, price and status for each show. Empty: the demo programme.",
    }),
    venue: f.text({ label: "Venue", default: "The Wren" }),
    tickets: f.text({
      label: "Ticket link",
      placeholder: "https://boxoffice.example.com/events/{{id}}",
      help: "For shows the API sends without a link, and the demo month. {{id}} is the show's id.",
    }),
    timeZone: f.text({ label: "Time zone", default: "America/Vancouver", help: "Where the venue is, so the month starts tomorrow there." }),
    days: f.number({ label: "Days ahead", default: 30, min: 7, max: 60 }),
    seen: f.text({ label: "Seen here", default: "seen", help: "The question, or API answer, listing shows they've been to here." }),
    kinds: f.text({ label: "Kinds of night", default: "nights", help: "The question on gigs, films, comedy, dance nights or podcasts." }),
    nights: f.text({ label: "Free on", default: "when", help: "The question on which nights they can do." }),
    budget: f.text({ label: "Spend", default: "budget", help: "The question on ticket price. A dollar amount in the answer counts." }),
  },
  sample: () => sampleProgramme(),
  async run(props, ctx) {
    // 1. The shows.
    const today = localToday(props.timeZone || "America/Vancouver");
    const from = addDays(today, 1);
    const to = addDays(today, props.days);
    const source = props.url.trim() ? "api" : "demo";
    if (source === "api") await ctx.report(`Reading what's on at ${props.venue}`);
    const all = source === "api" ? await fetchEvents(props.url.trim()) : demoProgramme(today);
    const link = (event: VenueEvent) => event.url || (props.tickets.trim() ? props.tickets.trim().replaceAll("{{id}}", encodeURIComponent(event.id)) : "");
    const shows = all
      .filter((event) => event.date >= from && event.date <= to)
      .map((event) => ({ ...event, url: link(event) }))
      .toSorted(byDate);
    if (!shows.length) return { skipped: true, message: `Nothing on at ${props.venue} in the next ${props.days} days` };

    // 2. A Qloo id for every subject: the show's own, or found by name.
    const subjectOf = (event: VenueEvent) => event.subject || event.title;
    const ids = new Map(shows.map((event) => [event.id, event.qloo.trim()]));
    const entities = new Map<string, TasteEntity>();
    const unknown = shows.filter((event) => !event.qloo.trim()).slice(0, MAX_SEARCHES);
    if (unknown.length && ctx.qloo.connected) await ctx.report(`Finding ${unknown.length} shows in Qloo`);
    for (const event of ctx.qloo.connected ? unknown : []) {
      const hit = await ctx.qloo.search(subjectOf(event), event.type).catch(() => null);
      if (!hit) continue;
      ids.set(event.id, hit.id);
      entities.set(hit.id, hit);
    }

    // 3. Must-sees: what they named, and what they've seen here.
    const seen = text(ctx.answers[props.seen]);
    const signals = ctx.brief?.signals ?? [];
    const seenHere = new Set(shows.filter((event) => mentions(seen, subjectOf(event))).map((event) => event.id));
    const named = new Set(
      shows
        .filter((event) => seenHere.has(event.id) || signals.some((s) => (s.id && s.id === ids.get(event.id)) || words(s.name) === words(subjectOf(event))))
        .map((event) => event.id),
    );

    // Then everything else, one Qloo call per type.
    await ctx.report(`Ranking ${shows.length} shows against your taste`);
    const types = [...new Set(shows.map((event) => event.type))] as EntityType[];
    for (const type of ctx.qloo.connected ? types : []) {
      const only = [...new Set(shows.filter((event) => event.type === type).map((event) => ids.get(event.id)).filter((id): id is string => Boolean(id)))];
      const ranked = await ctx.qloo.recommend({ type, only: only.slice(0, 50), take: 50 }).catch(() => [] as TasteEntity[]);
      for (const entity of ranked) entities.set(entity.id, entity);
    }

    // 4. What they said: the kinds of night, the nights they're free, what they'll spend.
    const kinds = kindsOf(ctx.answers[props.kinds]);
    const nights = nightsOf(ctx.answers[props.nights]);
    const budget = budgetOf(ctx.answers[props.budget]);
    const events = shows.map((event): ProgrammeEvent => {
      const entity = entities.get(ids.get(event.id) ?? "");
      return {
        ...event,
        subject: subjectOf(event),
        qloo: ids.get(event.id) ?? "",
        match: entity?.affinity ?? null,
        named: named.has(event.id),
        seen: seenHere.has(event.id),
        fits: {
          kind: kinds.includes(event.kind),
          night: nights.includes(weekday(event.date)),
          price: budget == null || event.price == null || event.price <= budget,
        },
        image: entity?.image ?? qlooImage(ids.get(event.id) ?? ""),
        because: entity?.because ?? [],
      };
    });

    // Best first: must-sees, then Qloo's match, marked down for what doesn't fit them.
    const score = (event: ProgrammeEvent) =>
      (event.named ? 2 : 0) +
      (event.match ?? 0) *
        (event.fits.kind ? 1 : 0.7) *
        (event.fits.night ? 1 : 0.8) *
        (event.fits.price ? 1 : 0.8) *
        (event.status === "sold-out" ? 0.5 : 1);
    const ranked = events.toSorted((a, b) => score(b) - score(a));

    const candidates = ranked.map((event): TasteEntity => {
      const entity = entities.get(event.qloo);
      return {
        id: event.id,
        name: event.title,
        type: event.type,
        image: event.image,
        tags: [eventKinds[event.kind].one, event.format, ...(entity?.tags ?? []).slice(0, 4)].filter(Boolean),
        address: null,
        neighbourhood: null,
        website: event.url || null,
        priceLevel: null,
        rating: null,
        description: entity?.description ?? null,
        keywords: entity?.keywords ?? [],
        affinity: event.match,
        because: event.because,
      };
    });

    const programme: Programme = { venue: props.venue, timeZone: props.timeZone || "America/Vancouver", from, to, source, events };
    const matched = events.filter((event) => event.match != null).length;
    return {
      candidates,
      data: programme,
      output: {
        venue: props.venue,
        month: `${dateLabel(from)} to ${dateLabel(to)}`,
        today: dateLabel(today),
        theyWant: kinds.length === Object.keys(eventKinds).length ? "any kind of night" : kinds.map((kind) => eventKinds[kind].label),
        maxTicket: budget == null ? "any price" : `$${budget}`,
        // Best first, by Qloo's match and what they said; sold-out shows only if they named them.
        shortlist: ranked
          .filter((event) => event.status !== "sold-out" || event.named)
          .slice(0, 8)
          .map((event) => event.id),
        shows: ranked.map((event) => ({
          id: event.id,
          title: event.title,
          about: event.subject !== event.title ? event.subject : undefined,
          kind: eventKinds[event.kind].one,
          when: `${dateLabel(event.date)}, ${event.doors && event.doors !== event.start ? `doors ${clock(event.doors)}, ` : ""}starts ${clock(event.start)}`,
          ticket: `${price(event)}, ${eventStatuses[event.status].toLowerCase()}`,
          format: event.format || undefined,
          age: event.age || undefined,
          match: event.match,
          theyNamedIt: (event.named && !event.seen) || undefined,
          theySawItHereBefore: event.seen || undefined,
          notAKindTheyPicked: !event.fits.kind || undefined,
          notANightTheyCanDo: !event.fits.night || undefined,
          overBudget: !event.fits.price || undefined,
          because: event.because.length ? event.because : undefined,
        })),
      },
      message: `${events.length} shows ${source === "demo" ? "in the demo month" : "on"}${matched ? ` · ranked ${matched} for you` : ""}${named.size ? ` · ${named.size} you named` : ""}`,
    };
  },
});
