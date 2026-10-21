// PostHog: page views, clicks and page leaves, in the hackathon's shared
// project. Every event carries product: "loro" to tell it apart from the
// other entries. Only the live site reports, so local builds stay out.
if (location.hostname === "loro.sh") {
  import("posthog-js").then(({ default: posthog }) =>
    posthog.init("phc_wHmU9xGagja5baLnbfXbBsDSepVnU7h5bBB6Do6DAdGs", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-08-30",
      // Runs before the first page view, so that one is tagged too.
      loaded: (ph) => ph.register({ product: "loro" }),
    }),
  );
}
