import type { ComponentType } from "react";
import type { z } from "zod";

export type ExperienceMeta = {
  slug: string;
  name: string;
  description: string;
  /** Theme name from `themes/`, applied as `data-theme` on <html>. */
  theme: string;
};

export type Experience<S extends z.ZodType = z.ZodType> = {
  meta: ExperienceMeta;
  schema: S;
  /** Sample data used for previews until real funnels feed the experience. */
  fixture: z.input<S>;
  Component: ComponentType<{ data: z.output<S> }>;
};

export function defineExperience<S extends z.ZodType>(experience: Experience<S>) {
  return experience;
}

// Every folder in experiences/ with an index.tsx registers itself.
const modules = import.meta.glob<{ default: Experience }>(
  "../experiences/*/index.tsx",
  { eager: true },
);

const experiences = new Map(
  Object.values(modules).map(({ default: experience }) => [
    experience.meta.slug,
    experience,
  ]),
);

export function listExperiences(): ExperienceMeta[] {
  return [...experiences.values()].map((experience) => experience.meta);
}

export function getExperience(slug: string): Experience | undefined {
  return experiences.get(slug);
}
