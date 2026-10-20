import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import { StarIcon } from "lucide-react";

import type { ExperienceContext } from "../experience";
import { type FeedbackResponse, feedbackFor, surveyQuestions } from "@core/funnels";
import { StatTiles } from "@/admin-components/stat-tiles";
import { Badge } from "@/admin-components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { daysAgo, number } from "@/lib/format";
import { cn } from "@/lib/utils";

const percent = (value: number) => `${Math.round(value * 100)}%`;

const filters = {
  all: { label: "All", match: () => true },
  positive: { label: "Positive", match: (r: FeedbackResponse) => r.rating >= 4 },
  mixed: { label: "Mixed", match: (r: FeedbackResponse) => r.rating === 3 },
  negative: { label: "Negative", match: (r: FeedbackResponse) => r.rating <= 2 },
} as const;
type Filter = keyof typeof filters;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
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

function Response({ response }: { response: FeedbackResponse }) {
  const name = <span className="font-medium">{response.name}</span>;

  return (
    <li className="flex flex-col gap-3 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          {response.personId ? (
            <Link
              to={`/admin/profiles/people/${response.personId}`}
              className="underline-offset-4 hover:underline"
            >
              {name}
            </Link>
          ) : (
            name
          )}
          <span className="text-xs text-muted-foreground">{response.plan}</span>
        </div>
        <div className="flex items-center gap-3">
          <Stars rating={response.rating} />
          <span className="text-xs text-muted-foreground">{daysAgo(response.daysAgo)}</span>
        </div>
      </div>
      {response.comment && <p className="text-pretty">{response.comment}</p>}
      {response.went.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Went to</span>
          {response.went.map((stop) => (
            <Badge key={stop} variant="secondary">{stop}</Badge>
          ))}
        </div>
      )}
    </li>
  );
}

export default function ExperienceFeedback() {
  const { funnel } = useOutletContext<ExperienceContext>();
  const summary = feedbackFor(funnel);
  const [filter, setFilter] = useState<Filter>("all");
  const rows = summary.responses.filter(filters[filter].match);
  const max = Math.max(1, ...summary.ratings.map((r) => r.count));

  if (summary.responses.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No Feedback Yet</EmptyTitle>
          <EmptyDescription>
            Responses appear here once people who opened their plan answer the survey.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <StatTiles
        tiles={[
          { label: "Responses", value: number.format(summary.total) },
          { label: "Response Rate", value: percent(summary.rate) },
          { label: "Average Rating", value: summary.average.toFixed(1) },
          { label: "Five Stars", value: percent(summary.fiveStar) },
        ]}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-xl font-medium">Latest Responses</h2>
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
                      {summary.responses.filter(filters[key].match).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {rows.length > 0 ? (
            <ul className="divide-y border-y">
              {rows.map((response) => (
                <Response key={response.id} response={response} />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No responses match.</p>
          )}
        </section>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-10 lg:self-start">
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">Ratings</h2>
            <ol className="flex flex-col gap-2.5">
              {summary.ratings.map(({ rating, count }) => (
                <li key={rating} className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-3 text-sm">
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
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">Most Visited</h2>
            <ol className="flex flex-col gap-2.5 text-sm">
              {summary.topStops.map(([stop, count]) => (
                <li key={stop} className="flex justify-between gap-3">
                  <span>{stop}</span>
                  <span className="text-muted-foreground tabular-nums">{count}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">Survey</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {surveyQuestions.map((question, i) => (
                <li key={question} className="flex gap-3">
                  <span className="w-4 shrink-0 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {question}
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">Emailed the morning after the event.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
