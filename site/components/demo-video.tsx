import { Container } from "@/components/ui";
import { links, youtubeId } from "@/lib/links";

/** The demo video's YouTube player in a raised frame that rides up over the bottom of the hero. */
export function DemoVideo() {
  const id = youtubeId(links.video);
  if (!id) return null;

  return (
    <section className="relative z-10 -mt-24 sm:-mt-28 lg:-mt-32">
      <Container>
        <div className="rounded-[28px] border border-hairline bg-raised/80 p-2 shadow-[0_1px_2px_rgb(40_50_60/0.04),0_20px_60px_-28px_rgb(40_50_60/0.16)] backdrop-blur-sm sm:p-3">
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-deep ring-1 ring-black/5">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
              title="Loro demo video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 size-full"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
