/**
 * Connect: how agents and other systems connect to the workspace. The
 * MCP server (workers/mcp.ts) comes first, then the REST API it's built on
 * (workers/api.ts), then the keys both of them take.
 */
import { Fragment, useState } from "react";
import { data, useFetcher, useSearchParams } from "react-router";
import { EyeIcon, KeyRoundIcon, PlusIcon } from "lucide-react";

import type { Route } from "./+types/mcp";
import type { ApiKeyRecord } from "@core/api-keys.server";
import { ApiKeyError, createApiKey, listApiKeys, revokeApiKey } from "@core/api-keys.server";
import { since } from "@core/people";
import { KEY_NAME_MAX, endpointGroups, mcpToolGroups } from "@core/settings";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { FormSection } from "@/admin-components/form-section";
import { PageHeader } from "@/admin-components/page-header";
import { Badge } from "@/admin-components/ui/badge";
import { Button } from "@/admin-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin-components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { daysAgo } from "@/lib/format";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta() {
  return [{ title: "Connect · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  return {
    workspace,
    keys: await listApiKeys(workspace.id),
    origin: new URL(request.url).origin,
    now: Math.floor(Date.now() / 1000),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const form = await request.formData();
  try {
    if (form.get("intent") === "create-key") {
      const { secret } = await createApiKey(workspace.id, String(form.get("name") ?? ""));
      return data({ error: null, secret });
    }
    if (form.get("intent") === "revoke-key") await revokeApiKey(workspace.id, String(form.get("id") ?? ""));
  } catch (error) {
    if (error instanceof ApiKeyError) return data({ error: error.message }, { status: 400 });
    throw error;
  }
  return data({ error: null });
}

/** Read-only value with a copy button, for URLs and commands. */
function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(event) => event.target.select()}
        className="h-9 rounded-md font-mono text-xs"
      />
      <Button
        variant="secondary"
        size="sm"
        className="w-20 shrink-0"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}


type KeyResult = { error: string | null; secret?: string };

