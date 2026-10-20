import { Link, NavLink } from "react-router";

import { Logo } from "@/admin-components/logo";
import { buttonVariants } from "@/admin-components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin/workspaces", label: "Workspaces" },
  { to: "/admin/workspaces/profiles", label: "Profiles" },
  { to: "/admin/docs", label: "Docs" },
];

/**
 * The top of the pages that sit above any one workspace, which have no
 * sidebar: Workspaces, Profiles, and Docs when no workspace is picked.
 * Links to the others; the page you're on is left out.
 */
export function AccountHeader({ page }: { page: "workspaces" | "profiles" | "docs" }) {
  const current = { workspaces: "/admin/workspaces", profiles: "/admin/workspaces/profiles", docs: "/admin/docs" }[page];

  return (
    <header className="flex h-9 items-center justify-between gap-4">
      <Link to="/admin/workspaces" aria-label="Loro" className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Logo className="h-6 w-auto" />
      </Link>
      <nav className="flex items-center gap-1">
        {links
          .filter((link) => link.to !== current)
          .map((link) => (
            <NavLink key={link.to} to={link.to} end className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {link.label}
            </NavLink>
          ))}
      </nav>
    </header>
  );
}
