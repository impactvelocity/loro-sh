import type { ComponentProps } from "react";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors";

const buttonVariants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-cream text-ink hover:bg-[#dcd9d6]",
  ghost: "text-slate hover:text-ink",
  inverse: "bg-white text-deep hover:bg-cream",
  "inverse-secondary": "bg-white/10 text-white hover:bg-white/15",
};

const buttonSizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
};

/** Qloo's buttons are pills; so are these. Always a link: the site has nothing to submit. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes }) {
  const external = props.href?.startsWith("http");
  return (
    <a
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={cx("size-4", className)}>
      <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={cx("size-4", className)}>
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const chipDots = {
  accent: "bg-accent",
  sage: "bg-sage",
  mauve: "bg-mauve",
  amber: "bg-amber",
  steel: "bg-steel",
};

/** A taste signal: one thing a person said they love. */
export function TasteChip({
  children,
  hue = "accent",
  className,
}: {
  children: React.ReactNode;
  hue?: keyof typeof chipDots;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-hairline bg-raised py-1 pr-3 pl-2.5 text-[13px] text-ink shadow-[0_1px_2px_rgb(40_50_60/0.06)]",
        className,
      )}
    >
      <span aria-hidden className={cx("size-2 rounded-full", chipDots[hue])} />
      {children}
    </span>
  );
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export { cx };
