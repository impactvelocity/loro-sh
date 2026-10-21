import type { ReactNode } from "react";
import { Container, cx } from "@/components/ui";

/** A page section with the standard heading block. */
export function Section({
  id,
  title,
  intro,
  children,
  className,
  size = "lg",
  align = "left",
}: {
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "lg" | "md";
  align?: "left" | "center";
}) {
  return (
    <section id={id} className={cx("scroll-mt-16 pt-24 sm:pt-32", className)}>
      <Container>
        <div className={cx("max-w-[42rem]", align === "center" && "mx-auto text-center")}>
          <h2
            className={cx(
              "font-display leading-[1.15] tracking-normal text-pretty",
              size === "lg" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
            )}
          >
            {title}
          </h2>
          {intro ? (
            <div
              className="mt-5 space-y-4 text-lg leading-relaxed text-pretty text-slate"
            >
              {intro}
            </div>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

/** Stands in for a screenshot that hasn't been captured yet. */
export function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-2xl border border-dashed border-[#cfcac5] bg-muted text-center text-sm text-quiet",
        className,
      )}
    >
      <span className="px-4">{label}</span>
    </div>
  );
}
