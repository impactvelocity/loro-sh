/**
 * Loro's MCP server, at /mcp, so an agent (Claude Code, Claude Desktop,
 * any MCP client) can run a workspace: profiles, experiences, starting
 * them for people and reading what came out.
 *
 * Connect with an API key from Connect → Keys as a bearer token. The key
 * picks the workspace, and every tool acts on that one.
 *
 * Each tool is a call to the REST API (workers/api.ts), made in-process
 * with the same key, so the rules, validation and errors are the API's.
 * Streamable HTTP, stateless: a fresh server per request, no sessions.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { Context } from "hono";
import { z } from "zod";

import { findApiKey } from "@core/api-keys.server";
import type { RunState } from "@core/outcome/state";
import { ageRanges, signalTypes } from "@core/profiles";
import { api } from "./api";
import { bearerToken } from "./api/auth";

type Method = "GET" | "POST" | "PATCH" | "DELETE";
/** One REST call. Resolves to the JSON body (undefined for 204); rejects with the API's error. */
type Call = (method: Method, path: string, body?: unknown) => Promise<any>;

class ToolError extends Error {}

/* Shared input shapes */

const signal = z.object({
  type: z.enum(Object.keys(signalTypes) as [string, ...string[]]),
  name: z.string().describe("The artist, place, brand, film… by name"),
});
const signals = z
  .array(signal)
  .describe("Taste signals. Qloo steers recommendations towards these.");

const segmentFields = {
  description: z.string().optional(),
  ages: z.array(z.enum(Object.keys(ageRanges) as [string, ...string[]])).optional(),
  gender: z.enum(["any", "female", "male"]).optional(),
  location: z.string().optional().describe("A city or region"),
  signals: signals.optional(),
};

const personFields = {
  email: z.string().optional().describe("Unique in the workspace; empty for none"),
  phone: z.string().optional(),
  location: z.string().optional(),
  segmentId: z.string().nullable().optional().describe("The segment they're in, or null"),
  signals: signals.optional(),
  notes: z.string().optional().describe("Anything the outcome should know about them"),
};

const answers = z
  .record(z.string(), z.unknown())
  .describe("Intake answers keyed by question id; see get_experience for the ids and shapes");

const readOnly: ToolAnnotations = { readOnlyHint: true, openWorldHint: false };
const writes: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
const deletes: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };

/* Tools */

type Tool<S extends z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  input: S;
  annotations: ToolAnnotations;
  run: (args: z.infer<z.ZodObject<S>>, call: Call, ws: (path: string) => string) => Promise<unknown>;
};

const tool = <S extends z.ZodRawShape>(definition: Tool<S>) => definition;

