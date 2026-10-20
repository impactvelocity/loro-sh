/**
 * Every outbound link on the site. The demo pages are the hackathon hosts
 * (worker/wrangler.jsonc APP_HOST and PAGES_HOST); each workspace has to
 * exist in the production D1 for its link to work.
 */
export const links = {
  demo: "https://demo.loro.sh/f/mirage-valley/road-trip",
  app: "https://app.loro.sh",
  // Set once the repo is public; buttons that need it hide while it's empty.
  repo: "",
  examples: {
    roadtrip: "https://demo.loro.sh/f/mirage-valley/road-trip",
    stay: "https://demo.loro.sh/f/low-tide-house/plan-your-stay",
    property: "https://demo.loro.sh/f/harbour-grey/2-3768-west-2nd-avenue",
  },
  qloo: "https://www.qloo.com",
};

/** Cloudflare's deploy button URL for the repo, or null until the repo is set. */
export const deployUrl = links.repo
  ? `https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(`${links.repo}/tree/main/worker`)}`
  : null;
