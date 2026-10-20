import type { CSSProperties } from "react";

import type { RenderContext } from "@core/catalogue/define";
import { cn } from "@/lib/utils";

/** Black or white, whichever reads better on the accent. */
function foregroundFor(hex: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "#ffffff";
  const n = Number.parseInt(match[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#111111" : "#ffffff";
}

/** Layouts set the accent once; components read --brand. */
export function brandStyle(accent: string): CSSProperties {
  return { "--brand": accent, "--brand-foreground": foregroundFor(accent) } as CSSProperties;
}

export const button = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-(--radius) px-6 font-medium transition-opacity outline-none",
  "bg-[var(--brand,var(--primary))] text-[var(--brand-foreground,var(--primary-foreground))]",
  "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
);

export const input = cn(
  "w-full rounded-(--radius) border border-input bg-card px-4 text-base outline-none transition-colors",
  "placeholder:text-muted-foreground focus-visible:border-[var(--brand,var(--primary))] focus-visible:ring-2 focus-visible:ring-[var(--brand,var(--primary))]/20",
  "aria-invalid:border-red-600",
);

export const heading = "font-heading text-3xl leading-tight font-medium text-balance @2xl:text-4xl";

/** In the editor preview, links stay put; in-page anchors still scroll. */
export function CatalogueLink({
  href,
  ctx,
  className,
  children,
}: {
  href: string;
  ctx: RenderContext;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href || "#"}
      className={className}
      onClick={(event) => {
        if (!ctx.preview && !href.startsWith("#")) return;
        event.preventDefault();
        if (!href.startsWith("#") || href.length < 2) return;
        // Look inside this experience only: the editor can show two at once.
        const root = event.currentTarget.closest<HTMLElement>("[data-part]");
        const id = CSS.escape(href.slice(1));
        const target = root?.querySelector<HTMLElement>(`#${id}, [data-block="${id}"]`);
        if (!root || !target) return;
        if (!ctx.preview) return target.scrollIntoView({ behavior: "smooth", block: "start" });
        // The preview scrolls itself, not the admin page around it.
        const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
        root.scrollTo({ top, behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}

export function Logo({ brand, logo }: { brand: string; logo: string }) {
  if (logo) return <img src={logo} alt={brand} className="h-7 w-auto max-w-40 object-contain" />;
  return <span className="font-heading text-lg font-medium">{brand}</span>;
}
