import { Hono } from "hono";
import { createRequestHandler } from "react-router";

import { serveFile } from "@core/files.server";
import { hostRedirect } from "@core/hosts.server";
import { api } from "./api";
import { handleMcp } from "./mcp";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// One Worker: Hono owns the non-page routes, React Router renders the rest.
const app = new Hono<{ Bindings: Env }>()
  // Admin on APP_HOST, public pages on PAGES_HOST (core/hosts.server.ts).
  .use(async (c, next) => hostRedirect(c.req.raw) ?? next())
  // Uploaded images, video and audio. Public, like the pages that show them.
  .get("/files/:workspace/:id", (c) => serveFile(c.req.raw, c.req.param("workspace"), c.req.param("id")))
  .route("/api", api)
  // Hono only hands /api the paths it matches; the rest would get the HTML 404 page.
  .all("/api/*", (c) => c.json({ error: "Not found" }, 404))
  // The MCP server, for agents. An API key picks the workspace.
  .all("/mcp", handleMcp)
  .all("*", (c) => requestHandler(c.req.raw));

export default app satisfies ExportedHandler<Env>;

// The outcome workflow and the rooms that stream it (core/workflow).
export { OutcomeWorkflow } from "@core/workflow/outcome.server";
export { OutcomeRoom } from "@core/workflow/room.server";
