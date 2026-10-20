import { Link } from "react-router";
import { PlusIcon } from "lucide-react";

import type { Route } from "./+types/experiences";
import { funnelTypes, listFunnels } from "@core/funnels";
import { PageHeader } from "@/admin-components/page-header";
import { StatusBadge } from "@/admin-components/experience-status";
import { StartPagePreview } from "@/admin-components/start-page-preview";
import { buttonVariants } from "@/admin-components/ui/button";
import { number } from "@/lib/format";

export function meta() {
  return [{ title: "Experiences · Loro" }];
}

export function loader() {
  return { funnels: listFunnels() };
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function Experiences({ loaderData }: Route.ComponentProps) {
  const { funnels } = loaderData;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        title="Experiences"
        docs={{ slug: "experiences", tooltip: "How experiences work" }}
        actions={
          <Link to="/admin/experiences/new" className={buttonVariants({ size: "sm" })}>
            <PlusIcon data-icon="inline-start" />
            New Experience
          </Link>
        }
      />

      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {funnels.map((funnel) => (
          <li key={funnel.slug}>
            <Link
              to={`/admin/experiences/${funnel.slug}`}
              className="group flex flex-col gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            >
              <div className="relative overflow-hidden rounded-xl ring-1 ring-border">
                <StartPagePreview
                  start={funnel.start}
                  compact
                  className="aspect-[4/3] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={funnel.status} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-heading text-lg font-medium underline-offset-4 group-hover:underline">
                  {funnel.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {funnelTypes[funnel.type].name} · {funnel.anchor.date} · {funnel.anchor.place}
                </span>
              </div>

              <dl className="grid grid-cols-3 gap-4 border-t pt-4">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Views</dt>
                  <dd className="text-sm font-medium tabular-nums">{number.format(funnel.stats.views)}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Generated</dt>
                  <dd className="text-sm font-medium tabular-nums">{number.format(funnel.stats.generated)}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Open rate</dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {funnel.stats.generated ? percent(funnel.stats.openRate) : "—"}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}

        <li>
          <Link
            to="/admin/experiences/new"
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlusIcon className="mb-1 size-5" />
            <span className="text-sm font-medium">New Experience</span>
            <span className="max-w-56 text-sm text-muted-foreground">
              Describe it and Loro drafts the page, questions and workflow.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