const id = (value: string) => encodeURIComponent(value);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tools = [
  // Workspace
  tool({
    name: "get_workspace",
    title: "Get Workspace",
    description: "The workspace this key belongs to, with how many experiences, segments and profiles it has.",
    input: {},
    annotations: readOnly,
    run: (_, call, ws) => call("GET", ws("")),
  }),
  tool({
    name: "update_workspace",
    title: "Update Workspace",
    description: "Change the workspace's name or tagline.",
    input: { name: z.string().optional(), tagline: z.string().optional() },
    annotations: writes,
    run: (args, call, ws) => call("PATCH", ws(""), args),
  }),
  tool({
    name: "get_analytics",
    title: "Get Analytics",
    description:
      "Totals for the period and the one before (views, new profiles, intakes started and finished, outcomes), the funnel by source, and the latest activity.",
    input: { range: z.enum(["7d", "30d", "90d"]).optional() },
    annotations: readOnly,
    run: async ({ range }, call, ws) => {
      const { analytics } = await call("GET", ws(`/analytics?range=${range ?? "30d"}`));
      const { days: _, ...rest } = analytics;
      return rest;
    },
  }),
  tool({
    name: "list_activity",
    title: "List Activity",
    description: "The latest steps people took (sign-ups, finished intakes, outcomes), newest first.",
    input: {
      limit: z.number().int().min(1).max(100).optional(),
      experience: z.string().optional().describe("Only this experience's slug"),
    },
    annotations: readOnly,
    run: ({ limit, experience }, call, ws) => {
      const query = new URLSearchParams({ limit: String(limit ?? 20), ...(experience ? { experience } : {}) });
      return call("GET", ws(`/activity?${query}`));
    },
  }),

  // Catalogues
  tool({
    name: "list_catalogues",
    title: "List Catalogues",
    description:
      "The catalogues experiences are built from: each part's components (start page, intake inputs, outcome sections) and their props.",
    input: {},
    annotations: readOnly,
    run: (_, call) => call("GET", "/catalogues"),
  }),
  tool({
    name: "get_catalogue",
    title: "Get Catalogue",
    description: "One catalogue with a complete example config, the best guide to the config shape update_experience takes.",
    input: { id: z.string() },
    annotations: readOnly,
    run: (args, call) => call("GET", `/catalogues/${id(args.id)}`),
  }),

  // Segments
  tool({
    name: "list_segments",
    title: "List Segments",
    description: "Segments with their demographics, taste signals and member counts.",
    input: {},
    annotations: readOnly,
    run: (_, call, ws) => call("GET", ws("/segments")),
  }),
  tool({
    name: "get_segment",
    title: "Get Segment",
    description: "One segment and its people.",
    input: { id: z.string() },
    annotations: readOnly,
    run: (args, call, ws) => call("GET", ws(`/segments/${id(args.id)}`)),
  }),
  tool({
    name: "create_segment",
    title: "Create Segment",
    description: "A new segment. Its demographics and signals steer Qloo for everyone in it.",
    input: { name: z.string(), ...segmentFields },
    annotations: writes,
    run: (args, call, ws) => call("POST", ws("/segments"), args),
  }),
  tool({
    name: "update_segment",
    title: "Update Segment",
    description: "Change a segment. Only the fields you send change; signals replaces the whole list.",
    input: { id: z.string(), name: z.string().optional(), ...segmentFields },
    annotations: writes,
    run: ({ id: segment, ...fields }, call, ws) => call("PATCH", ws(`/segments/${id(segment)}`), fields),
  }),
  tool({
    name: "delete_segment",
    title: "Delete Segment",
    description: "Delete a segment. Its people stay, unassigned.",
    input: { id: z.string() },
    annotations: deletes,
    run: (args, call, ws) => call("DELETE", ws(`/segments/${id(args.id)}`)),
  }),

  // People
  tool({
    name: "list_people",
    title: "List People",
    description: "Profiles, most recently active first.",
    input: { segment: z.string().optional().describe("Only this segment's members") },
    annotations: readOnly,
    run: ({ segment }, call, ws) => call("GET", ws(segment ? `/people?segment=${id(segment)}` : "/people")),
  }),
  tool({
    name: "get_person",
    title: "Get Person",
    description: "One profile: details, signals, notes, every intake they've answered, their outcomes and ratings.",
    input: { id: z.string() },
    annotations: readOnly,
    run: (args, call, ws) => call("GET", ws(`/people/${id(args.id)}`)),
  }),
  tool({
    name: "create_person",
    title: "Create Person",
    description: "Add a profile by hand. To start an experience for them afterwards, use start_experience with their id.",
    input: { name: z.string(), ...personFields },
    annotations: writes,
    run: (args, call, ws) => call("POST", ws("/people"), { email: "", ...args }),
  }),
  tool({
    name: "update_person",
    title: "Update Person",
    description: "Change a profile. Only the fields you send change; signals replaces the whole list.",
    input: { id: z.string(), name: z.string().optional(), ...personFields },
    annotations: writes,
    run: ({ id: person, ...fields }, call, ws) => call("PATCH", ws(`/people/${id(person)}`), fields),
  }),
  tool({
    name: "delete_person",
    title: "Delete Person",
    description: "Delete a profile with their submissions and outcomes.",
    input: { id: z.string() },
    annotations: deletes,
    run: (args, call, ws) => call("DELETE", ws(`/people/${id(args.id)}`)),
  }),

  // Experiences
  tool({
    name: "list_experiences",
    title: "List Experiences",
    description: "Every experience: slug, name, catalogue, status and public link.",
    input: {},
    annotations: readOnly,
    run: async (_, call, ws) => {
      const { experiences } = await call("GET", ws("/experiences"));
      return experiences.map((e: { slug: string; name: string; catalogue: string; status: string; updatedAt: number }) => ({
        slug: e.slug,
        name: e.name,
        catalogue: e.catalogue,
        status: e.status,
        updatedAt: e.updatedAt,
      }));
    },
  }),
  tool({
    name: "get_experience",
    title: "Get Experience",
    description:
      "One experience: its full config (start page, intake, outcome sections, workflow prompt and lookups) and its intake questions with answer ids and shapes.",
    input: { slug: z.string() },
    annotations: readOnly,
    run: async ({ slug }, call, ws) => {
      const [{ experience }, { questions }] = await Promise.all([
        call("GET", ws(`/experiences/${id(slug)}`)),
        call("GET", ws(`/experiences/${id(slug)}/questions`)),
      ]);
      return { experience, questions };
    },
  }),
  tool({
    name: "create_experience",
    title: "Create Experience",
    description: "A new draft experience, starting from its catalogue's example. Edit it with update_experience.",
    input: { name: z.string(), catalogue: z.string().optional().describe("A catalogue id; defaults to basic") },
    annotations: writes,
    run: (args, call, ws) => call("POST", ws("/experiences"), args),
  }),
  tool({
    name: "update_experience",
    title: "Update Experience",
    description:
      "Change an experience's name, link, status or config. `config` replaces the whole config, so read it with get_experience, change it and send it all back. Status live opens it to anyone with the link; paused closes it.",
    input: {
      slug: z.string(),
      name: z.string().optional(),
      newSlug: z.string().optional().describe("A new link. Links already shared stop working."),
      status: z.enum(["live", "draft", "paused"]).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    },
    annotations: writes,
    run: ({ slug, newSlug, ...fields }, call, ws) =>
      call("PATCH", ws(`/experiences/${id(slug)}`), { ...fields, ...(newSlug ? { slug: newSlug } : {}) }),
  }),
  tool({
    name: "delete_experience",
    title: "Delete Experience",
    description: "Delete an experience. People who went through it keep their profiles.",
    input: { slug: z.string() },
    annotations: deletes,
    run: ({ slug }, call, ws) => call("DELETE", ws(`/experiences/${id(slug)}`)),
  }),
  tool({
    name: "get_experience_results",
    title: "Get Experience Results",
    description:
      "How an experience is doing: the last 30 days (views, started, finished, outcomes, completion rate), ratings and comments, and its latest outcomes with who they're for.",
    input: { slug: z.string() },
    annotations: readOnly,
    run: async ({ slug }, call, ws) => {
      const base = ws(`/experiences/${id(slug)}`);
      const [{ analytics }, { feedback }, { generations }] = await Promise.all([
        call("GET", `${base}/analytics`),
        call("GET", `${base}/feedback`),
        call("GET", `${base}/generations?limit=20`),
      ]);
      return { stats: analytics.stats, feedback, outcomes: generations };
    },
  }),

  // Running
  tool({
    name: "start_experience",
    title: "Start Experience",
    description:
      "Start an experience for someone, the way a booking or ticket sale would: send a person (found by email, or created) or the personId of someone in Profiles, plus their intake answers. Loro saves them and starts writing their outcome, which takes about a minute; follow it with get_outcome. It runs Qloo and the model, so it costs a little each time.",
    input: {
      slug: z.string(),
      person: z.object({ name: z.string().optional(), email: z.string() }).optional(),
      personId: z.string().optional(),
      answers: answers.optional(),
    },
    annotations: { ...writes, openWorldHint: true },
    run: async ({ slug, ...body }, call, ws) => {
      const started = await call("POST", ws(`/experiences/${id(slug)}/trigger`), body);
      return { person: started.person, outcome: started.generation, links: started.links };
    },
  }),
  tool({
    name: "get_outcome",
    title: "Get Outcome",
    description:
      "An outcome as it's being made or once it's done: each step's status and what it wrote, the Qloo entities it recommends, who it's for and their rating. For a test, pass its slug too. Set wait to hold until it's finished (up to 60 seconds).",
    input: {
      id: z.string().describe("gen-… from start_experience, or test-… from run_test"),
      slug: z.string().optional().describe("The experience, needed for a test"),
      wait: z.number().int().min(0).max(60).optional().describe("Seconds to wait for it to finish"),
    },
    annotations: readOnly,
    run: async ({ id: outcome, slug, wait }, call, ws) => {
      const isTest = outcome.startsWith("test-");
      if (isTest && !slug) throw new ToolError("Pass the experience's slug to read a test.");
      const read = async () =>
        isTest
          ? call("GET", ws(`/experiences/${id(slug!)}/runs/${id(outcome)}`))
          : call("GET", ws(`/generations/${id(outcome)}`));
      const deadline = Date.now() + (wait ?? 0) * 1000;
      let result = await read();
      while ((result.run as RunState | null)?.status === "running" && Date.now() < deadline) {
        await sleep(3000);
        result = await read();
      }
      return result;
    },
  }),
  tool({
    name: "run_test",
    title: "Run Test",
    description:
      "Run an experience without touching Profiles or Analytics: as someone in Profiles (personId) or a made-up person, with the given answers, against the saved config or a draft config you pass. Follow it with get_outcome (id and slug).",
    input: {
      slug: z.string(),
      personId: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      answers: answers.optional(),
      config: z.record(z.string(), z.unknown()).optional().describe("A config to try without saving it"),
    },
    annotations: { ...writes, openWorldHint: true },
    run: ({ slug, ...body }, call, ws) => call("POST", ws(`/experiences/${id(slug)}/tests`), body),
  }),
  tool({
    name: "list_tests",
    title: "List Tests",
    description: "An experience's test runs, newest first, with their answers, status and what they made.",
    input: { slug: z.string() },
    annotations: readOnly,
    run: async ({ slug }, call, ws) => {
      const { tests } = await call("GET", ws(`/experiences/${id(slug)}/tests`));
      return tests.map(({ config: _, ...test }: { config: unknown }) => test);
    },
  }),

  // Context
  tool({
    name: "list_skills",
    title: "List Skills",
    description: "Skills: instructions outcomes can follow, picked per experience and per section.",
    input: {},
    annotations: readOnly,
    run: (_, call, ws) => call("GET", ws("/skills")),
  }),
  tool({
    name: "add_skill",
    title: "Add Skill",
    description: "A new skill. Add its id to an experience's workflow skills (update_experience) to use it.",
    input: { title: z.string(), description: z.string().describe("The instructions, in plain words") },
    annotations: writes,
    run: (args, call, ws) => call("POST", ws("/skills"), args),
  }),
  tool({
    name: "update_skill",
    title: "Update Skill",
    description: "Change a skill's title or instructions.",
    input: { id: z.string(), title: z.string().optional(), description: z.string().optional() },
    annotations: writes,
    run: ({ id: skill, ...fields }, call, ws) => call("PATCH", ws(`/skills/${id(skill)}`), fields),
  }),
  tool({
    name: "delete_skill",
    title: "Delete Skill",
    description: "Delete a skill.",
    input: { id: z.string() },
    annotations: deletes,
    run: (args, call, ws) => call("DELETE", ws(`/skills/${id(args.id)}`)),
  }),
  tool({
    name: "list_files",
    title: "List Files",
    description: "Uploaded images, video and audio, with the URLs to use in an experience's config.",
    input: { kind: z.enum(["image", "video", "audio"]).optional() },
    annotations: readOnly,
    run: ({ kind }, call, ws) => call("GET", ws(kind ? `/files?kind=${kind}` : "/files")),
  }),
];

