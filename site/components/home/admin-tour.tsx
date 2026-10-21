import { Chip, Dot, FeatureCard, Panel, Tick } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { cx } from "@/components/ui";

const areas = [
  {
    title: "Experiences",
    body: "Edit the landing page, intake form and outcome. Tests runs the unsaved draft as any profile, and Feedback collects a rating from one to five under every page.",
    art: <ExperiencesArt />,
    wide: true,
  },
  {
    title: "Analytics",
    body: "Views, sign-ups and finished pages for every experience, counted without names or emails.",
    art: <AnalyticsArt />,
  },
  {
    title: "Profiles",
    body: "Every person with their answers, their taste and their pages, grouped into segments the brand defines.",
    art: <ProfileArt />,
  },
  {
    title: "Context",
    body: "The brand’s skills: its voice, and the facts a page may and may not use.",
    art: <ContextArt />,
  },
  {
    title: "Agent",
    body: "Ask about people and experiences in plain English. The agent asks before it changes anything.",
    art: <AgentArt />,
  },
  {
    title: "Connect",
    body: "API keys, the REST API and the MCP server. Every write needs a key, and any key can be revoked.",
    art: <ConnectArt />,
  },
  {
    title: "Share",
    body: "Every experience has a link, a QR code, an embed and the API call that starts it, ready for a campaign.",
    art: <ShareArt />,
    wide: true,
  },
];

export function AdminTour() {
  return (
    <Section
      id="admin"
      title="A Tour of the Admin"
      align="center"
      intro={<p>One workspace per brand. The demo workspaces are open with no sign-in, so anyone can look around</p>}
    >
      <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <FeatureCard
            key={a.title}
            art={a.art}
            title={a.title}
            body={a.body}
            stage="h-44"
            className={a.wide ? "md:col-span-2" : undefined}
          />
        ))}
      </ul>
    </Section>
  );
}

