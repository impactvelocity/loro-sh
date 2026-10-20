import {
  ClipboardCheckIcon,
  ClipboardListIcon,
  type LucideIcon,
  SparklesIcon,
  StarIcon,
  TriangleAlertIcon,
  UserPlusIcon,
} from "lucide-react";

import type { HistoryEvent, HistoryKind } from "@core/profiles";
import { Button } from "@/admin-components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/admin-components/ui/sheet";
import { minutesAgo } from "@/lib/format";

const icons: Record<HistoryKind, LucideIcon> = {
  created: UserPlusIcon,
  intake_started: ClipboardListIcon,
  intake_completed: ClipboardCheckIcon,
  generated: SparklesIcon,
  failed: TriangleAlertIcon,
  rated: StarIcon,
};

/** Label/value pairs about the profile. */
export function PersonDetails({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="flex flex-col divide-y rounded-xl ring-1 ring-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-sm text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 truncate text-right text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EventList({ events, detailed }: { events: HistoryEvent[]; detailed?: boolean }) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const Icon = icons[event.kind];
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < events.length - 1 && (
              <span className="absolute top-8 bottom-1 left-[13px] w-px bg-border" />
            )}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{event.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {minutesAgo(event.minutesAgo)}
                </span>
              </div>
              {event.detail && (
                <span className={detailed ? "text-xs text-muted-foreground" : "truncate text-xs text-muted-foreground"}>
                  {event.detail}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Latest five events, with the rest in a sheet. */
export function PersonActivity({ name, events }: { name: string; events: HistoryEvent[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Recent Activity</h2>
        <span className="text-xs text-muted-foreground">{events.length} events</span>
      </div>
      <EventList events={events.slice(0, 5)} />
      {events.length > 5 && (
        <Sheet>
          <SheetTrigger render={<Button variant="secondary" size="sm" className="w-full" />}>
            View All History
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>History</SheetTitle>
              <SheetDescription>
                Everything {name} has done, newest first.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-6 pb-6">
              <EventList events={events} detailed />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </section>
  );
}
