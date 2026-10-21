import type { ReactNode } from "react";
import { PinIcon, SparkIcon, ZapIcon } from "@/components/home/icons";
import { Chip, Dot, FeatureCard, Panel, QDisc, spectrum, spectrumLine, Tick } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { cx } from "@/components/ui";

/** Theo's road trip run (gen-9f3e43e4-19f, the one in Examples), told by what each stage gives the person. */
const run: { title: string; message: string; icon: ReactNode; taste?: boolean; outcome?: boolean }[] = [
  {
    title: "Qloo Taste Matched",
    message: "Seven favourites become twenty picks they’re likely to love",
    icon: <QDisc />,
    taste: true,
  },
  {
    title: "Route and Lineup",
    message: "The drive split into three days, and the festival’s bill ranked for them",
    icon: <PinIcon />,
  },
  {
    title: "Written in the Festival’s Voice",
    message: "Nine stops on the way, each with a reason it suits them",
    icon: <SparkIcon />,
  },
  {
    title: "Their Experience",
    message: "A road trip in the festival’s own look, ready to share with friends",
    icon: <ZapIcon />,
    outcome: true,
  },
];

const rules = [
  {
    title: "Lookups",
    body: "Each experience says what to ask Qloo for: where, which kinds of place, popularity, price, open on which day, and a weight for each favourite.",
    art: <LookupArt />,
  },
  {
    title: "From Qloo, or Dropped",
    body: "A written section can only recommend things Qloo returned, by entity id. Anything else is removed before the page shows it.",
    art: <GroundedArt />,
  },
  {
    title: "Enriched by Taste",
    body: "One favourite act can bring back a bookshop, a café and another act on the bill. Qloo searches music, food, places and brands, and the brand keeps each person’s taste on their profile.",
    art: <EnrichArt />,
  },
];

export function Workflow() {
  return (
    <Section
      id="workflow"
      title="How Taste Runs Through Every Experience"
      align="center"
      intro={
        <p>
          Each page is one run of a Cloudflare Workflow. Taste comes first, so every section after it works from real
          places, artists and brands.
        </p>
      }
    >
      <div className="mt-12 rounded-[28px] bg-muted px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-center text-sm text-quiet">Theo&rsquo;s road trip page, step by step</p>
        <ol className="relative mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-4">
          <span
            aria-hidden
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-0.5 bg-[repeating-linear-gradient(90deg,#cfcac5_0_8px,transparent_8px_16px)] motion-safe:animate-[dash-flow_0.8s_linear_infinite] lg:block"
          />
          {run.map((step) => (
            <li key={step.title} className="group relative flex flex-col items-center text-center">
              {step.taste ? (
                <span className="relative transition-[translate] duration-300 group-hover:-translate-y-1">
                  <span aria-hidden className={cx("absolute -inset-3 rounded-full opacity-40 blur-lg", spectrum)} />
                  <span className="relative">{step.icon}</span>
                </span>
              ) : step.outcome ? (
                <span
                  className={cx(
                    "relative flex size-12 items-center justify-center rounded-full p-[3px] shadow-[0_10px_20px_-10px_rgb(232_103_158/0.6)] transition-[translate] duration-300 group-hover:-translate-y-1",
                    spectrumLine,
                  )}
                >
                  <span className="flex size-full items-center justify-center rounded-full bg-accent-deep text-white [&_svg]:size-5 [&_svg]:fill-white">
                    {step.icon}
                  </span>
                </span>
              ) : (
                <span className="relative flex size-12 items-center justify-center rounded-full border border-hairline bg-white text-accent-hover shadow-[0_8px_16px_-10px_rgb(40_50_60/0.3)] transition-[translate] duration-300 group-hover:-translate-y-1 [&_svg]:size-5">
                  {step.icon}
                </span>
              )}
              <h3 className="mt-3 text-[15px] font-medium text-ink">{step.title}</h3>
              <p
                className={cx(
                  "mt-3 w-full max-w-[16rem] rounded-xl border bg-white px-3 py-2 text-[13px] leading-snug text-slate",
                  step.taste || step.outcome ? "border-[#e8679e]/40" : "border-hairline",
                  step.outcome && "bg-[#fdf2f6] text-ink",
                )}
              >
                {step.message}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {rules.map((r) => (
          <FeatureCard key={r.title} art={r.art} title={r.title} body={r.body} stage="h-44" />
        ))}
      </ul>
    </Section>
  );
}

/** What one lookup asks Qloo for. */
function LookupArt() {
  return (
    <Panel className="w-full max-w-[240px] p-3.5">
      <p className="text-[10px] text-quiet">Lookup: stops on the drive</p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        <Chip>Near the route</Chip>
        <Chip>Record shops</Chip>
        <Chip>Open Thursday</Chip>
        <Chip className="border-[#e8679e]/40 bg-[#fbe4ee]">Favourites &times;3</Chip>
      </div>
    </Panel>
  );
}

/** A real pick stays; a made-up one is dropped. */
function GroundedArt() {
  return (
    <Panel className="w-full max-w-[250px] divide-y divide-hairline text-[11px]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Tick />
        </span>
        <span className="min-w-0 flex-1 truncate text-ink">Book Alley, Pasadena</span>
        <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9.5px] text-accent-hover">Qloo</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-cream text-slate">
          <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-2">
            <path d="m3.5 3.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 truncate text-quiet line-through">A café the model made up</span>
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] text-quiet">Dropped</span>
      </div>
    </Panel>
  );
}

/** One favourite in; a bookshop, a coffee stop and an act on the bill out. */
function EnrichArt() {
  const out = [
    { name: "Book Alley", c: "#eaa94e" },
    { name: "College Coffee", c: "#8c8cc8" },
    { name: "Jamie xx", c: "#e57aa8" },
  ];
  return (
    <div className="flex items-center gap-2.5 transition-[translate] duration-300 group-hover:-translate-y-1">
      <Chip className="flex items-center gap-1">
        <Dot color="#e57aa8" />
        Tame Impala
      </Chip>
      <span aria-hidden className="text-stone">
        &rarr;
      </span>
      <QDisc className="size-9 p-[2px]" text="text-base" />
      <span aria-hidden className="text-stone">
        &rarr;
      </span>
      <div className="flex flex-col gap-1">
        {out.map((o) => (
          <Chip key={o.name} className="flex items-center gap-1">
            <Dot color={o.c} />
            {o.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
