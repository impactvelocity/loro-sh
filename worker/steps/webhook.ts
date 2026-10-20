/**
 * A code step that runs after the outcome is ready: posts it to a URL, so
 * a CRM, Zapier or your own server can pick it up. Fire and forget: the
 * person never waits on it, and a failure shows on the run, not the page.
 */
import { WebhookIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f } from "@core/catalogue/fields";

export default defineStep({
  type: "webhook",
  name: "Webhook",
  description: "Posts the person, their answers and the finished outcome to a URL.",
  icon: WebhookIcon,
  at: "finish",
  fields: {
    url: f.text({ label: "URL", placeholder: "https://example.com/hooks/loro" }),
    tests: f.toggle({ label: "Send test runs too" }),
  },
  async run(props, ctx) {
    if (!props.url) return { skipped: true, message: "No URL set" };
    if (ctx.test && !props.tests) return { skipped: true, message: "Test run, not sent" };
    await ctx.report(`Posting to ${new URL(props.url).host}`);
    const response = await fetch(props.url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "Loro" },
      body: JSON.stringify({
        type: "outcome.ready",
        run: ctx.runId,
        test: ctx.test,
        url: ctx.outcomeUrl,
        person: ctx.person,
        answers: ctx.answers,
        sections: ctx.sections,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`The URL answered ${response.status}`);
    return { message: `Sent to ${new URL(props.url).host}` };
  },
});
