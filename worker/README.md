# Loro

One Cloudflare Worker that serves the admin, the public experience pages and the API.

- **Hono** (`workers/app.ts`) is the Worker entry. It handles `/api/*` and hands every other request to React Router.
- **React Router v8** (framework mode, SSR) renders `/admin/*` and the public pages under `/f/`.
- **Base UI** components via shadcn (`app/admin-components/ui`) and Tailwind v4. The admin is set in Cal Sans; experience pages use their theme's type.

## Develop

```sh
pnpm install
pnpm dev        # applies migrations, then http://localhost:5173
pnpm db:reset   # wipe the local database and reapply the migrations
pnpm typecheck  # wrangler types + react-router typegen + tsc
pnpm deploy     # build and deploy to your Cloudflare account
```

## Layout

```
workers/          Worker entry (Hono), API routes and the MCP server
core/             Shared domain code, used by the API and the routes (*.server.ts: bindings)
core/workflow/    The outcome workflow and the Durable Object that streams each run
migrations/       D1 schema, applied in order
app/              React Router app: routes, components, styles
catalogues/       Component catalogues for the start page, intake and outcome
steps/            Code steps an experience's workflow can run; each file registers itself
experiences/      Code experiences (the Itinerary sample) at /f/<slug>
themes/           Design tokens per theme, applied as data-theme on <html>
```

## Data

All Cloudflare resources are declared in `wrangler.jsonc`. D1, KV and R2 have no IDs, so `pnpm deploy` creates them in your account; locally they live in `.wrangler/state`. Images and Stream are `remote: true`, so even local dev uploads to your real account (log in with `wrangler login`).

