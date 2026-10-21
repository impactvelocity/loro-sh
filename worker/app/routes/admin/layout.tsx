import { useState } from "react";
import { Outlet, redirect } from "react-router";
import { MenuIcon } from "lucide-react";

import { AccountHeader } from "@/admin-components/account-header";
import { AdminNav } from "@/admin-components/admin-nav";
import { WorkspaceSwitcher } from "@/admin-components/workspace-switcher";
import { Button } from "@/admin-components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import type { Route } from "./+types/layout";
import type { RouteHandle } from "@/lib/document";
import { listWorkspaces } from "@core/workspaces.server";
import { readPreferences } from "@/lib/preferences";
import { selectedWorkspace } from "@/lib/workspace.server";

export const handle: RouteHandle = { surface: "admin" };

export async function loader({ request }: Route.LoaderArgs) {
  const [preferences, workspaces, current] = await Promise.all([
    readPreferences(request),
    listWorkspaces(),
    selectedWorkspace(request),
  ]);
  // Docs read the same with or without a workspace; everything else needs one.
  if (!current && !new URL(request.url).pathname.startsWith("/admin/docs")) {
    throw redirect("/admin/workspaces");
  }
  return { mode: preferences.mode, workspaces, current };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { current } = loaderData;

  // No workspace (only Docs gets here): the sidebar would be all dead links,
  // so use the header from the pages above any one workspace instead.
  if (!current) {
    return (
      <div className="flex min-h-svh flex-col gap-10 bg-background px-4 py-8 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <AccountHeader page="docs" />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r md:flex">
        <div className="px-10 pt-10">
          <WorkspaceSwitcher workspaces={loaderData.workspaces} current={current} />
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher workspaces={loaderData.workspaces} current={current} compact />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
        </header>

        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <AdminNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
