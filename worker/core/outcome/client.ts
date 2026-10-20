/**
 * Listening to a run from any front end. The run streams as server-sent
 * events from /api/workspaces/:workspace/experiences/:slug/runs/:id/events:
 * a snapshot first, then one small event per change. Works without React:
 *
 *   const stop = subscribeRun(client.runUrl(generationId), (state) => {
 *     const view = outcomeView(state);
 *     render(view.progress, view.current?.message, view.section("plan"));
 *   });
 *
 * It stops by itself once the run has failed, or is done and its
 * background steps have finished. `useOutcome` wraps it for React.
 */
import { type RunEvent, type RunState, applyEvent, isSettled } from "./state";

export function subscribeRun(
  url: string,
  onState: (state: RunState) => void,
  { initial = null, onError }: { initial?: RunState | null; onError?: (error: Event) => void } = {},
) {
  let state = initial;
  const source = new EventSource(`${url}/events`);
  source.onmessage = (message) => {
    const event = JSON.parse(message.data) as RunEvent;
    state = applyEvent(state, event);
    if (!state) return;
    onState(state);
    if (isSettled(state)) source.close();
  };
  // EventSource reconnects by itself and gets a fresh snapshot.
  source.onerror = (error) => onError?.(error);
  return () => source.close();
}

/** The run as it is now, once. */
export async function getRun(url: string, fetcher: typeof fetch = globalThis.fetch): Promise<RunState | null> {
  const response = await fetcher(url);
  if (!response.ok) return null;
  const { run } = (await response.json()) as { run: RunState };
  return run;
}
