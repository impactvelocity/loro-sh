/**
 * A funnel is one experience in the admin: a catalogue plus the brand's
 * config for its start page, intake and outcome (catalogue/config.ts).
 * Saved in D1 by funnels.server.ts; public at /f/:workspace/:slug.
 */
import type { ExperienceConfig } from "./catalogue/config";

export type FunnelStatus = "live" | "draft" | "paused";

export const funnelStatusLabels: Record<FunnelStatus, string> = {
  live: "Live",
  draft: "Draft",
  paused: "Paused",
};

export const funnelStatusDescriptions: Record<FunnelStatus, string> = {
  live: "Open to anyone with the link.",
  draft: "Still being built. The link works, so you can test it.",
  paused: "The link shows a closed notice.",
};

export type Funnel = {
  slug: string;
  name: string;
  catalogue: string;
  status: FunnelStatus;
  config: ExperienceConfig;
  /** Unix seconds. */
  createdAt: number;
  updatedAt: number;
};

export const NAME_MAX = 80;

export function publicPath(workspaceId: string, slug: string) {
  return `/f/${workspaceId}/${slug}`;
}

/** A card cover: the first photo on the start page or outcome, and the accent colour. */
export function coverOf(config: ExperienceConfig) {
  const blocks = [...config.parts.start.components, ...config.parts.artifact.components];
  const image = blocks.map((block) => block.props.image).find((value) => typeof value === "string" && value);
  const accent = [config.parts.start, config.parts.intake, config.parts.artifact]
    .map((part) => part.settings.accent)
    .find((value) => typeof value === "string" && value);
  return { image: (image as string | undefined) ?? null, accent: (accent as string | undefined) ?? null };
}
