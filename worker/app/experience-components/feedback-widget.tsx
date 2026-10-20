/**
 * A small button in a corner of the outcome that opens a 1–5 star rating,
 * then an optional comment. Drawn with the experience's theme tokens, so it
 * fits any catalogue; its words and corner come from the experience config.
 * Saving goes through the caller, usually the experience client.
 */
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { StarIcon } from "lucide-react";

import type { ClientResult } from "@core/catalogue/client";
import { type FeedbackConfig, defaultFeedback } from "@core/catalogue/feedback";
import { cn } from "@/lib/utils";

function Stars({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (rating: number) => void;
  labels: string[];
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="-ml-1 flex items-center" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}/5 · ${labels[n - 1]}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded-md p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StarIcon aria-hidden className={cn("size-6", n <= shown ? "fill-current" : "opacity-25")} />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{labels[shown - 1]}</span>
    </div>
  );
}

export function FeedbackWidget({
  settings = defaultFeedback,
  initial,
  onSend,
}: {
  settings?: FeedbackConfig;
  /** What they said before, when they come back to the outcome. */
  initial?: { rating: number; comment: string } | null;
  onSend: (feedback: { rating: number; comment: string }) => Promise<ClientResult<unknown>>;
}) {
  const { text, placement } = settings;
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent">(initial ? "sent" : "idle");
  const [error, setError] = useState<string | null>(null);

  if (!settings.enabled) return null;

  async function send() {
    if (!rating) return;
    setState("sending");
    setError(null);
    const result = await onSend({ rating, comment });
    if (result.ok) return setState("sent");
    setState("idle");
    setError(Object.values(result.errors)[0] ?? text.error);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          // Out of the way while the outcome is being made (core/outcome/use-follow.ts).
          "fixed bottom-4 z-40 flex h-9 items-center gap-1.5 rounded-full border bg-background/85 px-3.5 text-sm text-muted-foreground shadow-sm backdrop-blur outline-none transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:text-foreground [[data-following]_&]:hidden",
          placement === "left" ? "left-4" : "right-4",
        )}
      >
        <StarIcon aria-hidden className={cn("size-3.5", state === "sent" && "fill-current")} />
        {state === "sent" ? (
          <span>
            {rating}
            <span className="sr-only"> / 5</span>
          </span>
        ) : (
          text.launcher
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align={placement === "left" ? "start" : "end"} sideOffset={8} className="z-50">
          <Popover.Popup className="w-[min(20rem,calc(100vw-2rem))] origin-(--transform-origin) rounded-(--radius) border bg-card p-4 text-card-foreground shadow-lg outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {state === "sent" ? (
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-0.5" role="img" aria-label={`${rating}/5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} aria-hidden className={cn("size-4", n <= rating ? "fill-current" : "opacity-25")} />
                  ))}
                </div>
                <Popover.Title className="font-heading text-base">{text.thanks}</Popover.Title>
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {text.change}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <Popover.Title className="font-heading text-base">{text.title}</Popover.Title>
                  {text.description && (
                    <Popover.Description className="text-sm text-muted-foreground">{text.description}</Popover.Description>
                  )}
                </div>
                <Stars
                  value={rating}
                  labels={text.words}
                  onChange={(n) => {
                    setRating(n);
                    setError(null);
                  }}
                />
                {rating > 0 && (
                  <>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      aria-label={text.placeholder}
                      placeholder={text.placeholder}
                      className="w-full resize-none rounded-(--radius) border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={state === "sending"}
                      aria-busy={state === "sending"}
                      className="h-9 self-end rounded-(--radius) bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {text.send}
                    </button>
                  </>
                )}
                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