/** The outcome tab: its sections, which ones are written per person, and which are on. */
function ExperiencesArt() {
  const tabs = ["Landing", "Intake", "Outcome", "Tests", "Share"];
  const sections = [
    { name: "Cover", generated: false },
    { name: "Your Days", generated: true },
    { name: "Your Locals", generated: true },
  ];
  return (
    <Panel className="w-full max-w-[420px] overflow-hidden">
      <div className="flex gap-3 border-b border-hairline px-3.5 pt-2.5 text-[10.5px]">
        {tabs.map((t) => (
          <span
            key={t}
            className={cx("pb-2", t === "Outcome" ? "border-b-2 border-accent-deep text-ink" : "text-quiet")}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="divide-y divide-hairline">
        {sections.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 px-3.5 py-2 text-[11px]">
            <span aria-hidden className="grid grid-cols-2 gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="size-0.5 rounded-full bg-[#cfcac5]" />
              ))}
            </span>
            <span className="flex-1 text-ink">{s.name}</span>
            {s.generated ? (
              <span className="rounded-full bg-[#fbe4ee] px-1.5 py-0.5 text-[9.5px] text-[#ad4673]">Written per person</span>
            ) : null}
            <span className="flex h-3.5 w-6 items-center rounded-full bg-accent-deep p-0.5">
              <span className="ml-auto size-2.5 rounded-full bg-white" />
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** The overview's funnel: views, then sign-ups, then finished pages. */
function AnalyticsArt() {
  const rows = [
    { label: "Views", w: "w-full", c: "bg-[#d9d9f2]" },
    { label: "Sign-ups", w: "w-3/5", c: "bg-[#b9b9e6]" },
    { label: "Finished", w: "w-2/5", c: "bg-accent" },
  ];
  return (
    <Panel className="w-full max-w-[230px] space-y-2.5 p-3.5">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="text-[10px] text-quiet">{r.label}</p>
          <span className={cx("mt-1 block h-2.5 rounded-full", r.w, r.c)} />
        </div>
      ))}
    </Panel>
  );
}

/** One person, Maya from the stay demo, with an answer and a favourite. */
function ProfileArt() {
  return (
    <Panel className="w-full max-w-[230px] p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#7f9a76] text-[11px] font-medium text-white">
          M
        </span>
        <div>
          <p className="text-[11.5px] font-medium text-ink">Maya</p>
          <p className="text-[9.5px] text-quiet">Low Tide House</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Chip>Two nights</Chip>
        <Chip>Juniper, a lab</Chip>
        <Chip className="flex items-center gap-1">
          <Dot color="#eaa94e" />
          Sightglass
        </Chip>
      </div>
    </Panel>
  );
}

/** Harbour & Grey's real skills, switched on. */
function ContextArt() {
  const skills = ["Agency Voice", "Honest About the House", "Canadian English"];
  return (
    <Panel className="w-full max-w-[230px] divide-y divide-hairline">
      {skills.map((s) => (
        <div key={s} className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-ink">
          {s}
          <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Tick className="size-2" />
          </span>
        </div>
      ))}
    </Panel>
  );
}

function AgentArt() {
  return (
    <div className="w-full max-w-[230px] space-y-2 transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-accent-deep px-3 py-1.5 text-[11px] text-white">
        Who&rsquo;s driving from LA?
      </div>
      <div className="w-fit rounded-2xl rounded-bl-md border border-hairline bg-white px-3 py-2 text-[11px] leading-snug text-ink shadow-[0_8px_16px_-10px_rgb(40_50_60/0.25)]">
        Make them a segment?
        <div className="mt-1.5 flex gap-1">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[9.5px] text-white">Approve</span>
          <span className="rounded-full border border-hairline px-2 py-0.5 text-[9.5px] text-slate">Cancel</span>
        </div>
      </div>
    </div>
  );
}

function ConnectArt() {
  return (
    <Panel className="w-full max-w-[230px] space-y-2 p-3.5 font-mono text-[10px]">
      <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5">
        <span className="text-slate">loro_&bull;&bull;&bull;&bull;&bull;&bull;a91f</span>
        <span className="font-sans text-[9.5px] text-quiet">Revoke</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1.5 text-slate">
        <span className="rounded bg-white px-1 text-[9px] text-accent-hover">MCP</span>/mcp
      </div>
      <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1.5 text-slate">
        <span className="rounded bg-white px-1 text-[9px] text-accent-hover">POST</span>/trigger
      </div>
    </Panel>
  );
}

/** A QR code's look: three finder squares and a fixed scatter of modules (it doesn't scan). */
function FakeQr() {
  const n = 21;
  const finder = (x: number, y: number) =>
    [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const modules: [number, number][] = [];
  let seed = 7;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      if (!finder(x, y) && seed % 100 < 46) modules.push([x, y]);
    }
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} aria-hidden className="size-16" shapeRendering="crispEdges">
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} className="fill-ink">
          <path d={`M${x} ${y}h7v7h-7Z M${x + 1} ${y + 1}v5h5v-5Z`} fillRule="evenodd" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
      {modules.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-ink" />
      ))}
    </svg>
  );
}

function ShareArt() {
  return (
    <div className="flex w-full max-w-[440px] items-center gap-4">
      <Panel className="min-w-0 flex-1 space-y-2 p-3.5">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-2.5 py-1.5">
          <span className="truncate text-[10.5px] text-ink">demo.loro.sh/f/mirage-valley/road-trip</span>
          <span className="shrink-0 text-[9.5px] text-accent-hover">Copy</span>
        </div>
        <div className="flex gap-1.5 font-mono text-[9.5px] text-slate">
          <span className="rounded-md bg-muted px-1.5 py-1">&lt;iframe&gt;</span>
          <span className="rounded-md bg-muted px-1.5 py-1">curl &hellip;/trigger</span>
        </div>
      </Panel>
      <Panel className="shrink-0 p-2.5">
        <FakeQr />
      </Panel>
    </div>
  );
}
