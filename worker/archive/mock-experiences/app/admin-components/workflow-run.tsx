import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "lucide-react";

import { type Step, sampleRun, stepKinds } from "@core/funnels";
import { Spinner } from "@/admin-components/ui/spinner";
import { cn } from "@/lib/utils";

export type RunState = Record<string, "running" | "done">;

/**
 * Walks the enabled steps in order, faster than real time, so tests and
 * real runs feel alive until the workflow is connected.
 */
export function useMockRun(steps: Step[], onDone?: () => void) {
  const [run, setRun] = useState<RunState | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enabled = steps.filter((step) => step.enabled);
  const running = run !== null && Object.values(run).includes("running");

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function start() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRun({ [enabled[0].id]: "running" });
    let at = 0;
    enabled.forEach((step, i) => {
      at += Math.min(1400, 300 + sampleRun[step.kind].seconds * 120);
      timers.current.push(
        setTimeout(() => {
          setRun((current) => ({
            ...current,
            [step.id]: "done",
            ...(enabled[i + 1] ? { [enabled[i + 1].id]: "running" } : {}),
          }));
          if (i === enabled.length - 1) onDone?.();
        }, at),
      );
    });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    setRun(null);
  }

  return {
    run,
    running,
    finished: run !== null && !running,
    seconds: enabled.reduce((sum, step) => sum + sampleRun[step.kind].seconds, 0),
    start,
    reset,
  };
}

/** Step by step progress for a run, with each step's output once it's done. */
export function RunLog({ steps, run, test }: { steps: Step[]; run: RunState; test?: boolean }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps
        .filter((step) => step.enabled)
        .map((step) => {
          const state = run[step.id];
          const output =
            test && step.kind === "deliver" ? "Test run, nothing sent" : sampleRun[step.kind].output;
          return (
            <li key={step.id} className={cn("flex gap-3 text-sm", !state && "text-muted-foreground")}>
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                {state === "running" ? (
                  <Spinner className="size-3.5" />
                ) : state === "done" ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-border-strong" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex justify-between gap-2">
                  <span className="font-medium">{stepKinds[step.kind].title}</span>
                  {state === "done" && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {sampleRun[step.kind].seconds}s
                    </span>
                  )}
                </span>
                {state === "done" && <span className="text-pretty text-muted-foreground">{output}</span>}
              </span>
            </li>
          );
        })}
    </ol>
  );
}
