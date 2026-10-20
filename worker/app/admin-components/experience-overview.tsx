/**
 * An experience at a glance: the last 30 days of its funnel, outcomes per
 * day, and everyone who's been through it with their outcome's status.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ExternalLinkIcon } from "lucide-react";

import { sourceLabels, type Source } from "@core/analytics";
import { since } from "@core/people";
import { type ExperienceStatus, experienceStatusLabels } from "@core/profiles";
import { StatTiles } from "@/admin-components/stat-tiles";
import { Badge } from "@/admin-components/ui/badge";
import { buttonVariants } from "@/admin-components/ui/button";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/admin-components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/admin-components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { number } from "@/lib/format";

export type OverviewData = {
  days: { date: string; generated: number }[];
  stats: {
    views: number;
    started: number;
    finished: number;
    generated: number;
    failed: number;
    completionRate: number | null;
  };
  people: {
    id: string;
    name: string;
    email: string;
    source: Source;
    submission: "started" | "completed";
    generation: { id: string; status: ExperienceStatus } | null;
    at: number;
  }[];
};

type Person = OverviewData["people"][number];

const percent = (value: number) => `${Math.round(value * 100)}%`;
const shortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const chartConfig = {
  generated: { label: "Generated", color: "var(--chart-1)" },
} satisfies ChartConfig;

const filters = {
  all: "All",
  intake: "In Intake",
  generating: "Generating",
  done: "Done",
  error: "Error",
} as const;
type Filter = keyof typeof filters;

function matchesFilter(person: Person, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "intake") return person.submission === "started";
  return person.generation?.status === filter;
}

function Steps({ stats, startOn }: { stats: OverviewData["stats"]; startOn: boolean }) {
  const rows = [
    ...(startOn ? [{ label: "Viewed the page", value: stats.views }] : []),
    { label: "Started intake", value: stats.started },
    { label: "Finished intake", value: stats.finished },
    { label: "Generated", value: stats.generated },
  ];
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ol className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <li key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{row.label}</span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="font-medium">{number.format(row.value)}</span>
              {i > 0 && (
                <span className="w-9 text-right text-xs text-muted-foreground">
                  {rows[i - 1].value ? percent(row.value / rows[i - 1].value) : "—"}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-chart-1"
              style={{ width: `${Math.max(row.value ? 1.5 : 0, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
      {stats.failed > 0 && (
        <li className="text-sm text-destructive">
          {number.format(stats.failed)} {stats.failed === 1 ? "generation" : "generations"} failed
        </li>
      )}
    </ol>
  );
}

function People({ people, outcomeHref, now }: { people: Person[]; outcomeHref: (id: string) => string; now: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();
  const rows = people.filter((person) => matchesFilter(person, filter));
  const count = (key: Filter) => people.filter((person) => matchesFilter(person, key)).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-heading text-xl font-medium">People & Outcomes</h2>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
          className="max-w-full overflow-x-auto [scrollbar-width:none]"
        >
          <TabsList className="w-max">
            {(Object.keys(filters) as Filter[]).map((key) => (
              <TabsTrigger key={key} value={key} className="px-3">
                {filters[key]}
                <span className="text-muted-foreground tabular-nums">{count(key)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No One Here Yet</EmptyTitle>
            <EmptyDescription>People appear when they sign up, or when another system sends them by API.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table interactive>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">When</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Outcome</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((person) => {
              const profile = `/admin/profiles/people/${person.id}`;
              const status = person.generation?.status;
              return (
                <TableRow key={person.id} onClick={() => navigate(profile)}>
                  <TableCell className="h-18">
                    <Link to={profile} className="flex flex-col gap-0.5" onClick={(event) => event.stopPropagation()}>
                      <span className="font-medium">{person.name}</span>
                      <span className="text-xs text-muted-foreground">{person.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sourceLabels[person.source]}</TableCell>
                  <TableCell>
                    {status ? (
                      <Badge variant={status === "done" ? "secondary" : status === "error" ? "destructive" : "outline"}>
                        {experienceStatusLabels[status]}
                      </Badge>
                    ) : (
                      <Badge variant="ghost">{person.submission === "started" ? "In intake" : "Finished intake"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                    {since(person.at, now)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {status === "done" && person.generation && (
                      <a
                        href={outcomeHref(person.generation.id)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        View
                        <ExternalLinkIcon data-icon="inline-end" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export function ExperienceOverview({
  data,
  startOn,
  outcomeHref,
  now,
}: {
  data: OverviewData;
  /** Without a start page there are no page views to count. */
  startOn: boolean;
  outcomeHref: (id: string) => string;
  now: number;
}) {
  const { stats, days } = data;

  return (
    <div className="flex flex-col gap-12">
      <StatTiles
        tiles={[
          { label: "Views", value: startOn ? number.format(stats.views) : "—" },
          { label: "Started Intake", value: number.format(stats.started) },
          { label: "Generated", value: number.format(stats.generated) },
          { label: "Completion", value: stats.completionRate === null ? "—" : percent(stats.completionRate) },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-xl font-medium">Outcomes</h2>
            <span className="text-sm text-muted-foreground">Last 30 days</span>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={days} margin={{ left: 0, right: 0, top: 4 }}>
              <defs>
                <linearGradient id="fill-generated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-generated)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--color-generated)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={40}
                tickFormatter={shortDate}
              />
              <YAxis width={32} tickLine={false} axisLine={false} tickMargin={8} tickCount={4} allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelFormatter={(value) => shortDate(String(value))} />}
              />
              <Area
                dataKey="generated"
                type="monotone"
                fill="url(#fill-generated)"
                stroke="var(--color-generated)"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-xl font-medium">Funnel</h2>
          <Steps stats={stats} startOn={startOn} />
        </section>
      </div>

      <People people={data.people} outcomeHref={outcomeHref} now={now} />
    </div>
  );
}
