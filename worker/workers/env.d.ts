/**
 * Secrets, which `wrangler types` can't see. All optional: without them
 * Loro falls back to fixtures. Set with `wrangler secret put <NAME>`, or
 * in .dev.vars locally.
 *
 * - QLOO_API_KEY: Qloo's Taste AI.
 * - CF_ACCOUNT_ID and CF_API_TOKEN: read Analytics Engine over its SQL
 *   API. The token needs Account Analytics: Read.
 * - ADMIN_PASSWORD: unlocks the admin, which is view only without it
 *   (core/admin-auth.server.ts). Unset, the admin is open. Changing it
 *   puts everyone back to view only.
 * - POSTHOG_KEY: the PostHog project the live hosts report to
 *   (app/lib/posthog.server.ts). Unset, nothing is sent.
 */
type Secrets = {
  QLOO_API_KEY?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  ADMIN_PASSWORD?: string;
  POSTHOG_KEY?: string;
};

interface Env extends Secrets {}
declare namespace Cloudflare {
  interface Env extends Secrets {}
}
