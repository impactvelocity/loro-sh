/**
 * Start an experience for someone from their profile: pick it, fill its
 * questions for them, and their outcome is made like any other, for the
 * profile itself (no email needed). The link
 * is theirs to send. Same path as an API trigger (core/experience-start),
 * so it counts in Analytics and shows on their profile.
 */
import { useEffect, useMemo, useState } from "react";
import { type SubmitTarget, useFetcher } from "react-router";
import { ExternalLinkIcon, PlayIcon } from "lucide-react";

import type { ExperienceConfig } from "@core/catalogue/config";
import type { Answers } from "@core/catalogue/define";
import { answersSchema, emptyAnswers, errorsOf, questionsOf } from "@core/catalogue/flow";
import { getCatalogue } from "@core/catalogue/registry";
import { CopyButton } from "@/admin-components/experience-share";
import { AnswerInput } from "@/admin-components/experience-tests";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin-components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/admin-components/ui/sheet";
import { Spinner } from "@/admin-components/ui/spinner";

export type StartableExperience = { slug: string; name: string; catalogue: string; config: ExperienceConfig };

export type StartResponse =
  | { ok: true; url: string; generation: string }
  | { ok: false; errors: Record<string, string> };

export function StartExperience({ name, experiences }: { name: string; experiences: StartableExperience[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" disabled={experiences.length === 0} onClick={() => setOpen(true)}>
        <PlayIcon data-icon="inline-start" />
        Start Experience
      </Button>
      {open && <StartSheet name={name} experiences={experiences} onClose={() => setOpen(false)} />}
    </>
  );
}

function StartSheet({
  name,
  experiences,
  onClose,
}: {
  name: string;
  experiences: StartableExperience[];
  onClose: () => void;
}) {
  const fetcher = useFetcher<StartResponse>();
  const [slug, setSlug] = useState(experiences[0]?.slug ?? "");
  const experience = experiences.find((e) => e.slug === slug) ?? null;
  const catalogue = experience ? getCatalogue(experience.catalogue) : undefined;
  const questions = useMemo(
    () => (catalogue && experience ? questionsOf(catalogue, experience.config) : []),
    [catalogue, experience],
  );
  const [answers, setAnswers] = useState<Answers>(() =>
    catalogue && experience ? emptyAnswers(catalogue, experience.config) : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const starting = fetcher.state !== "idle";
  const started = fetcher.state === "idle" && fetcher.data?.ok ? fetcher.data : null;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !fetcher.data.ok) setErrors(fetcher.data.errors);
  }, [fetcher.state, fetcher.data]);

  function pick(next: string) {
    const found = experiences.find((e) => e.slug === next);
    const nextCatalogue = found && getCatalogue(found.catalogue);
    setSlug(next);
    setAnswers(found && nextCatalogue ? emptyAnswers(nextCatalogue, found.config) : {});
    setErrors({});
  }

  function start() {
    if (!catalogue || !experience) return;
    const parsed = answersSchema(catalogue, experience.config).safeParse(answers);
    if (!parsed.success) return setErrors(errorsOf(parsed.error));
    setErrors({});
    fetcher.submit({ intent: "start", slug, answers } as unknown as SubmitTarget, {
      method: "post",
      encType: "application/json",
    });
  }

  const items = Object.fromEntries(experiences.map((e) => [e.slug, e.name]));

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{started ? "Their Page Is Being Made" : "Start Experience"}</SheetTitle>
          <SheetDescription>
            {started
              ? "It takes about a minute. The link works now: it fills in as each part is ready."
              : `Answer for ${name.split(" ")[0] || "them"}, and their outcome is made like any other.`}
          </SheetDescription>
        </SheetHeader>

        {started ? (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
            <Field>
              <FieldLabel htmlFor="outcome-link">Link to send</FieldLabel>
              <Input id="outcome-link" readOnly value={started.url} onFocus={(e) => e.currentTarget.select()} />
              <FieldDescription>Anyone with the link can open it, so send it to them directly.</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-3">
              <CopyButton text={started.url} label="Copy Link" />
              <a href={started.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <ExternalLinkIcon data-icon="inline-start" />
                Open
              </a>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6">
            <FieldGroup>
              <Field>
                <FieldLabel>Experience</FieldLabel>
                <Select items={items} value={slug} onValueChange={(value) => pick(String(value))}>
                  <SelectTrigger className="w-full" aria-label="Experience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experiences.map((e) => (
                      <SelectItem key={e.slug} value={e.slug}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-medium">Answers</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">This experience asks no questions.</p>
              ) : (
                <FieldGroup>
                  {questions.map((question) => (
                    <Field key={`${slug}-${question.id}`} data-invalid={errors[question.id] ? true : undefined}>
                      <FieldLabel htmlFor={`start-${question.id}`}>
                        {question.question}
                        {!question.required && <span className="font-normal text-muted-foreground">Optional</span>}
                      </FieldLabel>
                      <AnswerInput
                        id={`start-${question.id}`}
                        shape={question.shape}
                        value={answers[question.id]}
                        onChange={(value) => {
                          setAnswers((current) => ({ ...current, [question.id]: value }));
                          setErrors(({ [question.id]: _, ...rest }) => rest);
                        }}
                      />
                      {errors[question.id] && <FieldError>{errors[question.id]}</FieldError>}
                    </Field>
                  ))}
                </FieldGroup>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="flex-row items-center justify-end gap-3 border-t">
          {errors[""] && <p className="mr-auto text-sm text-destructive">{errors[""]}</p>}
          {started ? (
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" disabled={starting || !experience} aria-busy={starting} onClick={start}>
                {starting ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
                Start
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
