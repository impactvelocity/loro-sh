/**
 * What the agent can do in a workspace. Reads run straight away; writes
 * (`needsApproval`) wait for the owner to approve them in the chat.
 *
 * Outputs are trimmed to what helps the model answer, with ids so it can
 * follow up and link to the admin page.
 *
 * The Qloo tools use the same client and ranking as a run's Taste step,
 * so what the agent finds for a segment or a person is what their
 * outcomes draw on.
 */
import { tool } from "ai";
import { z } from "zod";

import { experienceAnalytics, getAnalytics } from "./analytics.server";
import { ranges } from "./analytics";
import { questionsOf } from "./catalogue/flow";
import { partIds } from "./catalogue/define";
import { getCatalogue } from "./catalogue/registry";
import type { RecommendQuery } from "./catalogue/workflow";
import { listSkills, saveSkill } from "./context.server";
import { feedbackSummary } from "./feedback.server";
import { getFunnel, listFunnels } from "./funnels.server";
import { publicPath } from "./funnels";
import type { TasteSignal } from "./outcome/brief";
import { type PlaceCategory, placeCategoryIds, weights } from "./outcome/lookups";
import type { EntityType, TasteEntity } from "./outcome/state";
import { segmentInput } from "./people";
import { ageRanges, signalTypes, statusLabels } from "./profiles";
import {
  createSegment,
  funnelPeople,
  getPerson,
  getSegment,
  listGenerations,
  listPeople,
  listSegments,
  listSubmissions,
} from "./profiles.server";
import { qlooConnected, resolveEntity } from "./workflow/qloo.server";
import { recommend } from "./workflow/taste.server";
import type { Workspace } from "./workspaces";

const day = (seconds: number | null) => (seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : null);

const entityType = z.enum(Object.keys(signalTypes) as [EntityType, ...EntityType[]]);

const signal = z.object({
  type: entityType,
  name: z.string().describe("The artist, place, brand, film… as Qloo would know it."),
});

const notConnected = "Qloo isn't connected here: set the QLOO_API_KEY secret.";

/** Signals from a profile matched per call, like a run's Taste step. Each is a /search, one at a time. */
const MAX_SIGNALS = 12;

/** A Qloo entity with only the fields that say something. */
function entityOut(e: TasteEntity) {
  const out = {
    id: e.id,
    name: e.name,
    type: e.type,
    tags: e.tags,
    address: e.address,
    neighbourhood: e.neighbourhood,
    priceLevel: e.priceLevel,
    rating: e.rating,
    affinity: e.affinity,
    because: e.because,
    keywords: e.keywords,
    description: e.description?.slice(0, 160) ?? null,
  };
  return Object.fromEntries(
    Object.entries(out).filter(([, value]) => value !== null && !(Array.isArray(value) && value.length === 0)),
  );
}

/** A name to its Qloo entity, or why not. */
async function lookUp(name: string, type: EntityType | null, near?: string | null) {
  try {
    return { entity: await resolveEntity(name, type, near || null) };
  } catch (error) {
    console.error("agent qloo search", name, error);
    return { entity: null, failed: true };
  }
}

/** Tools that change the workspace. Demo workspaces are read-only, so they leave these out. */
export const writeTools = ["createSegment", "addSkill"] as const;

