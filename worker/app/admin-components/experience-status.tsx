import { LayersIcon } from "lucide-react";

import { type FunnelStatus, funnelStatusDescriptions, funnelStatusLabels } from "@core/funnels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin-components/ui/tooltip";
import { cn } from "@/lib/utils";

const dot: Record<FunnelStatus, string> = {
  live: "bg-positive",
  draft: "border border-muted-foreground",
  paused: "bg-[oklch(0.75_0.15_75)]",
};

/**
 * A light pill with a coloured dot, readable on a page or over a cover
 * photo. Live pulses gently; hovering explains the status.
 */
export function StatusBadge({
  status,
  className,
  tooltip = true,
}: {
  status: FunnelStatus;
  className?: string;
  /** Off inside links, where it can't be focused on its own. */
  tooltip?: boolean;
}) {
  const pill = cn(
    "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-background/90 pr-2.5 pl-2 text-xs font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-border outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
  const content = (
    <>
      <span aria-hidden className="relative flex size-2">
        {status === "live" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-positive opacity-40 [animation-duration:2s]" />
        )}
        <span className={cn("relative size-2 rounded-full", dot[status])} />
      </span>
      {funnelStatusLabels[status]}
    </>
  );
  if (!tooltip) return <span className={pill}>{content}</span>;
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className={pill} />}>{content}</TooltipTrigger>
      <TooltipContent>{funnelStatusDescriptions[status]}</TooltipContent>
    </Tooltip>
  );
}

/** Which catalogue an experience is built from, with what that gives it. */
export function CatalogueBadge({ name, description }: { name: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className="inline-flex h-6 items-center gap-1.5 rounded-full px-1.5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <LayersIcon aria-hidden className="size-3.5" />
        {name}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Built from the {name} catalogue: {description.charAt(0).toLowerCase() + description.slice(1)}
      </TooltipContent>
    </Tooltip>
  );
}
