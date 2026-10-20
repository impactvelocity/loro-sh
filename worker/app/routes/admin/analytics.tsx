import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { Route } from "./+types/analytics";
import {
  type ActivityEvent,
  type Analytics,
  type Day,
  type Range,
  parseRange,
  ranges,
  sourceLabels,
  sumSources,
} from "@core/analytics";
import { getAnalytics } from "@core/analytics.server";
import { DocsButton } from "@/admin-components/docs-button";
import { Badge } from "@/admin-components/ui/badge";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/admin-components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { cn } from "@/lib/utils";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta() {
  return [{ title: "Analytics · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const range = parseRange(new URL(request.url).searchParams.get("range"));
  const now = new Date();
  return { analytics: await getAnalytics(workspace.id, range, now), now: now.toISOString() };
}

type Metric = "views" | "profiles" | "generated" | "completionRate";

const eventLabels: Record<ActivityEvent, string> = {
  intake_started: "Started intake",
  intake_completed: "Finished intake",
  generated: "Outcome generated",
  failed: "Generation failed",
};

const number = new Intl.NumberFormat("en-US");
const percent = (value: number) => `${Math.round(value * 100)}%`;
const shortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const sourceConfig = {
  signup: { label: sourceLabels.signup, color: "var(--chart-1)" },
  trigger: { label: sourceLabels.trigger, color: "var(--chart-2)" },
  owner: { label: sourceLabels.owner, color: "var(--chart-3)" },
} satisfies ChartConfig;

const metrics: Record<
  Metric,
  {
    label: string;
    /** Shorter label for the stat tiles. */
    stat: string;
    description: string;
    config: ChartConfig;
    row: (day: Day) => Record<string, number>;
    format?: (value: number) => string;
  }
> = {
  views: {
    label: "Views",
    stat: "Views",
    description: "Every time an experience page loads, including repeat visits.",
    config: { views: { label: "Views", color: "var(--chart-1)" } },
    row: (day) => ({ views: day.views }),
  },
  profiles: {
    label: "New Profiles",
    stat: "New Profiles",
    description: "People who entered a funnel, by how they arrived.",
    config: sourceConfig,
    row: (day) => day.profiles,
  },
  generated: {
    label: "Outcomes Generated",
    stat: "Generated",
    description: "Personalised outcomes made for people, by source.",
    config: sourceConfig,
    row: (day) => day.generated,
  },
  completionRate: {
    label: "Intake Completion",
    stat: "Completion",
    description: "Share of started intakes that were finished. Owner-created profiles skip intake.",
    config: { completionRate: { label: "Completion", color: "var(--chart-1)" } },
    row: (day) => {
      const started = sumSources(day.intakeStarted);
      return { completionRate: started ? sumSources(day.intakeCompleted) / started : 0 };
    },
    format: percent,
  },
};

function timeAgo(at: number, now: string) {
  const minutes = Math.max(1, Math.round((Date.parse(now) - at * 1000) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Delta({ current, previous, points }: { current: number; previous: number; points?: boolean }) {
  // Nothing to compare against: a percentage of zero means nothing.
  if (!points && previous === 0) {
    return <span className="text-sm font-medium text-muted-foreground">{current ? "New" : ""}</span>;
  }
  const change = points ? (current - previous) * 100 : previous ? ((current - previous) / previous) * 100 : 0;
  const rounded = Math.round(change);
  const label = `${rounded > 0 ? "+" : ""}${rounded}${points ? " pts" : "%"}`;
  return (
    <span
      className={cn(
        "text-sm font-medium tabular-nums",
        rounded > 0 && "text-positive",
        rounded < 0 && "text-destructive",
        rounded === 0 && "text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function RangePicker({ range }: { range: Range }) {
  const [, setSearchParams] = useSearchParams();
  return (
    <Tabs
      value={range}
      onValueChange={(value) =>
        setSearchParams({ range: String(value) }, { preventScrollReset: true })
      }
    >
      <TabsList>
        {Object.keys(ranges).map((key) => (
          <TabsTrigger key={key} value={key} className="px-4 uppercase">
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function Overview({ analytics }: { analytics: Analytics }) {
  const [metric, setMetric] = useState<Metric>("views");
  const { totals, previous, days } = analytics;
  const active = metrics[metric];
  const data = days.map((day) => ({ date: day.date, ...active.row(day) }));
  const keys = Object.keys(active.config);
  const stacked = keys.length > 1;

  const stats: { key: Metric; value: string; current: number; previous?: number }[] = [
    { key: "views", value: number.format(totals.views), current: totals.views, previous: previous?.views },
    { key: "profiles", value: number.format(totals.profiles), current: totals.profiles, previous: previous?.profiles },
    { key: "generated", value: number.format(totals.generated), current: totals.generated, previous: previous?.generated },
    { key: "completionRate", value: percent(totals.completionRate), current: totals.completionRate, previous: previous?.completionRate },
  ];

  return (
    <section className="overflow-hidden rounded-xl ring-1 ring-border">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            data-active={metric === stat.key}
            onClick={() => setMetric(stat.key)}
            className="group relative flex flex-col gap-2 border-r border-b border-border-strong bg-secondary/60 p-5 text-left outline-none transition-colors last:border-r-0 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:border-b-transparent data-[active=true]:bg-background max-lg:even:border-r-0"
          >
            <span className="text-sm font-medium text-muted-foreground">
              {metrics[stat.key].stat}
            </span>
            <span className="flex items-baseline gap-2.5">
              <span className="font-heading text-3xl font-medium tabular-nums">{stat.value}</span>
              {stat.previous !== undefined && (
                <Delta
                  current={stat.current}
                  previous={stat.previous}
                  points={stat.key === "completionRate"}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 p-5 pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{active.label}</h2>
          {/* <p className="text-sm text-muted-foreground">{active.description}</p> */}
        </div>
        <ChartContainer config={active.config} className="aspect-auto h-72 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 4 }}>
            <defs>
              {keys.map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={stacked ? 0.5 : 0.18} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={stacked ? 0.2 : 0.02} />
                </linearGradient>
              ))}
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
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={4}
              tickFormatter={active.format ?? ((value: number) => number.format(value))}
              domain={metric === "completionRate" ? [0, 1] : undefined}
            />
            <ChartTooltip
              cursor={false}
              itemSorter={(item) => keys.indexOf(String(item.dataKey))}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => shortDate(String(value))}
                  valueFormatter={active.format}
                />
              }
            />
            {keys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                stackId={stacked ? "a" : undefined}
                fill={`url(#fill-${key})`}
                stroke={`var(--color-${key})`}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            ))}
            {stacked && <ChartLegend itemSorter={null} content={<ChartLegendContent />} />}
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}

function LatestActivity({ analytics, now }: { analytics: Analytics; now: string }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-medium">Latest Activity</h2>
          {/* <p className="text-sm text-muted-foreground">
            Intake and delivery events as they happen.
          </p> */}
        </div>
        <Link
          to="/admin/profiles"
          className="text-sm font-medium underline underline-offset-4"
        >
          All profiles
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analytics.activity.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nothing yet. Sign-ups and answers show up here as they happen.
              </TableCell>
            </TableRow>
          )}
          {analytics.activity.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link to={`/admin/profiles/people/${item.personId}`} className="flex flex-col gap-0.5">
                  <span className="font-medium underline-offset-4 hover:underline">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.email}</span>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={item.event === "generated" ? "default" : item.event === "failed" ? "destructive" : "secondary"}>
                  {eventLabels[item.event]}
                </Badge>
              </TableCell>
              <TableCell>{item.experience ?? <span className="text-disabled-foreground">Deleted</span>}</TableCell>
              <TableCell className="text-muted-foreground">{sourceLabels[item.source]}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {timeAgo(item.at, now)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

export default function AnalyticsPage({ loaderData }: Route.ComponentProps) {
  const { analytics, now } = loaderData;
  const days = ranges[analytics.range];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[2rem] font-medium">Analytics</h1>
          {/* <p className="text-muted-foreground">
            {analytics.previous
              ? `Last ${days} days, compared with the ${days} days before.`
              : `Last ${days} days. Analytics keeps 90 days, so there's no earlier period to compare.`}
          </p> */}
        </div>
        <div className="flex items-center gap-3">
          <DocsButton slug="analytics" tooltip="What each metric measures" />
          <RangePicker range={analytics.range} />
        </div>
      </div>

      <Overview analytics={analytics} />
      <LatestActivity analytics={analytics} now={now} />
    </div>
  );
}