function ApiKeys({ keys, locked, now }: { keys: ApiKeyRecord[]; locked: boolean; now: number }) {
  // A fresh fetcher each time the dialog opens, so it doesn't show the last key or error.
  const [attempt, setAttempt] = useState(0);
  const fetcher = useFetcher<KeyResult>({ key: `api-key-${attempt}` });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const creating = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "create-key";
  const result = fetcher.data;
  // A key opened from the table, or the one just made.
  const [viewing, setViewing] = useState<ApiKeyRecord | null>(null);
  const shown = open ? (viewing?.secret ?? result?.secret ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {locked
            ? "Demo workspaces are read-only, so they don't take keys."
            : "Agents over MCP, and changes over the API, need one of these. Each key works on this workspace only."}
        </p>
        <Button
          size="sm"
          className="shrink-0"
          disabled={locked}
          onClick={() => {
            setName("");
            setViewing(null);
            setAttempt((n) => n + 1);
            setOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          New Key
        </Button>
      </div>
      {keys.length === 0 ? null : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="text-right">Last used</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">loro_sk_••••{key.last4}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {daysAgo(Math.floor((now - key.createdAt) / 86_400))}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{since(key.lastUsedAt, now)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {key.secret && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View ${key.name}`}
                        onClick={() => {
                          setViewing(key);
                          setOpen(true);
                        }}
                      >
                        <EyeIcon />
                      </Button>
                    )}
                    <ConfirmDeleteButton
                      iconOnly
                      label={`Revoke ${key.name}`}
                      confirmTitle={`Revoke ${key.name}?`}
                      confirmDescription="Anything using it stops working straight away. This can't be undone."
                      onConfirm={() => fetcher.submit({ intent: "revoke-key", id: key.id }, { method: "post" })}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {shown ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing ? viewing.name : "Copy Your Key"}</DialogTitle>
                <DialogDescription>
                  Send it as a Bearer token in the Authorization header. You can view it again here any time.
                </DialogDescription>
              </DialogHeader>
              <CopyField value={shown} label="API key" />
              <DialogFooter>
                <DialogClose render={<Button size="sm" />}>Done</DialogClose>
              </DialogFooter>
            </>
          ) : (
            <fetcher.Form method="post" className="flex flex-col gap-6">
              <input type="hidden" name="intent" value="create-key" />
              <DialogHeader>
                <DialogTitle>New Key</DialogTitle>
              </DialogHeader>
              <Field data-invalid={result?.error ? true : undefined}>
                <FieldLabel htmlFor="key-name">Name</FieldLabel>
                <Input
                  id="key-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Booking sync"
                  maxLength={KEY_NAME_MAX}
                  autoFocus
                />
                <FieldDescription>{result?.error ?? "So you know what to revoke later."}</FieldDescription>
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
                <Button type="submit" size="sm" disabled={!name.trim() || creating}>
                  <KeyRoundIcon data-icon="inline-start" />
                  {creating ? "Creating" : "Create Key"}
                </Button>
              </DialogFooter>
            </fetcher.Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* MCP */

function Mcp({ origin, onKeys }: { origin: string; onKeys: () => void }) {
  return (
    <div className="flex flex-col gap-10">
      <FormSection title="Set Up">
        <div className="flex flex-col gap-8">
          <Field>
            <FieldLabel>Server URL</FieldLabel>
            <CopyField value={`${origin}/mcp`} label="MCP server URL" />
          </Field>
          <Field>
            <FieldLabel>Add to Claude Code</FieldLabel>
            <CopyField
              value={`claude mcp add --transport http loro ${origin}/mcp --header "Authorization: Bearer loro_sk_..."`}
              label="Claude Code command"
            />
            <FieldDescription>
              Swap in a key from{" "}
              <button type="button" onClick={onKeys} className="font-medium text-foreground underline underline-offset-4">
                Keys
              </button>
              . The key picks the workspace, and the agent can do anything the key can. Other clients take the server
              URL and the same header.
            </FieldDescription>
          </Field>
        </div>
      </FormSection>
      <FormSection title="Tools">
        <div className="flex flex-col gap-8">
          {mcpToolGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <Table>
                <TableBody>
                  {group.tools.map((tool) => (
                    <TableRow key={tool.name}>
                      <TableCell className="font-mono text-xs">{tool.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{tool.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

/* API */

function Api({ origin }: { origin: string }) {
  return (
    <div className="flex flex-col gap-10">
      <FormSection title="Base URL">
        <div className="flex flex-col gap-3">
          <CopyField value={`${origin}/api`} label="API base URL" />
          <p className="text-sm text-muted-foreground">
            Endpoints marked Key need one of this workspace's keys as a bearer token. Everything else is open, like
            the admin.
          </p>
        </div>
      </FormSection>
      <FormSection title="Endpoints">
        <div className="flex flex-col gap-8">
          {endpointGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <Table>
                <TableBody>
                  {group.endpoints.map((endpoint) => (
                    <TableRow key={endpoint.method + endpoint.path}>
                      <TableCell className="w-20">
                        <Badge variant="outline" className="font-mono">
                          {endpoint.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {/* Breaks only after a slash, so long paths wrap cleanly. */}
                        <span className="font-mono text-xs">
                          {endpoint.path.split("/").map((segment, i) => (
                            <Fragment key={i}>
                              {i > 0 && (
                                <>
                                  /<wbr />
                                </>
                              )}
                              {segment}
                            </Fragment>
                          ))}
                        </span>
                        <span className="mt-1 block text-muted-foreground sm:hidden">{endpoint.description}</span>
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                        {endpoint.description}
                      </TableCell>
                      <TableCell className="w-14 text-right">
                        {endpoint.key && <Badge variant="secondary">Key</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

/* Page */

const views = ["mcp", "api", "keys"] as const;
type View = (typeof views)[number];

const viewDocs: Record<View, { slug: string; tooltip: string }> = {
  mcp: { slug: "mcp", tooltip: "How agents connect over MCP" },
  api: { slug: "api", tooltip: "How the REST API works" },
  keys: { slug: "api", tooltip: "What keys are for" },
};

export default function McpApi({ loaderData }: Route.ComponentProps) {
  const { workspace, keys, origin, now } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = views.find((v) => v === searchParams.get("view")) ?? "mcp";
  const show = (next: View) => setSearchParams(next === "mcp" ? {} : { view: next }, { preventScrollReset: true });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <PageHeader title="Connect" docs={viewDocs[view]} />
      <div className="flex flex-col gap-10">
        <Tabs value={view} onValueChange={(value) => show(value as View)}>
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="mcp">MCP</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="keys">
              Keys
              <span className="text-muted-foreground tabular-nums">{keys.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {view === "mcp" && <Mcp origin={origin} onKeys={() => show("keys")} />}
        {view === "api" && <Api origin={origin} />}
        {view === "keys" && <ApiKeys keys={keys} locked={Boolean(workspace.demo)} now={now} />}
      </div>
    </div>
  );
}
