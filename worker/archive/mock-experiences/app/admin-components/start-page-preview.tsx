import { type Funnel, type FunnelType, type SectionId, type StartPage, funnelTypes } from "@core/funnels";
import { cn } from "@/lib/utils";

/** Whether a section shows on the page: fixed ones always do. */
export function sectionOn(type: FunnelType, start: StartPage, id: SectionId) {
  const spec = funnelTypes[type].sections.find((section) => section.id === id);
  return Boolean(spec && (spec.fixed || start.sections[id]));
}

function Hero({ start, compact }: { start: StartPage; compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-end overflow-hidden bg-neutral-900 text-white",
        compact ? "flex-1" : "min-h-[34rem] @2xl:min-h-[30rem]",
      )}
    >
      {start.image && (
        <img src={start.image} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/40 to-black/5" />

      {compact ? (
        <div className="flex flex-col gap-1.5 p-4">
          {start.showAnchor && (
            <span className="truncate text-[11px] font-medium text-white/75">{start.eyebrow}</span>
          )}
          <span className="font-heading text-lg leading-tight font-medium text-balance">
            {start.headline}
          </span>
        </div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-4 p-6 @2xl:p-12">
          {start.showAnchor && start.eyebrow && (
            <span className="text-xs font-medium text-white/75 @2xl:text-sm">{start.eyebrow}</span>
          )}
          <h2 className="font-heading text-[1.75rem] leading-[1.1] font-medium text-balance @2xl:text-5xl">
            {start.headline || "Your headline"}
          </h2>
          {start.body && <p className="text-sm text-pretty text-white/80 @2xl:text-lg">{start.body}</p>}
          <span className="mt-2 flex h-11 items-center justify-center self-stretch rounded-lg bg-white px-5 text-sm font-medium text-neutral-900 @2xl:self-start">
            {start.button || "Get Started"}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-xl font-medium @2xl:text-2xl">{children}</h3>;
}

/** Sections for other types draw as labelled blocks until those types exist. */
function Placeholder({ title, rows = 1 }: { title: string; rows?: number }) {
  return (
    <section className="flex flex-col gap-4 px-6 py-10 @2xl:px-12">
      <SectionHeading>{title}</SectionHeading>
      <div className={cn("grid gap-3", rows > 1 && "@2xl:grid-cols-3")}>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="block aspect-[4/3] rounded-lg bg-neutral-200" />
        ))}
      </div>
    </section>
  );
}

/**
 * A stand-in for the public start page, drawn in the admin. It lays out
 * for desktop once its container is wide enough, so the same component
 * serves the small preview, the drawer and the list cards (`compact`).
 */
export function StartPagePreview({
  start,
  type = "itinerary",
  anchor,
  compact,
  className,
}: {
  start: StartPage;
  type?: FunnelType;
  anchor?: Funnel["anchor"];
  /** Thumbnail for cards: the hero only. */
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("flex flex-col justify-end overflow-hidden", className)}>
        <Hero start={start} compact />
      </div>
    );
  }

  const on = (id: SectionId) => sectionOn(type, start, id);

  return (
    <div className={cn("@container overflow-y-auto bg-[#faf8f5] text-neutral-900 [scrollbar-width:none]", className)}>
      <Hero start={start} />

      {on("details") && anchor && (
        <section className="grid gap-5 border-b border-neutral-200 px-6 py-8 text-sm @2xl:grid-cols-3 @2xl:px-12">
          {[
            ["When", `${anchor.date} · ${start.doors}`],
            ["Where", anchor.place],
            ["Address", start.address],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </section>
      )}

      {on("how") && (
        <section className="flex flex-col gap-6 px-6 py-10 @2xl:px-12">
          <SectionHeading>How It Works</SectionHeading>
          <ol className="grid gap-5 @2xl:grid-cols-3">
            {start.how.map((step, i) => (
              <li key={i} className="flex gap-4 @2xl:flex-col @2xl:gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-pretty text-neutral-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {on("sample") && (
        <section className="flex flex-col gap-6 bg-white px-6 py-10 @2xl:px-12">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">From a recent plan</span>
            <SectionHeading>{start.sample.title}</SectionHeading>
          </div>
          <ol className="divide-y divide-neutral-200 border-y border-neutral-200">
            {start.sample.stops.map((stop) => (
              <li key={stop.name} className="grid grid-cols-[3.5rem_1fr] gap-3 py-4 text-sm">
                <span className="tabular-nums text-neutral-500">{stop.time}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{stop.name}</span>
                  <span className="text-neutral-600">{stop.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {on("products") && <Placeholder title="Featured Picks" rows={3} />}

      {on("faq") && start.faq.length > 0 && (
        <section className="flex flex-col gap-6 px-6 py-10 @2xl:px-12">
          <SectionHeading>Questions</SectionHeading>
          <dl className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
            {start.faq.map((item, i) => (
              <div key={i} className="flex flex-col gap-1 py-4 text-sm">
                <dt className="font-medium">{item.question}</dt>
                <dd className="text-neutral-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="flex flex-col gap-4 bg-neutral-900 px-6 py-10 text-white @2xl:items-center @2xl:px-12 @2xl:text-center">
        <SectionHeading>{start.headline || "Your headline"}</SectionHeading>
        <div className="flex w-full max-w-sm flex-col gap-2">
          {start.askEmail && (
            <span className="flex h-11 items-center rounded-lg bg-white/10 px-4 text-sm text-white/60">
              Email address
            </span>
          )}
          {start.askPhone && (
            <span className="flex h-11 items-center rounded-lg bg-white/10 px-4 text-sm text-white/60">
              Phone number
            </span>
          )}
          <span className="flex h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-neutral-900">
            {start.button || "Get Started"}
          </span>
        </div>
      </section>

      <footer className="flex flex-col gap-1 px-6 py-6 text-xs text-neutral-500 @2xl:flex-row @2xl:justify-between @2xl:px-12">
        <span className="font-medium text-neutral-900">{start.brand}</span>
        <span>{start.smallPrint}</span>
      </footer>
    </div>
  );
}
