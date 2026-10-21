import { Link } from "react-router";
import { ArrowLeftIcon } from "lucide-react";

import { DocsButton } from "@/admin-components/docs-button";
import { buttonVariants } from "@/admin-components/ui/button";

/**
 * Title row for admin pages: optional back link, title, meta and actions.
 * `backAside` sits opposite the back link, for badges like type and status.
 * `docs` adds an info button before the actions, linking to the docs article.
 */
export function PageHeader({
  back,
  backAside,
  title,
  description,
  meta,
  docs,
  actions,
}: {
  back?: { to: string; label: string };
  backAside?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  docs?: { slug: string; tooltip?: React.ReactNode };
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {back && (
        <div className="flex items-center justify-between gap-4">
          <Link
            to={back.to}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            {back.label}
          </Link>
          {backAside && <div className="flex items-center gap-2">{backAside}</div>}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="font-heading text-[2rem] font-medium">{title}</h1>
            {meta}
          </div>
          {(docs || actions) && (
            <div className="flex flex-wrap items-center gap-3">
              {docs && <DocsButton slug={docs.slug} tooltip={docs.tooltip} />}
              {actions}
            </div>
          )}
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
