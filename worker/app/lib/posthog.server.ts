import { env } from "cloudflare:workers";

import type { PostHogConfig } from "./posthog";

/**
 * PostHog settings for the page at this URL, or null to send nothing. Only
 * APP_HOST and PAGES_HOST report, so local dev and forks on other hosts
 * stay out of the project.
 */
export function posthogConfig(requestUrl: string): PostHogConfig | null {
  const { hostname } = new URL(requestUrl);
  const live = hostname === env.APP_HOST || hostname === env.PAGES_HOST;
  return live && env.POSTHOG_KEY ? { key: env.POSTHOG_KEY, host: env.POSTHOG_HOST } : null;
}
