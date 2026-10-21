import { Container } from "@/components/ui";
import { links } from "@/lib/links";

/**
 * The demo video in a raised frame that rides up over the bottom of the hero.
 * Until links.video is set it shows the road trip outcome as a poster.
 */
export function DemoVideo() {
  return (
    <section className="relative z-10 -mt-24 sm:-mt-28 lg:-mt-32">
      <Container>
        <div className="rounded-[28px] border border-hairline bg-raised/80 p-2 shadow-[0_1px_2px_rgb(40_50_60/0.04),0_20px_60px_-28px_rgb(40_50_60/0.16)] backdrop-blur-sm sm:p-3">
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-deep ring-1 ring-black/5">
            {links.video ? (
              <video
                src={links.video}
                poster="/demos/roadtrip-outcome.jpg"
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- static export; images are pre-sized */}
                <img
                  src="/demos/roadtrip-outcome.jpg"
                  alt="Theo's road trip page from Mirage Valley, the outcome the demo video walks through"
                  className="absolute inset-0 size-full object-cover object-top"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-deep/35">
                  <span
                    aria-hidden
                    className="flex size-16 items-center justify-center rounded-full bg-white/90 text-deep shadow-lg sm:size-20"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-6 sm:size-7">
                      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
                    </svg>
                  </span>
                  <span className="rounded-full bg-deep/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
                    Video coming soon
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
