/**
 * Writes one generated section: its component's schema, filled by the
 * model from the profile, the Taste brief, its own Qloo candidates and
 * what earlier sections already said, streamed to the page as it goes.
 *
 * The page can only show real things: any `entity` field that isn't one
 * of the section's candidates is dropped, along with the item it's in.
 */
import { Output, generateText, streamText } from "ai";

import type { BlockConfig } from "../catalogue/config";
import type { GeneratedDefinition } from "../catalogue/define";
import { outcomeModel, outcomeOptions } from "../ai.server";
import type { TasteBrief } from "../outcome/brief";
import type { TasteEntity } from "../outcome/state";
import { type SkillNote, skillsText } from "./context.server";

/** What a later section is told about an earlier one. */
export type EarlierSection = { label: string; summary: string };

/** For sections that recommend (`picks`). Given to one that doesn't, models put \`entity\` ids in its prose. */
const PICK_RULES = `- Recommend only from the candidates below, pointing at each by its id in an \`entity\` field. Never name a business, venue, artist, film or product that isn't a candidate.
- Facts (addresses, prices, opening times, what's on the menu) come only from the candidate data. If you don't know, leave it out.
- Say why each pick fits this person, using what they told us and their taste. One reason they'd recognise beats three generic ones.`;

const NO_PICK_RULES = `- Don't recommend businesses, places or artists: sections with candidates do that. Write plain prose, with no ids or JSON in it.`;

const RULES = `Rules:
- Write to them directly ("you"), like a friend who knows the place well: specific, plain and warm. Short sentences, with contractions (it's, you'll), the way people talk.
- Never use: vibe, vibrant, hidden gem, curated, elevate, unforgettable, nestled, bustling, must-visit, delve, tapestry, perfect for, low-key. No exclamation marks, no emoji.
- Don't repeat what earlier sections said or recommend what they already picked.
- The team's notes steer you. Never quote or mention them.`;

function candidateLine(entity: TasteEntity) {
  const facts = [
    entity.type,
    entity.neighbourhood,
    entity.address,
    entity.priceLevel ? "$".repeat(entity.priceLevel) : null,
    entity.rating ? `${entity.rating}★` : null,
    entity.tags.length ? `tags: ${entity.tags.join(", ")}` : null,
    entity.keywords.length ? `people mention: ${entity.keywords.join(", ")}` : null,
    entity.because.length ? `fits because they like ${entity.because.join(", ")}` : null,
  ].filter(Boolean);
  return `- id ${entity.id}: ${entity.name} (${facts.join("; ")})${entity.description ? `\n  ${entity.description}` : ""}`;
}

/**
 * What this section may recommend: the results of the lookups it picked,
 * unused ones first, alternating between lookups so it gets a mix.
 */
export function candidatesFor(
  definition: GeneratedDefinition<any, any>,
  block: BlockConfig,
  brief: TasteBrief,
  used: Set<string>,
): TasteEntity[] {
  const take = definition.generate.picks?.(block.props) ?? 0;
  const lists = ((block.props.lookups as string[]) ?? []).map((id) => (brief.pools[id] ?? []).filter((e) => !used.has(e)));
  const out = new Set<string>();
  for (let i = 0; out.size < take && lists.some((list) => i < list.length); i++) {
    for (const list of lists) if (list[i] && out.size < take) out.add(list[i]);
  }
  return [...out].flatMap((id) => brief.entities[id] ?? []);
}

/**
 * Points every `entity` field at a candidate's id, or drops the item it's
 * in. Models sometimes lower-case an id or write the name instead, so
 * both are matched back to the id.
 */
export function checkEntities(value: unknown, candidates: TasteEntity[], used: Set<string>): unknown {
  const lookup = new Map<string, string>();
  for (const entity of candidates) {
    lookup.set(entity.id.toLowerCase(), entity.id);
    lookup.set(entity.name.trim().toLowerCase(), entity.id);
  }
  const resolve = (id: unknown) => (typeof id === "string" ? (lookup.get(id.trim().toLowerCase()) ?? null) : null);

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      // An unknown entity drops its item, and so does a repeat within the same list.
      const seen = new Set<string>();
      return node
        .filter((item) => {
          if (!(item && typeof item === "object" && "entity" in item)) return true;
          const id = resolve((item as { entity: unknown }).entity);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map(walk);
    }
    if (node && typeof node === "object") {
      return Object.fromEntries(
        Object.entries(node).map(([key, item]) => {
          if (key !== "entity") return [key, walk(item)];
          const id = resolve(item);
          if (id) used.add(id);
          return [key, id ?? ""];
        }),
      );
    }
    return node;
  };
  return walk(value);
}

/** One line per earlier section, so the next knows what's been said. */
export function summarize(data: unknown, entities: Record<string, TasteEntity>) {
  const text = JSON.stringify(data, (key, value) =>
    key === "entity" && typeof value === "string" ? (entities[value]?.name ?? value) : value,
  );
  return text.length > 700 ? `${text.slice(0, 700)}…` : text;
}

