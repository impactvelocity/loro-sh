/**
 * The HTTP side of an experience, for any front end: Loro's own page, a
 * brand's site, a native app. Pair it with `useExperience` for the state,
 * or call it directly from a server (with intake off, `submit` is how
 * another system starts an experience).
 *
 *   const client = createExperienceClient({ workspace: "nodo", experience: "weekend-plan" });
 *   const { experience } = await client.get();
 *   await client.optin({ name: "Sam", email: "sam@example.com" });
 *   await client.submit({ person, answers: { occasion: "A friend in town" } });
 *   await client.feedback({ rating: 5, comment: "Spot on" });
 *   subscribeRun(client.runUrl(client.generation), (run) => …);   // the outcome being made
 *
 * It remembers the submission `optin` started, so `submit` completes that
 * one instead of starting another. A `submit` with no sign-up first is a
 * trigger, which needs `apiKey`; keep that on a server.
 */
import type { RunState } from "../outcome/state";
import type { ExperienceConfig } from "./config";
import type { Answers, Person, ProfileRow } from "./define";

export type ClientResult<T> = { ok: true; data: T } | { ok: false; status: number; errors: Record<string, string> };

export type PersonRef = Person & { id: string };

export type PublicExperience = {
  slug: string;
  name: string;
  catalogue: string;
  status: "live" | "draft" | "paused";
  config: ExperienceConfig;
};

export function createExperienceClient({
  workspace,
  experience,
  baseUrl = "",
  apiKey,
  fetch: fetcher = globalThis.fetch,
}: {
  workspace: string;
  experience: string;
  /** Leave empty on the same origin as Loro. */
  baseUrl?: string;
  /** A workspace API key, to start it without a sign-up. Never in a browser. */
  apiKey?: string;
  fetch?: typeof fetch;
}) {
  const root = `${baseUrl}/api/workspaces/${encodeURIComponent(workspace)}/experiences/${encodeURIComponent(experience)}`;
  let submission: string | null = null;
  // The outcome the last submit made, so `feedback` knows what it's about.
  let generation: string | null = null;

  async function request<T>(path: string, init?: RequestInit): Promise<ClientResult<T>> {
    try {
      const response = await fetcher(`${root}${path}`, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
          ...init?.headers,
        },
      });
      const json = (await response.json().catch(() => null)) as (T & { errors?: Record<string, string>; error?: string }) | null;
      if (response.ok && json) return { ok: true, data: json };
      return {
        ok: false,
        status: response.status,
        errors: json?.errors ?? { "": json?.error ?? "Something went wrong. Try again." },
      };
    } catch {
      return { ok: false, status: 0, errors: { "": "Couldn't reach the server. Check your connection." } };
    }
  }

  return {
    get: () => request<{ experience: PublicExperience }>(""),

    /** Signs them up: creates or finds their profile and starts a submission. */
    async optin(person: Person) {
      const result = await request<{ person: PersonRef; submission: string }>("/optin", {
        method: "POST",
        body: JSON.stringify(person),
      });
      if (result.ok) submission = result.data.submission;
      return result;
    },

    /** Their answers. Completes the submission from `optin`, or starts and completes a new one. */
    async submit(input: { person: Person; answers: Answers }) {
      const result = await request<{
        person: PersonRef;
        submission: string;
        generation: string;
        profile: ProfileRow[];
        /** The outcome's planned steps, all pending: draw them while the first event is on its way. */
        run: RunState;
      }>(
        "/submissions",
        { method: "POST", body: JSON.stringify({ ...input, submission }) },
      );
      if (result.ok) {
        submission = null;
        generation = result.data.generation;
      }
      return result;
    },

    /** The outcome from the last `submit`, once there is one. */
    get generation() {
      return generation;
    },

    /** Where a run lives: GET it for its state, or listen with subscribeRun (core/outcome/client.ts). */
    runUrl: (id: string) => `${root}/runs/${encodeURIComponent(id)}`,

    /** A 1–5 rating for an outcome, and an optional comment. Rating again replaces it. */
    feedback: (input: { rating: number; comment?: string; generation?: string }) =>
      request<{ ok: true }>("/feedback", {
        method: "POST",
        body: JSON.stringify({ ...input, generation: input.generation ?? generation }),
      }),
  };
}

export type ExperienceClient = ReturnType<typeof createExperienceClient>;
