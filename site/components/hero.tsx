import { BrowserFrame } from "@/components/browser-frame";
import { ButtonLink, Container, TasteChip } from "@/components/ui";
import { links } from "@/lib/links";

export function Hero() {
  return (
    <section id="top" className="pt-14 sm:pt-20 lg:pt-24">
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 className="font-display text-[2.6rem] leading-[1.02] tracking-normal text-balance sm:text-6xl lg:col-span-8 lg:text-[4.5rem]">
            Loro turns your customer&rsquo;s taste into an experience only your brand could send.
          </h1>
          <div className="lg:col-span-4 lg:pb-2">
            <p className="text-lg leading-relaxed text-pretty text-slate">
              Loro turns what your customers love into branded experiences around the thing you sell: road trips to
              your festival, weekends at your hotel, a life at your listing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={links.demo}>Open the demo</ButtonLink>
              <ButtonLink href="#examples" variant="secondary">
                See the examples
              </ButtonLink>
            </div>
          </div>
        </div>

        <Stage />
      </Container>
    </section>
  );
}

/**
 * Three real outcome pages fanned out on a warm panel, with the taste
 * each one started from pinned beside it.
 */
function Stage() {
  return (
    <div className="relative mt-12 overflow-hidden rounded-[28px] bg-[#efece8] sm:mt-16">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_12%_0%,rgb(140_140_200/0.35),transparent_70%),radial-gradient(50%_60%_at_95%_100%,rgb(230_190_120/0.35),transparent_70%),radial-gradient(40%_50%_at_60%_10%,rgb(180_140_160/0.22),transparent_70%)]"
      />
      <div className="relative h-[340px] sm:h-[520px] lg:h-[600px]">
        <BrowserFrame
          src="/examples/stay.jpg"
          alt="Maya's weekend page from Low Tide House, a holiday cottage in Carmel"
          url="demo.loro.sh/f/low-tide-house/your-stay"
          className="absolute top-[22%] left-[3%] hidden w-[40%] -rotate-[4deg] lg:block"
        />
        <BrowserFrame
          src="/examples/property.jpg"
          alt="Sam's week at 2-3768 West 2nd Avenue, from Harbour & Grey"
          url="demo.loro.sh/f/harbour-grey/2-3768-west-2nd-avenue"
          className="absolute top-[22%] right-[3%] hidden w-[40%] rotate-[4deg] lg:block"
        />
        <BrowserFrame
          src="/examples/roadtrip.jpg"
          alt="Bob's road trip page from Mirage Valley: San Francisco to the desert"
          url="demo.loro.sh/f/mirage-valley/road-trip"
          priority
          className="absolute top-8 left-1/2 w-[92%] -translate-x-1/2 sm:top-12 sm:w-[78%] lg:w-[56%]"
        />

        <div className="absolute top-[14%] left-[6%] z-10 hidden flex-col items-start gap-2 lg:flex">
          <TasteChip hue="sage">Sightglass</TasteChip>
          <TasteChip hue="amber" className="ml-6">
            Fleetwood Mac
          </TasteChip>
        </div>
        <div className="absolute top-[14%] right-[6%] z-10 hidden flex-col items-end gap-2 lg:flex">
          <TasteChip hue="steel">Victrola Coffee</TasteChip>
          <TasteChip hue="mauve" className="mr-6">
            Bon Iver
          </TasteChip>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-2">
          <TasteChip>Khruangbin</TasteChip>
          <TasteChip>Tame Impala</TasteChip>
          <TasteChip>Bicep</TasteChip>
        </div>
      </div>
    </div>
  );
}
