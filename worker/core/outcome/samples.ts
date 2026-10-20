/**
 * Real Qloo entities for editor previews, so a generated component's
 * `sample` can point at something that looks like a live run. Pulled
 * from Qloo for someone who likes Khruangbin, around Austin, TX.
 *
 * Also the preview run itself: every generated section in one state, so
 * a catalogue designer can see pending, generating, done and error
 * without running the workflow.
 */
import type { DeepPartial } from "ai";

import type { ExperienceConfig } from "../catalogue/config";
import type { Catalogue } from "../catalogue/define";
import { getStep } from "../catalogue/workflow";
import { planRun } from "./plan";
import type { RunState, StepStatus, TasteEntity } from "./state";

const place = (
  entity: Pick<TasteEntity, "id" | "name" | "image" | "address" | "neighbourhood" | "website" | "description"> &
    Partial<TasteEntity>,
): TasteEntity => ({
  type: "place",
  tags: [],
  priceLevel: null,
  rating: null,
  keywords: [],
  affinity: null,
  because: ["Khruangbin"],
  ...entity,
});

const artist = (entity: Pick<TasteEntity, "id" | "name" | "image" | "description" | "tags">): TasteEntity => ({
  type: "artist",
  address: null,
  neighbourhood: null,
  website: null,
  priceLevel: null,
  rating: null,
  keywords: [],
  affinity: null,
  because: ["Khruangbin"],
  ...entity,
});

export const sampleEntities: Record<string, TasteEntity> = Object.fromEntries(
  [
    place({
      id: "07217A01-7409-4418-9E9B-C72BAD947F16",
      name: "Café No Sé",
      image: "https://images.qloo.com/i/07217A01-7409-4418-9E9B-C72BAD947F16-1HBksn-420x-outside.jpg",
      address: "1603 S Congress Ave Austin, TX 78704",
      neighbourhood: "Travis Heights",
      website: "https://cafenoseaustin.com/",
      description: "Hotel café on South Congress with seasonal brunch, coffee and a patio.",
      tags: ["Cafe", "Rustic modern", "Charming"],
      keywords: ["brunch", "avocado toast"],
      priceLevel: 2,
      rating: 4.4,
      affinity: 0.83,
    }),
    place({
      id: "27FECE33-87FF-42C4-AEF9-B9C1B6CE503D",
      name: "Palomino Coffee",
      image: "https://images.qloo.com/i/27FECE33-87FF-42C4-AEF9-B9C1B6CE503D-3Q61eY-420x-outside.jpg",
      address: "4136 E 12th St Austin, TX 78721",
      neighbourhood: "MLK",
      website: "https://palominocoffee.com/",
      description: "Community coffee shop and market with seasonal drinks and kolaches.",
      tags: ["Coffee shop", "Welcoming"],
      keywords: ["kolaches", "plants", "outdoor seating"],
      priceLevel: 1,
      rating: 4.5,
      affinity: 0.85,
    }),
    place({
      id: "45DFCAED-B89E-4CE8-819A-8C83EB234BB9",
      name: "End of An Ear",
      image: "https://images.qloo.com/i/45DFCAED-B89E-4CE8-819A-8C83EB234BB9-4aR5Vz-420x-outside.jpg",
      address: "4304 Clawson Rd Austin, TX 78704",
      neighbourhood: "South Lamar",
      website: "http://endofanear.com/",
      description: "South Austin shop with new, vintage and rare vinyl.",
      tags: ["Record store", "Eclectic"],
      keywords: ["vinyl selection", "cassettes"],
      rating: 4.8,
      affinity: 0.85,
    }),
    place({
      id: "E1854A2D-E5D1-4FA2-8871-2CC698032B6D",
      name: "Swan Dive",
      image: "https://images.qloo.com/i/E1854A2D-E5D1-4FA2-8871-2CC698032B6D-3wzXED-420x-outside.jpg",
      address: "615 Red River St Austin, TX 78701",
      neighbourhood: "Downtown",
      website: "http://swandiveaustin.com/",
      description: "Retro cocktail lounge and venue for jazz, soul and late shows.",
      tags: ["Live music venue", "Eclectic"],
      keywords: ["band", "back patio"],
      rating: 3.9,
      affinity: 0.86,
    }),
    place({
      id: "8820E7A1-22AF-4C4D-8858-E475BEA5BF06",
      name: "Cactus Cafe",
      image: "https://images.qloo.com/i/8820E7A1-22AF-4C4D-8858-E475BEA5BF06-25H0nq-420x-outside.jpg",
      address: "2247 Guadalupe St Austin, TX 78712",
      neighbourhood: null,
      website: "https://cactuscafe.org/",
      description: "Listening room and bar on the UT campus, mostly acoustic, since 1979.",
      tags: ["Bar", "Classic", "Quiet"],
      keywords: ["intimate venue", "acoustics"],
      priceLevel: 2,
      rating: 4.6,
      affinity: 0.85,
    }),
    artist({
      id: "076ADA9F-DB3B-4BD3-AE61-DBBA89FC0D15",
      name: "Mildlife",
      image: "https://images.qloo.com/i/076ADA9F-DB3B-4BD3-AE61-DBBA89FC0D15-420x-auto.jpg",
      description: "Australian band mixing psychedelic rock, jazz fusion and funk.",
      tags: ["Space Disco", "Jazz Fusion", "Psychedelic"],
    }),
    artist({
      id: "24BA18BE-62EF-4B7E-99C6-7AA20EB05F28",
      name: "Glass Beams",
      image: "https://images.qloo.com/i/24BA18BE-62EF-4B7E-99C6-7AA20EB05F28-420x-auto.jpg",
      description: "Masked trio from Melbourne playing hypnotic, instrumental psych.",
      tags: ["Psychedelic", "Funk", "Soul"],
    }),
    artist({
      id: "7C038006-7C6B-4F1B-A3F0-E6BED80C1098",
      name: "Arc De Soleil",
      image: "https://images.qloo.com/i/7C038006-7C6B-4F1B-A3F0-E6BED80C1098-420x-auto.jpg",
      description: "Instrumental band with a dreamy, surf-tinged psychedelic sound.",
      tags: ["Psychedelic Rock", "Surf Rock"],
    }),
  ].map((entity) => [entity.id, entity]),
);

