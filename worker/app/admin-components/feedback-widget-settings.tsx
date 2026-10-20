/** The Feedback Widget section of an experience's settings: on or off, which corner, and its words. */
import {
  type FeedbackConfig,
  type FeedbackPlacement,
  type FeedbackText,
  defaultFeedbackText,
  feedbackTextLabels,
} from "@core/catalogue/feedback";
import { FormSection } from "@/admin-components/form-section";
import { Button } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Switch } from "@/admin-components/ui/switch";
import { cn } from "@/lib/utils";

const placements: { value: FeedbackPlacement; label: string }[] = [
  { value: "left", label: "Bottom Left" },
  { value: "right", label: "Bottom Right" },
];

type Line = Exclude<keyof FeedbackText, "words">;
const lines = Object.keys(feedbackTextLabels) as Line[];

export function FeedbackWidgetSettings({
  value,
  onChange,
}: {
  value: FeedbackConfig;
  onChange: (value: FeedbackConfig) => void;
}) {
  const setText = (text: Partial<FeedbackText>) => onChange({ ...value, text: { ...value.text, ...text } });
  const isDefault = JSON.stringify(value.text) === JSON.stringify(defaultFeedbackText);

  return (
    <FormSection
      title="Feedback Widget"
      description="A small button in the corner of the outcome. People rate it 1 to 5 and can add a comment."
    >
      <Field orientation="horizontal">
        <Switch
          id="feedback-enabled"
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
        />
        <FieldLabel htmlFor="feedback-enabled">Show on outcomes</FieldLabel>
      </Field>

      <fieldset disabled={!value.enabled} className="flex flex-col gap-8 transition-opacity disabled:opacity-50">
        <div role="radiogroup" aria-label="Placement" className="grid gap-3 sm:grid-cols-2">
          {placements.map((placement) => (
            <button
              key={placement.value}
              type="button"
              role="radio"
              aria-checked={value.placement === placement.value}
              onClick={() => onChange({ ...value, placement: placement.value })}
              className="flex items-center gap-4 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
            >
              <span aria-hidden className="relative h-10 w-14 shrink-0 rounded-md border bg-secondary">
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-4 rounded-full bg-foreground",
                    placement.value === "left" ? "left-1" : "right-1",
                  )}
                />
              </span>
              <span className="font-medium">{placement.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Text</span>
              <p className="text-sm text-muted-foreground">
                Rewrite or translate what the widget says. Blank fields use the default.
              </p>
            </div>
            <Button variant="ghost" size="sm" disabled={isDefault} onClick={() => setText(defaultFeedbackText)}>
              Reset Text
            </Button>
          </div>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {lines.map((key) => (
              <Field key={key}>
                <FieldLabel htmlFor={`feedback-${key}`}>{feedbackTextLabels[key]}</FieldLabel>
                <Input
                  id={`feedback-${key}`}
                  maxLength={200}
                  value={value.text[key]}
                  placeholder={defaultFeedbackText[key]}
                  onChange={(e) => setText({ [key]: e.target.value })}
                />
              </Field>
            ))}
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="feedback-word-1">Rating Words</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-5">
              {value.text.words.map((word, i) => (
                <Input
                  key={i}
                  id={`feedback-word-${i + 1}`}
                  aria-label={`${i + 1} ${i === 0 ? "star" : "stars"}`}
                  maxLength={200}
                  value={word}
                  placeholder={defaultFeedbackText.words[i]}
                  onChange={(e) => {
                    const words = [...value.text.words] as FeedbackText["words"];
                    words[i] = e.target.value;
                    setText({ words });
                  }}
                />
              ))}
            </div>
            <FieldDescription>Shown beside the stars, from 1 star to 5.</FieldDescription>
          </Field>
        </div>
      </fieldset>
    </FormSection>
  );
}
