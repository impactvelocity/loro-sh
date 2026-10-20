import { z } from "zod";

import { defineExperience } from "@core/experiences";
import { Badge } from "@/admin-components/ui/badge";
import { Separator } from "@/admin-components/ui/separator";

const stop = z.object({
  time: z.string(),
  name: z.string(),
  kind: z.string(),
  note: z.string(),
});

const schema = z.object({
  title: z.string(),
  intro: z.string(),
  anchor: z.object({ name: z.string(), date: z.string(), place: z.string() }),
  days: z.array(z.object({ label: z.string(), stops: z.array(stop) })),
});

type Data = z.output<typeof schema>;

function Itinerary({ data }: { data: Data }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {data.anchor.name} · {data.anchor.date} · {data.anchor.place}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {data.title}
        </h1>
        <p className="text-lg text-muted-foreground">{data.intro}</p>
      </header>

      {data.days.map((day) => (
        <section key={day.label} className="mt-14">
          <h2 className="font-heading text-2xl font-semibold">{day.label}</h2>
          <Separator className="mt-3" />
          <ol className="divide-y">
            {day.stops.map((s) => (
              <li key={`${s.time}-${s.name}`} className="grid grid-cols-[4rem_1fr] gap-4 py-5">
                <time className="pt-0.5 text-sm tabular-nums text-muted-foreground">
                  {s.time}
                </time>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{s.name}</h3>
                    <Badge variant="secondary">{s.kind}</Badge>
                  </div>
                  <p className="text-muted-foreground">{s.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}

export default defineExperience({
  meta: {
    slug: "itinerary",
    name: "Itinerary",
    description: "A day-by-day plan built around one event.",
    theme: "paper",
  },
  schema,
  fixture: {
    title: "A weekend in Austin, built around the show",
    intro: "Where to eat, what to do before doors, and where to go after.",
    anchor: { name: "Khruangbin", date: "Sat 14 Nov", place: "Moody Center" },
    days: [
      {
        label: "Saturday",
        stops: [
          { time: "11:00", name: "Veracruz All Natural", kind: "Food", note: "Migas tacos from the truck. Get there before the queue." },
          { time: "13:30", name: "Waterloo Records", kind: "Shop", note: "Dig through the vinyl before the show." },
          { time: "16:00", name: "Barton Springs Pool", kind: "Outdoors", note: "Spring-fed and 68°F all year. Bring a towel." },
          { time: "20:00", name: "Moody Center", kind: "Show", note: "Doors at 7. The floor fills early." },
        ],
      },
      {
        label: "Sunday",
        stops: [
          { time: "10:30", name: "Cosmic Coffee + Beer Garden", kind: "Coffee", note: "Slow morning in the garden." },
        ],
      },
    ],
  },
  Component: Itinerary,
});
