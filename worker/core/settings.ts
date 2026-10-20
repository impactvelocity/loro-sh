/**
 * What the admin shows about connecting to Loro from outside: the Connect
 * page's endpoints and tools, and Settings' Qloo and resources.
 *
 * Endpoints mirror workers/api.ts and MCP tools mirror workers/mcp.ts, both
 * kept in step by hand. The Qloo connection is a fixture until secrets are
 * wired up.
 */

export type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  /** Needs an API key for the workspace. */
  key?: boolean;
};

/** The longest name an API key can have. */
export const KEY_NAME_MAX = 60;

export type EndpointGroup = { title: string; endpoints: Endpoint[] };

const ws = "/api/workspaces/:workspace";
const exp = `${ws}/experiences/:slug`;

export const endpointGroups: EndpointGroup[] = [
  {
    title: "Account",
    endpoints: [
      { method: "GET", path: "/api/health", description: "Check the Worker is up" },
      { method: "GET", path: "/api/catalogues", description: "Catalogues and their components" },
      { method: "GET", path: "/api/catalogues/:id", description: "One catalogue, with its example config" },
      { method: "GET", path: "/api/workspaces", description: "List workspaces" },
      { method: "POST", path: "/api/workspaces", description: "Create a workspace; returns its first key" },
    ],
  },
  {
    title: "Workspace",
    endpoints: [
      { method: "GET", path: ws, description: "The workspace and its counts" },
      { method: "PATCH", path: ws, description: "Change its name, tagline or cover", key: true },
      { method: "DELETE", path: ws, description: "Delete it and everything in it", key: true },
      { method: "GET", path: `${ws}/analytics`, description: "Counts, totals and the funnel (?range=7d|30d|90d)" },
      { method: "GET", path: `${ws}/activity`, description: "The latest steps people took" },
      { method: "GET", path: `${ws}/keys`, description: "List API keys", key: true },
      { method: "POST", path: `${ws}/keys`, description: "Make a key", key: true },
      { method: "DELETE", path: `${ws}/keys/:id`, description: "Revoke a key", key: true },
    ],
  },
  {
    title: "Profiles",
    endpoints: [
      { method: "GET", path: `${ws}/segments`, description: "List segments" },
      { method: "POST", path: `${ws}/segments`, description: "Create a segment", key: true },
      { method: "GET", path: `${ws}/segments/:id`, description: "One segment and its people" },
      { method: "PATCH", path: `${ws}/segments/:id`, description: "Update a segment", key: true },
      { method: "DELETE", path: `${ws}/segments/:id`, description: "Delete a segment; its people stay", key: true },
      { method: "GET", path: `${ws}/people`, description: "List people (?segment=)" },
      { method: "POST", path: `${ws}/people`, description: "Add a person", key: true },
      { method: "GET", path: `${ws}/people/:id`, description: "One person, their answers, outcomes and ratings" },
      { method: "PATCH", path: `${ws}/people/:id`, description: "Update a person", key: true },
      { method: "DELETE", path: `${ws}/people/:id`, description: "Delete a person", key: true },
      { method: "GET", path: `${ws}/generations/:id`, description: "One outcome, its run and rating" },
    ],
  },
  {
    title: "Experiences",
    endpoints: [
      { method: "GET", path: `${ws}/experiences`, description: "List experiences" },
      { method: "POST", path: `${ws}/experiences`, description: "Create one from a catalogue", key: true },
      { method: "GET", path: exp, description: "One experience and its config" },
      { method: "PATCH", path: exp, description: "Change its name, link, status or config", key: true },
      { method: "DELETE", path: exp, description: "Delete an experience", key: true },
      { method: "GET", path: `${exp}/questions`, description: "The intake as plain data" },
      { method: "GET", path: `${exp}/analytics`, description: "The last 30 days" },
      { method: "GET", path: `${exp}/people`, description: "Everyone who's been through it" },
      { method: "GET", path: `${exp}/generations`, description: "Its outcomes, newest first" },
      { method: "GET", path: `${exp}/feedback`, description: "Ratings and comments" },
    ],
  },
  {
    title: "Running An Experience",
    endpoints: [
      { method: "POST", path: `${exp}/trigger`, description: "Start it for someone, with their answers", key: true },
      { method: "POST", path: `${exp}/optin`, description: "Sign someone up" },
      { method: "POST", path: `${exp}/submissions`, description: "Answers for a sign-up's submission" },
      { method: "GET", path: `${exp}/runs/:id`, description: "An outcome as it's made" },
      { method: "GET", path: `${exp}/runs/:id/events`, description: "The same, as server-sent events" },
      { method: "POST", path: `${exp}/feedback`, description: "Rate an outcome 1–5" },
      { method: "GET", path: `${exp}/tests`, description: "List test runs" },
      { method: "POST", path: `${exp}/tests`, description: "Run a test, saved config or not", key: true },
      { method: "DELETE", path: `${exp}/tests/:id`, description: "Delete a test run", key: true },
    ],
  },
  {
    title: "Context",
    endpoints: [
      { method: "GET", path: `${ws}/skills`, description: "List skills" },
      { method: "POST", path: `${ws}/skills`, description: "Add a skill", key: true },
      { method: "PATCH", path: `${ws}/skills/:id`, description: "Update a skill", key: true },
      { method: "DELETE", path: `${ws}/skills/:id`, description: "Delete a skill", key: true },
      { method: "GET", path: `${ws}/files`, description: "List files (?kind=image|video|audio)" },
      { method: "POST", path: `${ws}/files`, description: "Upload an image or audio file" },
      { method: "PATCH", path: `${ws}/files/:id`, description: "Rename a file or change its alt text", key: true },
      { method: "DELETE", path: `${ws}/files/:id`, description: "Delete a file", key: true },
      { method: "POST", path: `${ws}/videos`, description: "Start a video upload to Stream" },
      { method: "POST", path: `${ws}/videos/:id/done`, description: "Finish a video upload" },
    ],
  },
  {
    title: "Agent",
    endpoints: [
      { method: "GET", path: `${ws}/agent/threads`, description: "List threads" },
      { method: "GET", path: `${ws}/agent/threads/:thread`, description: "One thread and its messages" },
      { method: "POST", path: `${ws}/agent/threads/:thread`, description: "Send a message; the reply streams" },
      { method: "PATCH", path: `${ws}/agent/threads/:thread`, description: "Rename a thread", key: true },
      { method: "DELETE", path: `${ws}/agent/threads/:thread`, description: "Delete a thread", key: true },
    ],
  },
];

