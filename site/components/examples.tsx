import { BrowserFrame } from "@/components/browser-frame";
import { ArrowRight, Check, Container, TasteChip } from "@/components/ui";
import { links } from "@/lib/links";

/**
 * The road trip run's steps and timings (generation gen-2bc1295d-998). The
 * first three messages are the run's own; the written sections have none,
 * so they show what each one produced.
 */
const run = [
  { label: "Reading your taste", message: "Matched 3 favourites and found 20 picks in Qloo", seconds: 9.1 },
  { label: "Route", message: "San Francisco, CA to Mirage Valley: 509 mi over 2 days · 20 places found", seconds: 3.9 },
  { label: "Lineup", message: "Ranked 37 acts for you · 3 must-sees", seconds: 1.5 },
  { label: "The drive", message: "Six stops over two days, from College Coffee and Donuts to Neil's Lounge", seconds: 5.9 },
  { label: "Road mix", message: "Leisure, Jungle, Elder Island, Jamie xx", seconds: 3.6 },
];

const more = [
  {
    title: "Maya’s weekend at Low Tide House",
    brand: "A dog-friendly cottage in Carmel-by-the-Sea. Started by API after the booking.",
    body: "Maya and Juniper, her two-year-old lab, arrive Friday for two nights. Their page starts with Carmel Beach at 5 PM and Carmel Valley Coffee Roasting Co in place of her Sightglass.",
    taste: ["Sightglass", "Tartine Bakery", "Fleetwood Mac"],
    hue: "sage" as const,
    src: "/examples/stay.jpg",
    url: "demo.loro.sh/f/low-tide-house/your-stay",
    href: links.examples.stay,
    cta: "Plan a stay",
  },
  {
    title: "Sam’s week at West 2nd",
    brand: "Harbour & Grey, selling 2-3768 West 2nd Avenue in Vancouver.",
    body: "Sam works at UBC and drinks Victrola Coffee in Seattle. The page walks his week from the front door, starting with Storm City Coffee on West Broadway.",
    taste: ["Victrola Coffee", "Canlis", "Fleet Foxes"],
    hue: "steel" as const,
    src: "/examples/property.jpg",
    url: "demo.loro.sh/f/harbour-grey/2-3768-west-2nd-avenue",
    href: links.examples.property,
    cta: "See the listing",
  },
  {
    title: "Sunday with Priya",
    brand: "Overlap, a dating app. Started by the app after a match.",
    body: "Priya loves Japanese Breakfast and Studio Ghibli. The first date: hojicha at Caffe Mira, the Dr. Sun Yat-Sen Classical Chinese Garden, then Massy Books.",
    taste: ["Japanese Breakfast", "Studio Ghibli", "Mitski"],
    hue: "mauve" as const,
    src: "/examples/date.jpg",
    url: "demo.loro.sh/f/overlap/first-date",
    href: null,
    cta: null,
  },
];

export function Examples() {
  return (
    <section id="examples" className="scroll-mt-16 pt-24 sm:pt-32">
      <Container>
        <div className="max-w-[40rem]">
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.015em] text-balance sm:text-5xl">
            Every page here came from one run
          </h2>
          <p className="mt-5 text-lg text-pretty text-slate">
            The brands are made up for the demo. Each person answered the questions once, and every place, act and
            match below is what came back.
          </p>
        </div>

        <article className="mt-14 grid grid-cols-1 gap-10 rounded-[28px] bg-muted p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
          <div className="flex flex-col lg:col-span-5">
            <h3 className="font-display text-3xl leading-tight tracking-[-0.01em] sm:text-[2.25rem]">
              Bob&rsquo;s road trip to Mirage Valley
            </h3>
            <p className="mt-2 text-[15px] text-quiet">A three-day festival in Indio, April 16 to 18.</p>
            <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-slate">
              <p>
                Bob is driving down from San Francisco with his partner. He named three acts and said he stops for
                record stores and vintage shops.
              </p>
              <p>
                His page splits 509 miles over two days, with a night in Bakersfield and used vinyl at Book Alley in
                Pasadena. Then it ranks the bill around his three.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <TasteChip>Khruangbin</TasteChip>
              <TasteChip>Tame Impala</TasteChip>
              <TasteChip>Bicep</TasteChip>
            </div>

            <ol className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-raised">
              {run.map((step) => (
                <li key={step.label} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-hover">
                    <Check className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{step.label}</p>
                    <p className="text-[13px] text-slate">{step.message}</p>
                  </div>
                  <span className="shrink-0 text-[13px] text-quiet tabular-nums">{step.seconds}s</span>
                </li>
              ))}
            </ol>

            <a
              href={links.examples.roadtrip}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 self-start text-[15px] font-medium text-ink hover:text-accent-hover"
            >
              Plan your own drive <ArrowRight />
            </a>
          </div>
          <div className="lg:col-span-7">
            <BrowserFrame
              src="/examples/roadtrip.jpg"
              alt="Bob's road trip page: the route map, how it was planned, and each day's stops"
              url="demo.loro.sh/f/mirage-valley/road-trip/g/gen-2bc1295d-998"
              aspect="aspect-[4/5] sm:aspect-[5/6]"
              className="lg:sticky lg:top-24"
            />
          </div>
        </article>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {more.map((item) => (
            <article key={item.title} className="flex flex-col rounded-[28px] bg-muted p-5 sm:p-6">
              <BrowserFrame src={item.src} alt={item.title} url={item.url} aspect="aspect-[4/3]" />
              <h3 className="mt-6 font-display text-2xl font-medium leading-tight tracking-[-0.01em]">{item.title}</h3>
              <p className="mt-1.5 text-sm text-quiet">{item.brand}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-slate">{item.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.taste.map((t) => (
                  <TasteChip key={t} hue={item.hue}>
                    {t}
                  </TasteChip>
                ))}
              </div>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 self-start pt-6 text-[15px] font-medium text-ink hover:text-accent-hover"
                >
                  {item.cta} <ArrowRight />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
