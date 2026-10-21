import { useEffect } from "react";

export type PostHogConfig = { key: string; host: string };

/**
 * Starts PostHog once per page load: page views (client navigations too),
 * clicks and page leaves, each tagged product: "loro". The SDK loads only
 * when the server sent settings (lib/posthog.server.ts).
 */
export function usePostHog(config: PostHogConfig | null | undefined) {
  const key = config?.key;
  const host = config?.host;

  useEffect(() => {
    if (!key || !host) return;
    import("posthog-js").then(({ default: posthog }) =>
      posthog.init(key, {
        api_host: host,
        defaults: "2026-08-30",
        // Runs before the first page view, so that one is tagged too.
        loaded: (ph) => ph.register({ product: "loro" }),
      }),
    );
  }, [key, host]);
}
