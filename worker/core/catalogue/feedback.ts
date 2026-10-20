/**
 * The rating widget on an outcome: whether it shows, which corner it sits
 * in, and every word it says, so it can be rewritten or translated.
 * Lives in the experience config under `feedback`.
 */
import { z } from "zod";

export type FeedbackPlacement = "right" | "left";

export type FeedbackText = {
  /** The button in the corner. */
  launcher: string;
  title: string;
  description: string;
  placeholder: string;
  send: string;
  thanks: string;
  /** The link to rate again. */
  change: string;
  error: string;
  /** What each star means, 1 to 5. */
  words: [string, string, string, string, string];
};

export type FeedbackConfig = {
  enabled: boolean;
  placement: FeedbackPlacement;
  text: FeedbackText;
};

export const defaultFeedbackText: FeedbackText = {
  launcher: "Feedback",
  title: "How did we do?",
  description: "Your rating shapes the next one.",
  placeholder: "Anything to add? Optional.",
  send: "Send",
  thanks: "Thanks for telling us.",
  change: "Change your rating",
  error: "That didn't send. Try again.",
  words: ["Not for me", "Not quite", "It's fine", "Pretty good", "Spot on"],
};

export const defaultFeedback: FeedbackConfig = { enabled: true, placement: "right", text: defaultFeedbackText };

/** Short labels for the admin, keyed like the text. */
export const feedbackTextLabels: Record<Exclude<keyof FeedbackText, "words">, string> = {
  launcher: "Button",
  title: "Title",
  description: "Description",
  placeholder: "Comment Placeholder",
  send: "Send Button",
  thanks: "Thank You",
  change: "Rate Again Link",
  error: "Send Error",
};

// A blank field falls back to its default, so the widget never shows an empty label.
const line = (fallback: string) =>
  z
    .string()
    .max(200)
    .transform((value) => value.trim() || fallback)
    .catch(fallback);

const d = defaultFeedbackText;

export const feedbackSchema = z
  .object({
    enabled: z.boolean().catch(true),
    placement: z.enum(["right", "left"]).catch("right"),
    text: z
      .object({
        launcher: line(d.launcher),
        title: line(d.title),
        description: z.string().max(200).catch(d.description),
        placeholder: line(d.placeholder),
        send: line(d.send),
        thanks: line(d.thanks),
        change: line(d.change),
        error: line(d.error),
        words: z
          .tuple([line(d.words[0]), line(d.words[1]), line(d.words[2]), line(d.words[3]), line(d.words[4])])
          .catch(d.words),
      })
      .catch(d),
  })
  .catch(defaultFeedback);
