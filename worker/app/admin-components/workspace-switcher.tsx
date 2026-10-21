import { useFetcher, useNavigate } from "react-router";
import { ChevronsUpDownIcon, LayoutGridIcon, PlusIcon } from "lucide-react";

import { type Workspace, workspaceSubtitle } from "@core/workspaces";
import { WorkspaceMark } from "@/admin-components/workspace-mark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Spinner } from "@/admin-components/ui/spinner";
import { useReadOnly } from "@/hooks/use-read-only";
import { cn } from "@/lib/utils";

/**
 * The workspace at the top of the sidebar, opening a menu to switch,
 * create or see them all. `compact` is the one-line version for the
 * mobile header.
 */
export function WorkspaceSwitcher({
  workspaces,
  current,
  compact,
}: {
  workspaces: Workspace[];
  current: Workspace;
  compact?: boolean;
}) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const readOnly = useReadOnly();
  const switching = fetcher.state !== "idle";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex w-full min-w-0 rounded-lg text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-secondary",
          compact ? "items-center gap-3 p-1.5 pr-2" : "-mx-2.5 w-[calc(100%+1.25rem)] items-start gap-3 p-2.5",
        )}
      >
        <span className={cn("flex min-w-0 flex-1", compact ? "items-center gap-3" : "flex-col items-start gap-4")}>
          <WorkspaceMark name={current.name} />
          <span
            className={cn(
              "font-heading font-medium",
              compact ? "truncate text-base" : "text-lg leading-snug text-balance",
            )}
          >
            {current.name}
          </span>
        </span>
        {switching ? (
          <Spinner className="size-4 shrink-0" />
        ) : (
          <ChevronsUpDownIcon
            aria-hidden
            className={cn("size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground", !compact && "mt-2")}
          />
        )}
        <span className="sr-only">Switch workspace</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={current.id}
            onValueChange={(id) => fetcher.submit({ intent: "switch", id: String(id) }, { method: "post", action: "/admin/workspaces" })}
          >
            {workspaces.map((workspace) => (
              <DropdownMenuRadioItem key={workspace.id} value={workspace.id} closeOnClick className="gap-3">
                <WorkspaceMark name={workspace.name} className="size-7 text-sm" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{workspace.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {[workspaceSubtitle({ ...workspace, location: "" }), workspace.demo && "Demo"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {!readOnly && (
          <DropdownMenuItem onClick={() => navigate("/admin/workspaces?new")}>
            <PlusIcon />
            New Workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/admin/workspaces")}>
          <LayoutGridIcon />
          All Workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
