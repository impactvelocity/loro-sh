import { data } from "react-router";

import type { Route } from "./+types/experience";
import { getExperience } from "@core/experiences";
import type { RouteHandle } from "@/lib/document";

export const handle: RouteHandle = { surface: "experience" };

export function loader({ params }: Route.LoaderArgs) {
  const experience = getExperience(params.slug);
  if (!experience) throw data(null, { status: 404 });

  return {
    meta: experience.meta,
    theme: experience.meta.theme,
    data: experience.schema.parse(experience.fixture),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.meta.name ?? "Not found" }];
}

export default function ExperiencePage({ loaderData }: Route.ComponentProps) {
  const { Component } = getExperience(loaderData.meta.slug)!;
  return <Component data={loaderData.data} />;
}
