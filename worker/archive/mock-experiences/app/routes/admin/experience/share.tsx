import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, SendIcon, SparklesIcon } from "lucide-react";

import type { Route } from "./+types/share";
import type { ExperienceContext } from "../experience";
import { isInternal } from "@core/funnels";
import { experiencesFor, listIndividuals } from "@core/profiles";
import { FormSection } from "@/admin-components/form-section";
import { Alert, AlertDescription } from "@/admin-components/ui/alert";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { RunLog, useMockRun } from "@/admin-components/workflow-run";

export function loader() {
  return {
    people: listIndividuals().map(({ id, name }) => ({
      id,
      name,
      title: experiencesFor(id)[0]?.title ?? null,
    })),
  };
}

const host = "https://loro.sh";

const holds = {
  review: "Hold for my review",
  send: "Send when it's ready",
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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
      <pre className="overflow-x-auto rounded-lg bg-secondary p-4 pr-28 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

/**
 * Stand-in QR code: the three finder squares plus a pattern seeded by the
 * link, so each experience looks different. Not scannable yet.
 */
function QrMock({ seed }: { seed: string }) {
  const size = 25;
  let hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const random = () => ((hash = (hash * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const finder = (x: number, y: number) =>
    [[0, 0], [size - 7, 0], [0, size - 7]].some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8);
  const cells: [number, number][] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!finder(x, y) && random() > 0.52) cells.push([x, y]);

  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="size-full" role="img" aria-label="QR code for the link">
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="white" />
      {[[0, 0], [size - 7, 0], [0, size - 7]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="black" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="black" />
        </g>
      ))}
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="black" />
      ))}
    </svg>
  );
}


/**
 * Runs the real workflow for one profile, like a test, but the result is
 * kept: it's saved to their profile with a private link to share.
 */
