import { Link, useOutletContext } from "react-router";
import { ArrowRightIcon } from "lucide-react";

import type { DocsContext } from "../docs";
import { PageHeader } from "@/admin-components/page-header";

export function meta() {
  return [{ title: "Docs · Loro" }];
}

const start = [
  { slug: "quickstart", label: "Quickstart" },
  { slug: "self-hosting", label: "Self-Hosting" },
  { slug: "api", label: "REST API" },
];

export default function DocsOverview() {
  const { sections } = useOutletContext<DocsContext>();

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title="Docs"
        description="Build experiences, connect your systems and run Loro yourself."
      />

      <ul className="grid gap-3 sm:grid-cols-3">
        {start.map((item) => (
          <li key={item.slug}>
            <Link
              to={`/admin/docs/${item.slug}`}
              className="group flex items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-3.5 text-sm font-medium transition-colors outline-none hover:bg-secondary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {item.label}
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-4 border-t pt-6">
            <h2 className="font-heading text-xl font-medium">{section.title}</h2>
            <ul className="flex flex-col gap-4">
              {section.articles.map((article) => (
                <li key={article.slug}>
                  <Link to={`/admin/docs/${article.slug}`} className="group flex flex-col gap-0.5">
                    <span className="font-medium underline-offset-4 group-hover:underline">{article.title}</span>
                    <span className="text-sm text-muted-foreground">{article.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
