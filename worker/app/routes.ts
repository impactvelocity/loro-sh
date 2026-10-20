import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),

  // Signing in to the admin, when ADMIN_PASSWORD is set.
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // Everything under /admin is behind the password (routes/admin/gate.tsx).
  layout("routes/admin/gate.tsx", [
    // Outside the admin layout: it's where you pick a workspace, so there may
    // not be one to show a sidebar for.
    route("admin/workspaces", "routes/admin/workspaces.tsx"),
    // Profiles across every workspace, also above any one workspace.
    route("admin/workspaces/profiles", "routes/admin/all-profiles.tsx"),

    route("admin", "routes/admin/layout.tsx", [
      index("routes/admin/home.tsx"),
      route("analytics", "routes/admin/analytics.tsx"),
      route("profiles", "routes/admin/profiles.tsx"),
      route("profiles/segments/:id", "routes/admin/segment.tsx"),
      route("profiles/people/:id", "routes/admin/person.tsx"),
      route("experiences", "routes/admin/experiences.tsx"),
      route("experiences/new", "routes/admin/experience-new.tsx"),
      route("experiences/:slug", "routes/admin/experience.tsx"),
      route("context", "routes/admin/context.tsx"),
      route("agent", "routes/admin/agent.tsx"),
      route("mcp", "routes/admin/mcp.tsx"),
      route("settings", "routes/admin/settings.tsx"),
      route("settings/components", "routes/admin/settings-components.tsx"),
      route("settings/catalogues/:id", "routes/admin/catalogue.tsx"),
      route("docs", "routes/admin/docs.tsx", [
        index("routes/admin/docs/overview.tsx"),
        route(":slug", "routes/admin/docs/article.tsx"),
      ]),
    ]),
  ]),

  // Generated pages for the experience types in experiences/.
  route("f/:slug", "routes/experience.tsx"),
  // A saved experience: start page, intake and outcome.
  route("f/:workspace/:slug", "routes/funnel.tsx"),
  // The same experience in a bare design, built only on the headless SDK.
  route("f/:workspace/:slug/plain", "routes/funnel-plain.tsx"),
  // One person's outcome.
  route("f/:workspace/:slug/g/:id", "routes/generation.tsx"),
] satisfies RouteConfig;
