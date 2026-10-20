/** The Feedback tab: what people rated their outcomes, and what they said. */
import { useState } from "react";
import { Link } from "react-router";
import { ExternalLinkIcon, StarIcon } from "lucide-react";

import { since } from "@core/people";
import { StatTiles } from "@/admin-components/stat-tiles";
import { buttonVariants } from "@/admin-components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/admin-components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { number } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FeedbackData = {
  responses: {
    id: string;
    generationId: string;
    person: { id: string; name: string; email: string } | null;
    rating: number;
    comment: string;
    at: number;
  }[];
  total: number;
  rate: number | null;
  average: number | null;
  fiveStar: number | null;
  ratings: { rating: number; count: number }[];
};

type Response = FeedbackData["responses"][number];

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

const filters = {
  all: { label: "All", match: () => true },
  positive: { label: "Positive", match: (r: Response) => r.rating >= 4 },
  mixed: { label: "Mixed", match: (r: Response) => r.rating === 3 },
  negative: { label: "Negative", match: (r: Response) => r.rating <= 2 },
  comments: { label: "With Comments", match: (r: Response) => r.comment !== "" },
} as const;
type Filter = keyof typeof filters;

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          aria-hidden
          className={cn("size-3.5", i <= rating ? "fill-foreground text-foreground" : "text-border-strong")}
        />
      ))}
    </span>
  );
}

export function ExperienceFeedback({
  data,
  outcomeHref,
  now,
}: {
  data: FeedbackData;
  outcomeHref: (generation: string) => string;
  now: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = data.responses.filter(filters[filter].match);
  const max = Math.max(1, ...data.ratings.map((r) => r.count));

  if (data.total === 0) {
    return (
      <Empty className="flex-none border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <StarIcon />
          </EmptyMedia>
          <EmptyTitle>No Feedback Yet</EmptyTitle>
          <EmptyDescription>
            Everyone who gets an outcome sees a small feedback button in its corner. Their stars and comments land here. Turn it off, move it or change its words under Settings.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <StatTiles
        tiles={[
          { label: "Responses", value: number.format(data.total) },
          { label: "Response Rate", value: percent(data.rate) },
          { label: "Average Rating", value: data.average === null ? "—" : data.average.toFixed(1) },
          { label: "Five Stars", value: percent(data.fiveStar) },
        ]}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-xl font-medium">Responses</h2>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as Filter)}
              className="max-w-full overflow-x-auto [scrollbar-width:none]"
            >
              <TabsList className="w-max">
                {(Object.keys(filters) as Filter[]).map((key) => (
                  <TabsTrigger key={key} value={key} className="px-3">
                    {filters[key].label}
                    <span className="text-muted-foreground tabular-nums">
                      {data.responses.filter(filters[key].match).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No responses match.</p>
          ) : (
            <ul className="divide-y border-y">
              {rows.map((response) => (
                <li key={response.id} className="flex flex-col gap-3 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    {response.person ? (
                      <Link
                        to={`/admin/profiles/people/${response.person.id}`}
                        className="flex flex-col gap-0.5 underline-offset-4 hover:underline"
                      >
                        <span className="font-medium">{response.person.name}</span>
                        <span className="text-xs text-muted-foreground">{response.person.email}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Deleted profile</span>
                    )}
                    <div className="flex items-center gap-3">
                      <Stars rating={response.rating} />
                      <span className="text-xs text-muted-foreground tabular-nums">{since(response.at, now)}</span>
                      <a
                        href={outcomeHref(response.generationId)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "ghost", size: "xs" })}
                      >
                        Outcome
                        <ExternalLinkIcon data-icon="inline-end" />
                      </a>
                    </div>
                  </div>
                  {response.comment ? (
                    <p className="text-pretty">{response.comment}</p>
                  ) : (
                    <p className="text-sm text-disabled-foreground">No comment</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
          <h2 className="font-heading text-xl font-medium">Ratings</h2>
          <ol className="flex flex-col gap-2.5">
            {data.ratings.map(({ rating, count }) => (
              <li key={rating} className="grid grid-cols-[1.75rem_1fr_1.5rem] items-center gap-3 text-sm">
                <span className="flex items-center gap-1 tabular-nums">
                  {rating}
                  <StarIcon aria-hidden className="size-3 fill-current" />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className="text-right text-muted-foreground tabular-nums">{count}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">
            From the widget under each outcome. Rating again replaces the earlier one.
          </p>
        </aside>
      </div>
    </div>
  );
}
