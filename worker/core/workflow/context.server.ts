/**
 * What a run is written from, besides Qloo: the brand, the person, their
 * segment and the workspace's skills. Loaded once per run, then turned
 * into the profile text every model call reads.
 *
 * The layers go brand → experience → segment → individual, and the person's
 * own answers and notes come last, so they win where they disagree.
 */
import type { ExperienceConfig } from "../catalogue/config";
import type { Answers, Person, ProfileRow } from "../catalogue/define";
import { listSkills } from "../context.server";
import { getPerson, getSegment } from "../profiles.server";
import { ageRanges } from "../profiles";
import { workspaceSubtitle } from "../workspaces";
import { findWorkspace } from "../workspaces.server";

/** What starts a run. Plain JSON: it's the workflow's payload. */
export type OutcomeParams = {
  workspaceId: string;
  /** gen-… for a person's outcome, test-… for a test from the admin. */
  runId: string;
  test: boolean;
  funnel: { slug: string; name: string };
  /** The experience as it was when the run started, so saving mid-run changes nothing. */
  config: ExperienceConfig;
  person: Person & { id: string | null };
  answers: Answers;
  profile: ProfileRow[];
  /** The outcome page, for webhooks and emails. */
  outcomeUrl: string | null;
};

export type SkillNote = { id: string; title: string; description: string };

export type RunContext = {
  brand: { name: string; about: string };
  person: { notes: string; location: string; signals: { type: string; name: string }[] } | null;
  segment: {
    name: string;
    description: string;
    ages: string[];
    gender: "any" | "female" | "male";
    location: string;
    signals: { type: string; name: string }[];
  } | null;
  skills: SkillNote[];
};

export async function loadRunContext(params: OutcomeParams): Promise<RunContext> {
  const [workspace, record, skills] = await Promise.all([
    findWorkspace(params.workspaceId),
    params.person.id ? getPerson(params.workspaceId, params.person.id) : null,
    listSkills(params.workspaceId),
  ]);
  const segment = record?.segmentId ? await getSegment(params.workspaceId, record.segmentId) : null;
  return {
    brand: {
      name: workspace?.name ?? "the brand",
      about: [workspace?.tagline, workspace ? workspaceSubtitle(workspace) : ""].filter(Boolean).join(" · "),
    },
    person: record
      ? {
          notes: record.notes,
          location: record.location,
          signals: record.signals.map(({ type, name }) => ({ type, name })),
        }
      : null,
    segment: segment
      ? {
          name: segment.name,
          description: segment.description,
          ages: segment.ages,
          gender: segment.gender,
          location: segment.location,
          signals: segment.signals,
        }
      : null,
    skills: skills.map(({ id, title, description }) => ({ id, title, description })),
  };
}

/** The person as every model call reads them. Holds owner notes, so it never goes to the page. */
export function profileText(params: OutcomeParams, context: RunContext, notes: string[]) {
  const { person, answers, profile, config } = params;
  const sections: string[] = [];
  sections.push(`Brand: ${context.brand.name}${context.brand.about ? ` (${context.brand.about})` : ""}`);
  sections.push(
    `Experience: ${config.name}${config.workflow.prompt.trim() ? `\n${config.workflow.prompt.trim()}` : ""}`,
  );
  if (context.segment) {
    const s = context.segment;
    const ages = s.ages.map((age) => ageRanges[age as keyof typeof ageRanges] ?? age).join(", ");
    sections.push(
      [
        `Their segment: ${s.name}`,
        s.description,
        ages && `Ages: ${ages}`,
        s.gender !== "any" && `Gender: ${s.gender}`,
        s.location && `Based in: ${s.location}`,
        s.signals.length > 0 && `Segment taste: ${s.signals.map((x) => `${x.name} (${x.type})`).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const answered = profile.filter((row) => row.answer);
  sections.push(
    [
      `The person: ${person.name || "Unknown name"}`,
      context.person?.location && `Lives in: ${context.person.location}`,
      context.person?.signals.length &&
        `Their own taste: ${context.person.signals.map((x) => `${x.name} (${x.type})`).join(", ")}`,
      answered.length > 0
        ? `What they told us:\n${answered.map((row) => `- ${row.question} ${row.answer}`).join("\n")}`
        : "",
      // Answers saved under keys the intake no longer asks.
      ...Object.entries(answers)
        .filter(([id, value]) => !profile.some((row) => row.id === id) && value !== null && value !== "")
        .map(([id, value]) => `- ${id}: ${Array.isArray(value) ? value.join(", ") : value}`),
    ]
      .filter(Boolean)
      .join("\n"),
  );
  if (context.person?.notes) sections.push(`Notes from the team (private, never quote them): ${context.person.notes}`);
  if (notes.length) sections.push(`Also known:\n${notes.map((note) => `- ${note}`).join("\n")}`);
  return sections.join("\n\n");
}

/** Skill ids to their text, in the order given, skipping any since deleted. */
export function skillsFor(context: RunContext, ids: string[]) {
  const byId = new Map(context.skills.map((skill) => [skill.id, skill]));
  return [...new Set(ids)].flatMap((id) => byId.get(id) ?? []);
}

export function skillsText(skills: SkillNote[]) {
  if (!skills.length) return "";
  return `Skills to follow:\n${skills.map((skill) => `## ${skill.title}\n${skill.description}`).join("\n\n")}`;
}
