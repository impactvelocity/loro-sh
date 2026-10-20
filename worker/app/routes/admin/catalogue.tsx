import { useState } from "react";
import { Link, data } from "react-router";

import type { Route } from "./+types/catalogue";
import { listImages } from "@core/context";
import { type ExperienceConfig, parseConfig } from "@core/catalogue/config";
import type { PartId } from "@core/catalogue/define";
import { stagesOf } from "@core/catalogue/flow";
import { getCatalogue } from "@core/catalogue/registry";
import { EditorLibrary } from "@/admin-components/catalogue/media-picker";
import { JsonSheet, PartTabs, PartWorkspace, RunThrough } from "@/admin-components/catalogue/experience-editor";
import { PageHeader } from "@/admin-components/page-header";
import { Badge } from "@/admin-components/ui/badge";
import { buttonVariants } from "@/admin-components/ui/button";

/** A catalogue's example, editable but never saved: for trying components out. */
export function loader({ params }: Route.LoaderArgs) {
  const catalogue = getCatalogue(params.id);
  if (!catalogue) throw data(null, { status: 404 });
  return {
    id: catalogue.id,
    config: parseConfig(catalogue, catalogue.example),
    images: listImages(),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.config.name ?? "Catalogue"} · Loro` }];
}

export default function CataloguePlayground({ loaderData }: Route.ComponentProps) {
  const { id, images } = loaderData;
  const catalogue = getCatalogue(id)!;
  const [config, setConfig] = useState<ExperienceConfig>(loaderData.config);
  const [tab, setTab] = useState<PartId>(stagesOf(loaderData.config)[0]);

  return (
    <EditorLibrary value={{ images, videos: [], workspaceId: null }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <PageHeader
          back={{ to: "/admin/settings", label: "Settings" }}
          backAside={<Badge variant="outline">{catalogue.name} Catalogue</Badge>}
          title={config.name}
          description={catalogue.description}
          actions={
            <>
              <JsonSheet config={config} />
              <RunThrough catalogue={catalogue} config={config} />
              <Link to="/admin/experiences/new" className={buttonVariants({ size: "sm" })}>
                New Experience
              </Link>
            </>
          }
        />
        <PartTabs config={config} value={tab} onChange={setTab} />
        <PartWorkspace key={tab} catalogue={catalogue} config={config} part={tab} onChange={setConfig} />
      </div>
    </EditorLibrary>
  );
}
