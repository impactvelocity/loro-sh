import type { ReactNode } from "react";
import { PageIcon } from "@/components/home/icons";
import { Bar, Dot, FeatureCard, Panel, Tick } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { cx } from "@/components/ui";

const points = [
  {
    title: "Custom Components",
    body: "Any section is a React component with its own fields: a photo gallery, a lineup, an FAQ. Group them into a catalogue and the brand chooses every section on every page.",
    art: <ComponentsArt />,
    wide: true,
  },
  {
    title: "Edit Without a Developer",
    body: "Each component’s fields become an editor in the admin. The team changes copy, questions and images, then tests the draft before it goes live.",
    art: <EditArt />,
  },
  {
    title: "Drag-and-Drop Editing",
    body: "Sections and questions drag into order on the landing page, intake form and outcome. A phone preview beside the editor shows each change as it’s made.",
    art: <DragArt />,
  },
  {
    title: "A Library for Photos and Video",
    body: "Logos, photos and video upload once to the brand’s library, and every experience picks from it. Cloudflare Images serves the pictures and Cloudflare Stream plays the video.",
    art: <MediaArt />,
  },
  {
    title: "On Brand, Down to the Type",
    body: "The brand’s colours, typefaces and layout on every page. Mirage Valley’s pages look nothing like Low Tide House’s.",
    art: <ThemesArt />,
  },
  {
    title: "Custom Steps",
    body: "Tools the agent runs between taste and writing. Call any API, then ask Qloo for places along the way, the way the road trip plans its stops.",
    art: <StepArt />,
  },
  {
    title: "Skills",
    body: "Write the brand’s rules once, in plain English, and the agent follows them on every page: how it sounds, what it can promise, what it always mentions.",
    art: <SkillsArt />,
  },
  {
    title: "Test Runs Before Launch",
    body: "Run the unsaved draft as a made-up customer or a real profile, through Qloo and the model, and watch the page write itself. Tests stay out of Profiles and Analytics.",
    art: <TestsArt />,
  },
  {
    title: "Ratings on Every Outcome",
    body: "Customers rate their page from “Not for me” to “Spot on”, with an optional comment. The brand sees which pages miss, changes the prompt and runs a test.",
    art: <RatingArt />,
  },
  {
    title: "Agent Chat Across the Workspace",
    body: "Ask about segments, people and experiences, or press Ask Agent on any of those pages to talk about that one. The agent reads 30-day numbers and ratings, drafts segments and asks before it saves.",
    art: <AgentArt />,
  },
  {
    title: "31 MCP Tools for Any Agent",
    body: "One command connects Claude Code. It can build an experience, test the draft, read the page and fix the prompt without opening the admin, then start a page for anyone in Profiles.",
    art: <McpArt />,
  },
];

export function Flexible() {
  return (
    <Section
      id="flexible"
      title="Built to Be Extended"
      align="center"
      intro={
        <p>
          Every demo here runs on the same core and the same agent. Each new experience is a catalogue, a theme and a few
          skills, so a brand can start with one and add the next when it&rsquo;s ready.
        </p>
      }
    >
      <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {points.map((p) => (
          <FeatureCard
            key={p.title}
            art={p.art}
            title={p.title}
            body={p.body}
            className={p.wide ? "md:col-span-2" : undefined}
          />
        ))}
      </ul>
    </Section>
  );
}

