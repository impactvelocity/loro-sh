import type { ReactNode } from "react";
import { CloudIcon, HeartIcon, HomeIcon, KeyIcon, MusicIcon, StoreIcon } from "@/components/home/icons";
import { Chip, FeatureCard, spectrum } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { Logo } from "@/components/logo";
import { cx } from "@/components/ui";

const features = [
  {
    title: "A Self-Hosted Admin App",
    body: "One Cloudflare Worker on the brand’s own account runs the admin, the public pages and the API. It’s open source and deploys in one click.",
    art: <AdminArt />,
  },
  {
    title: "One Core, Any Experience",
    body: "Landing page, intake form and outcome, each built from a catalogue of components. Swap the catalogue and the same core runs a festival, a holiday rental, an estate agency or a dating app.",
    art: <FunnelArt />,
  },
  {
    title: "Analytics, Profiles and Segments",
    body: "Every sign-up, answer and taste lands in the brand’s own database. Group people into segments for the next campaign, and track views, sign-ups and finished pages without names or emails.",
    art: <DataArt />,
    last: true,
  },
];

export function FrameworkFeatures() {
  return (
    <Section
      id="framework"
      title="An Agentic Framework"
      align="center"
      intro={
        <p>
          A brand brings what it sells, and Qloo brings what each customer loves. Loro is the agent in the middle of the
          funnel: it builds each page from both, on the brand&rsquo;s own Cloudflare account.
        </p>
      }
    >
      <Connections />

      {/* Three across on wide screens. On tablets, two across, and the last card takes the whole row. */}
      <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard
            key={f.title}
            art={f.art}
            title={f.title}
            body={f.body}
            className={"last" in f ? "md:col-span-2 lg:col-span-1" : undefined}
          />
        ))}
      </ul>
    </Section>
  );
}

/**
 * The brand and Qloo feed Loro, and Loro turns them into experience funnels.
 * Side by side on wide screens, stacked on phones.
 */
