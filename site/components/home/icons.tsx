import type { ComponentProps } from "react";
import { cx } from "@/components/ui";

/** Small line icons for the home page diagrams. 24px grid, drawn with currentColor. */
function Icon({ className, children, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cx("size-5", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function StoreIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M4.5 4h15L21 9H3l1.5-5Z" />
      <path d="M4.5 9v10a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  );
}

export function PersonIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Icon>
  );
}

export function HeartIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.5 12 20 12 20Z" />
    </Icon>
  );
}

export function PageIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4" />
    </Icon>
  );
}

export function SparkIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9 12 3.5Z" />
      <path d="M18.5 3.5v3M17 5h3" />
    </Icon>
  );
}

export function PinIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </Icon>
  );
}

export function MusicIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M9 17.5V5.5l10-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
    </Icon>
  );
}

export function CupIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M4.5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
      <path d="M15.5 10.5h1.25a2.25 2.25 0 0 1 0 4.5H15.5" />
      <path d="M8 3.5v2.5M12 3.5v2.5" />
    </Icon>
  );
}

export function ZapIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M13.5 2.5 4.5 13.5H11l-1 8 9-11h-6.5l1-8Z" />
    </Icon>
  );
}

export function CloudIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M7 18.5h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5Z" />
    </Icon>
  );
}

export function HomeIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />
    </Icon>
  );
}

export function KeyIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="m11 12.5 8.5-8.5M16.5 7l2.5 2.5M14.5 9l2 2" />
    </Icon>
  );
}

export function LockIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Icon>
  );
}

export function DatabaseIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
    </Icon>
  );
}

export function GlobeIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5Z" />
    </Icon>
  );
}

export function LayersIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M12 4 3.5 8.5 12 13l8.5-4.5L12 4Z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </Icon>
  );
}

export function ChartIcon(props: ComponentProps<"svg">) {
  return (
    <Icon {...props}>
      <path d="M4 20h16" />
      <path d="M7 16v-5M12 16V7M17 16v-8" />
    </Icon>
  );
}

/** GitHub's mark, filled. */
export function GitHubIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cx("size-4", className)} {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

/** X's mark (formerly Twitter), filled. */
export function TwitterIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cx("size-4", className)} {...props}>
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" />
    </svg>
  );
}

/** LinkedIn's mark, filled. */
export function LinkedInIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cx("size-4", className)} {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