export async function writeSection({
  definition,
  block,
  label,
  brief,
  brand,
  firstName,
  skills,
  earlier,
  candidates,
  extra,
  onPartial,
}: {
  definition: GeneratedDefinition<any, any>;
  block: BlockConfig;
  label: string;
  brief: TasteBrief;
  brand: string;
  firstName: string;
  skills: SkillNote[];
  earlier: EarlierSection[];
  /** From candidatesFor: what it may recommend. */
  candidates: TasteEntity[];
  /** Output of "after-taste" code steps, by id. */
  extra: Record<string, unknown>;
  onPartial: (data: unknown) => void;
}) {
  const picks = Boolean(definition.generate.picks);
  const prompt = block.props.prompt;

  const effort = definition.generate.effort?.(block.props);
  const result = streamText({
    ...outcomeOptions,
    ...(effort && { providerOptions: { ...outcomeOptions.providerOptions, anthropic: { effort } } }),
    model: outcomeModel(),
    output: Output.object({ schema: definition.generate.schema(block.props), name: definition.type }),
    instructions: [
      `You write one section of a personalised page ${brand} makes for one person${firstName ? `, ${firstName}` : ""}. The section is "${label}".`,
      RULES.replace("Rules:\n", `Rules:\n${picks ? PICK_RULES : NO_PICK_RULES}\n`),
      skillsText(skills),
    ]
      .filter(Boolean)
      .join("\n\n"),
    prompt: [
      `# Who it's for\n${brief.profile}`,
      `# Their taste\n${brief.summary}${brief.angles.length ? `\nAngles: ${brief.angles.join("; ")}` : ""}`,
      Object.keys(extra).length ? `# Other context\n${JSON.stringify(extra)}` : "",
      earlier.length ? `# Already on the page\n${earlier.map((e) => `- ${e.label}: ${e.summary}`).join("\n")}` : "",
      picks
        ? `# Candidates\n${candidates.map(candidateLine).join("\n")}`
        : "",
      `# This section\n${definition.generate.instructions(block.props)}${typeof prompt === "string" && prompt.trim() ? `\n\nFrom the team: ${prompt.trim()}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    maxOutputTokens: definition.generate.maxOutputTokens?.(block.props) ?? 2500,
  });

  for await (const partial of result.partialOutputStream) onPartial(partial);
  let output = await result.output;
  const slips = bannedIn(output, [RULES, ...skills.map((skill) => skill.description)]);
  if (slips.length) {
    output = await editOut(slips, output, definition, block, skills).catch(() => output);
    onPartial(output);
  }
  const sectionUsed = new Set<string>();
  const data = checkEntities(output, candidates, sectionUsed);
  if (JSON.stringify(data) !== JSON.stringify(output)) console.warn("section", block.id, "entity fixes", JSON.stringify(output).slice(0, 400));
  return { data, used: [...sectionUsed] };
}

/**
 * Phrases the rules and skills ban ("Never write: lane, vibe, …"). Models
 * still slip them in, so a section that uses one gets a quick edit pass.
 */
function bannedPhrases(texts: string[]) {
  const phrases = new Set<string>();
  for (const text of texts) {
    for (const [, list] of text.matchAll(/Never (?:write|use)(?: them)?:\s*([^\n]+)/gi)) {
      for (const phrase of list.replace(/\.\s.*$|\.$/, "").split(",")) {
        const clean = phrase.trim().toLowerCase();
        if (clean.length > 2) phrases.add(clean);
      }
    }
  }
  return [...phrases];
}

/** Banned phrases in the prose of an output. Single-word strings are ids and enum values, so they're skipped. */
function bannedIn(output: unknown, texts: string[]) {
  const prose: string[] = [];
  JSON.stringify(output, (_key, value) => {
    if (typeof value === "string" && value.includes(" ")) prose.push(value);
    return value;
  });
  const text = prose.join("\n");
  return bannedPhrases(texts).filter((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(phrase.startsWith("-") ? escaped : `\\b${escaped}\\b`, "i").test(text);
  });
}

async function editOut(
  slips: string[],
  output: unknown,
  definition: GeneratedDefinition<any, any>,
  block: BlockConfig,
  skills: SkillNote[],
) {
  const { output: edited } = await generateText({
    ...outcomeOptions,
    model: outcomeModel(),
    output: Output.object({ schema: definition.generate.schema(block.props), name: definition.type }),
    instructions: [
      `You edit one section of a page. It uses words its rules ban: ${slips.map((s) => `"${s}"`).join(", ")}. ` +
        "Rewrite only the sentences with those words, saying the same thing in plain, specific words. " +
        "Keep every other sentence, every field and every id exactly as it is.",
      skillsText(skills),
    ]
      .filter(Boolean)
      .join("\n\n"),
    prompt: JSON.stringify(output),
    maxOutputTokens: definition.generate.maxOutputTokens?.(block.props) ?? 2500,
  });
  return edited;
}