function Connections() {
  return (
    <div className="mt-12 rounded-[28px] bg-muted px-4 py-8 sm:px-8 sm:py-10">
      <div className="grid grid-cols-1 items-center justify-items-center lg:grid-cols-[1fr_minmax(3rem,7rem)_auto_minmax(3rem,7rem)_1fr]">
        <Node
          className="lg:justify-self-end"
          icon={
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-hover">
              <StoreIcon className="size-6" />
            </span>
          }
          title="The Brand"
          body="What it sells, its voice and its customers"
        />
        <Wire />
        <div className="relative">
          <span aria-hidden className={cx("absolute -inset-3 rounded-[32px] opacity-50 blur-2xl", spectrum)} />
          <div className="relative flex flex-col items-center rounded-[24px] bg-accent-deep px-9 py-7 text-center text-white shadow-[0_20px_40px_-16px_rgb(34_32_63/0.6)]">
            <Logo className="h-9 w-auto" />
            <p className="mt-3 max-w-[13rem] text-[13px] leading-snug text-white/65">
              The agent, the admin and the API, on the brand&rsquo;s own Cloudflare account
            </p>
          </div>
        </div>
        <Wire reverse />
        <Node
          className="lg:justify-self-start"
          icon={
            <span className={cx("flex size-12 items-center justify-center rounded-full p-[3px]", spectrum)}>
              <span className="flex size-full items-center justify-center rounded-full bg-accent-deep font-display text-xl text-white">
                Q
              </span>
            </span>
          }
          title="Qloo"
          body="Taste across 3.7 billion people, places and things"
        />
      </div>

      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className="h-12 w-0.5 bg-[repeating-linear-gradient(180deg,#cfcac5_0_8px,transparent_8px_16px)] motion-safe:animate-[dash-flow-y_0.8s_linear_infinite]"
        />
        <div className="w-full max-w-[34rem] rounded-[22px] bg-[linear-gradient(135deg,#7d7dd0,#e8679e_50%,#eea53f)] p-[3px] shadow-[0_20px_40px_-20px_rgb(232_103_158/0.55)]">
          <div className="rounded-[19px] bg-raised px-5 py-5 text-center sm:px-7">
            <h3 className="font-display text-xl">Experience Funnels</h3>
            <p className="mt-1 text-[14px] text-slate">Before the sale or after it: a ticket, a booking, a listing, a match</p>
            <ol className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[12px] text-ink">
              {["Landing Page", "Intake Form", "Loro’s Agent", "Branded Outcome"].map((step, i, all) => (
                <li key={step} className="flex items-center gap-1.5">
                  <span
                    className={cx(
                      "rounded-full border px-2.5 py-1",
                      i === all.length - 1 ? "border-[#e8679e]/50 bg-[#fbe4ee]" : "border-hairline bg-white",
                    )}
                  >
                    {step}
                  </span>
                  {i < all.length - 1 ? (
                    <span aria-hidden className="text-stone">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({ icon, title, body, className }: { icon: ReactNode; title: string; body: string; className?: string }) {
  return (
    <div
      className={cx(
        "flex w-full max-w-[15rem] flex-col items-center rounded-[22px] border border-hairline bg-raised px-5 py-6 text-center",
        className,
      )}
    >
      {icon}
      <h3 className="mt-3 font-display text-lg">{title}</h3>
      <p className="mt-1 text-[13px] leading-snug text-slate">{body}</p>
    </div>
  );
}

/** A dashed connector flowing towards Loro: across on wide screens, down on phones. */
function Wire({ reverse }: { reverse?: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className="h-10 w-0.5 bg-[repeating-linear-gradient(180deg,#cfcac5_0_8px,transparent_8px_16px)] motion-safe:animate-[dash-flow-y_0.8s_linear_infinite] lg:hidden"
      />
      <span
        aria-hidden
        className={cx(
          "hidden h-0.5 w-full bg-[repeating-linear-gradient(90deg,#cfcac5_0_8px,transparent_8px_16px)] motion-safe:animate-[dash-flow_0.8s_linear_infinite] lg:block",
          reverse && "[animation-direction:reverse]",
        )}
      />
    </>
  );
}

/* Feature previews: one idea each, drawn with as little as it takes. */

/** Loro inside a dashed boundary: everything it runs stays on the brand's account. */
function AdminArt() {
  return (
    <div className="relative rounded-[24px] border border-dashed border-[#cfcac5] px-8 pt-9 pb-6">
      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-hairline bg-white px-2.5 py-1 text-[11px] whitespace-nowrap text-slate shadow-[0_1px_2px_rgb(40_50_60/0.06)]">
        <CloudIcon className="size-3.5 text-accent-hover" />
        The brand&rsquo;s Cloudflare account
      </span>
      <div className="flex flex-col items-center">
        <span className="relative transition-[translate] duration-300 group-hover:-translate-y-1">
          <span
            aria-hidden
            className={cx("absolute -inset-2 rounded-[24px] opacity-30 blur-xl transition-opacity duration-300 group-hover:opacity-60", spectrum)}
          />
          <span className="relative flex size-16 items-center justify-center rounded-[18px] bg-accent-deep shadow-[0_12px_24px_-12px_rgb(34_32_63/0.6)]">
            <Logo className="h-5 w-auto text-white" />
          </span>
        </span>
        <span className="h-4 w-px bg-[#d8d4cf]" />
        <div className="flex gap-1.5">
          <Chip>Admin</Chip>
          <Chip>Pages</Chip>
          <Chip>API</Chip>
        </div>
      </div>
    </div>
  );
}

/** The demo's four people, a rising sign-up line and two segments. */
function DataArt() {
  const people = [
    { initial: "B", bg: "#c2703d" },
    { initial: "M", bg: "#7f9a76" },
    { initial: "S", bg: "#3f6b62" },
    { initial: "P", bg: "#7a2e45" },
  ];
  return (
    <div className="w-full max-w-[280px] rounded-2xl border border-hairline bg-white p-4 shadow-[0_16px_32px_-16px_rgb(40_50_60/0.25)] transition-[translate] duration-300 group-hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {people.map((p) => (
            <span
              key={p.initial}
              className="flex size-7 items-center justify-center rounded-full text-[11px] font-medium text-white ring-2 ring-white"
              style={{ background: p.bg }}
            >
              {p.initial}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-quiet">Sign-ups</span>
      </div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden className="mt-3 h-14 w-full">
        <defs>
          <linearGradient id="signups-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8c8cc8" stopOpacity="0.35" />
            <stop offset="1" stopColor="#8c8cc8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 26 L14 22 L28 24 L42 16 L56 18 L70 11 L84 13 L100 4 L100 32 L0 32 Z" fill="url(#signups-fill)" />
        <path
          d="M0 26 L14 22 L28 24 L42 16 L56 18 L70 11 L84 13 L100 4"
          fill="none"
          stroke="#8081b7"
          strokeWidth="1.75"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-3 flex flex-wrap gap-1">
        <Chip className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#8c8cc8]" />
          Driving from LA
        </Chip>
        <Chip className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#eaa94e]" />
          Brings a dog
        </Chip>
      </div>
    </div>
  );
}

/** One core, four kinds of experience: the demos, each in its own colours. */
function FunnelArt() {
  const kinds = [
    { name: "Festival", icon: <MusicIcon />, bg: "bg-[linear-gradient(160deg,#7a4a86,#e0857a_60%,#f3b56f)]" },
    { name: "Stay", icon: <HomeIcon />, bg: "bg-[linear-gradient(160deg,#a9bfa0,#6f8b67)]" },
    { name: "Property", icon: <KeyIcon />, bg: "bg-[linear-gradient(160deg,#5f8a80,#2f564e)]" },
    { name: "Date", icon: <HeartIcon />, bg: "bg-[linear-gradient(160deg,#b0546f,#6e2440)]" },
  ];
  return (
    <div className="flex w-full max-w-[300px] flex-col items-center">
      <Chip>Landing Page &middot; Intake Form &middot; Outcome</Chip>
      <div className="relative mt-0 grid w-full grid-cols-4">
        <span aria-hidden className="absolute top-4 right-[12.5%] left-[12.5%] h-px bg-[#d8d4cf]" />
        <span aria-hidden className="absolute top-0 left-1/2 h-4 w-px bg-[#d8d4cf]" />
        {kinds.map((k, i) => (
          <div key={k.name} className="flex flex-col items-center pt-4">
            <span className="h-3 w-px bg-[#d8d4cf]" />
            <span
              className={cx(
                "flex size-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_20px_-10px_rgb(40_50_60/0.5)] transition-[translate] duration-300 group-hover:-translate-y-1.5 [&_svg]:size-5",
                k.bg,
              )}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {k.icon}
            </span>
            <span className="mt-2 text-[11px] text-slate">{k.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