/** A catalogue of components, drawn in one colour: three from the demos, and room for the next. */
function ComponentsArt() {
  const tiles = [
    {
      tag: "<Gallery />",
      preview: (
        <div className="grid h-full grid-cols-2 gap-1.5 p-3">
          <span className="row-span-2 rounded-md bg-accent-soft" />
          <span className="rounded-md bg-muted" />
          <span className="rounded-md bg-muted" />
        </div>
      ),
    },
    {
      tag: "<Lineup />",
      preview: (
        <div className="flex h-full flex-col justify-center gap-2 px-3">
          {["w-12", "w-9", "w-11"].map((w, i) => (
            <div key={w} className="flex items-center gap-1.5">
              <span className={cx("size-3.5 shrink-0 rounded-full", i === 0 ? "bg-accent" : "bg-cream")} />
              <span className={cx("h-1.5 rounded-full", i === 0 ? "bg-[#cfcaea]" : "bg-cream", w)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      tag: "<Faq />",
      preview: (
        <div className="flex h-full flex-col justify-center divide-y divide-hairline px-3">
          {[true, false, false].map((open, i) => (
            <div key={i} className="py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={cx("h-1.5 rounded-full", open ? "w-12 bg-ink/60" : "w-10 bg-cream")} />
                <span className={cx("text-[10px] leading-none", open ? "text-accent-hover" : "text-stone")}>
                  {open ? "−" : "+"}
                </span>
              </div>
              {open ? <span className="mt-1.5 block h-1 w-14 rounded-full bg-cream" /> : null}
            </div>
          ))}
        </div>
      ),
    },
  ];
  return (
    <div className="flex items-start justify-center gap-3">
      {tiles.map((t, i) => (
        <div
          key={t.tag}
          className="flex flex-col items-center gap-2 transition-[translate] duration-300 group-hover:-translate-y-1.5"
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <div className="size-24 overflow-hidden rounded-2xl border border-hairline bg-white sm:size-28">{t.preview}</div>
          <span className="font-mono text-[10.5px] text-slate">{t.tag}</span>
        </div>
      ))}
      <div className="hidden flex-col items-center gap-2 sm:flex">
        <div className="flex size-28 items-center justify-center rounded-2xl border border-dashed border-[#cfcac5] text-2xl text-stone transition-colors duration-300 group-hover:border-accent group-hover:text-accent-hover">
          +
        </div>
        <span className="font-mono text-[10.5px] text-quiet">Your own</span>
      </div>
    </div>
  );
}

/** The editor the fields become, with a test before anything goes live. */
function EditArt() {
  return (
    <Panel className="w-full max-w-[230px] space-y-2.5 p-3.5">
      <Field label="Headline">
        <Bar className="w-4/5 bg-[#d8d4cf]" />
      </Field>
      <Field label="Button">
        <span className="text-[10.5px] text-ink">Plan my drive</span>
      </Field>
      <div className="flex items-center justify-between pt-0.5">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] text-quiet">Draft</span>
        <span className="rounded-full bg-accent-deep px-2.5 py-1 text-[10px] text-white transition-colors duration-300 group-hover:bg-accent-hover">
          Test draft
        </span>
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[9.5px] text-quiet">{label}</p>
      <div className="mt-1 flex h-6 items-center rounded-md border border-hairline bg-ground/60 px-2">{children}</div>
    </div>
  );
}

/** A step, trimmed to the four lines that matter. */
function StepArt() {
  const k = "text-[#b4b4e6]";
  const s = "text-[#f2c58a]";
  return (
    <div className="w-full max-w-[250px] overflow-hidden rounded-2xl border border-white/10 bg-deep shadow-[0_20px_40px_-20px_rgb(30_35_40/0.6)] transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="border-b border-white/10 px-3.5 py-2 font-mono text-[10px] text-white/50">steps/my-step.ts</div>
      <pre className="px-3.5 py-3 font-mono text-[10.5px] leading-[1.75] text-white/85">
        <code>
          defineStep({"{"}
          {"\n"}
          {"  "}at: <span className={s}>&quot;after-taste&quot;</span>,{"\n"}
          {"  "}
          <span className={k}>async</span> run(props, ctx) {"{"}
          {"\n"}
          {"    "}
          <span className={k}>return</span> ctx.qloo.recommend(&hellip;){"\n"}
          {"  "}
          {"}"},{"\n"}
          {"}"})
        </code>
      </pre>
    </div>
  );
}

/** Two of the demo brands side by side, each in its own colours and type. Flat swatches. */
function ThemesArt() {
  const brands = [
    {
      name: "Mirage Valley",
      // The festival's own desert theme: plum, the sky's magenta and orange, the sun.
      card: "text-[oklch(0.29_0.075_318)]",
      type: "font-serif italic",
      palette: ["oklch(0.29 0.075 318)", "oklch(0.5 0.16 352)", "oklch(0.63 0.175 40)", "oklch(0.84 0.135 76)"],
    },
    {
      name: "Low Tide House",
      card: "text-[#1d4b4b]",
      type: "font-sans font-medium tracking-tight",
      palette: ["#1d4b4b", "#5e9c94", "#c9a46b", "#e3eeea"],
    },
  ];
  return (
    <div className="flex gap-2.5 transition-[translate] duration-300 group-hover:-translate-y-1">
      {brands.map((b) => (
        <div key={b.name} className={cx("flex w-[7.5rem] flex-col rounded-2xl border border-hairline bg-white p-3", b.card)}>
          <p className={cx("text-[22px] leading-none", b.type)}>Aa</p>
          <p className={cx("mt-3 text-[12px] leading-tight", b.type)}>{b.name}</p>
          <div className="mt-2.5 flex gap-1">
            {b.palette.map((c) => (
              <span key={c} className="size-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rules a brand would actually write, switched on. */
function SkillsArt() {
  const skills = ["Brand Voice", "Point at Real Places", "Always Mention Parking"];
  return (
    <Panel className="w-full max-w-[230px] divide-y divide-hairline">
      {skills.map((s) => (
        <div key={s} className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-ink">
          <PageIcon className="size-3.5 shrink-0 text-accent-hover" />
          <span className="flex-1">{s}</span>
          <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Tick className="size-2" />
          </span>
        </div>
      ))}
    </Panel>
  );
}

/** Outcome sections in the editor, one being dragged, beside the phone preview. Hover the card and it settles. */
function DragArt() {
  const row =
    "flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2.5 text-[11px] text-ink shadow-[0_8px_16px_-12px_rgb(40_50_60/0.25)]";
  return (
    <div className="flex w-full max-w-[290px] items-center gap-4 transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="flex-1 space-y-2">
        <div className={row}>
          <Grip />
          Cover
        </div>
        <div
          className={cx(
            row,
            "translate-x-2 transition-[translate] duration-300 group-hover:translate-x-0",
          )}
        >
          <Grip />
          Your Locals
        </div>
        <div className={row}>
          <Grip />
          Your Days
        </div>
      </div>
      <div className="w-[72px] shrink-0 rounded-[14px] border border-hairline bg-white p-1.5 shadow-[0_16px_32px_-16px_rgb(40_50_60/0.25)]">
        <span className="block h-8 rounded-md bg-[linear-gradient(160deg,#a9bfa0,#6f8b67)]" />
        <div className="mt-1.5 space-y-1 px-0.5">
          <Bar className="w-4/5" />
          <div className="grid grid-cols-2 gap-0.5">
            <span className="h-4 rounded-sm bg-muted" />
            <span className="h-4 rounded-sm bg-muted" />
          </div>
        </div>
        <div className="mt-1.5 space-y-1 px-0.5 pb-0.5">
          <Bar className="w-full" />
          <Bar className="w-2/3" />
        </div>
      </div>
    </div>
  );
}

function Grip() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="size-0.5 rounded-full bg-[#b9b4ae]" />
      ))}
    </span>
  );
}

/** A photo in the library: the demo's colours under a hill and a sun. */
function Photo({ bg }: { bg: string }) {
  return (
    <span className={cx("relative aspect-square overflow-hidden rounded-lg", bg)}>
      <svg viewBox="0 0 40 40" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
        <circle cx="28" cy="13" r="4" fill="white" fillOpacity="0.55" />
        <path d="M0 40V29l10-8 9 7 8-5 13 10v7Z" fill="white" fillOpacity="0.3" />
      </svg>
    </span>
  );
}

/** The brand's library: two photos, a video from Stream, and the next upload on its way. */
function MediaArt() {
  return (
    <Panel className="w-full max-w-[260px] p-3">
      <div className="grid grid-cols-3 gap-1.5">
        <Photo bg="bg-[linear-gradient(160deg,#a9bfa0,#6f8b67)]" />
        <Photo bg="bg-[linear-gradient(160deg,#7a4a86,#e0857a_60%,#f3b56f)]" />
        <span className="relative flex aspect-square items-center justify-center rounded-lg bg-[linear-gradient(160deg,#5f8a80,#2f564e)]">
          <span className="flex size-6 items-center justify-center rounded-full bg-white/90">
            <svg viewBox="0 0 10 10" aria-hidden className="ml-0.5 size-2.5 fill-ink">
              <path d="M2 1.2v7.6L8.6 5Z" />
            </svg>
          </span>
          <span className="absolute right-1 bottom-1 rounded bg-black/45 px-1 text-[8.5px] text-white">0:42</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10.5px]">
        <span className="truncate text-ink">harbour-walkthrough.mp4</span>
        <span className="ml-auto shrink-0 text-quiet">Uploading</span>
      </div>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-cream">
        <span className="block h-full w-3/4 rounded-full bg-accent transition-[width] duration-700 group-hover:w-full" />
      </span>
    </Panel>
  );
}

/** The Tests tab: Maya's test still writing, a made-up customer's done, and the button for the next. */
function TestsArt() {
  return (
    <Panel className="w-full max-w-[270px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5">
        <span className="text-[11.5px] font-medium text-ink">Tests</span>
        <span className="rounded-full bg-accent-deep px-2.5 py-1 text-[10px] text-white">Run Test</span>
      </div>
      <div className="divide-y divide-hairline text-[11px]">
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#7f9a76] text-[9px] font-medium text-white">
            M
          </span>
          <span className="flex-1 text-ink">As Maya</span>
          <span className="flex items-center gap-1.5 text-quiet">
            <span className="size-1.5 rounded-full bg-[#eea53f] motion-safe:animate-pulse" />
            Writing
          </span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <span className="size-5 rounded-full border border-dashed border-[#b9b4ae]" />
          <span className="flex-1 text-ink">New answers</span>
          <span className="flex items-center gap-1.5 text-slate">
            <span className="flex size-3.5 items-center justify-center rounded-full bg-accent text-white">
              <Tick className="size-2" />
            </span>
            Done
          </span>
        </div>
      </div>
    </Panel>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cx("size-4.5", className)}>
      <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8Z" />
    </svg>
  );
}

/** The rating under every outcome, with its default words. Hover the card and the fifth star fills. */
function RatingArt() {
  return (
    <Panel className="w-full max-w-[230px] p-4">
      <p className="font-display text-[15px] text-ink">How did we do?</p>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < 4 ? "fill-[#eea53f]" : "fill-cream transition-[fill] duration-300 group-hover:fill-[#eea53f]"
              }
            />
          ))}
        </div>
        <span className="grid text-[11px] text-slate">
          <span className="col-start-1 row-start-1 transition-opacity duration-300 group-hover:opacity-0">
            Pretty good
          </span>
          <span className="col-start-1 row-start-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Spot on
          </span>
        </span>
      </div>
      <div className="mt-3 rounded-lg border border-hairline px-2.5 py-2 text-[10.5px] text-quiet">
        Anything to add? Optional.
      </div>
    </Panel>
  );
}

/** One of the empty chat's suggestions, and the card the agent shows before it saves. */
function AgentArt() {
  return (
    <div className="w-full max-w-[260px] space-y-2 transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent-deep px-3 py-2 text-[11px] leading-snug text-white shadow-[0_8px_16px_-10px_rgb(34_32_63/0.6)]">
        Suggest a new segment from my people
      </div>
      <div className="w-[85%] rounded-2xl rounded-bl-md border border-hairline bg-white p-3 text-[11px] text-ink shadow-[0_8px_16px_-10px_rgb(40_50_60/0.25)]">
        <p className="font-medium">Create Segment</p>
        <p className="mt-1 flex items-center gap-1.5 text-slate">
          <Dot color="#eaa94e" />
          Brings a dog
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <span className="rounded-full bg-accent-deep px-2.5 py-1 text-[10px] text-white">Approve</span>
          <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] text-slate">Decline</span>
        </div>
      </div>
    </div>
  );
}

/** Claude Code after one command: a request in plain English, then Loro's tools doing the work. */
function McpArt() {
  const calls = ["create_experience", "run_test", "get_outcome"];
  return (
    <div className="w-full max-w-[290px] overflow-hidden rounded-2xl bg-accent-deep font-mono text-[10.5px] leading-relaxed text-white/80 shadow-[0_16px_32px_-16px_rgb(34_32_63/0.6)] transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="ml-auto font-sans text-[10px] text-white/45">Claude Code</span>
      </div>
      <div className="space-y-1 p-3.5">
        <p className="text-white/40">$ claude mcp add loro &hellip;/mcp</p>
        <p>
          <span className="text-white/40">&gt;</span> Add a stay page for new bookings and test it
        </p>
        {calls.map((c) => (
          <p key={c} className="flex items-center gap-1.5 text-[#b4b4e6]">
            <span className="flex size-3 shrink-0 items-center justify-center rounded-full bg-accent text-white">
              <Tick className="size-2" />
            </span>
            loro &middot; {c}
          </p>
        ))}
      </div>
    </div>
  );
}
