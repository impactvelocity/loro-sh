/**
 * While an outcome is being made: a footer fixed to the bottom of the
 * page, centred, over a soft fade of the page's own background with the
 * page behind it blurred, both easing out towards the top. What's happening
 * now in large type (it slides in fresh at each step), then a bar with a
 * segment per step in the brand colour: done ones full, the one under way
 * filling with a shimmer, the step ("3 / 8") and the percent at its ends. It also follows the run (core/outcome/use-follow.ts): the page is
 * held still, the section being written is kept in view, and at the end
 * the footer slides away and the page goes back to the top.
 *
 * Any catalogue's outcome layout drops it in as its last child:
 *
 *   <RunFooter ctx={ctx} />
 *
 * In the editor it sits at the bottom of the preview instead of the
 * window, and the editor's sample run (which never finishes) isn't followed.
 */
import { type CSSProperties, useEffect, useRef, useState } from "react";

import type { RenderContext } from "@core/catalogue/define";
import type { OutcomeView, StepState } from "@core/outcome/state";
import { useFollowRun } from "@core/outcome/use-follow";
import { cn } from "@/lib/utils";

/** Solid at the bottom, gone by the top: for the blur layer. */
const fadeMask: CSSProperties = {
  maskImage: "linear-gradient(to top, black 40%, transparent)",
  WebkitMaskImage: "linear-gradient(to top, black 40%, transparent)",
};

/** How long a step usually takes, for its segment to creep through it. */
const STEP_MS = 12_000;

/** How far through a step is, 0–1: done is full; under way fills over time, slowing, never full. */
function fillOf(step: StepState, now: number) {
  if (step.status === "done" || step.status === "skipped" || step.status === "error") return 1;
  if (step.status !== "running" || !step.startedAt) return 0;
  return 0.9 * (1 - Math.exp(-(now - step.startedAt) / STEP_MS));
}

/** A clock that ticks while `on`, so segments creep between events. */
function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [on]);
  return now;
}

export function RunFooter({
  ctx,
  className,
}: {
  ctx: RenderContext;
  /** Width of the inner column, to sit well in the layout. */
  className?: string;
}) {
  const outcome: OutcomeView | null = ctx.outcome;
  const footer = useRef<HTMLDivElement>(null);
  // The editor's sample run is planned as "preview" and never settles: show it, don't follow it.
  const sample = outcome?.state.id === "preview";
  const phase = useFollowRun(outcome, footer, { enabled: !sample });
  const showing = sample ? outcome?.status === "running" : phase !== "idle";
  const now = useNow(showing);
  const best = useRef(0);
  if (!outcome || !showing) return null;

  const steps = outcome.state.steps.filter((step) => !step.background);
  const fills = steps.map((step) => (outcome.status === "done" ? 1 : fillOf(step, now)));
  const total = Math.max(steps.length, 1);
  // Never goes back, even if a step's estimate ran ahead of it.
  best.current = Math.max(best.current, Math.round((fills.reduce((sum, fill) => sum + fill, 0) / total) * 100));
  const percent = outcome.status === "done" ? 100 : Math.min(99, best.current);

  const { done } = outcome.progress;
  const failed = outcome.status === "error";
  const current = outcome.current;
  const title = failed
    ? "Something went wrong. What's here is what we managed."
    : outcome.status === "done"
      ? "All done"
      : // Section headings can name the person ("Send {{answers.match}} this").
        ctx.fill(current?.message ?? current?.label ?? "Getting started");

  return (
    <div
      ref={footer}
      role="status"
      aria-live="polite"
      className={cn(
        "inset-x-0 bottom-0 z-40 transition-[translate,opacity] duration-700 ease-in-out",
        ctx.preview ? "sticky" : "fixed",
        phase === "leaving" && "translate-y-full opacity-0",
      )}
    >
      {/* The page behind, blurred, fading out towards the top. */}
      <div aria-hidden className="absolute inset-0 backdrop-blur-md" style={fadeMask} />
      {/* A wash of the page's background over it, lighter than solid so the page still shows through. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(to top, color-mix(in oklab, var(--background) 82%, transparent) 45%, transparent)" }}
      />
      <div className={cn("relative mx-auto flex w-full max-w-xl flex-col items-center gap-5 px-5 pt-24 pb-8 text-center @3xl:pb-10", className)}>
        {/* Keyed, so each new step slides in rather than swapping in place. */}
        <p
          key={title}
          className={cn(
            "animate-in font-heading text-[1.75rem] leading-tight font-medium text-balance duration-500 fade-in slide-in-from-bottom-2 @2xl:text-4xl",
            failed && "text-red-700",
          )}
        >
          {title}
        </p>
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex w-full gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            {steps.map((step, i) => {
              const live = step.status === "running" && !failed;
              return (
                <div key={step.id} className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-[var(--brand,var(--primary))] transition-[width] duration-500 ease-out"
                    style={{ width: `${fills[i] * 100}%` }}
                  />
                  {live && (
                    <div
                      aria-hidden
                      className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/45 to-transparent"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground tabular-nums">
            <span>
              {Math.min(done + 1, total)} / {total}
            </span>
            <span className="font-medium text-foreground">{percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
