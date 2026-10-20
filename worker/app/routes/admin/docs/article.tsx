import { useState } from "react";
import { data, Link } from "react-router";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CopyIcon, InfoIcon } from "lucide-react";

import type { Route } from "./+types/article";
import { type DocBlock, type DocLink, getDoc, headingId } from "@core/docs";
import { Button } from "@/admin-components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import { daysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function loader({ params }: Route.LoaderArgs) {
  const doc = getDoc(params.slug);
  if (!doc) throw data(null, { status: 404 });
  return doc;
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.article.title ?? "Docs"} · Loro` }];
}

/** `code`, **bold** and [links](/path). External links open in a new tab. */
function Inline({ text }: { text: string }) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((part, i) => {
    if (part.startsWith("`")) {
      return (
        <code key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const className = "font-medium text-foreground underline underline-offset-4 hover:decoration-2";
      return href.startsWith("/") ? (
        <Link key={i} to={href} className={className}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noreferrer" className={className}>
          {label}
        </a>
      );
    }
    return part;
  });
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg bg-secondary">
      <div className="flex items-center justify-between gap-4 border-b border-background py-1.5 pr-1.5 pl-4">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="leading-relaxed text-muted-foreground">
          <Inline text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2 id={headingId(block.text)} className="scroll-mt-10 pt-4 font-heading text-xl font-medium">
          {block.text}
        </h2>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={cn(
            "flex flex-col gap-2 pl-5 leading-relaxed text-muted-foreground marker:text-foreground",
            block.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "code":
      return <CodeBlock code={block.code} label={block.label} />;
    case "note":
      return (
        <div className="flex gap-3 rounded-lg border p-4 text-sm leading-relaxed">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            <Inline text={block.text} />
          </p>
        </div>
      );
    case "table":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              {block.head.map((cell) => (
                <TableHead key={cell}>{cell}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.rows.map((row) => (
              <TableRow key={row.join()}>
                {row.map((cell, i) => (
                  <TableCell key={i} className={cn(i === 0 && "font-medium")}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
  }
}

function Pager({ doc, direction }: { doc: DocLink | null; direction: "previous" | "next" }) {
  if (!doc) return <div />;
  const next = direction === "next";

  return (
    <Link
      to={`/admin/docs/${doc.slug}`}
      className={cn(
        "group flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-secondary",
        next && "items-end text-right",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {!next && <ArrowLeftIcon className="size-3.5" />}
        {next ? "Next" : "Previous"}
        {next && <ArrowRightIcon className="size-3.5" />}
      </span>
      <span className="text-sm font-medium">{doc.title}</span>
    </Link>
  );
}

export default function DocsArticle({ loaderData }: Route.ComponentProps) {
  const { article, section, previous, next } = loaderData;
  const headings = article.body.flatMap((block) => (block.type === "h2" ? [block.text] : []));

  return (
    <div className="flex gap-12">
      <article className="flex max-w-2xl min-w-0 flex-1 flex-col gap-10">
        <header className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{section}</span>
          <h1 className="font-heading text-[2rem] font-medium">{article.title}</h1>
          <p className="text-lg text-muted-foreground">{article.description}</p>
        </header>

        <div className="flex flex-col gap-5">
          {article.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        <footer className="flex flex-col gap-6 border-t pt-6">
          <span className="text-sm text-muted-foreground">
            Updated {daysAgo(article.updatedDaysAgo).toLowerCase()}
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Pager doc={previous} direction="previous" />
            <Pager doc={next} direction="next" />
          </div>
        </footer>
      </article>

      {headings.length > 0 && (
        <aside className="sticky top-10 hidden w-44 shrink-0 self-start 2xl:block">
          <h2 className="mb-3 text-xs font-medium text-muted-foreground">On This Page</h2>
          <ul className="flex flex-col gap-2">
            {headings.map((heading) => (
              <li key={heading}>
                <a
                  href={`#${headingId(heading)}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {heading}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
