import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ExternalLinkIcon, SendIcon } from "lucide-react";

import type { ExperienceContext } from "../experience";
import { type FunnelPerson, dailyGenerations, funnelStats, isInternal } from "@core/funnels";
import { experienceStatusLabels, statusLabels } from "@core/profiles";
import { StatTiles } from "@/admin-components/stat-tiles";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/admin-components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { minutesAgo, number } from "@/lib/format";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const shortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const chartConfig = {
  generated: { label: "Generated", color: "var(--chart-1)" },
} satisfies ChartConfig;

const filters = {
  all: "All",
  review: "Needs Review",
  generating: "Generating",
  sent: "Sent",
  intake: "In Intake",
} as const;
type Filter = keyof typeof filters;

function matchesFilter(person: FunnelPerson, filter: Filter) {
  const status = person.generation?.status;
  switch (filter) {
    case "all":
      return true;
    case "review":
      return status === "review";
    case "generating":
      return status === "generating";
    case "sent":
      return status === "delivered" || status === "opened";
    case "intake":
      return !person.generation;
  }
}

function Stats({ stats, internal }: { stats: ReturnType<typeof funnelStats>; internal: boolean }) {
  if (internal) {
    return (
      <StatTiles
        tiles={[
          { label: "Created", value: number.format(stats.generated) },
          { label: "Sent", value: number.format(stats.sent) },
          { label: "Page Views", value: number.format(stats.views) },
          { label: "Open Rate", value: stats.sent ? percent(stats.openRate) : "—" },
        ]}
      />
    );
  }

  return (
    <StatTiles
      tiles={[
        { label: "Views", value: number.format(stats.views) },
        { label: "Started Intake", value: number.format(stats.started) },
        { label: "Generated", value: number.format(stats.generated) },
        { label: "Open Rate", value: stats.generated ? percent(stats.openRate) : "—" },
      ]}
    />
  );
}

function Steps({ stats, internal }: { stats: ReturnType<typeof funnelStats>; internal: boolean }) {
  const rows = internal
    ? [
        { label: "Created", value: stats.generated },
        { label: "Sent", value: stats.sent },
        { label: "Opened", value: stats.opened },
      ]
    : [
        { label: "Viewed start page", value: stats.views },
        { label: "Started intake", value: stats.started },
        { label: "Finished intake", value: stats.finished },
        { label: "Generated", value: stats.generated },
        { label: "Opened", value: stats.opened },
      ];
  const max = Math.max(1, rows[0].value);

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
    </ol>
  );
}

function People({ people, href, internal }: { people: FunnelPerson[]; href: string; internal: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();
  const rows = people.filter((person) => matchesFilter(person, filter));
  const count = (key: Filter) => people.filter((person) => matchesFilter(person, key)).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-heading text-xl font-medium">People & Generations</h2>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
          className="max-w-full overflow-x-auto [scrollbar-width:none]"
        >
          <TabsList className="w-max">
            {(Object.keys(filters) as Filter[]).filter((key) => !(internal && key === "intake")).map((key) => (
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
            <EmptyDescription>
              People appear once they open the start page, or when a trigger adds them.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table interactive>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">When</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Actions</span>
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
                    <Link
                      to={profile}
                      className="flex flex-col gap-0.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="font-medium">{person.name}</span>
                      <span className="text-xs text-muted-foreground">{person.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-72">
                    {person.generation ? (
                      <span className="line-clamp-2 text-pretty">{person.generation.title}</span>
                    ) : (
                      <span className="text-disabled-foreground">Not generated yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {status ? (
                      <Badge variant={status === "review" ? "default" : status === "delivered" ? "outline" : "secondary"}>
                        {experienceStatusLabels[status]}
                        {status === "opened" && ` ×${person.generation!.opens}`}
                      </Badge>
                    ) : (
                      <Badge variant="ghost">{statusLabels[person.status]}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                    {minutesAgo(person.lastActiveMinutes)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {status === "review" ? (
                      <Button size="sm">
                        <SendIcon data-icon="inline-start" />
                        Review & Send
                      </Button>
                    ) : status === "delivered" || status === "opened" ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        View
                        <ExternalLinkIcon data-icon="inline-end" />
                      </a>
                    ) : null}
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

export default function ExperienceOverview() {
  const { funnel, people, now } = useOutletContext<ExperienceContext>();
  const stats = funnelStats(funnel);
  const days = dailyGenerations(funnel, new Date(now));
  const internal = isInternal(funnel.type);

  return (
    <div className="flex flex-col gap-12">
      <Stats stats={stats} internal={internal} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-xl font-medium">Generations</h2>
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
              <YAxis width={32} tickLine={false} axisLine={false} tickMargin={8} tickCount={4} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => shortDate(String(value))}
                  />
                }
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
          <Steps stats={stats} internal={internal} />
        </section>
      </div>

      {/* Itinerary is the only type with a page so far, so every result opens it. */}
      <People people={people} href="/f/itinerary" internal={internal} />
    </div>
  );
}
