import { cx } from "@/components/ui";

/**
 * A screenshot of a real outcome page in a plain browser window. The images
 * are full-page captures, so hovering scrolls slowly down the page.
 */
export function BrowserFrame({
  src,
  alt,
  url,
  className,
  aspect = "aspect-[16/10]",
  priority,
}: {
  src: string;
  alt: string;
  url: string;
  className?: string;
  aspect?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={cx(
        "group min-w-0 overflow-hidden rounded-2xl border border-hairline bg-raised shadow-[0_1px_2px_rgb(40_50_60/0.04),0_12px_40px_-12px_rgb(40_50_60/0.18)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-hairline px-3.5 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-cream" />
          <span className="size-2.5 rounded-full bg-cream" />
          <span className="size-2.5 rounded-full bg-cream" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-full bg-muted px-3 py-1 text-center text-[11px] text-quiet">
          {url}
        </div>
        <div aria-hidden className="w-[42px]" />
      </div>
      <div className={cx("relative overflow-hidden", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export; images are pre-sized */}
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className="absolute inset-0 size-full object-cover object-top transition-[object-position] duration-[6s] ease-in-out group-hover:object-[center_55%]"
        />
      </div>
    </figure>
  );
}
