import type { ReactNode } from "react";
import { BrowserFrame } from "@/components/browser-frame";
import { QDisc, Tick } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { ArrowRight, ArrowUpRight, ButtonLink, Check, cx } from "@/components/ui";
import { type Demo, type FunnelStep, demos } from "@/lib/demos";

export function Demos() {
  return (
    <Section
      id="examples"
      title="One Agent, Any Funnel"
      intro={
        <p>
          The brands are made up for the demo; the places, acts and listings are real, and each page below is a real
          run. Three start with a sign-up on the brand&rsquo;s own page. Three start from the brand&rsquo;s own
          system by API, and the brand sends the link.
        </p>
      }
    >
      <nav aria-label="Examples by industry" className="mt-10 flex flex-wrap gap-2">
        {demos.map((demo) => (
          <a
            key={demo.id}
            href={`#${demo.id}`}
            className="inline-flex h-10 items-center rounded-full border border-hairline bg-raised px-4 text-[15px] font-medium text-ink transition-colors hover:border-[#cfcac5] hover:bg-white"
          >
            {demo.industry}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-6">
        {demos.map((demo) => (
          <DemoBlock key={demo.id} demo={demo} />
        ))}
      </div>
    </Section>
  );
}

function DemoBlock({ demo }: { demo: Demo }) {
  return (
    <article id={demo.id} className="scroll-mt-20 rounded-[28px] bg-muted p-5 sm:p-8 lg:p-10">
      <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <h3 className="font-display tracking-normal">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl leading-tight sm:text-2xl">
              <span className="text-ink">{demo.industry}</span>
              <span aria-hidden className="hidden h-5 w-px bg-stone/60 sm:block" />
              <span className="w-full text-accent-hover sm:w-auto">{demo.moment}</span>
            </span>
            <span className="mt-5 block text-3xl leading-[1.08] text-balance sm:mt-6 sm:text-[2.5rem]">{demo.useCase}</span>
          </h3>
          <p className="mt-4 max-w-[36rem] text-[17px] leading-relaxed text-pretty text-slate">{demo.summary}</p>
          <ul className="mt-5 space-y-2.5">
            {demo.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[15px] leading-snug text-ink">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-hover">
                  <Check className="size-3" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-quiet">
            <span className="font-medium text-ink">{demo.brand}</span>, {demo.brandNote}
          </p>
        </div>
        <WhyItWorks demo={demo} />
      </header>

      <Funnel demo={demo} />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <TryIt demo={demo} />
        <BrowserFrame
          src={demo.outcome.src}
          alt={demo.outcome.alt}
          url={demo.outcome.url}
          aspect="aspect-[4/3]"
          className="lg:col-span-7 lg:self-start"
        />
      </div>
    </article>
  );
}

/** The gap the brand leaves, then what Qloo matched for one person. */
function WhyItWorks({ demo }: { demo: Demo }) {
  return (
    <div className="self-start rounded-2xl border border-hairline bg-raised p-5 sm:p-6 lg:col-span-5">
      <h4 className="font-display text-xl">Why It Works</h4>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{demo.why}</p>
      <div className="mt-5 flex items-start gap-3 border-t border-hairline pt-5">
        <QDisc className="size-9 p-[2px]" text="text-base" />
        <p className="text-[15px] leading-relaxed text-slate">{demo.qloo}</p>
      </div>
      <div className="mt-4 rounded-xl bg-muted p-1">
        <div className="grid grid-cols-[1fr_14px_1fr] gap-x-3 px-3 pt-1.5 pb-2 text-[11px] text-quiet">
          <span>What They Named</span>
          <span />
          <span>What Qloo Found</span>
        </div>
        <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-white">
          {demo.matches.map((match) => (
            <li key={match.to} className="grid grid-cols-[1fr_14px_1fr] items-center gap-x-3 px-3 py-2.5">
              <span className="text-[12.5px] leading-snug text-slate">{match.from}</span>
              <ArrowRight className="size-3.5 text-stone" />
              <span className="text-[13px] leading-snug font-medium text-ink">
                {match.to}
                {match.where ? <span className="block text-[11.5px] font-normal text-quiet">{match.where}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The experience's steps in order, each a small preview of what happened in the run. */
function Funnel({ demo }: { demo: Demo }) {
  return (
    <div className="mt-10">
      <ol className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-4">
        {demo.steps.map((step) => (
          <li
            key={step.title}
            className={cx(
              "group relative flex w-[78%] shrink-0 snap-start flex-col rounded-2xl border bg-raised p-2.5 transition-transform duration-300 hover:scale-[1.03] sm:w-[44%] lg:w-auto",
              step.kind === "outcome"
                ? "border-2 border-transparent shadow-[0_18px_36px_-22px_rgb(232_103_158/0.6)] [background:linear-gradient(#fcfaf8,#fcfaf8)_padding-box,linear-gradient(135deg,#7d7dd0,#e8679e_50%,#eea53f)_border-box]"
                : "border-hairline",
            )}
          >
            <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-muted p-3">
              <StepArt step={step} demo={demo} />
            </div>
            <div className="px-1.5 pt-3.5 pb-1.5">
              <p className="text-[15px] font-medium text-ink">{step.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-slate">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {demo.note ? <p className="mt-4 text-[13px] text-quiet">{demo.note}</p> : null}
    </div>
  );
}

export function StepArt({ step, demo }: { step: FunnelStep; demo: Demo }) {
  switch (step.kind) {
    case "landing":
      return (
        // eslint-disable-next-line @next/next/no-img-element -- static export; images are pre-sized
        <img
          src={step.src}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-top"
        />
      );
    case "intake":
      return (
        <Sheet>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-quiet">{step.count}</span>
            <span aria-hidden className="flex w-16 gap-0.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cx("h-1 flex-1 rounded-full", n === 0 ? "bg-accent" : "bg-cream")} />
              ))}
            </span>
          </div>
          <p className="mt-2.5 line-clamp-2 text-[12px] leading-snug font-medium text-ink">{step.question}</p>
          <p className="mt-2 line-clamp-2 rounded-lg border border-accent bg-accent-soft/50 px-2 py-1.5 text-[11px] leading-snug text-ink">
            {step.answer}
            <span aria-hidden className="ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-ink/70 motion-safe:animate-pulse" />
          </p>
        </Sheet>
      );
    case "personalise":
      return (
        <Sheet className="px-3 py-3">
          <ol className="relative">
            <span aria-hidden className="absolute top-2 bottom-2 left-[6.5px] w-px bg-accent/35" />
            {step.log.map((row) => (
              <li key={row.label} className="relative flex items-start gap-2.5 pb-2.5 last:pb-0">
                <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-accent text-white ring-2 ring-white">
                  <Tick className="size-2" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] leading-tight font-medium text-ink">{row.label}</span>
                  <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-slate">{row.message}</span>
                </span>
              </li>
            ))}
          </ol>
        </Sheet>
      );
    case "outcome": {
      const look = demo.outcomeLook ?? {
        bar: demo.swatch,
        barInk: demo.swatchInk ?? "rgb(255 255 255 / 0.9)",
        hero: `linear-gradient(160deg, ${demo.swatch}, color-mix(in oklab, ${demo.swatch} 55%, black))`,
        heroInk: "#fff",
      };
      // Pop draws square corners and black rules, like the date page.
      const pop = look.pop;
      return (
        <div
          className={cx(
            "absolute inset-3 flex flex-col overflow-hidden bg-white shadow-[0_10px_24px_-14px_rgb(40_50_60/0.35)]",
            pop ? "border-[1.5px] border-[#151215]" : "rounded-lg border border-hairline",
          )}
        >
          <div
            className={cx("flex h-5 shrink-0 items-center px-2", pop && "border-b-[1.5px] border-[#151215]")}
            style={{ background: look.bar }}
          >
            <span
              className={cx("text-[8.5px] font-medium", pop && "font-display tracking-wide uppercase")}
              style={{ color: look.barInk }}
            >
              {demo.brand}
            </span>
          </div>
          <div className="flex flex-1 items-end px-2.5 pb-2.5" style={{ background: look.hero }}>
            <p
              className={cx("font-display text-[17px] leading-[1.1]", pop && "text-[19px] leading-none font-semibold tracking-tight uppercase")}
              style={{ color: look.heroInk }}
            >
              {step.headline}
            </p>
          </div>
          <div
            className={cx(
              "grid shrink-0 grid-cols-3 divide-x",
              pop ? "divide-[#151215] border-t-[1.5px] border-[#151215] bg-[#fcf7ee]" : "divide-hairline",
            )}
          >
            {step.stats.map((stat) => (
              <span key={stat} className="truncate px-1 py-2 text-center text-[10px] font-medium text-ink">
                {stat}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "trigger":
      return (
        <div className="absolute inset-3 flex flex-col overflow-hidden rounded-lg bg-deep p-2.5 font-mono text-[9.5px] leading-[1.55] text-white/70 shadow-[0_10px_24px_-14px_rgb(20_24_28/0.6)]">
          <span className="self-start rounded-full bg-white/10 px-2 py-0.5 font-sans text-[9.5px] text-white/80">
            {step.source}
          </span>
          <p className="mt-2 truncate text-[#b9b9e6]">{step.endpoint}</p>
          <p>{"{ \"answers\": {"}</p>
          {step.body.map(([key, value]) => (
            <p key={key} className="truncate pl-3">
              <span className="text-[#f2b3cf]">&quot;{key}&quot;</span>: <span className="text-white/85">&quot;{value}&quot;</span>
            </p>
          ))}
          <p>{"} }"}</p>
        </div>
      );
    case "email":
      return (
        <Sheet className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full font-display text-[10px] text-white"
              style={{ background: demo.swatch, color: demo.swatchInk }}
            >
              {step.from[0]}
            </span>
            <span className="min-w-0 truncate text-[10.5px] font-medium text-ink">{step.from}</span>
          </div>
          <p className="mt-2 text-[12px] leading-tight font-medium text-ink">{step.subject}</p>
          <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-slate">{step.body}</p>
          <span
            className="mt-2 self-start rounded-full px-2.5 py-1 text-[9.5px] font-medium text-white"
            style={{ background: demo.swatch, color: demo.swatchInk }}
          >
            {step.cta}
          </span>
        </Sheet>
      );
  }
}

/** A white card centred on the step's muted stage. */
function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "relative w-full overflow-hidden rounded-lg border border-hairline bg-white p-2.5 shadow-[0_10px_24px_-14px_rgb(40_50_60/0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TryIt({ demo }: { demo: Demo }) {
  const tryable = demo.tryUrl || demo.prefillUrl;
  // The prefilled profile is the first example person's, unless it names another.
  const sample = demo.prefillName ?? demo.examples[0]?.name.split(" ")[0];
  return (
    <div className="flex flex-col lg:col-span-5">
      {/* With no public form there's nothing to run, so the example pages lead. */}
      <h4 className="font-display text-2xl font-semibold sm:text-[1.75rem]">
        {tryable ? "Run the Experience" : "Example Outcomes"}
      </h4>
      {tryable ? (
        <>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate">
            The demo calls Qloo and the model live, so a new page takes about a minute.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {demo.tryUrl ? (
              <ButtonLink href={demo.tryUrl} size="sm">
                Start from Scratch
              </ButtonLink>
            ) : null}
            {demo.prefillUrl ? (
              <ButtonLink href={demo.prefillUrl} variant="secondary" size="sm">
                Run as {sample}
              </ButtonLink>
            ) : null}
          </div>
        </>
      ) : null}
      {demo.tryNote ? <p className={tryable ? "mt-3 text-[13px] text-quiet" : "mt-1.5 text-[15px] leading-relaxed text-slate"}>{demo.tryNote}</p> : null}

      {tryable ? <h4 className="mt-8 text-[15px] font-medium text-ink">Example Outcomes</h4> : null}
      <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-raised">
        {demo.examples.map((example) => (
          <li key={example.href}>
            <a
              href={example.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ink">{example.name}</span>
                <span className="block text-[13px] leading-snug text-quiet">
                  {example.context}. {example.taste.join(", ")}
                </span>
              </span>
              <ArrowUpRight className="shrink-0 text-stone transition-colors group-hover:text-ink" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
