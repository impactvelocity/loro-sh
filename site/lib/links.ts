/**
 * Every outbound link on the site. The demo pages are the hackathon hosts
 * (worker/wrangler.jsonc APP_HOST and PAGES_HOST); each workspace has to
 * exist in the production D1 for its link to work.
 */
export const links = {
  // ?demo opens the admin straight in the Demo Experiences workspace, view only.
  demo: "https://app.loro.sh/admin?demo=1",
  app: "https://app.loro.sh/admin?demo=1",
  // Buttons that need it hide while it's empty.
  repo: "https://github.com/impactvelocity/loro-sh",
  examples: {
    roadtrip: "https://demo.loro.sh/f/demo-experiences/mirage-valley-road-trip",
    stay: "https://demo.loro.sh/f/demo-experiences/plan-your-stay",
    property: "https://demo.loro.sh/f/demo-experiences/2-3768-west-2nd-avenue",
  },
  qloo: "https://www.qloo.com",
  hackathon: "https://qloo.devpost.com/",
  // The demo video on YouTube. Until it's set, the video frame is hidden.
  video: "https://youtu.be/MXuHlf53Rq4",
  creator: {
    site: "https://hidylanjones.com",
    twitter: "https://twitter.com/hidylanjones",
    linkedin: "https://www.linkedin.com/in/hidylanjones",
  },
};

/** Cloudflare's deploy button URL for the repo, or null until the repo is set. */
export const deployUrl = links.repo
  ? `https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(`${links.repo}/tree/main/worker`)}`
  : null;

/** The video id from a youtu.be or youtube.com link, or null. */
export function youtubeId(url: string): string | null {
  return url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/)?.[1] ?? null;
}
