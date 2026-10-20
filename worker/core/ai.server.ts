/**
 * Models for anything in Loro that calls AI, starting with the agent.
 *
 * Every call goes through the Worker's AI binding and the AI Gateway named
 * in `AI_GATEWAY`, so the gateway logs, caches and rate limits all of them
 * in one place. `AI_MODEL` picks the model:
 *
 * - a Workers AI model ("@cf/moonshotai/kimi-k2.6"): runs on Cloudflare,
 *   billed to the account, no key needed.
 * - an AI Gateway catalog model ("anthropic/claude-sonnet-5.5",
 *   "openai/gpt-5"): billed through the gateway's unified billing, or the
 *   provider key stored on the gateway.
 */
import { env } from "cloudflare:workers";
import type { LanguageModel } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { anthropic } from "workers-ai-provider/anthropic";
import { openai } from "workers-ai-provider/openai";

export function aiModelId(): string {
  return env.AI_MODEL;
}

export function aiGatewayId(): string {
  return env.AI_GATEWAY;
}

export function languageModel(id: string = aiModelId()): LanguageModel {
  const workersai = createWorkersAI({
    binding: env.AI,
    gateway: { id: aiGatewayId() },
    // Wire formats for catalog models; "@cf/…" ids don't need them.
    providers: [anthropic, openai],
  });
  return workersai(id);
}

/**
 * The model that writes outcomes: the Taste brief and every generated
 * section. `OUTCOME_MODEL`, separate from the agent's, since sections
 * need reliable structured output.
 */
export function outcomeModel(): LanguageModel {
  return languageModel(env.OUTCOME_MODEL);
}

/**
 * Call settings for outcome writing. Reasoning models think at length by
 * default, which a section doesn't need and the person waits through, so
 * effort is kept low for Workers AI and OpenAI models; other providers
 * ignore it.
 */
export const outcomeOptions = {
  providerOptions: { "workers-ai": { reasoning_effort: "low" }, openai: { reasoningEffort: "low" } },
} as const;
