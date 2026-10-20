/**
 * The steps one run takes, from the experience's config. The workflow
 * runs this list; the page draws it before the first event arrives, so
 * every section can show its pending state straight away.
 */
import type { BlockConfig, ExperienceConfig } from "../catalogue/config";
import { type Catalogue, findDefinition, isGenerated } from "../catalogue/define";
import { type StepPoint, getStep } from "../catalogue/workflow";
import { type RunState, type StepState, pendingStep } from "./state";

export const TASTE = "taste";
export const FINISH = "finish";

/** The outcome's generated sections, in page order. */
export function generatedBlocks(catalogue: Catalogue, config: ExperienceConfig) {
  return config.parts.artifact.components.flatMap((block) => {
    const definition = findDefinition(catalogue, "artifact", block.type);
    return definition && isGenerated(definition) ? [{ block, definition }] : [];
  });
}

export function codeSteps(config: ExperienceConfig, at: StepPoint) {
  return config.workflow.steps.flatMap((block) => {
    const definition = getStep(block.type);
    return definition && definition.at === at ? [{ block, definition }] : [];
  });
}

/** A section's name on the progress line: its heading if it has one. */
export function sectionLabel(block: BlockConfig, fallback: string) {
  const heading = block.props.heading;
  return typeof heading === "string" && heading.trim() ? heading.trim() : fallback;
}

export function planSteps(catalogue: Catalogue, config: ExperienceConfig): StepState[] {
  const code = (at: StepPoint) =>
    codeSteps(config, at).map(({ block, definition }) =>
      pendingStep({ id: block.id, kind: "code", type: block.type, label: definition.name, background: at === "finish" }),
    );
  return [
    ...code("before"),
    pendingStep({ id: TASTE, kind: "taste", type: null, label: "Reading your taste" }),
    ...code("after-taste"),
    ...generatedBlocks(catalogue, config).map(({ block, definition }) =>
      pendingStep({ id: block.id, kind: "section", type: block.type, label: sectionLabel(block, definition.name) }),
    ),
    pendingStep({ id: FINISH, kind: "finish", type: null, label: "Putting it together" }),
    ...code("finish"),
  ];
}

export function planRun(id: string, catalogue: Catalogue, config: ExperienceConfig): RunState {
  return { id, status: "running", steps: planSteps(catalogue, config), entities: {}, error: null, updatedAt: Date.now() };
}
