/**
 * The rules every experience follows, whatever its catalogue:
 *
 * 1. The parts run in order, skipping any that are off. With the intake
 *    off, the experience is started by API with the answers already in.
 * 2. Signing up needs an email; the name is optional.
 * 3. Each input's answer is checked against its component's schema, in
 *    the browser on each step and again on the server.
 *
 * Shared by the runner, the API and the editor preview.
 */
import { z } from "zod";

import type { BlockConfig, ExperienceConfig } from "./config";
import {
  type AnswerValue,
  type Answers,
  type Catalogue,
  type InputDefinition,
  type PartId,
  type Person,
  type ProfileRow,
  findDefinition,
  isInput,
  partIds,
} from "./define";

export function stagesOf(config: ExperienceConfig): PartId[] {
  return partIds.filter((id) => config.parts[id].enabled);
}

export const optinSchema = z.object({
  name: z.string().trim().max(80, "Keep it under 80 characters").catch(""),
  email: z.email("Check your email address"),
});

export const samplePerson: Person = { name: "Alex Rivera", email: "alex@example.com" };

/** Intake components that ask something, with their definitions. */
export function inputsOf(catalogue: Catalogue, config: ExperienceConfig) {
  return config.parts.intake.components.flatMap((block) => {
    const definition = findDefinition(catalogue, "intake", block.type);
    return definition && isInput(definition) ? [{ block, definition }] : [];
  });
}

export function inputOf(catalogue: Catalogue, block: BlockConfig): InputDefinition<any, any> | null {
  const definition = findDefinition(catalogue, "intake", block.type);
  return definition && isInput(definition) ? definition : null;
}

/** Every input's answer. A missing one counts as empty, so API callers can leave out optional ones. */
export function answersSchema(catalogue: Catalogue, config: ExperienceConfig) {
  return z.object(
    Object.fromEntries(
      inputsOf(catalogue, config).map(({ block, definition }) => [
        block.id,
        z.preprocess(
          (value) => (value === undefined ? definition.input.empty(block.props) : value),
          definition.input.schema(block.props),
        ),
      ]),
    ),
  );
}

/** Every question as plain data, for forms that don't use the catalogue's components. */
export function questionsOf(catalogue: Catalogue, config: ExperienceConfig) {
  return inputsOf(catalogue, config).map(({ block, definition }) => ({
    id: block.id,
    question: definition.input.label(block.props),
    shape: definition.input.shape(block.props),
    required: definition.input.required(block.props),
  }));
}

export function emptyAnswers(catalogue: Catalogue, config: ExperienceConfig): Answers {
  return Object.fromEntries(
    inputsOf(catalogue, config).map(({ block, definition }) => [block.id, definition.input.empty(block.props)]),
  );
}

export function sampleAnswers(catalogue: Catalogue, config: ExperienceConfig): Answers {
  return Object.fromEntries(
    inputsOf(catalogue, config).map(({ block, definition }) => [block.id, definition.input.sample(block.props)]),
  );
}

export function displayAnswer(value: AnswerValue | undefined) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** What gets saved to the person's profile: one row per question. */
export function profileRows(catalogue: Catalogue, config: ExperienceConfig, answers: Answers): ProfileRow[] {
  return inputsOf(catalogue, config).map(({ block, definition }) => ({
    id: block.id,
    question: definition.input.label(block.props),
    answer: displayAnswer(answers[block.id]),
  }));
}

export function fillTemplate(text: string, person: Person | null, answers: Answers) {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (token, key: string) => {
    if (key === "name") return person?.name ?? "";
    if (key === "first_name") return person?.name.split(" ")[0] ?? "";
    if (key === "email") return person?.email ?? "";
    if (key.startsWith("answers.")) return displayAnswer(answers[key.slice("answers.".length)]);
    return token;
  });
}

/** First message per top-level key, for showing next to each field. */
export function errorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    errors[key] ??= issue.message;
  }
  return errors;
}
