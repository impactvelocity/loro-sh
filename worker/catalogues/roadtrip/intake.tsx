/**
 * The road trip's intake: where they drive from, then the festival's own
 * questions (the act picker and the Basic inputs). The Route step reads
 * the Origin Picker's cities for their points; a city typed in instead is
 * found on the map when the trip is planned.
 */
import { CarIcon } from "lucide-react";
import { z } from "zod";

import { defineInput } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { intakeComponents as festivalIntake } from "../festival/intake";
import { poster } from "../festival/shared";
import { originFields } from "./trip";

const origin = defineInput({
  type: "origin",
  name: "Origin Picker",
  description: "Where they drive from: a city from the list, or their own.",
  icon: CarIcon,
  fields: {
    question: f.text({ label: "Question", default: "Where are you driving from?" }),
    help: f.text({ label: "Hint" }),
    required: f.toggle({ label: "Required", default: true }),
    other: f.toggle({ label: "Let them type another city", default: true }),
    ...originFields,
  },
  input: {
    schema: (props): z.ZodType<string> => {
      const names = props.options.map((option) => option.name);
      const answer = z.string().trim();
      const allowed = props.other ? answer : answer.refine((value) => !value || names.includes(value), "Pick a city from the list");
      return props.required ? allowed.refine(Boolean, "Pick where you're starting") : allowed;
    },
    label: (props) => props.question,
    shape: (props) =>
      props.other
        ? { kind: "text", placeholder: props.options[0]?.name ?? "Portland, OR" }
        : { kind: "one", options: props.options.map((option) => option.name) },
    required: (props) => props.required,
    empty: () => "",
    sample: (props) => props.options[3]?.name ?? props.options[0]?.name ?? "Portland, OR",
  },
  Component: ({ props, field }) => {
    const listed = props.options.some((option) => option.name === field.value);
    return (
      <fieldset className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <legend className={cn(poster, "text-[clamp(2.5rem,6cqi,4.25rem)] leading-[0.98] text-balance")}>{props.question}</legend>
          {props.help && <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{props.help}</p>}
        </div>
        <div className="grid gap-2 @xl:grid-cols-2" role="radiogroup" aria-label={props.question}>
          {props.options.map((option) => {
            const on = field.value === option.name;
            return (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => field.pick(option.name)}
                className={cn(
                  "flex min-h-28 flex-col items-start justify-between gap-4 rounded-(--radius) p-5 text-left ring-1 transition-[transform,background-color,color] outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                  on
                    ? "bg-[var(--plum)] text-[var(--plum-foreground)] ring-[var(--plum)]"
                    : "bg-card/70 ring-border hover:bg-card hover:ring-foreground/25 active:scale-[0.98]",
                )}
              >
                <span className="text-2xl font-semibold tracking-[-0.02em]">{option.name.split(",")[0]}</span>
                <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className={cn("text-sm font-medium", on ? "text-[var(--sun)]" : "text-[var(--brand)]")}>{option.drive}</span>
                  {option.note && <span className={cn("text-sm", on ? "opacity-85" : "text-muted-foreground")}>{option.note}</span>}
                </span>
              </button>
            );
          })}
        </div>
        {props.other && (
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Somewhere else?</span>
            <input
              value={listed ? "" : field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && field.submit()}
              placeholder="Type a city, like Boise, ID"
              autoComplete="address-level2"
              aria-invalid={Boolean(field.error)}
              className="h-14 w-full border-0 border-b-2 border-foreground/20 bg-transparent px-0 text-xl outline-none placeholder:text-muted-foreground/60 focus:border-[var(--brand)]"
            />
          </label>
        )}
        {field.error && (
          <p role="alert" className="text-sm text-red-700">
            {field.error}
          </p>
        )}
      </fieldset>
    );
  },
});

export { intakeLayout } from "../festival/intake";
export const intakeComponents = [origin, ...festivalIntake];
