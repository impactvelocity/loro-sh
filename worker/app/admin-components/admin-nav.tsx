import { NavLink } from "react-router";
import { ExternalLinkIcon } from "lucide-react";

import { Logo } from "@/admin-components/logo";
import { ViewOnlyNote } from "@/admin-components/view-only";
import { useReadOnly } from "@/hooks/use-read-only";
import { cn } from "@/lib/utils";

const primary = [
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/profiles", label: "Profiles" },
  { to: "/admin/experiences", label: "Experiences" },
  { to: "/admin/context", label: "Context" },
];

/** Working with the workspace from outside the pages: the agent, and MCP / API. */
const agents = [
  { to: "/admin/agent", label: "Agent" },
  { to: "/admin/mcp", label: "Connect" },
];

const secondary = [
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/docs", label: "Docs" },
];

/** The underline grows from the left on hover and stays when active. */
const itemClass = (isActive: boolean) =>
  cn(
    "relative inline-block pb-1 text-[17px] font-medium tracking-wider text-foreground",
    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-current",
    "after:scale-x-0 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100",
    isActive && "after:scale-x-100",
  );

/** Text-only links. */
function NavList({
  items,
  onNavigate,
}: {
  items: typeof primary;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const readOnly = useReadOnly();
  return (
    <nav className="flex h-full flex-col justify-between px-10 pt-[4.5rem] pb-10">
      <div className="flex flex-col gap-5">
        <NavList items={primary} onNavigate={onNavigate} />
        <hr className="border-border" />
        <NavList items={agents} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col gap-6">
        {readOnly && <ViewOnlyNote>This is demo data, view only for judging. In production use the admin would be password protected.</ViewOnlyNote>}
        <NavList items={secondary} onNavigate={onNavigate} />
        <a
          href="https://loro.sh"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 border-t pt-6 text-muted-foreground"
        >
          <Logo className="h-5 w-auto text-foreground" />
          <ExternalLinkIcon
            aria-hidden
            className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
          <span className="sr-only">(opens loro.sh in a new tab)</span>
        </a>
      </div>
    </nav>
  );
}
