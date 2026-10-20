/**
 * The road trip's start page: the festival's own poster, lineup and
 * sign-up, plus Every Road, the cities people drive in from, each on a
 * map with its drive time.
 */
import { MapIcon } from "lucide-react";

import { defineComponent } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { parsePoint } from "@core/outcome/lookups";
import { cn } from "@/lib/utils";
import { startComponents as festivalStart } from "../festival/start";
import { SectionHead, wrap } from "../festival/shared";
import { RoadMap } from "./map";
import { originFields } from "./trip";

const routes = defineComponent({
  type: "routes",
  name: "Every Road",
  description: "The cities people drive in from, on a map, with how long each drive takes.",
  icon: MapIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Every road ends in the desert" }),
    body: f.longText({ label: "Intro" }),
    destination: f.text({ label: "Destination", default: "Mirage Valley" }),
    point: f.text({ label: "Destination point", placeholder: "33.6823, -116.2376", help: "Latitude, longitude." }),
    ...originFields,
  },
  Component: ({ id, props }) => {
    const to = parsePoint(props.point);
    const from = props.options.flatMap((option) => {
      const point = parsePoint(option.point);
      return point ? [{ ...point, label: option.name.split(",")[0] }] : [];
    });
    return (
      <section id={id} className="scroll-mt-4">
        <div className={cn(wrap, "flex flex-col gap-12 py-20 @3xl:py-28")}>
          <SectionHead title={props.heading} aside={props.body && <p className="leading-relaxed text-muted-foreground text-pretty">{props.body}</p>} />
          <div className="grid items-start gap-12 @4xl:grid-cols-12">
            {to && (
              <RoadMap
                title={`Drives to ${props.destination} from ${from.map((p) => p.label).join(", ")}`}
                arcs={from.map((p) => ({ from: p, to }))}
                marks={[
                  ...from.map((p) => ({ ...p, role: "start" as const, side: "left" as const })),
                  { ...to, label: props.destination, role: "arrive" as const, side: "right" as const },
                ]}
                className="mx-auto w-full max-w-sm rounded-[calc(var(--radius)*1.6)] ring-1 ring-border @4xl:col-span-4 @4xl:max-w-none"
              />
            )}
            <ul className="flex flex-col @4xl:col-span-6 @4xl:col-start-7">
              {props.options.map((option, i) => (
                <li key={i} className="flex flex-col gap-1.5 border-t border-border py-5 last:border-b">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-xl font-semibold tracking-[-0.02em]">{option.name.split(",")[0]}</span>
                    <span className="shrink-0 text-right text-sm font-medium text-[var(--brand)] tabular-nums">{option.drive.split("·")[0]}</span>
                  </span>
                  {option.note && <span className="text-sm text-muted-foreground">{option.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  },
});

export const startComponents = [...festivalStart, routes];
