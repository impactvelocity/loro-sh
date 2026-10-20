import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A row in an ordered editor (questions, sections, steps) that opens in
 * place to show its fields. Without `children` it can't open.
 *
 * For drag-and-drop, pass `handle` instead of `leading`: it sits outside
 * the toggle button, so it can be its own control. `rootRef`, `style` and
 * `dragging` come from the sortable hook.
 */
export function ExpandableCard({
  leading,
  handle,
  rootRef,
  style,
  dragging,
  title,
  meta,
  open,
  onToggle,
  actions,
  muted,
  children,
}: {
  leading?: React.ReactNode;
  handle?: React.ReactNode;
  rootRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragging?: boolean;
  title: React.ReactNode;
  meta?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Controls on the right: switches, move buttons, menus. */
  actions?: React.ReactNode;
  /** Turned off or skipped. */
  muted?: boolean;
  children?: React.ReactNode;
}) {
  const expandable = Boolean(children);

  return (
    <li
      ref={rootRef}
      style={style}
      className={cn(
        "group/card relative rounded-xl bg-background ring-1 ring-border transition-shadow",
        muted && "bg-secondary/40",
        open && expandable && "ring-2 ring-foreground",
        dragging && "z-10 shadow-[0_8px_30px_rgb(0_0_0/0.12)]",
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {handle}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expandable ? open : undefined}
          disabled={!expandable}
          className="group/toggle flex min-w-0 flex-1 items-center gap-4 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
        >
          {leading}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className={cn("font-medium text-pretty", muted && "text-muted-foreground")}>{title}</span>
            {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
          </span>
          {expandable && (
            <ChevronDownIcon
              aria-hidden
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          )}
        </button>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {open && expandable && <div className="border-t p-5">{children}</div>}
    </li>
  );
}

/** The square icon tile at the start of an ExpandableCard. */
export function CardIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </span>
  );
}