export function agentTools(workspace: Pick<Workspace, "id">) {
  const ws = workspace.id;

  return {
    listSegments: tool({
      description: "List the workspace's segments: audiences described once, with demographics and taste signals.",
      inputSchema: z.object({}),
      execute: async () =>
        (await listSegments(ws)).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          people: s.people,
          ages: s.ages.map((age) => ageRanges[age]),
          gender: s.gender,
          location: s.location,
          signals: s.signals.map((x) => `${signalTypes[x.type]}: ${x.name}`),
        })),
    }),

    getSegment: tool({
      description: "Read one segment and the people in it.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const segment = await getSegment(ws, id);
        if (!segment) return { error: `No segment with id "${id}".` };
        const members = await listPeople(ws, id);
        return {
          ...segment,
          updatedAt: day(segment.updatedAt),
          members: members.slice(0, 50).map((p) => ({ id: p.id, name: p.name, status: statusLabels[p.status], source: p.source })),
          membersShown: Math.min(members.length, 50),
        };
      },
    }),

    listPeople: tool({
      description: "List people (individual profiles), most recently active first. Optionally only one segment's.",
      inputSchema: z.object({
        segmentId: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
      execute: async ({ segmentId, limit }) => {
        const people = await listPeople(ws, segmentId);
        return {
          total: people.length,
          people: people.slice(0, limit).map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            segment: p.segmentName,
            source: p.source,
            status: statusLabels[p.status],
            location: p.location,
            lastActive: day(p.lastActiveAt ?? p.createdAt),
          })),
        };
      },
    }),

    getPerson: tool({
      description: "Read one person: their profile, taste signals, notes, intake answers and outcomes.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const person = await getPerson(ws, id);
        if (!person) return { error: `No person with id "${id}".` };
        const [submissions, generations] = await Promise.all([
          listSubmissions(ws, id),
          listGenerations(ws, { person: id }),
        ]);
        return {
          ...person,
          status: statusLabels[person.status],
          createdAt: day(person.createdAt),
          updatedAt: day(person.updatedAt),
          lastActiveAt: day(person.lastActiveAt),
          submissions: submissions.map((s) => ({
            experience: s.funnelName,
            slug: s.funnelSlug,
            status: s.status,
            answers: s.profile,
            at: day(s.updatedAt),
          })),
          outcomes: generations.map((g) => ({ id: g.id, experience: g.funnelSlug, status: g.status, at: day(g.updatedAt) })),
        };
      },
    }),

    listExperiences: tool({
      description: "List the workspace's experiences (start page, intake questions and outcome), with status and link.",
      inputSchema: z.object({}),
      execute: async () =>
        (await listFunnels(ws)).map((f) => ({
          slug: f.slug,
          name: f.name,
          status: f.status,
          catalogue: f.catalogue,
          parts: partIds.filter((part) => f.config.parts[part].enabled),
          link: publicPath(ws, f.slug),
          updatedAt: day(f.updatedAt),
        })),
    }),

    getExperience: tool({
      description:
        "Read one experience: its parts, intake questions, outcome sections, the last 30 days of numbers, feedback and who went through it.",
      inputSchema: z.object({ slug: z.string() }),
      execute: async ({ slug }) => {
        const funnel = await getFunnel(ws, slug);
        if (!funnel) return { error: `No experience with slug "${slug}".` };
        const catalogue = getCatalogue(funnel.catalogue)!;
        const [analytics, feedback, people] = await Promise.all([
          experienceAnalytics(ws, slug, new Date()),
          feedbackSummary(ws, slug),
          funnelPeople(ws, slug),
        ]);
        const { parts } = funnel.config;
        return {
          slug: funnel.slug,
          name: funnel.name,
          status: funnel.status,
          link: publicPath(ws, slug),
          start: parts.start.enabled ? parts.start.components.map((c) => c.type) : "off",
          intake: parts.intake.enabled ? questionsOf(catalogue, funnel.config) : "off",
          outcome: parts.artifact.components.map((c) => ({ type: c.type, title: c.props.title ?? c.props.heading })),
          last30Days: analytics.stats,
          feedback: {
            responses: feedback.total,
            average: feedback.average,
            comments: feedback.responses.filter((r) => r.comment).slice(0, 10).map((r) => ({ rating: r.rating, comment: r.comment })),
          },
          people: people.slice(0, 30).map((p) => ({ id: p.id, name: p.name, intake: p.submission, outcome: p.generation?.status ?? null })),
        };
      },
    }),

    getAnalytics: tool({
      description:
        "Workspace analytics for a range: page views, new profiles, intake completion and outcomes, split by source (sign-up, triggered, owner-created), with the previous period and latest activity.",
      inputSchema: z.object({ range: z.enum(Object.keys(ranges) as [keyof typeof ranges]).default("30d") }),
      execute: async ({ range }) => {
        const analytics = await getAnalytics(ws, range, new Date());
        return {
          range,
          totals: analytics.totals,
          previous: analytics.previous,
          funnel: analytics.funnel,
          latestActivity: analytics.activity.slice(0, 15).map((a) => ({
            person: a.name,
            personId: a.personId,
            event: a.event,
            experience: a.experience,
            at: day(a.at),
          })),
        };
      },
    }),

    listSkills: tool({
      description: "List the workspace's skills: instructions in Context that outcome generation follows when they apply.",
      inputSchema: z.object({}),
      execute: async () => (await listSkills(ws)).map(({ id, title, description }) => ({ id, title, description })),
    }),

    searchQloo: tool({
      description:
        "Look names up in Qloo, the taste engine behind every outcome. Check an artist, place, brand, film… exists there before you suggest it as a signal, and use the name Qloo knows it by. Places come with an address.",
      inputSchema: z.object({
        names: z
          .array(z.object({ name: z.string(), type: entityType.optional().describe("Leave out to take the best match of any type.") }))
          .min(1)
          .max(MAX_SIGNALS),
        near: z.string().optional().describe("A city, to find the right place, e.g. 'Austin, TX'."),
      }),
      execute: async ({ names, near }) => {
        if (!qlooConnected()) return { error: notConnected };
        const results = [];
        for (const { name, type } of names) {
          const { entity, failed } = await lookUp(name, type ?? null, near);
          results.push({ asked: name, found: entity ? entityOut(entity) : null, ...(failed && { note: "Qloo didn't answer." }) });
        }
        return { found: results.filter((r) => r.found).length, results };
      },
    }),

    recommendWithQloo: tool({
      description:
        "Ask Qloo what fits a taste: things of one type ranked for a segment, a person or a few favourites, with the signals that pulled each one up. With a segment or person it ranks the way their outcomes do: their signals as favourites and the segment's ages and gender as demographics. Places need a city, or a venue or landmark to look around.",
      inputSchema: z.object({
        type: entityType.describe("What to find."),
        segmentId: z.string().optional().describe("Steer by this segment's signals and demographics."),
        personId: z.string().optional().describe("Steer by this person's signals and their segment's."),
        favourites: z
          .array(signal.extend({ weight: z.enum(["low", "medium", "high"]).default("high") }))
          .max(8)
          .default([])
          .describe("More names to steer by."),
        city: z.string().optional().describe("Places: the city to look in. Other types: ranks by what's popular there when nothing else steers."),
        nearPlace: z.string().optional().describe("Places: a venue, hotel or landmark to look around, e.g. 'Moody Center'. Give the city too."),
        radiusKm: z.number().min(0.2).max(50).default(2),
        kinds: z.array(z.enum(placeCategoryIds as [PlaceCategory, ...PlaceCategory[]])).max(4).default([]).describe("Places: kinds to look for."),
        popularity: z.enum(["any", "known", "lesser"]).default("any"),
        priceMax: z.number().int().min(1).max(4).optional().describe("Places: 1–4, like dollar signs."),
        ages: z.array(z.enum(Object.keys(ageRanges) as [keyof typeof ageRanges])).optional().describe("Instead of the segment's."),
        gender: z.enum(["any", "female", "male"]).optional().describe("Instead of the segment's."),
        take: z.number().int().min(1).max(25).default(10),
      }),
      execute: async (input) => {
        if (!qlooConnected()) return { error: notConnected };
        const person = input.personId ? await getPerson(ws, input.personId) : null;
        if (input.personId && !person) return { error: `No person with id "${input.personId}".` };
        const segmentId = input.segmentId ?? person?.segmentId;
        const segment = segmentId ? await getSegment(ws, segmentId) : null;
        if (input.segmentId && !segment) return { error: `No segment with id "${input.segmentId}".` };

        const city = input.city?.trim() || segment?.location || person?.location || "";
        if (input.type === "place" && !city && !input.nearPlace) {
          return { error: "Places need a city or a place to look around." };
        }

        // The person's own come first, so a big segment can't crowd them out.
        const seen = new Set<string>();
        const wanted = [
          ...(person?.signals ?? []).map((s) => ({ ...s, from: "person" as const, near: person!.location })),
          ...(segment?.signals ?? []).map((s) => ({ ...s, from: "segment" as const, near: segment!.location })),
        ]
          .filter((s) => {
            const key = `${s.type}:${s.name.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, MAX_SIGNALS);
        const signals: TasteSignal[] = [];
        for (const s of wanted) {
          const { entity } = await lookUp(s.name, s.type, s.near);
          signals.push({ name: entity?.name ?? s.name, type: s.type, from: s.from, id: entity?.id ?? null });
        }
        const favourites = [];
        for (const f of input.favourites) {
          const { entity } = await lookUp(f.name, f.type, input.city);
          favourites.push({ ...f, name: entity?.name ?? f.name, id: entity?.id ?? null });
        }

        let near: RecommendQuery["near"] = city || undefined;
        let note: string | undefined;
        if (input.type === "place" && input.nearPlace) {
          const { entity } = await lookUp(input.nearPlace, "place", city);
          if (entity?.location) near = { ...entity.location, radiusKm: input.radiusKm };
          else note = `Qloo doesn't know "${input.nearPlace}", so this looked across ${city || "everywhere"}.`;
        }

        const ages = input.ages ?? segment?.ages ?? [];
        const gender = input.gender ?? segment?.gender ?? "any";
        const results = await recommend(
          {
            type: input.type,
            near,
            kinds: input.type === "place" ? input.kinds : undefined,
            take: input.take,
            popularity: input.popularity,
            priceMax: input.type === "place" ? input.priceMax : undefined,
            entities: favourites.flatMap((f) => (f.id ? [{ id: f.id, weight: weights[f.weight], name: f.name }] : [])),
          },
          { signals, ages, gender: gender === "any" ? null : gender, location: city || null },
        );

        const steered = [...signals, ...favourites.map((f) => ({ ...f, from: "chat" }))];
        if (!steered.some((s) => s.id) && !note) {
          note = `Nothing matched to steer by, so these are ranked by what's popular${city ? ` in ${city}` : ""}.`;
        }
        return {
          for: [person?.name, segment?.name].filter(Boolean).join(", ") || null,
          steeredBy: steered.map((s) => ({ name: s.name, type: s.type, from: s.from, matched: Boolean(s.id) })),
          demographics: { ages: ages.map((age) => ageRanges[age]), gender },
          where: typeof near === "string" ? near : near ? `${input.radiusKm} km around ${input.nearPlace}` : null,
          ...(note && { note }),
          results: results.map(entityOut),
        };
      },
    }),

    createSegment: tool({
      description: "Create a segment. The owner approves it in the chat before it's saved.",
      inputSchema: segmentInput.pick({ name: true }).extend({
        description: z.string().describe("Who they are, in a sentence or two."),
        ages: z.array(z.enum(Object.keys(ageRanges) as [keyof typeof ageRanges])).default([]),
        gender: z.enum(["any", "female", "male"]).default("any"),
        location: z.string().default(""),
        signals: z.array(signal).max(20).default([]),
      }),
      needsApproval: true,
      execute: async (input) => {
        const id = await createSegment(ws, input);
        return { saved: "Approved by the owner and saved.", id, link: `/admin/profiles/segments/${id}` };
      },
    }),

    addSkill: tool({
      description:
        "Add a skill to Context: a title, then what to do and when to use it. The owner approves it in the chat before it's saved.",
      inputSchema: z.object({
        title: z.string().max(80),
        description: z.string().max(2000).describe("What to do, then when it applies."),
      }),
      needsApproval: true,
      execute: async (input) => {
        const skill = await saveSkill(ws, input);
        if (!skill) return { error: "A skill needs a title and a description." };
        return { saved: "Approved by the owner and saved.", id: skill.id, link: "/admin/context" };
      },
    }),
  };
}
