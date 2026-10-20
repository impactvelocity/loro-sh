import { Link } from "react-router";
import { PlusIcon } from "lucide-react";

import type { Route } from "./+types/experiences";
import { getCatalogue } from "@core/catalogue/registry";
import { coverOf } from "@core/funnels";
import { listFunnels } from "@core/funnels.server";
import { StatusBadge } from "@/admin-components/experience-status";
import { PageHeader } from "@/admin-components/page-header";
import { buttonVariants } from "@/admin-components/ui/button";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta() {
  return [{ title: "Experiences · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const funnels = await listFunnels(workspace.id);
  return {
    funnels: funnels.map((funnel) => ({
      slug: funnel.slug,
      name: funnel.name,
      status: funnel.status,
      catalogue: getCatalogue(funnel.catalogue)?.name ?? funnel.catalogue,
      updatedAt: funnel.updatedAt,
      cover: coverOf(funnel.config),
    })),
  };
}

const updated = (seconds: number) =>
  new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary ring-1 ring-border"
                style={funnel.cover.accent && !funnel.cover.image ? { backgroundColor: funnel.cover.accent } : undefined}
              >
                {funnel.cover.image && (
                  <img
                    src={funnel.cover.image}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                )}
                <div className="absolute top-3 left-3">
                  <StatusBadge status={funnel.status} tooltip={false} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-lg font-medium underline-offset-4 group-hover:underline">
                  {funnel.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {funnel.catalogue} · Edited {updated(funnel.updatedAt)}
                </span>
              </div>
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
              Pick a catalogue and start from its example.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
