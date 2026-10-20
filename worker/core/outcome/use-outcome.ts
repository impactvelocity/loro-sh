/**
 * The headless outcome SDK for React: one run's live state, from its
 * planned steps to the finished page. Bring your own design:
 *
 *   const outcome = useOutcome({ url: client.runUrl(generation), initial });
 *   if (!outcome) return null;
 *   outcome.progress            // { done: 2, total: 5 }
 *   outcome.current?.message    // "Finding places near Austin, TX"
 *   const plan = outcome.section<Plan>("plan");
 *   plan.status                 // "pending" | "generating" | "done" | "error"
 *   plan.data?.stops?.map((stop) => outcome.entity(stop.entity)?.name)
 *
 * `initial` is what to show before the first event: the planned steps
 * (planRun) or a snapshot the server already loaded. ExperienceRunner
 * uses this hook on the outcome, so catalogue components read the same
 * view from `ctx.outcome` and their `section` prop.
 */
import { useEffect, useMemo, useState } from "react";

import { subscribeRun } from "./client";
import { type OutcomeView, type RunState, isSettled, outcomeView } from "./state";

export function useOutcome({ url, initial }: { url: string | null; initial: RunState | null }): OutcomeView | null {
  const [state, setState] = useState<RunState | null>(initial);
  const initialId = initial?.id ?? null;

  // A new run (another generation, a new test) starts from its own plan.
  useEffect(() => setState(initial), [initialId]);

  useEffect(() => {
    if (!url || (initial && isSettled(initial))) return;
    return subscribeRun(url, setState, { initial });
  }, [url, initialId]);

  return useMemo(() => (state ? outcomeView(state) : null), [state]);
}