/** Sample ids by type, best first, for `sample` functions. */
export const sampleIds = {
  places: Object.values(sampleEntities)
    .filter((e) => e.type === "place")
    .map((e) => e.id),
  artists: Object.values(sampleEntities)
    .filter((e) => e.type === "artist")
    .map((e) => e.id),
};

export type PreviewState = "done" | "generating" | "pending" | "error";

/**
 * Cuts a finished object down to what would have streamed in by `fraction`
 * (0–1): keys arrive in order, strings grow, arrays fill item by item.
 */
export function partialOf<T>(value: T, fraction: number): DeepPartial<T> | undefined {
  const size = (v: unknown): number =>
    typeof v === "string"
      ? v.length
      : Array.isArray(v)
        ? v.reduce((n: number, item) => n + size(item), 0)
        : v && typeof v === "object"
          ? Object.values(v).reduce((n: number, item) => n + size(item), 0)
          : 1;
  let budget = Math.floor(size(value) * Math.min(1, Math.max(0, fraction)));
  const take = (v: unknown): unknown => {
    if (budget <= 0) return undefined;
    if (typeof v === "string") {
      const part = v.slice(0, budget);
      budget -= part.length;
      return part;
    }
    if (Array.isArray(v)) {
      const out: unknown[] = [];
      for (const item of v) {
        const part = take(item);
        if (part === undefined) break;
        out.push(part);
      }
      return out;
    }
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(v)) {
        const part = take(item);
        if (part === undefined) break;
        out[key] = part;
      }
      return out;
    }
    budget -= 1;
    return v;
  };
  return take(value) as DeepPartial<T> | undefined;
}

const stepStatus: Record<PreviewState, StepStatus> = {
  done: "done",
  generating: "running",
  pending: "pending",
  error: "error",
};

/** A run for the editor: every generated section in `state`, from its component's sample. */
export function previewRun(catalogue: Catalogue, config: ExperienceConfig, state: PreviewState, fraction = 1): RunState {
  const run = planRun("preview", catalogue, config);
  const blocks = new Map(config.parts.artifact.components.map((block) => [block.id, block]));
  const definitions = new Map(catalogue.parts.artifact.components.map((d) => [d.type, d]));
  return {
    ...run,
    status: state === "done" ? "done" : state === "error" ? "error" : "running",
    entities: sampleEntities,
    steps: run.steps.map((step, index) => {
      if (step.kind !== "section") {
        // Everything up to the sections has run, apart from Taste while waiting.
        const early = index < run.steps.findIndex((s) => s.kind === "section" || s.kind === "finish");
        const status: StepStatus =
          state === "done" ? "done" : !early ? "pending" : step.kind === "taste" && state === "pending" ? "running" : "done";
        // A code step's public data, from its sample, once it's run.
        const code = step.kind === "code" && status === "done" ? config.workflow.steps.find((s) => s.id === step.id) : null;
        const data = code ? (getStep(code.type)?.sample?.(code.props) ?? null) : null;
        return { ...step, status, data };
      }
      const block = blocks.get(step.id);
      const definition = block && definitions.get(block.type);
      const types = ((block?.props.lookups as string[]) ?? []).flatMap(
        (id) => config.workflow.lookups.find((lookup) => lookup.id === id)?.props.type ?? [],
      );
      const sample = block && definition?.generate ? definition.generate.sample(block.props, { types }) : null;
      return {
        ...step,
        status: stepStatus[state],
        data: state === "done" ? sample : state === "generating" ? (partialOf(sample, fraction) ?? null) : null,
        error: state === "error" ? "The model didn't answer." : null,
        message: state === "pending" ? null : step.message,
      };
    }),
  };
}
