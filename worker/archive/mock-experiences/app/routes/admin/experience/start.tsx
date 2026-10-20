import { useState } from "react";
import { useOutletContext } from "react-router";
import {
  CalendarIcon,
  CheckIcon,
  CircleHelpIcon,
  ImageIcon,
  ListOrderedIcon,
  MailIcon,
  PanelBottomIcon,
  PlusIcon,
  RouteIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";

import type { Route } from "./+types/start";
import type { ExperienceContext } from "../experience";
import { listImages } from "@core/context";
import {
  type SectionId,
  type StartPage,
  funnelTypes,
  isInternal,
  sectionKinds,
} from "@core/funnels";
import { CardIcon, ExpandableCard } from "@/admin-components/expandable-card";
import { InternalNotice } from "@/admin-components/internal-notice";
import { FormSection } from "@/admin-components/form-section";
import { PreviewSheet } from "@/admin-components/preview-sheet";
import { StartPagePreview, sectionOn } from "@/admin-components/start-page-preview";
import { Button } from "@/admin-components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Switch } from "@/admin-components/ui/switch";
import { Textarea } from "@/admin-components/ui/textarea";
import { cn } from "@/lib/utils";

export function loader() {
  return { images: listImages().filter((image) => image.width > image.height) };
}

const sectionIcons: Record<SectionId, typeof ImageIcon> = {
  hero: ImageIcon,
  details: CalendarIcon,
  how: ListOrderedIcon,
  sample: RouteIcon,
  products: ShoppingBagIcon,
  faq: CircleHelpIcon,
  signup: MailIcon,
  footer: PanelBottomIcon,
};

type SetField = <K extends keyof StartPage>(key: K, value: StartPage[K]) => void;

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  );
}

