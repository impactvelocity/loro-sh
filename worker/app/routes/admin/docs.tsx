import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BookOpenIcon, SearchIcon } from "lucide-react";

import type { Route } from "./+types/docs";
import { listDocs } from "@core/docs";
import { Button } from "@/admin-components/ui/button";
import { Input } from "@/admin-components/ui/input";
import { ScrollArea } from "@/admin-components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import { cn } from "@/lib/utils";

export function loader() {
  return { sections: listDocs() };
}

export type DocsContext = Route.ComponentProps["loaderData"];

type Sections = DocsContext["sections"];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "-ml-px block border-l py-1 pl-4 text-sm transition-colors",
    isActive
      ? "border-foreground font-medium text-foreground"
      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
  );

/** Filters by title and description, keeping sections that still have a match. */
function DocsSidebar({ sections, onNavigate }: { sections: Sections; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = sections
    .map((section) => ({
      ...section,
      articles: section.articles.filter((article) =>
        `${article.title} ${article.description}`.toLowerCase().includes(needle),
      ),
    }))
    .filter((section) => section.articles.length > 0);

  return (
    <nav aria-label="Docs" className="flex flex-col gap-8">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs"
          aria-label="Search docs"
          className="h-9 rounded-md pl-9 text-sm"
        />
      </div>

      {filtered.map((section, i) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{section.title}</h2>
          <ul className="ml-2 flex flex-col border-l">
            {/* Overview leads the first section, and hides while searching. */}
            {i === 0 && !needle && (
              <li>
                <NavLink to="/admin/docs" end onClick={onNavigate} className={linkClass}>
                  Overview
                </NavLink>
              </li>
            )}
            {section.articles.map((article) => (
              <li key={article.slug}>
                <NavLink to={`/admin/docs/${article.slug}`} onClick={onNavigate} className={linkClass}>
                  {article.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing matches "{query.trim()}".</p>
      )}
    </nav>
  );
}

export default function DocsLayout({ loaderData }: Route.ComponentProps) {
  const [open, setOpen] = useState(false);

  return (
    // From xl the sidebar sits flush against the admin nav, so this cancels main's padding.
    <div className="flex xl:-mx-10 xl:-my-10">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r xl:block">
        <ScrollArea className="h-full">
          <div className="pt-6 pr-6 pb-10 pl-4">
            <DocsSidebar sections={loaderData.sections} />
          </div>
        </ScrollArea>
      </aside>

      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-8 xl:px-10 xl:py-10">
        <div className="xl:hidden">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <BookOpenIcon data-icon="inline-start" />
            Browse Docs
          </Button>
        </div>
        <Outlet context={loaderData satisfies DocsContext} />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-6 pt-14">
          <SheetTitle className="sr-only">Docs</SheetTitle>
          <DocsSidebar sections={loaderData.sections} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
