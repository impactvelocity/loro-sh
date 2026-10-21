import type { ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * Shared pieces for the home page's little product previews, so every
 * section's mock-ups share one look: white panels on a muted stage, small
 * chips, and the brand-person-taste spectrum.
 */

export const spectrum = "bg-[conic-gradient(from_0deg,#7d7dd0,#e8679e,#eea53f,#7d7dd0)]";
export const spectrumLine = "bg-[linear-gradient(135deg,#7d7dd0,#e8679e_50%,#eea53f)]";

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "rounded-full border border-hairline bg-white px-2.5 py-1 text-[11px] whitespace-nowrap text-ink shadow-[0_1px_2px_rgb(40_50_60/0.06)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />;
}

/** A white surface that lifts a little when its card is hovered. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-hairline bg-white shadow-[0_16px_32px_-16px_rgb(40_50_60/0.25)] transition-[translate] duration-300 group-hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Bar({ className }: { className?: string }) {
  return <span className={cx("block h-1.5 rounded-full bg-cream", className)} />;
}

export function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden className={cx("size-2.5", className)}>
      <path d="m3 6.2 2 2 4-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Qloo as a letter on a dark disc ringed in the spectrum. Not Qloo's logo. */
export function QDisc({ className, text = "text-xl" }: { className?: string; text?: string }) {
  return (
    <span className={cx("flex size-12 shrink-0 items-center justify-center rounded-full p-[3px]", spectrum, className)}>
      <span className={cx("flex size-full items-center justify-center rounded-full bg-accent-deep font-display text-white", text)}>
        Q
      </span>
    </span>
  );
}

/** A feature card: a preview on a muted stage, then the title and a line or two. */
export function FeatureCard({
  art,
  title,
  body,
  className,
  stage = "h-52 sm:h-56",
}: {
  art: ReactNode;
  title: string;
  body: string;
  className?: string;
  stage?: string;
}) {
  return (
    <li
      className={cx(
        "group flex flex-col overflow-hidden rounded-[28px] border border-hairline bg-raised transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(40_50_60/0.3)]",
        className,
      )}
    >
      <div className={cx("flex items-center justify-center bg-muted p-6", stage)}>{art}</div>
      <div className="p-6 sm:p-7">
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-slate">{body}</p>
      </div>
    </li>
  );
}
