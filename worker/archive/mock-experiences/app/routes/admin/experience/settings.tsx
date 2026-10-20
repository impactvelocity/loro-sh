import { useState } from "react";
import { useOutletContext } from "react-router";
import { LockIcon } from "lucide-react";

import type { Route } from "./+types/settings";
import type { ExperienceContext } from "../experience";
import { type FunnelStatus, funnelStatusLabels, funnelTypes } from "@core/funnels";
import { listSegments } from "@core/profiles";
import { listThemes } from "@core/themes";
import { ConfirmDelete } from "@/admin-components/confirm-delete";
import { FormSection } from "@/admin-components/form-section";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";

export function loader() {
  return {
    segments: listSegments().map(({ id, name }) => ({ id, name })),
    themes: listThemes().map(({ name }) => name),
  };
}

const statusDescriptions: Record<FunnelStatus, string> = {
  live: "Anyone with the link can start. Triggers run.",
  paused: "The link shows a paused notice. Triggers wait.",
  draft: "Only your team can preview it.",
};

export default function ExperienceSettings({ loaderData }: Route.ComponentProps) {
  const { funnel } = useOutletContext<ExperienceContext>();
  const { segments, themes } = loaderData;
  const [status, setStatus] = useState<FunnelStatus>(funnel.status);
  const segmentItems = { none: "No segment", ...Object.fromEntries(segments.map((s) => [s.id, s.name])) };
  const themeItems = Object.fromEntries(themes.map((name) => [name, name[0].toUpperCase() + name.slice(1)]));

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <FormSection title="General">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" defaultValue={funnel.name} />
          </Field>
          <Field>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <div id="type" className="flex h-12 items-center justify-between gap-3 rounded-lg bg-secondary px-3.5 text-disabled-foreground">
              <span className="text-foreground">{funnelTypes[funnel.type].name}</span>
              <LockIcon className="size-4" aria-hidden />
            </div>
            <FieldDescription>Set when it was created. Start a new experience to use another type.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="slug">Link</FieldLabel>
            <div className="flex h-12 items-center rounded-lg border-2 border-transparent bg-secondary transition-colors hover:border-secondary-hover focus-within:border-ring focus-within:bg-background">
              <span className="pl-3.5 text-muted-foreground select-none">loro.sh/f/</span>
              <input
                id="slug"
                defaultValue={funnel.slug}
                className="h-full min-w-0 flex-1 bg-transparent pr-3.5 outline-none"
              />
            </div>
            <FieldDescription>Changing it breaks links you've already shared.</FieldDescription>
          </Field>
        </FieldGroup>
      </FormSection>

      <FormSection title="Status">
        <div role="radiogroup" aria-label="Status" className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(funnelStatusLabels) as FunnelStatus[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={status === key}
              onClick={() => setStatus(key)}
              className="flex flex-col gap-1 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
            >
              <span className="font-medium">{funnelStatusLabels[key]}</span>
              <span className="text-sm text-muted-foreground">{statusDescriptions[key]}</span>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Event">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="event">Name</FieldLabel>
            <Input id="event" defaultValue={funnel.anchor.name} />
            <FieldDescription>Looked up on Qloo, so recommendations start from it.</FieldDescription>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input id="date" defaultValue={funnel.anchor.date} />
            </Field>
            <Field>
              <FieldLabel htmlFor="venue">Venue</FieldLabel>
              <Input id="venue" defaultValue={funnel.anchor.place} />
            </Field>
          </div>
        </FieldGroup>
      </FormSection>

      <FormSection title="Defaults">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Segment</FieldLabel>
            <Select items={segmentItems} defaultValue={funnel.segmentId ?? "none"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(segmentItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>For people who skip intake.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Theme</FieldLabel>
            <Select items={themeItems} defaultValue={themes.includes("paper") ? "paper" : themes[0]}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themeItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      <ConfirmDelete
        title="Delete Experience"
        description="The link stops working. People and their profiles stay."
        label="Delete Experience"
        confirmTitle={`Delete ${funnel.name}?`}
        confirmDescription="Generated pages that were already sent will show a closed notice. This can't be undone."
        redirectTo="/admin/experiences"
      />
    </div>
  );
}
