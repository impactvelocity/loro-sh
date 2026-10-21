/**
 * Docs shown in the admin under Docs. Articles are grouped into sections
 * and written as blocks, so the admin renders them without a Markdown
 * parser. Inline text supports `code` and [links](/admin/docs/slug).
 *
 * Fixtures until the docs move to their own site. The examples match the
 * Itinerary experience's anchor: a Khruangbin show at Moody Center, Austin.
 */

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; code: string; label?: string }
  | { type: "note"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export type DocArticle = {
  slug: string;
  title: string;
  description: string;
  updatedDaysAgo: number;
  body: DocBlock[];
};

export type DocSection = { title: string; articles: DocArticle[] };

export type DocLink = Pick<DocArticle, "slug" | "title" | "description">;

const sections: DocSection[] = [
  {
    title: "Getting Started",
    articles: [
      {
        slug: "introduction",
        title: "What Is Loro",
        description: "Personalised experiences from taste, not guesswork.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Loro turns what someone likes into a page made for them. A guest books a show, answers a few questions, and gets an itinerary built around the artists, places and food they already love.",
          },
          {
            type: "p",
            text: "Taste comes from [Qloo](https://docs.qloo.com). Loro asks the questions, matches the favourites in the answers to Qloo entities, and hands what Qloo finds to a workflow that writes the page.",
          },
          { type: "h2", text: "The Pieces" },
          {
            type: "list",
            items: [
              "**Experiences**: a start page, intake questions and an outcome, built from a catalogue around one thing like a festival or a listing.",
              "**Profiles**: segments you describe once, and the people who arrive through an experience.",
              "**Context**: skills the workflow follows, and the images, video and audio you place on pages.",
              "**Agent**: a chat that reads all of the above, and creates segments and skills once you approve them.",
              "**API and MCP**: a REST API and an MCP server, so your own systems and agents can run a workspace.",
            ],
          },
          { type: "h2", text: "Where It Runs" },
          {
            type: "p",
            text: "Loro is open source and runs as one Cloudflare Worker in your own account, with every workspace in one database. See [Self-Hosting](/admin/docs/self-hosting) to deploy your own.",
          },
        ],
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        description: "Publish your first experience in about ten minutes.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "This walks through a festival guide. The same steps work for a hotel stay or a listing.",
          },
          { type: "h2", text: "1. Create The Experience" },
          {
            type: "p",
            text: "Go to Experiences and choose New Experience. Name it and pick a catalogue, like Festival, Road Trip, Property or Stay. It starts as a draft copy of the catalogue's example.",
          },
          { type: "h2", text: "2. Edit The Parts" },
          {
            type: "p",
            text: "The Start, Intake and Outcome tabs each list their components, with a phone preview beside them. Turn Start and Intake off if another system will start the experience instead; see [Triggers](/admin/docs/triggers).",
          },
          {
            type: "p",
            text: "On the Outcome tab, open **Workflow Settings** and write the prompt: what the experience is, where and when. Every model call in the run reads it.",
          },
          { type: "h2", text: "3. Run A Test" },
          {
            type: "p",
            text: "On the Outcome tab, open **Tests** and choose New Test. Run it as one of your people or with answers you make up. Tests use what's in the editor, saved or not, and stay out of Profiles and Analytics.",
          },
          { type: "h2", text: "4. Go Live" },
          {
            type: "p",
            text: "Set the status to Live on the Settings tab, then copy the link or QR code from Share.",
          },
          {
            type: "note",
            text: "A draft's link already works, so you can try it end to end. A paused experience keeps its link but shows a closed notice, and can't be started.",
          },
        ],
      },
      {
        slug: "self-hosting",
        title: "Self-Hosting",
        description: "Deploy Loro to your own Cloudflare account.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "You need a Cloudflare account with Images and Stream turned on, Node 22 and pnpm. Loro keeps its data in D1, caches public pages in KV, stores uploads in Images, Stream and R2 (audio), runs outcomes on Workflows and Durable Objects, and calls models through Workers AI and AI Gateway.",
          },
          {
            type: "p",
            text: "None of these need IDs in `wrangler.jsonc`: the first deploy creates them in your account.",
          },
          { type: "h2", text: "Install" },
          {
            type: "code",
            label: "Terminal",
            code: "git clone https://github.com/impactvelocity/loro-sh\ncd loro-sh/worker\npnpm install",
          },
          { type: "h2", text: "Add Secrets" },
          {
            type: "p",
            text: "Store your Qloo key as a Worker secret. It never reaches the browser.",
          },
          { type: "code", label: "Terminal", code: "pnpm wrangler secret put QLOO_API_KEY" },
          {
            type: "p",
            text: "Set an admin password, or anyone with the URL can change your workspaces and chat with the agent. With one, `/admin` opens view only: visitors can read everything in it, profiles included, but saving, adding, deleting and the agent need the password. Run the same command again to change it; that puts everyone back to view only.",
          },
          { type: "code", label: "Terminal", code: "pnpm wrangler secret put ADMIN_PASSWORD" },
          {
            type: "p",
            text: "Two more are optional: `CF_ACCOUNT_ID` and `CF_API_TOKEN`. With them, Analytics reads Workers Analytics Engine (the token needs Account Analytics: Read), and the Agency catalogue's listing step can read sites that block a plain fetch through Browser Rendering (Browser Rendering: Edit).",
          },
          {
            type: "p",
            text: "For local dev, put the same values in `.dev.vars`. `pnpm dev` never asks for the admin password.",
          },
          { type: "h2", text: "Deploy" },
          { type: "code", label: "Terminal", code: "pnpm run deploy" },
          {
            type: "p",
            text: "That builds the app, deploys the Worker and applies the database migrations. Wrangler prints the Worker's URL; open `/admin` on it and create your first workspace. Choose demo data to start with sample profiles, skills, files and 90 days of analytics.",
          },
          { type: "h2", text: "Models" },
          {
            type: "p",
            text: "`OUTCOME_MODEL` in `wrangler.jsonc` writes outcomes and `AI_MODEL` runs the [Agent](/admin/docs/agent). Both go through the AI Gateway named in `AI_GATEWAY`, which is created on first use. Local dev calls the real models too, so run `wrangler login` first.",
          },
          { type: "h2", text: "Custom Domains" },
          {
            type: "p",
            text: "Set `APP_HOST` and `PAGES_HOST` in `wrangler.jsonc` to put the admin, API and MCP server on one domain and the public pages on another, then add both domains to the Worker in the Cloudflare dashboard. A page opened on the wrong one redirects to the right one. Any other host serves everything, so `workers.dev` and localhost keep working. Clear both to serve everything from one domain.",
          },
        ],
      },
    ],
  },
  {
    title: "Experiences",
    articles: [
      {
        slug: "experiences",
        title: "How Experiences Work",
        description: "Catalogues, parts and the path from sign-up to page.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Every experience is built from a catalogue, like Festival or Property, which sets the components it can use and how they look. It has three parts: the **start** page with the sign-up, the **intake** questions, and the **outcome**. Its prompt, in Workflow Settings, says what it's built around: the show, the listing, the stay.",
          },
          {
            type: "p",
            text: "Start and intake can be turned off. Then another system starts the experience with the person and their answers; see [Triggers](/admin/docs/triggers).",
          },
          { type: "h2", text: "From Visit To Page" },
          {
            type: "list",
            ordered: true,
            items: [
              "Someone lands on the start page at `/f/:workspace/:slug`.",
              "They sign up and answer the intake questions.",
              "Their answers are saved to their profile.",
              "The [workflow](/admin/docs/workflows) matches their favourites in Qloo and writes the outcome.",
              "They watch it fill in at `/f/:workspace/:slug/g/:id`, a link they can come back to.",
            ],
          },
          { type: "h2", text: "Tabs" },
          {
            type: "table",
            head: ["Tab", "What it's for"],
            rows: [
              ["Overview", "The last 30 days: the funnel, outcomes and people"],
              ["Start, Intake", "Components and their settings, with a phone preview"],
              ["Outcome", "The workflow and its sections, Workflow Settings, and Tests"],
              ["Feedback", "Ratings and comments, and the rating widget's settings"],
              ["Share", "The link, a QR code and code for your own front end"],
              ["Settings", "Name, status, and delete"],
            ],
          },
          { type: "h2", text: "Statuses" },
          {
            type: "table",
            head: ["Status", "Link", "Can be started"],
            rows: [
              ["Draft", "Works, so you can test it", "Yes"],
              ["Live", "Open to anyone", "Yes"],
              ["Paused", "Shows a closed notice", "No"],
            ],
          },
        ],
      },
      {
        slug: "intake",
        title: "Intake Questions",
        description: "Ask less, learn more: questions that become signals.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Intake is what you ask before the outcome is made. Each answer is saved to the person's profile under its question's id. When the run starts, Taste reads the whole profile and picks out named favourites, like artists, places and brands, to match in Qloo. A question that asks for names gives it something to match.",
          },
          {
            type: "p",
            text: "Each question checks its own answer, so a required question can't be skipped and a choice has to be one of its options. The same rules apply when answers come in by API.",
          },
          { type: "h2", text: "Good Questions" },
          {
            type: "list",
            items: [
              "Ask for names, not adjectives: \"An artist you'd travel for\" beats \"What music do you like?\"",
              "Keep it under a minute. Four questions is plenty.",
              "Make one question optional and open, for anything the others miss.",
            ],
          },
          {
            type: "note",
            text: "People you add yourself skip intake. Add their favourites on their profile page, or press **Start Experience** there and fill in the answers for them.",
          },
        ],
      },
      {
        slug: "workflows",
        title: "Workflows",
        description: "The steps that turn finished answers into an outcome.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "When someone finishes the questions (or another system posts their answers), a workflow run makes their outcome. Each step is retried on its own, and the outcome page fills in as steps finish. Set it up on an experience's **Outcome** tab, where the steps sit around the sections.",
          },
          { type: "h2", text: "The Steps" },
          {
            type: "list",
            ordered: true,
            items: [
              "**Code steps before Taste**: optional, from `steps/` in your repo. They can add notes to the profile, like the weekend's forecast.",
              "**Taste**: reads the profile, matches their favourites in Qloo, then runs each lookup (below).",
              "**Code steps after Taste**: optional. They see the brief, and can find their own candidates in Qloo.",
              "**Sections**: each generated section on the Outcome tab, in page order. Each one sees what earlier sections said, so nothing repeats.",
              "**Finish**: saves the outcome and marks it ready.",
              "**Code steps after Finish**: run in the background, like a webhook to your CRM.",
            ],
          },
          { type: "h2", text: "Lookups" },
          {
            type: "p",
            text: "A lookup is one Qloo search Taste runs for each person, set in Workflow Settings: bars near their hotel, dinner near the venue, music they'd like. Each one sets what it finds, where (in a city, near a set place like the venue, or near a place named in one of their answers), the kinds of place, popularity, price and opening day.",
          },
          {
            type: "p",
            text: "Results are ranked by the person's weighted favourites: what they told us and their segment's favourites, each Off, Low, Medium or High. A lookup can also steer by names everyone shares, like the band that's playing. Sections that recommend things pick their lookups under **From**.",
          },
          { type: "h2", text: "Qloo in Code Steps" },
          {
            type: "p",
            text: "Code steps get `ctx.qloo`, with the person's taste built in once Taste has run. A step that sets `provides` returns `candidates`, and sections can pick it under From like a lookup: a road trip step can find stops along a route.",
          },
          {
            type: "code",
            label: "steps/stops.ts",
            code: 'export default defineStep({\n  type: "stops", name: "Stops on the Way", at: "after-taste", provides: "place", fields: {},\n  async run(props, { qloo }) {\n    const venue = await qloo.search("Moody Center", "place", "Austin, TX");\n    const bars = await qloo.recommend({ type: "place", near: { ...venue!.location!, radiusKm: 1.5 }, kinds: ["bar"] });\n    return { candidates: bars };\n  },\n});',
          },
          { type: "h2", text: "Writing a Code Step" },
          {
            type: "p",
            text: "A file in `steps/` that default-exports `defineStep` shows up in every experience's workflow; `steps/weather.ts` is a good one to copy. `at` sets when it runs: `before`, `after-taste` or `finish`. Its `fields` are the settings the admin shows when you add it.",
          },
          {
            type: "p",
            text: "`run` gets the person, their answers, the prompt, the brief once Taste has run, earlier steps' output, `ctx.qloo` and `ctx.model`, the outcome model. It can return:",
          },
          {
            type: "list",
            items: [
              "`notes`: lines added to the profile the run is written from (before Taste).",
              "`answers`: answers filled in for the rest of the run where the person's are empty, like a listing's address read from its link.",
              "`output`: passed to later steps and to every section.",
              "`candidates`: what sections that pick this step under From recommend from (with `provides`).",
              "`data`: shown on the outcome page, which anyone with the link can open, so nothing private.",
              "`skipped`: it didn't apply this time. It shows as skipped, not failed.",
            ],
          },
          {
            type: "p",
            text: "A step that fails is retried, then the run carries on without it. Set `required: true` for a step the page can't be true without, and the run stops instead.",
          },
          { type: "h2", text: "What Sections Are Written From" },
          {
            type: "p",
            text: "Every section gets the experience's prompt, the person's answers, their segment, your team's notes, and the Taste brief. Sections can only recommend real things Qloo found for them, so every place, artist or film on the page exists.",
          },
          {
            type: "p",
            text: "Skills from [Context](/admin/docs/skills) can be set for the whole experience in Workflow Settings on the Outcome tab, or for one section in its settings.",
          },
          { type: "h2", text: "Listening From Your Own Front End" },
          {
            type: "code",
            label: "React",
            code: 'const outcome = useOutcome({ url: client.runUrl(generation), initial: run });\noutcome?.progress;            // { done: 2, total: 5 }\noutcome?.current?.message;    // "Finding bars around Austin, TX"\noutcome?.section("plan");     // { status, data, error }',
          },
        ],
      },
    ],
  },
  {
    title: "Profiles",
    articles: [
      {
        slug: "segments",
        title: "Segments",
        description: "Describe an audience once and reuse it everywhere.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "A segment is a group you describe once, like \"Austin locals who follow indie and psych rock\": a name and description, the ages, gender and location Qloo uses as demographics, and taste signals for the things the group already loves.",
          },
          {
            type: "p",
            text: "A person can belong to one segment. Taste ranks every lookup by their own favourites and their segment's, each at the weight the lookup sets, so a new sign-up gets a good page before they've said much.",
          },
          {
            type: "note",
            text: "Edit a segment and every member's next outcome picks up the change. Deleting a segment keeps its people.",
          },
        ],
      },
      {
        slug: "individuals",
        title: "Individuals",
        description: "The three ways a person arrives in Loro.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "table",
            head: ["Source", "How", "Intake"],
            rows: [
              ["Sign-up", "Signs up on a start page", "They answer it"],
              ["Triggered", "An API call after a booking or purchase", "Answers come with the call"],
              ["Owner-created", "You add them in the admin or with the API", "Skipped"],
            ],
          },
          {
            type: "p",
            text: "People are matched by email, so someone who signs up twice is one profile. Anyone in Profiles can be started on an experience from their page with **Start Experience**, or by API with their `personId`; they keep their original source.",
          },
          {
            type: "p",
            text: "Each profile shows its signals, its segment and every experience generated for it. See [Triggers](/admin/docs/triggers) to create profiles from your booking system.",
          },
        ],
      },
      {
        slug: "taste-signals",
        title: "Taste Signals",
        description: "The entity types Qloo understands.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "A signal is a named thing someone likes, with a type. Qloo resolves it to an entity and finds what else people with that taste tend to like. You add signals to segments and people in Profiles; Taste also picks favourites out of each person's answers when a run starts.",
          },
          {
            type: "table",
            head: ["Type", "In the API"],
            rows: [
              ["Artist", "`artist`"],
              ["Place", "`place`"],
              ["Brand", "`brand`"],
              ["Film", "`movie`"],
              ["TV show", "`tv_show`"],
              ["Book", "`book`"],
              ["Podcast", "`podcast`"],
              ["Destination", "`destination`"],
            ],
          },
          {
            type: "code",
            label: "Signal",
            code: '{ "type": "artist", "name": "Khruangbin" }',
          },
        ],
      },
    ],
  },
  {
    title: "Context",
    articles: [
      {
        slug: "skills",
        title: "Skills",
        description: "House rules the workflow follows when it writes.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "A skill is a short instruction with a title and a description. Pick skills for a whole experience in Workflow Settings on the Outcome tab, or for one section in its settings. Every section written with a skill gets its full text, so if it only applies sometimes, say when in the description.",
          },
          {
            type: "p",
            text: "A line that starts with \"Never write:\" followed by a list of phrases is checked: a section that uses one of them gets a quick edit to take it out.",
          },
          { type: "h2", text: "Example" },
          {
            type: "code",
            label: "Rain plan",
            code: "If the forecast for the show date shows rain, swap outdoor stops for\ncovered ones within a 10 minute walk of Moody Center.",
          },
          {
            type: "p",
            text: "Write skills the way you'd brief a new hire. The [Agent](/admin/docs/agent) can draft them from a conversation.",
          },
        ],
      },
      {
        slug: "media",
        title: "Images And Media",
        description: "Photos, video and audio for your pages.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Upload venue photos, maps or a walkthrough video on the Context page. Then pick them in any image or media field on an experience's Start, Intake or Outcome tab, or paste a URL there instead.",
          },
          {
            type: "table",
            head: ["Kind", "Stored in", "Notes"],
            rows: [
              ["Image", "Cloudflare Images", "Give each one a name and alt text"],
              ["Video", "Cloudflare Stream", "Usable once Stream has finished processing it"],
              ["Audio", "R2", "Served from `/files/:workspace/:id`"],
            ],
          },
          {
            type: "p",
            text: "Files are public, like the pages that show them. `GET /api/workspaces/:workspace/files` lists them, with each image's alt text.",
          },
        ],
      },
      {
        slug: "agent",
        title: "Agent",
        description: "Ask about your workspace, and have it draft segments and skills.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "The agent reads your segments, people, experiences, analytics and skills. Ask which experience finishes intake best, who signed up this week, or to suggest a segment from the people you have. It shows each lookup as a line above its answer; open one to see what came back.",
          },
          {
            type: "p",
            text: "Use **+** in the message field to attach a segment, person or experience, or press **Ask Agent** on its page. The agent reads what you attached before it answers.",
          },
          { type: "h2", text: "Changes Need Your Approval" },
          {
            type: "p",
            text: "The agent can create a segment or add a skill, but only after you press Approve on the card it shows. Decline and it asks what to change. Demo workspaces are read-only, so there it only reads.",
          },
          { type: "h2", text: "Threads" },
          {
            type: "p",
            text: "Each conversation is a thread, saved with the workspace. Pick one from the menu at the top, start another with **New Thread**, or delete it. Deleting a thread keeps anything the agent created.",
          },
          { type: "h2", text: "Models" },
          {
            type: "p",
            text: "Every call goes through the Worker's AI binding and [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/), which logs, caches and rate limits it. `AI_MODEL` in `wrangler.jsonc` picks the agent's model and `AI_GATEWAY` the gateway. Outcomes are written by a separate model, `OUTCOME_MODEL` (`openai/gpt-5.4-mini`), since the person waits on every section.",
          },
          {
            type: "table",
            head: ["AI_MODEL", "Billing"],
            rows: [
              ["`anthropic/claude-sonnet-5.5` (default)", "AI Gateway unified billing, or your Anthropic key stored on the gateway."],
              ["`openai/gpt-5`", "AI Gateway unified billing, or your OpenAI key stored on the gateway."],
              ["`@cf/moonshotai/kimi-k2.6`", "Workers AI, on your Cloudflare account. No key."],
            ],
          },
          {
            type: "note",
            text: "Local dev calls the real models too, so run `wrangler login` first. Set `ADMIN_PASSWORD` and rate limits on the gateway before you share a deployment: without the password, anyone with the URL can chat with the agent.",
          },
        ],
      },
    ],
  },
  {
    title: "Developers",
    articles: [
      {
        slug: "api",
        title: "REST API",
        description: "Manage workspaces, profiles and experiences over HTTP.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Everything in a workspace is under `/api/workspaces/:workspace`. Anything that changes the workspace needs one of its API keys, sent as a bearer token. Make keys under Connect → Keys, where you can view or revoke them later.",
          },
          {
            type: "code",
            label: "Request",
            code: 'curl -X POST https://your-worker.workers.dev/api/workspaces/acme/segments \\\n  -H "Authorization: Bearer loro_sk_..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{ "name": "Weekend regulars" }\'',
          },
          {
            type: "p",
            text: "`POST /api/workspaces` makes a workspace without a key and returns its first one. Updates only need the fields that change. Errors come back as `{ error }`, plus `{ errors }` keyed by field when the input is wrong.",
          },
          { type: "h2", text: "What's Open" },
          {
            type: "p",
            text: "Without an admin password, reads are open, like the admin. With `ADMIN_PASSWORD` set, every route needs a key or a browser that has unlocked the admin, except what a public experience page calls: the experience and its questions, sign-up, answers, feedback and following a run. Listing and creating workspaces then needs the admin unlocked.",
          },
          { type: "h2", text: "Endpoints" },
          {
            type: "table",
            head: ["Area", "Paths", "Does"],
            rows: [
              ["Workspace", "/, /keys, /analytics, /activity", "Settings, keys, counts and the activity feed"],
              ["Profiles", "/segments, /people, /generations/:id", "Segments, people and their outcomes"],
              ["Experiences", "/experiences, /experiences/:slug", "Create, edit, delete, plus questions, analytics, people, outcomes and feedback"],
              ["Running", "/experiences/:slug/trigger, /optin, /submissions, /runs/:id", "Start an experience and follow its outcome"],
              ["Tests", "/experiences/:slug/tests", "Run it without touching Profiles or Analytics"],
              ["Context", "/skills, /files, /videos", "Skills and uploads"],
              ["Agent", "/agent/threads", "Threads, and messages that stream a reply"],
            ],
          },
          {
            type: "note",
            text: "The API tab on the Connect page lists every endpoint and which ones need a key. Demo workspaces don't take keys, so the API can't change them.",
          },
        ],
      },
      {
        slug: "triggers",
        title: "Triggers",
        description: "Start an experience when something happens elsewhere.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Call the trigger endpoint after a booking, ticket sale or purchase. Loro creates or finds the profile by email, saves the answers you already know and starts the outcome. With the questions turned off, it's the only way in.",
          },
          {
            type: "code",
            label: "POST /api/workspaces/:workspace/experiences/:slug/trigger",
            code: '{\n  "person": { "name": "Sam", "email": "sam@example.com" },\n  "answers": { "occasion": "A friend in town" }\n}',
          },
          {
            type: "p",
            text: "Send `personId` instead of `person` for someone already in Profiles. `GET …/experiences/:slug/questions` lists the answers it takes and which are required. Answers are checked against the questions even when intake is off, and a paused experience can't be triggered.",
          },
          {
            type: "p",
            text: "The response has the person, the outcome's id and `links`: the outcome page, the run to poll, and its event stream, which sends a snapshot and then every change as the outcome is written.",
          },
          {
            type: "note",
            text: "Triggers need an API key, so keep the call on your server. Each one runs the outcome workflow, which calls Qloo and the model.",
          },
        ],
      },
      {
        slug: "mcp",
        title: "MCP Server",
        description: "Let Claude and other agents run your workspace.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Loro serves the Model Context Protocol at `/mcp`. Connect with an API key from Connect → Keys: the key picks the workspace, and the agent can do whatever the key can, from adding segments to starting an experience for someone and reading their outcome.",
          },
          {
            type: "code",
            label: "Claude Code",
            code: 'claude mcp add --transport http loro https://your-worker.workers.dev/mcp \\\n  --header "Authorization: Bearer loro_sk_..."',
          },
          {
            type: "code",
            label: "Client config",
            code: '{\n  "mcpServers": {\n    "loro": {\n      "type": "http",\n      "url": "https://your-worker.workers.dev/mcp",\n      "headers": { "Authorization": "Bearer loro_sk_..." }\n    }\n  }\n}',
          },
          { type: "h2", text: "Tools" },
          {
            type: "table",
            head: ["Area", "Tools"],
            rows: [
              ["Workspace", "get_workspace, update_workspace, get_analytics, list_activity, list_catalogues, get_catalogue"],
              ["Profiles", "list, get, create, update and delete for segments and people"],
              ["Experiences", "list, get, create, update and delete, plus get_experience_results"],
              ["Running", "start_experience, get_outcome (it can wait for the outcome to finish), run_test, list_tests"],
              ["Context", "list_skills, add_skill, update_skill, delete_skill, list_files"],
            ],
          },
          {
            type: "note",
            text: "Each tool calls the REST API with the same key, so the rules and errors are the same. start_experience and run_test call Qloo and the model, so each costs a little.",
          },
        ],
      },
      {
        slug: "analytics",
        title: "Analytics",
        description: "What's counted, and for how long.",
        updatedDaysAgo: 0,
        body: [
          {
            type: "p",
            text: "Loro counts page views, new profiles, intakes started and finished, and outcomes made or failed. Each is a daily count per experience in D1, so Analytics works locally and on a fresh deploy. No names or emails are counted; the activity feed has those. Tests are never counted.",
          },
          {
            type: "p",
            text: "Every metric is split by source: sign-up, triggered or owner-created. Owner-created profiles skip intake, so they don't count toward intake completion.",
          },
          {
            type: "p",
            text: "Each event is also written to Workers Analytics Engine, which keeps 90 days. Ranges are 7, 30 or 90 days to match, so the 90 day view has no previous period to compare against.",
          },
        ],
      },
    ],
  },
];

const articles = sections.flatMap((section) => section.articles);

const link = ({ slug, title, description }: DocArticle): DocLink => ({ slug, title, description });

/** Sections with article titles only, for the sidebar and the overview. */
export function listDocs() {
  return sections.map((section) => ({ title: section.title, articles: section.articles.map(link) }));
}

export function getDoc(slug: string) {
  const index = articles.findIndex((article) => article.slug === slug);
  if (index === -1) return null;
  const article = articles[index];
  return {
    article,
    section: sections.find((section) => section.articles.includes(article))!.title,
    previous: index > 0 ? link(articles[index - 1]) : null,
    next: index < articles.length - 1 ? link(articles[index + 1]) : null,
  };
}

/** Anchor ids for h2 blocks, so the outline can link to them. */
export const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
