/**
 * The Share tab: everywhere an experience can start. The public link (and
 * where it lives) with its QR code, and the API for starting it from another
 * system. Snippets use the saved experience's real link and question ids.
 */
import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";

import type { ExperienceConfig } from "@core/catalogue/config";
import type { Catalogue } from "@core/catalogue/define";
import { questionsOf, sampleAnswers } from "@core/catalogue/flow";
import type { FunnelStatus } from "@core/funnels";
import { FormSection } from "@/admin-components/form-section";
import { Alert, AlertDescription } from "@/admin-components/ui/alert";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/admin-components/ui/field";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Code({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="rounded-lg bg-secondary p-4 pr-28 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

function download(name: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

export function ExperienceShare({
  url,
  api: apiOrigin,
  qr,
  workspace,
  slug,
  slugDraft,
  onSlugChange,
  actions,
  status,
  catalogue,
  config,
}: {
  /** The full public link. */
  url: string;
  /** Where the API lives, for the snippets. Not always the page's host. */
  api: string;
  /** The link as a QR code, SVG markup. */
  qr: string;
  workspace: string;
  /** The saved link; copy, open and the QR code use it. */
  slug: string;
  /** The link being edited, saved with the rest of the experience. */
  slugDraft: string;
  onSlugChange: (slug: string) => void;
  /** Save and Discard for the link, shown while it's being changed. */
  actions: React.ReactNode;
  status: FunnelStatus;
  catalogue: Catalogue;
  /** The saved config, so ids in the snippets match what's live. */
  config: ExperienceConfig;
}) {
  const origin = apiOrigin;
  const api = `${origin}/api/workspaces/${workspace}/experiences/${slug}`;
  const questions = questionsOf(catalogue, config);
  const answers = sampleAnswers(catalogue, config);

  // Single-quoted for the shell, so any ' in an answer is closed, escaped and reopened.
  const body = JSON.stringify({ person: { name: "Sam Okafor", email: "sam@example.com" }, answers }, null, 2)
    .replaceAll("'", "'\\''")
    .split("\n")
    .join("\n  ");
  const curl = `curl -X POST ${api}/trigger \\
  -H "Authorization: Bearer $LORO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <FormSection title="Public Link">
        {status !== "live" && (
          <Alert>
            <AlertDescription>
              {status === "paused"
                ? "It's paused, so the link shows a closed notice. Set it live in Settings."
                : "It's still a draft. The link works so you can test it; set it live in Settings when it's ready."}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor="slug" className="sr-only">
                Link
              </FieldLabel>
              <div className="flex h-12 items-center rounded-lg border-2 border-transparent bg-secondary font-mono text-sm transition-colors hover:border-secondary-hover focus-within:border-ring focus-within:bg-background">
                <span className="truncate pl-3.5 text-muted-foreground select-none">{url.slice(0, url.length - slug.length)}</span>
                <input
                  id="slug"
                  value={slugDraft}
                  onChange={(e) => onSlugChange(e.target.value)}
                  className="h-full min-w-24 flex-1 bg-transparent pr-3.5 outline-none"
                />
              </div>
              <FieldDescription>
                {slugDraft !== slug
                  ? "Save to switch to the new link. Links you've already shared will stop working."
                  : "Changing it breaks links you've already shared."}
              </FieldDescription>
            </Field>
            {slugDraft !== slug && <div className="flex justify-start">{actions}</div>}
            <div className="flex flex-wrap gap-3">
              <CopyButton text={url} label="Copy Link" />
              <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Open
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Every visit is counted in the Overview. Each finished intake gets its own outcome link.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {/* Generated on the server from the link above, so it scans. */}
            <div className="size-40 overflow-hidden rounded-lg ring-1 ring-border [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <Button variant="ghost" size="xs" onClick={() => download(`${slug}-qr.svg`, qr)}>
              <DownloadIcon data-icon="inline-start" />
              Download SVG
            </Button>
          </div>
        </div>
      </FormSection>

      <FormSection title="Start by API">
        <p className="text-sm text-muted-foreground">
          For when another system knows them already: a ticket sale, a booking, a CRM. Post the person and their
          answers, or a <code className="font-mono">personId</code> for someone already in Profiles. Loro creates or
          finds their profile and makes the outcome. With the questions turned off, this is the only way in. It needs
          an API key from Connect → Keys.
        </p>
        <Code code={curl} />
        {questions.length > 0 && (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
            {questions.map((question) => (
              <div key={question.id} className="contents">
                <dt className="font-mono text-xs leading-5">
                  {question.id}
                  {!question.required && <span className="text-muted-foreground"> · optional</span>}
                </dt>
                <dd className="text-muted-foreground">
                  {question.question}
                  {(question.shape.kind === "one" || question.shape.kind === "many") &&
                    ` (${question.shape.kind === "many" ? "a list of " : "one of "}${question.shape.options.map((o) => `“${o}”`).join(", ")})`}
                  {question.shape.kind === "number" && ` (${question.shape.min} to ${question.shape.max})`}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="text-sm text-muted-foreground">
          <code className="font-mono">GET {api}/questions</code> lists the answers it takes. The response links
          to the outcome page and its run, which you can poll or stream.
        </p>
      </FormSection>
    </div>
  );
}