export type McpTool = { name: string; description: string };

/** Mirrors the tools in workers/mcp.ts. */
export const mcpToolGroups: { title: string; tools: McpTool[] }[] = [
  {
    title: "Workspace",
    tools: [
      { name: "get_workspace", description: "The workspace and its counts" },
      { name: "update_workspace", description: "Change its name or tagline" },
      { name: "get_analytics", description: "Totals, the funnel and the latest activity" },
      { name: "list_activity", description: "The latest steps people took" },
      { name: "list_catalogues", description: "What experiences are built from" },
      { name: "get_catalogue", description: "One catalogue, with an example config" },
    ],
  },
  {
    title: "Profiles",
    tools: [
      { name: "list_segments", description: "Segments with their taste signals" },
      { name: "get_segment", description: "One segment and its people" },
      { name: "create_segment", description: "A new segment" },
      { name: "update_segment", description: "Change a segment" },
      { name: "delete_segment", description: "Delete a segment; its people stay" },
      { name: "list_people", description: "Profiles, most recently active first" },
      { name: "get_person", description: "One person's answers, outcomes and ratings" },
      { name: "create_person", description: "Add a profile" },
      { name: "update_person", description: "Change a profile" },
      { name: "delete_person", description: "Delete a profile" },
    ],
  },
  {
    title: "Experiences",
    tools: [
      { name: "list_experiences", description: "Every experience and its status" },
      { name: "get_experience", description: "Its config and intake questions" },
      { name: "create_experience", description: "A new draft from a catalogue" },
      { name: "update_experience", description: "Change its name, link, status or config" },
      { name: "delete_experience", description: "Delete an experience" },
      { name: "get_experience_results", description: "Numbers, ratings and latest outcomes" },
      { name: "start_experience", description: "Start it for someone, with their answers" },
      { name: "get_outcome", description: "An outcome as it's made, or once it's done" },
      { name: "run_test", description: "Try it without touching Profiles" },
      { name: "list_tests", description: "Its test runs" },
    ],
  },
  {
    title: "Context",
    tools: [
      { name: "list_skills", description: "Skills outcomes can follow" },
      { name: "add_skill", description: "Add a skill" },
      { name: "update_skill", description: "Change a skill" },
      { name: "delete_skill", description: "Delete a skill" },
      { name: "list_files", description: "Uploaded images, video and audio" },
    ],
  },
];

export const qloo = {
  connected: true,
  /** Where the key lives on a self-hosted Worker. */
  secret: "QLOO_API_KEY",
  docs: "https://docs.qloo.com",
};

export const resources = [
  {
    label: "Qloo",
    description: "The taste AI behind every outcome",
    href: "https://qloo.com",
  },
  {
    label: "Qloo API Docs",
    description: "Taste insights, entities and demographics",
    href: "https://docs.qloo.com",
  },
];