function CreateForSomeone({
  funnel,
  people,
}: {
  funnel: ExperienceContext["funnel"];
  people: Route.ComponentProps["loaderData"]["people"];
}) {
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [hold, setHold] = useState<keyof typeof holds>("review");
  const [sent, setSent] = useState(false);
  const mock = useMockRun(funnel.steps);
  const person = people.find((p) => p.id === personId);
  const personItems = Object.fromEntries(people.map((p) => [p.id, p.name]));
  const privateLink = `${host}/a/exp-2007`;

  return (
    <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Field>
          <FieldLabel>Person</FieldLabel>
          <Select
            items={personItems}
            value={personId}
            onValueChange={(value) => {
              setPersonId(String(value));
              mock.reset();
              setSent(false);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="create-note">Note for this one</FieldLabel>
          <Textarea
            id="create-note"
            value={note}
            placeholder="Celebrating ten years. Somewhere quiet for dinner."
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>When it's ready</FieldLabel>
          <Select items={holds} value={hold} onValueChange={(value) => setHold(value as keyof typeof holds)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(holds).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button size="sm" className="self-start" onClick={mock.start} disabled={mock.running || !person}>
          {mock.running ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
          {mock.running ? "Creating" : mock.finished ? "Create Another" : "Create"}
        </Button>
      </div>

      <div className="flex flex-col gap-5 rounded-xl bg-secondary/60 p-5">
        {mock.run ? (
          <>
            <RunLog steps={funnel.steps} run={mock.run} />
            {mock.finished && person && (
              <div className="flex flex-col gap-4 border-t border-border-strong pt-5">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-pretty">
                    {person.title ?? `${funnel.anchor.name}, planned for ${person.name.split(" ")[0]}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Saved to{" "}
                    <Link to={`/admin/profiles/people/${person.id}`} className="underline underline-offset-4">
                      {person.name}'s profile
                    </Link>
                    {sent || hold === "send" ? ", sent by email" : ", waiting for you"}
                  </span>
                </div>
                <div className="flex h-10 items-center rounded-lg bg-background px-3 text-sm">
                  <span className="truncate">{privateLink}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={privateLink} label="Copy Link" />
                  <a href="/f/itinerary" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Open
                    <ExternalLinkIcon data-icon="inline-end" />
                  </a>
                  {hold === "review" && !sent && (
                    <Button size="sm" onClick={() => setSent(true)}>
                      <SendIcon data-icon="inline-start" />
                      Send
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="m-auto max-w-56 text-center text-sm text-muted-foreground">
            Runs the workflow for this person and saves the result to their profile.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ExperienceShare({ loaderData }: Route.ComponentProps) {
  const { funnel } = useOutletContext<ExperienceContext>();
  const internal = isInternal(funnel.type);
  const [embed, setEmbed] = useState<"button" | "inline">("button");
  const link = `${host}/f/${funnel.slug}`;

  const snippet =
    embed === "button"
      ? `<script src="${host}/embed.js" async></script>\n<a href="${link}" data-loro="button">${funnel.start.button}</a>`
      : `<script src="${host}/embed.js" async></script>\n<div data-loro="inline" data-experience="${funnel.slug}"></div>`;

  const curl = `curl ${host}/api/experiences/${funnel.slug}/people \\
  -H "Authorization: Bearer $LORO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "maya.okafor@hey.com",
    "name": "Maya Okafor",
    "source": "Ticket order #MC-48213",
    "invite": true
  }'`;

  const mcpConfig = `{
  "mcpServers": {
    "loro": {
      "url": "${host}/mcp",
      "headers": { "Authorization": "Bearer $LORO_API_KEY" }
    }
  }
}`;

  const tools = [
    ["create_experience", `Generate ${funnel.name} for a person, from an email or profile.`],
    ["invite_to_intake", "Send someone the start page link, with their details filled in."],
    ["list_generations", "Recent generations and their status."],
    ["get_feedback", "Survey responses, filtered by rating."],
  ];

  return (
    <div className="flex flex-col gap-10">
      {!internal && (
        <FormSection title="Public Link">
          {funnel.status !== "live" && (
            <Alert>
              <AlertDescription>
                This experience isn't live, so the link shows a closed notice. Publish it in Settings.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 items-center rounded-lg bg-secondary px-3.5">
                <span className="truncate">{link}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <CopyButton text={link} label="Copy Link" />
                <a href={`/f/${funnel.type}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Open Page
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <div className="size-40 overflow-hidden rounded-lg ring-1 ring-border">
                <QrMock seed={link} />
              </div>
              <Button variant="ghost" size="sm" className="-ml-3">
                <DownloadIcon data-icon="inline-start" />
                Download QR
              </Button>
            </div>
          </div>
        </FormSection>
      )}

      <FormSection title="Create for Someone">
        <CreateForSomeone funnel={funnel} people={loaderData.people} />
      </FormSection>

      {!internal && (
        <FormSection title="Embed">
          <Tabs value={embed} onValueChange={(value) => setEmbed(value as typeof embed)}>
            <TabsList>
              <TabsTrigger value="button" className="px-3">Button</TabsTrigger>
              <TabsTrigger value="inline" className="px-3">Inline</TabsTrigger>
            </TabsList>
          </Tabs>
          <Code code={snippet} />
        </FormSection>
      )}

      <FormSection title="API">
        <Code code={curl} />
        <Field className="sm:max-w-md">
          <FieldLabel htmlFor="api-key">API key</FieldLabel>
          <div className="flex gap-3">
            <Input id="api-key" readOnly value="loro_sk_••••••••••••••••3f9a" className="font-mono text-sm" />
            <Button variant="secondary" size="sm" className="h-12 shrink-0">New Key</Button>
          </div>
        </Field>
      </FormSection>

      <FormSection title="MCP">
        <Code code={mcpConfig} />
        <ul className="divide-y border-y">
          {tools.map(([name, description]) => (
            <li key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <code className="w-44 shrink-0 text-sm font-medium">{name}</code>
              <span className="text-sm text-muted-foreground">{description}</span>
            </li>
          ))}
        </ul>
      </FormSection>
    </div>
  );
}