- **D1** (`DB`): one database for every workspace; each table's key starts with `workspace_id`. Schema in `migrations/`. A fresh database has no workspaces; create one in the admin, with demo data or without.
- **Cloudflare Images** (`IMAGES`): uploaded images, delivered from `imagedelivery.net`.
- **Stream** (`STREAM`): uploaded video. The browser posts the file straight to a one-time Stream URL, then the row waits until Stream has encoded it.
- **R2** (`AUDIO`): audio only, since Stream takes video. Served at `/files/<workspace>/<id>` with Range support.
- **KV** (`CACHE`): public page data (start page, intake questions) so `/f/:slug` skips D1. Cleared on save; never the source of truth.
- **Workflows** (`OUTCOME`): one durable run per outcome or test. See [Outcome workflow](#outcome-workflow).
- **Durable Objects** (`OUTCOME_ROOMS`): one room per run, holding its live state and streaming it to every open page.
- **Analytics**: each funnel event (page view, new profile, intake started and finished, outcome generated or failed) increments a daily row in D1 `event_counts`, which the Analytics page and each experience's Overview read, and is also written to Analytics Engine (`EVENTS`). No names or emails in either; the `activity` table has those. Workspaces created with demo data get 90 days of sample counts.

Models run through the `AI` binding and AI Gateway; see [Agent](#agent).

Vars, in `wrangler.jsonc`:

- `AI_MODEL`: the agent's model. `AI_GATEWAY`: the gateway every model call goes through.
- `OUTCOME_MODEL`: what writes outcomes, the Taste brief and every generated section (`openai/gpt-5.4-mini`).
- `QLOO_API_URL`: Qloo's API host.
- `APP_HOST` and `PAGES_HOST`: the custom domains. See [Domains](#domains).

Secrets, all optional (`workers/env.d.ts`). Put them in `.dev.vars` locally and set them with `wrangler secret put` for production:

- `QLOO_API_KEY`: without it, Qloo calls return nothing.
- `ADMIN_PASSWORD`: puts the admin behind a sign-in. See [Admin sign-in](#admin-sign-in).
- `CF_ACCOUNT_ID` and `CF_API_TOKEN`: query Analytics Engine (Account Analytics: Read), and let the listing step read sites that turn away a plain fetch through Browser Rendering (Browser Rendering: Edit).

Images and Stream need those products enabled on the account.

Code that touches bindings lives in `*.server.ts` files, so it never ends up in the browser bundle.

## Code experiences

Most experiences are built from a catalogue (below) and saved in D1. A code experience is a single page with sample data: create `experiences/<slug>/index.tsx` and default-export `defineExperience({ meta, schema, fixture, Component })`. It's served at `/f/<slug>` and listed at `GET /api/experiences` without any other wiring, but doesn't appear in the admin. `experiences/itinerary` is the only one.

## Catalogues

An experience has three parts: **start** (landing page and sign-up), **intake** (questions) and **artifact** (the outcome). Start and intake can be off; with the intake off, another system starts the experience by API with the person and their answers.

A catalogue (`catalogues/<id>/index.ts`) lists the components each part can use, plus an optional layout per part. Each component declares its props as fields (`f.text`, `f.longText`, `f.number`, `f.toggle`, `f.segmented`, `f.select`, `f.color`, `f.image`, `f.media`, `f.link`, `f.list`). One field gives the prop's type, a lenient zod schema, and the control the admin shows for it. Intake components made with `defineInput` also declare how their answer is checked; the answer is saved to the profile under the component's id.

The experience itself is JSON: per part, `enabled`, the layout `settings` and an ordered `components: [{ id, type, props }]`. `parseConfig` reads it against the catalogue and `ExperienceRunner` renders and runs it. The engine is in `core/catalogue/`:

- `fields.ts` field kinds; `define.ts` component, layout and catalogue types
- `config.ts` the experience JSON; `flow.ts` the rules (part order, sign-up, answer checks, `{{answers.<id>}}` templates)
- `runner.tsx` state and rendering; it knows nothing about how anything looks

Experiences are saved in D1 (`funnels`: one row per experience, the config as JSON) and served at `/f/<workspace>/<slug>`.

### Headless form SDK

The flow is usable from any design, not just a catalogue's components:

- `useExperience({ catalogue, config, client })` (`core/catalogue/use-experience.ts`) holds the state and rules: `stage`, `optin(person)`, `current` intake component, `setAnswer(id, value)`, `next()` / `back()`, per-field errors, `profile` rows and `fill("{{first_name}}")`. It renders nothing; the catalogue only supplies each input's answer rules.
- `createExperienceClient({ workspace, experience })` (`core/catalogue/client.ts`) talks to the API: `get()`, `optin()`, `submit()`. It works from a browser or a server.
- `ExperienceRunner` is that hook plus the catalogue's own layouts and components. `/f/<workspace>/<slug>/plain` is the same experience in a bare design built only on the hook and client; copy `app/routes/funnel-plain.tsx` to start a new one.

API, under `/api/workspaces/<workspace>/experiences/<slug>`:

- `GET` returns the experience and its config; `GET /questions` its intake as plain data.
- `POST /optin` with `{ name, email }` creates or finds the person by email and starts a submission.
- `POST /submissions` with `{ person, answers, submission }` checks the answers against the experience's intake and completes the sign-up's submission.
- `POST /trigger` with `{ person, answers }` (or `{ personId, answers }` for someone already in Profiles) is how another system starts an experience, with intake on or off: the person is created as Triggered. It needs an API key.
- `POST /feedback` with `{ generation, rating, comment? }` rates an outcome 1–5; rating again replaces it. The widget under every outcome uses it, and so does `client.feedback()`.

Sign-ups and answers land in Profiles: `people`, plus `submissions` (one per person per experience, answers keyed by intake component id) and the `activity` feed. Each finished submission makes a `generations` row (generating, done or error; done straight away while outcomes are static), viewable at `/f/<workspace>/<slug>/g/<id>`. The **Tests** section of each experience's Outcome tab runs it from the admin, as a real profile or with made-up answers, against the editor's config (saved or not). Tests live in their own `tests` table, so they never reach Analytics or Profiles. Inputs describe their answer (`input.shape`: text, one, many or number), which is how the test drawer asks every question on one page without the catalogue's components. The Catalogue Playground (`/admin/settings/catalogues/<id>`, not linked from the admin) edits a catalogue's example without saving; `/admin/settings/components` shows every admin component.

## Outcome workflow

Each finished submission, trigger or test starts a run of `OutcomeWorkflow` (`core/workflow/outcome.server.ts`):

```
code steps "before" → Taste → code steps "after-taste" → each generated section, in page order → Finish → code steps "finish"
```

- Every piece is a `step.do`, so it's retried on its own and never repeated once done. A section that fails is marked and skipped; the rest of the page still arrives.
- **Taste** (`taste.server.ts`) reads the profile, matches the person's favourites in Qloo, runs the experience's lookups (`core/outcome/lookups.ts`) and writes the brief that every section reads.
- **Sections** (`generate.server.ts`) are the outcome's generated components, written with `OUTCOME_MODEL`. They recommend only entities Qloo returned.
- Each step reports to the run's room (`room.server.ts`), a Durable Object that streams the state as server-sent events at `/api/workspaces/<workspace>/experiences/<slug>/runs/<id>/events`. A page opened mid-run gets a snapshot first. Once the run is done, D1 holds the finished copy.
- `useOutcome` (`core/outcome/use-outcome.ts`) follows a run from React: `progress`, `current`, `section(id)`.

Code steps live in `steps/`: a file that default-exports `defineStep({ type, name, description, at, fields, run })` (`core/catalogue/workflow.ts`) shows up in every experience's Workflow. `at` is `"before"`, `"after-taste"` or `"finish"`. `run` gets the person, answers, profile, prompt, brief, earlier output, `ctx.qloo` (search and recommend, with the person's taste built in after Taste) and `ctx.model`. It can return `notes` for the profile, `output` for later steps, `candidates` (with `provides`, so sections can recommend from it), `answers` to fill in, and public `data` for the outcome page. `required: true` stops the run if the step fails. `steps/weather.ts` is the one to copy.

## REST API

`workers/api.ts` mounts the routes in `workers/api/`: workspaces, keys, analytics and activity; segments, people and outcomes; experiences (create, edit, delete, questions, analytics, people, outcomes, feedback, tests); skills and files; agent threads. The admin's Connect page lists every endpoint (`core/settings.ts`, kept in step by hand).

- **Keys** (`core/api-keys.server.ts`): anything that changes a workspace needs one of its keys as `Authorization: Bearer loro_sk_…`. Keys are looked up by SHA-256 hash and also kept in full (migration 0009), so the Connect page can show one again; keys made before that can't be shown. Make them on the admin's Connect page, or over the API once you have one; `POST /api/workspaces` returns the new workspace's first key. Demo workspaces don't take keys.
- **Open**: reads, and what the admin and public pages call from the browser (sign-up, answers after a sign-up, feedback, runs, uploads, the agent chat). With `ADMIN_PASSWORD` set, everything except the public experience routes also needs a key or the admin's sign-in cookie, and listing or creating workspaces needs the sign-in.
- **Errors**: core functions throw their own errors with messages fit to show; `errorResponse` in `workers/api/http.ts` turns them into `{ error }` (400), or `{ error, errors }` per field (422).

## MCP Server

`/mcp` (`workers/mcp.ts`) is a Model Context Protocol server over Streamable HTTP, stateless, so an agent can run a workspace: profiles, experiences, starting one for someone and reading the outcome (`get_outcome` can wait for it). Connect with an API key as `Authorization: Bearer loro_sk_…`; the key picks the workspace.

```sh
claude mcp add --transport http loro http://localhost:5173/mcp --header "Authorization: Bearer loro_sk_..."
```

Each tool is an in-process call to the REST API with the same key, so validation, rules and errors match it. The Connect page lists the tools (`core/settings.ts`, kept in step by hand).

## Agent

`/admin/agent` is a chat over the workspace, built on the [AI SDK](https://ai-sdk.dev) (`streamText` on the Worker, `useChat` in the admin) and the shadcn/ui AI Elements (Message Scroller, Message, Bubble, Trace, Input Group). Replies render with Streamdown.

- **Model** (`core/ai.server.ts`): every call goes through the `AI` binding and the AI Gateway named in `AI_GATEWAY`, so it's logged, cached and rate limited there. `AI_MODEL` picks the model: a gateway catalog model (`anthropic/claude-sonnet-5.5`, the default, or `openai/gpt-5`) billed through unified billing or a key stored on the gateway, or a Workers AI id (`@cf/moonshotai/kimi-k2.6`) that needs no key. Both are `vars` in `wrangler.jsonc`. The binding is always remote, so local dev needs `wrangler login`.
- **Tools** (`core/agent-tools.server.ts`): read segments, people, experiences (questions, 30-day numbers, feedback), analytics and skills. `createSegment` and `addSkill` have `needsApproval`, so the chat shows an Approve / Decline card first; demo workspaces leave them out.
- **Threads** (`core/agent.server.ts`, migration 0007): `agent_threads` and `agent_messages`, the messages as UI parts in JSON. The thread id is in the URL from the start (`?thread=`), and `?attach=segment:<id>` (or `person:`, `experience:`) opens it with that record attached.
- **API**: `POST /api/workspaces/<workspace>/agent/threads/<thread>` with `{ message }` streams the reply as UI message chunks. The browser sends only the new message; the server has the rest, and from a returning assistant message it takes only approval answers.

Outcomes use a separate model, `OUTCOME_MODEL` (`outcomeModel()`), with reasoning kept low, since the person waits on every section. Code steps get it as `ctx.model`. To use either elsewhere, call `languageModel()` or `outcomeModel()` from `core/ai.server.ts` with `generateText` or `streamText`.

## Admin sign-in

Set the `ADMIN_PASSWORD` secret and `/admin` redirects to `/login`. Signing in sets a 30-day cookie holding an expiry and an HMAC of it, keyed by the password (`core/admin-auth.server.ts`). Nothing is stored, and changing the password signs everyone out. Unset, the admin is open. `pnpm dev` never asks, even with the password in `.dev.vars`.

## Domains

With `APP_HOST` and `PAGES_HOST` set (`core/hosts.server.ts`), the admin, API and MCP server answer on one host and the public pages under `/f/` on the other. Page loads on the wrong host redirect to the right one; the pages host still serves `/api` and `/files`. Any other host (localhost, `workers.dev`, a fork without its own domains) serves everything. Add the domains in the Cloudflare dashboard, or clear both vars to turn this off.

## Add a theme

Create `themes/<name>.css` with a `:root[data-theme="<name>"], [data-theme="<name>"]` block that sets the tokens, import it in `themes/index.css`, and reference it from a catalogue's `theme` (or a code experience's `meta.theme`).

## Type

Cal Sans is a variable font with a `GEOM` axis for letterform style: 0 (a11y), 25 (UI), 50 (default) and 100 (geometric). Set `--font-geom` on any element or theme to change it. The admin uses 25. Experience themes set their own faces (`--font-ui`, `--font-display-face`). Optical size is automatic, so small text gets the Text and Micro cuts.
