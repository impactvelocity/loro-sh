/**
 * What the agent can do in a workspace. Reads run straight away; writes
 * (`needsApproval`) wait for the owner to approve them in the chat.
 *
 * Outputs are trimmed to what helps the model answer, with ids so it can
 * follow up and link to the admin page.
 */
import { tool } from "ai";
import { z } from "zod";

import { experienceAnalytics, getAnalytics } from "./analytics.server";
import { ranges } from "./analytics";
import { questionsOf } from "./catalogue/flow";
import { partIds } from "./catalogue/define";
import { getCatalogue } from "./catalogue/registry";
import { listSkills, saveSkill } from "./context.server";
import { feedbackSummary } from "./feedback.server";
import { getFunnel, listFunnels } from "./funnels.server";
import { publicPath } from "./funnels";
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
import type { Workspace } from "./workspaces";

const day = (seconds: number | null) => (seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : null);

const signal = z.object({
  type: z.enum(Object.keys(signalTypes) as [keyof typeof signalTypes, ...(keyof typeof signalTypes)[]]),
  name: z.string().describe("The artist, place, brand, film… as Qloo would know it."),
});

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