/** Read-only note for sections filled in from data. */
function FromData({ rows, note }: { rows: [string, string][]; note: string }) {
  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function SectionFields({
  id,
  start,
  set,
  images,
  anchor,
}: {
  id: SectionId;
  start: StartPage;
  set: SetField;
  images: Route.ComponentProps["loaderData"]["images"];
  anchor: ExperienceContext["funnel"]["anchor"];
}) {
  switch (id) {
    case "hero":
      return (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="eyebrow">Event line</FieldLabel>
            <Input id="eyebrow" value={start.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="headline">Headline</FieldLabel>
            <Input id="headline" value={start.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="body">Intro</FieldLabel>
            <Textarea id="body" value={start.body} onChange={(e) => set("body", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Photo</FieldLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image) => {
                const selected = start.image === image.url;
                return (
                  <button
                    key={image.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set("image", image.url)}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    <img src={image.url} alt={image.alt} className="size-full object-cover" />
                    {selected && (
                      <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckIcon className="size-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <FieldDescription>From the images in Context.</FieldDescription>
          </Field>
          <Toggle
            id="showAnchor"
            label="Show event line"
            description="The small line above the headline."
            checked={start.showAnchor}
            onChange={(checked) => set("showAnchor", checked)}
          />
        </FieldGroup>
      );
    case "details":
      return (
        <FromData
          rows={[
            ["When", `${anchor.date} · ${start.doors}`],
            ["Where", anchor.place],
            ["Address", start.address],
          ]}
          note="Filled in from the event. Change the event and this follows."
        />
      );
    case "how":
      return (
        <FieldGroup>
          {start.how.map((step, i) => (
            <Field key={i}>
              <FieldLabel htmlFor={`how-${i}`}>Step {i + 1}</FieldLabel>
              <Input
                id={`how-${i}`}
                value={step}
                onChange={(e) => set("how", start.how.map((s, j) => (j === i ? e.target.value : s)))}
              />
            </Field>
          ))}
        </FieldGroup>
      );
    case "sample":
      return (
        <FromData
          rows={[
            ["Plan", start.sample.title],
            ["Stops shown", String(start.sample.stops.length)],
          ]}
          note="Uses the most opened plan from the last week, with the person's details taken out."
        />
      );
    case "products":
      return <FromData rows={[]} note="Filled in from the anchor when the page loads." />;
    case "faq":
      return (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {start.faq.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    aria-label={`Question ${i + 1}`}
                    value={item.question}
                    placeholder="Question"
                    onChange={(e) =>
                      set("faq", start.faq.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)))
                    }
                  />
                  <Textarea
                    aria-label={`Answer ${i + 1}`}
                    value={item.answer}
                    placeholder="Answer"
                    className="min-h-20"
                    onChange={(e) =>
                      set("faq", start.faq.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)))
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.question || `question ${i + 1}`}`}
                  className="mt-1.5"
                  onClick={() => set("faq", start.faq.filter((_, j) => j !== i))}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 self-start"
            onClick={() => set("faq", [...start.faq, { question: "", answer: "" }])}
          >
            <PlusIcon data-icon="inline-start" />
            Add Question
          </Button>
        </div>
      );
    case "signup":
      return (
        <FieldGroup>
          <Field className="sm:max-w-xs">
            <FieldLabel htmlFor="button">Button</FieldLabel>
            <Input id="button" value={start.button} onChange={(e) => set("button", e.target.value)} />
          </Field>
          <Toggle
            id="askEmail"
            label="Ask for email"
            description="Needed to send the link back. Recommended."
            checked={start.askEmail}
            onChange={(checked) => set("askEmail", checked)}
          />
          <Toggle
            id="askPhone"
            label="Ask for phone"
            description="For text delivery. Optional for the guest."
            checked={start.askPhone}
            onChange={(checked) => set("askPhone", checked)}
          />
        </FieldGroup>
      );
    case "footer":
      return (
        <FieldGroup>
          <Field className="sm:max-w-xs">
            <FieldLabel htmlFor="brand">Brand name</FieldLabel>
            <Input id="brand" value={start.brand} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="smallPrint">Small print</FieldLabel>
            <Input id="smallPrint" value={start.smallPrint} onChange={(e) => set("smallPrint", e.target.value)} />
          </Field>
        </FieldGroup>
      );
  }
}

export default function ExperienceStart({ loaderData }: Route.ComponentProps) {
  const { funnel } = useOutletContext<ExperienceContext>();
  const { images } = loaderData;
  const type = funnelTypes[funnel.type];
  const [start, setStart] = useState<StartPage>(funnel.start);
  const [openId, setOpenId] = useState<SectionId | null>("hero");
  const set: SetField = (key, value) => setStart((current) => ({ ...current, [key]: value }));
  const preview = (
    <StartPagePreview start={start} type={funnel.type} anchor={funnel.anchor} className="absolute inset-0" />
  );

  if (isInternal(funnel.type)) return <InternalNotice typeName={type.name} />;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-10">
        <FormSection title="Sections">
          <ol className="flex flex-col gap-3">
            {type.sections.map((spec) => {
              const kind = sectionKinds[spec.id];
              const Icon = sectionIcons[spec.id];
              const on = sectionOn(funnel.type, start, spec.id);
              return (
                <ExpandableCard
                  key={spec.id}
                  open={openId === spec.id}
                  onToggle={() => setOpenId(openId === spec.id ? null : spec.id)}
                  muted={!on}
                  leading={
                    <CardIcon className={cn(!on && "text-disabled-foreground")}>
                      <Icon />
                    </CardIcon>
                  }
                  title={kind.title}
                  meta={on ? kind.description : "Hidden"}
                  actions={
                    <span className="flex w-16 shrink-0 justify-end">
                      {spec.fixed ? (
                        <span className="text-xs text-muted-foreground">Always on</span>
                      ) : (
                        <Switch
                          aria-label={`Show ${kind.title}`}
                          checked={on}
                          onCheckedChange={(checked) => {
                            set("sections", { ...start.sections, [spec.id]: checked });
                            if (!checked && openId === spec.id) setOpenId(null);
                          }}
                        />
                      )}
                    </span>
                  }
                >
                  {on && (
                    <SectionFields id={spec.id} start={start} set={set} images={images} anchor={funnel.anchor} />
                  )}
                </ExpandableCard>
              );
            })}
          </ol>
        </FormSection>

      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Preview</h2>
          <PreviewSheet title={`${funnel.name} · Start Page`}>{() => preview}</PreviewSheet>
        </div>
        <div className="relative mx-auto aspect-[9/16] w-full max-w-80 overflow-hidden rounded-2xl ring-1 ring-border">
          {preview}
        </div>
      </aside>
    </div>
  );
}