const instructions = `Loro turns what a brand knows about a person into a personal outcome page, using Qloo's taste data.

- An experience has a start page (sign-up), an intake (questions) and an outcome (sections the workflow writes). It's built from a catalogue's components and saved as one JSON config.
- Profiles are segments and people. Segment and person taste signals steer Qloo's recommendations.
- To make someone an outcome, call start_experience with the experience's slug, the person and their intake answers (get_experience lists the question ids and answer shapes), then get_outcome with wait to read it.
- To change an experience, read it with get_experience, edit the config and send the whole config to update_experience. Try changes with run_test before going live.`;

/* Transport */

function callerFor(c: Context<{ Bindings: Env }>, key: string): Call {
  const origin = new URL(c.req.url).origin;
  return async (method, path, body) => {
    const response = await api.request(
      new URL(path, origin).toString(),
      {
        method,
        headers: { authorization: `Bearer ${key}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      c.env,
      c.executionCtx,
    );
    if (response.status === 204) return undefined;
    const json = (await response.json().catch(() => null)) as { error?: string; errors?: Record<string, string> } | null;
    if (response.ok) return json;
    const fields = Object.entries(json?.errors ?? {})
      .filter(([field]) => field)
      .map(([field, message]) => `${field}: ${message}`);
    throw new ToolError([json?.error ?? `Request failed (${response.status})`, ...fields].join("\n"));
  };
}

function serverFor(call: Call, workspaceId: string) {
  const server = new McpServer(
    { name: "loro", title: "Loro", version: "1.0.0" },
    { instructions, jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  );
  const ws = (path: string) => `/workspaces/${workspaceId}${path}`;
  for (const definition of tools) {
    server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: definition.description,
        inputSchema: definition.input,
        annotations: { title: definition.title, ...definition.annotations },
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await definition.run(args as never, call, ws);
          const text = result === undefined ? "Done." : JSON.stringify(result, null, 2);
          return { content: [{ type: "text" as const, text }] };
        } catch (error) {
          if (error instanceof ToolError) return { isError: true, content: [{ type: "text" as const, text: error.message }] };
          throw error;
        }
      },
    );
  }
  return server;
}

const unauthorized = (message: string) =>
  Response.json({ jsonrpc: "2.0", error: { code: -32001, message }, id: null }, { status: 401 });

export async function handleMcp(c: Context<{ Bindings: Env }>) {
  const key = bearerToken(c.req.header("authorization"));
  if (!key) return unauthorized("Send a Loro API key as a bearer token. Make one under Connect → Keys.");
  const found = await findApiKey(key);
  if (!found) return unauthorized("That API key isn't valid.");

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = serverFor(callerFor(c, key), found.workspaceId);
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
}
