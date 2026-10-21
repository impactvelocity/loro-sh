import type { ReactNode } from "react";
import { CupIcon, MusicIcon, PinIcon } from "@/components/home/icons";
import { PartsDiagram } from "@/components/home/parts-diagram";
import { Section } from "@/components/home/section";
import { cx } from "@/components/ui";

export function Parts() {
  return (
    <Section
      id="parts"
      title="Every Experience Starts with Right Context"
      align="center"
      intro={
        <p>
          Most marketing runs on a name, an email and a purchase history. Loro adds taste: what each person loves,
          matched by Qloo to real places, artists and brands around what the brand sells.
        </p>
      }
    >
      <PartsDiagram />
      <Funnel />
    </Section>
  );
}

const steps = [
  { above: "Landing Page", below: "The Brand’s Sign-Up", art: <LandingArt /> },
  { above: "Intake Form", below: "Who They Are, What They Love", art: <IntakeArt /> },
  { above: "Personalise", below: "Matched by Qloo", art: <PersonaliseArt /> },
  { above: "Branded Outcome", below: "Their Plan, in the Brand’s Look", art: <OutcomeArt /> },
];

/** The four stages of an experience, drawn as little previews of each page. */
function Funnel() {
  return (
    <div className="mt-24 sm:mt-28">
      <h3 className="text-center font-display text-3xl leading-[1.15] tracking-normal text-pretty sm:text-4xl">
        The Loro Experience Funnel
      </h3>
      <ol className="relative mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
        <span aria-hidden className="absolute top-1/2 right-[12%] left-[12%] hidden h-0.5 lg:block">
          <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#cfcac5_0_8px,transparent_8px_16px)] motion-safe:animate-[dash-flow_0.8s_linear_infinite]" />
          <span className="absolute top-1/2 size-2 -translate-1/2 rounded-full bg-accent shadow-[0_0_0_4px_rgb(140_140_200/0.2),0_0_12px_rgb(140_140_200/0.8)] motion-safe:animate-[travel_5s_ease-in-out_infinite]" />
        </span>
        {steps.map((step, i) => (
          <li key={step.above} className="group relative flex flex-col items-center text-center">
            <p className="text-[15px] font-medium text-ink transition-colors duration-300 group-hover:text-accent-hover">
              {step.above}
            </p>
            <div className="mt-4 w-full max-w-[220px] px-3 sm:px-0">{step.art}</div>
            <p
              className={
                i === steps.length - 1
                  ? "mt-5 font-display text-lg text-ink"
                  : "mt-5 text-[15px] text-ink"
              }
            >
              {step.below}
            </p>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-12 max-w-[44rem] text-center text-lg leading-relaxed text-pretty text-slate">
        Someone signs up, answers the questions and gets a page built around what they love.
        The brand keeps every answer in its profiles, and the customer gets a reason to book, buy or turn up.
      </p>
    </div>
  );
}

function Card({
  children,
  className,
  bare,
  highlight,
}: {
  children: ReactNode;
  className?: string;
  bare?: boolean;
  /** The funnel's last card: a thicker ring in the three parts' colours. */
  highlight?: boolean;
}) {
  const inner = cx("relative aspect-[4/5] overflow-hidden rounded-2xl bg-raised", !bare && "p-3 sm:p-4", className);
  if (highlight) {
    return (
      <div className="relative rounded-[19px] bg-[linear-gradient(135deg,#7d7dd0,#e8679e_50%,#eea53f)] p-[3px] shadow-[0_20px_40px_-20px_rgb(232_103_158/0.55)] transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_52px_-20px_rgb(232_103_158/0.7)]">
        <div className={inner}>{children}</div>
      </div>
    );
  }
  return (
    <div
      className={cx(
        inner,
        "border border-hairline shadow-[0_1px_2px_rgb(40_50_60/0.04),0_16px_40px_-20px_rgb(40_50_60/0.2)] transition-[translate,box-shadow,border-color] duration-300 group-hover:-translate-y-1.5 group-hover:border-[#d8d4cf] group-hover:shadow-[0_1px_2px_rgb(40_50_60/0.04),0_24px_48px_-20px_rgb(40_50_60/0.32)]",
      )}
    >
      {children}
    </div>
  );
}

/** A sunset over desert ridges, the hero both the landing page and the outcome share. */
function Desert({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={cx(
        "relative overflow-hidden bg-[linear-gradient(180deg,#2f2b5c_0%,#7a4a86_42%,#e0857a_74%,#f3b56f_100%)]",
        className,
      )}
    >
      <span className="absolute right-[16%] bottom-[18%] aspect-square w-[34%] rounded-full bg-[linear-gradient(180deg,#ffe2a8,#f59e6b)] shadow-[0_0_28px_rgb(255_196_140/0.65)] transition-[translate] duration-500 group-hover:-translate-y-1.5" />
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-0 h-[40%] w-full">
        <path d="M0 40V25l13-8 10 6 17-14 14 10 11-6 14 8 21-7V40Z" fill="#4a2d5e" fillOpacity="0.85" />
        <path d="M0 40V32l17-6 15 4 19-9 18 8 13-4 18 5V40Z" fill="#251c40" />
      </svg>
      {children}
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-1", className)}>
      <span className="size-2 rounded-full bg-[#f3b56f]" />
      <span className="h-1 w-6 rounded-full bg-white/70" />
    </span>
  );
}

function LandingArt() {
  return (
    <Card bare className="flex flex-col">
      <div className="flex h-6 shrink-0 items-center gap-1 border-b border-hairline bg-white px-2.5">
        <span className="size-1.5 rounded-full bg-[#f0a29a]" />
        <span className="size-1.5 rounded-full bg-[#f2cf86]" />
        <span className="size-1.5 rounded-full bg-[#a8d29b]" />
        <span className="ml-1.5 flex h-3 flex-1 items-center rounded-full bg-muted px-1.5">
          <span className="h-0.5 w-8 rounded-full bg-[#d8d4cf]" />
        </span>
      </div>
      <Desert className="flex-1">
        <BrandMark className="absolute top-2.5 left-3" />
        <div className="absolute top-[30%] left-3 space-y-1.5">
          <span className="block h-2 w-[4.5rem] rounded-full bg-white/95" />
          <span className="block h-2 w-12 rounded-full bg-white/95" />
          <span className="block h-1 w-14 rounded-full bg-white/55" />
        </div>
      </Desert>
      <div className="flex shrink-0 gap-1.5 p-2.5">
        <span className="flex h-7 flex-1 items-center rounded-full border border-hairline bg-white px-2.5">
          <span className="h-1 w-10 rounded-full bg-cream" />
        </span>
        <span className="flex h-7 items-center rounded-full bg-accent-deep px-3 transition-colors duration-300 group-hover:bg-accent-hover">
          <span className="h-1 w-5 rounded-full bg-white/80" />
        </span>
      </div>
    </Card>
  );
}

const tastes = ["#8c8cc8", "#e57aa8", "#eaa94e"];

function IntakeArt() {
  return (
    <Card className="flex flex-col justify-center">
      <div className="flex gap-1">
        {[true, true, true, false, false].map((on, i) => (
          <span key={i} className={cx("h-1 flex-1 rounded-full", on ? "bg-accent" : "bg-cream")} />
        ))}
      </div>
      <span className="mt-3.5 block h-2 w-4/5 rounded-full bg-ink/70" />
      <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-cream" />
      <div className="mt-3 space-y-1.5">
        {[0, 1, 2].map((i) => {
          const on = i === 1;
          return (
            <div
              key={i}
              className={cx(
                "flex h-5 items-center gap-2 rounded-lg border px-2 sm:h-6",
                on ? "border-accent bg-accent-soft/70" : "border-hairline bg-white",
              )}
            >
              <span
                className={cx(
                  "flex size-3 shrink-0 items-center justify-center rounded-full",
                  on ? "bg-accent text-white" : "border border-[#d8d4cf]",
                )}
              >
                {on ? (
                  <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-2">
                    <path d="m3 6.2 2 2 4-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span className={cx("h-1 rounded-full", on ? "w-12 bg-accent-hover/50" : "w-14 bg-cream")} />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {tastes.map((c, i) => (
          <span
            key={c}
            className="flex h-[18px] items-center gap-1 rounded-full border border-hairline bg-white px-1.5 transition-[translate] duration-300 group-hover:-translate-y-0.5"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <span className="size-1.5 rounded-full" style={{ background: c }} />
            <span className="h-1 w-4 rounded-full bg-cream" />
          </span>
        ))}
        <span className="h-3 w-px bg-ink/60 motion-safe:animate-pulse" />
      </div>
      <span className="mt-3 hidden h-5 w-10 self-end rounded-full bg-accent-deep transition-colors duration-300 group-hover:bg-accent-hover sm:block" />
    </Card>
  );
}

/** Favourites flow into Qloo and come out as places, music and cafés near the brand. */
function PersonaliseArt() {
  const line =
    "fill-none stroke-[#d8d4cf] [stroke-dasharray:3_3] transition-colors duration-300 group-hover:stroke-accent group-hover:motion-safe:animate-[dash-move_0.6s_linear_infinite]";
  return (
    <Card bare className="bg-[radial-gradient(circle_at_50%_50%,#f1effa,transparent_60%)]">
      <svg viewBox="0 0 100 125" aria-hidden className="absolute inset-0 size-full">
        {["M22 26 C22 40 50 36 50 50", "M50 26 V50", "M78 26 C78 40 50 36 50 50"].map((d) => (
          <path key={d} d={d} strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={line} />
        ))}
        {["M50 75 C50 89 22 85 22 97", "M50 75 V97", "M50 75 C50 89 78 85 78 97"].map((d) => (
          <path key={d} d={d} strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={line} />
        ))}
      </svg>

      {tastes.map((c, i) => (
        <span
          key={c}
          className="absolute top-[16%] flex h-5 -translate-1/2 items-center gap-1 rounded-full border border-hairline bg-white px-1.5 shadow-[0_2px_6px_-2px_rgb(40_50_60/0.15)]"
          style={{ left: `${22 + i * 28}%` }}
        >
          <span className="size-1.5 rounded-full" style={{ background: c }} />
          <span className="h-1 w-3.5 rounded-full bg-cream" />
        </span>
      ))}

      <span className="absolute top-1/2 left-1/2 aspect-square w-[32%] -translate-1/2">
        <span className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,#7d7dd0,#e8679e,#eea53f,#7d7dd0)] opacity-40 blur-lg transition-opacity duration-300 group-hover:opacity-90 motion-safe:animate-[spin_12s_linear_infinite]" />
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#7d7dd0,#e8679e,#eea53f,#7d7dd0)] p-[3px] motion-safe:animate-[spin_12s_linear_infinite]">
          <span className="block size-full rounded-full bg-accent-deep" />
        </span>
        <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white transition-[scale] duration-300 group-hover:scale-110 sm:text-3xl">
          Q
        </span>
      </span>

      {[
        { icon: <PinIcon />, tone: "text-[#c98a2b]" },
        { icon: <MusicIcon />, tone: "text-[#d0608f]" },
        { icon: <CupIcon />, tone: "text-accent-hover" },
      ].map((pick, i) => (
        <span
          key={i}
          className={cx(
            "absolute top-[84%] flex size-7 -translate-1/2 items-center justify-center rounded-lg border border-hairline bg-white shadow-[0_4px_10px_-4px_rgb(40_50_60/0.25)] transition-[top] duration-300 group-hover:top-[82%] sm:size-8 [&_svg]:size-3.5 sm:[&_svg]:size-4",
            pick.tone,
          )}
          style={{ left: `${22 + i * 28}%`, transitionDelay: `${i * 60}ms` }}
        >
          {pick.icon}
        </span>
      ))}
    </Card>
  );
}

/** The festival's page for one person: the brand's header and hero, then their day, pick by pick. */
function OutcomeArt() {
  const day = [
    { tone: "#e57aa8", w: "w-4/5" },
    { tone: "#eaa94e", w: "w-3/5" },
    { tone: "#8c8cc8", w: "w-2/3" },
  ];
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute inset-x-[6%] top-[30%] -bottom-5 rounded-[32px] bg-[linear-gradient(90deg,#7d7dd0,#e8679e,#eea53f)] opacity-45 blur-2xl transition-opacity duration-300 group-hover:opacity-75"
      />
      <Card bare highlight className="flex flex-col">
        <div className="flex h-6 shrink-0 items-center justify-between bg-accent-deep px-2.5">
          <BrandMark />
          <span className="h-3 w-8 rounded-full bg-white/90" />
        </div>
        <Desert className="h-[36%] shrink-0">
          <div className="absolute top-2.5 left-2.5 space-y-1">
            <span className="block h-1.5 w-14 rounded-full bg-white/95" />
            <span className="block h-1.5 w-9 rounded-full bg-white/95" />
          </div>
        </Desert>
        <div className="flex flex-1 flex-col p-2.5">
          <span className="block h-1.5 w-1/2 rounded-full bg-ink/70" />
          <div className="mt-2.5 space-y-2">
            {day.map((row) => (
              <div key={row.tone} className="flex items-center gap-1.5">
                <span className="h-1 w-3 shrink-0 rounded-full bg-[#d8d4cf]" />
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: row.tone }} />
                <span className={cx("h-1 rounded-full bg-cream", row.w)} />
              </div>
            ))}
          </div>
          <span className="mt-auto block h-5 w-full rounded-full bg-accent-deep" />
        </div>
      </Card>
    </div>
  );
}
