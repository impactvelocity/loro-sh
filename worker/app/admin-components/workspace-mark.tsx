import { cn } from "@/lib/utils";

/**
 * The workspace's first letter in a filled square, as in the sidebar. The
 * colours are marked important because menu items recolour every
 * descendant on hover, which would turn the letter dark on dark.
 */
export function WorkspaceMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground! font-heading text-base font-medium text-background!",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
