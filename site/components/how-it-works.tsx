import { ArrowRight, Container } from "@/components/ui";

const parts = [
  {
    title: "What you sell",
    body: "The bill, the cottage, the listing. Your facts, set once in the admin.",
  },
  {
    title: "Who it’s for",
    body: "Their answers: where they’re driving from, who’s coming, what they stop for.",
  },
  {
    title: "What they love",
    body: "Their favourites, matched in Qloo, a taste engine, to the places, acts and music around your thing.",
  },
];

const everyone = [
  "Mirage Valley, April 16 to 18",
  "The full lineup, A to Z",
  "Parking, shuttles and what to pack",
  "Things to do in Indio",
];

const bob = [
  "509 miles from San Francisco, split over two days",
  "Wednesday night in Bakersfield, dinner at Stars Theatre Restaurant",
  "Used vinyl at Book Alley in Pasadena on the way down",
  "Fred again.., Jamie xx and Channel Tres, the closest matches on the bill to his three",
  "A road mix for the car: Leisure, Jungle, Elder Island",
];

/** "In place of" pairs from the stay, listing and date runs above. */
const swaps = [
  { from: "Sightglass", fromWhere: "San Francisco", to: "Carmel Valley Coffee Roasting Co", toWhere: "Ocean Ave, Carmel", who: "Maya" },
  { from: "Tartine Bakery", fromWhere: "San Francisco", to: "Rise + Roam Bakery", toWhere: "Mission St, Carmel", who: "Maya" },
  { from: "Victrola Coffee", fromWhere: "Seattle", to: "Storm City Coffee", toWhere: "West Broadway, Vancouver", who: "Sam" },
  { from: "Canon", fromWhere: "Seattle", to: "Little Bird Dim Sum + Craft Beer", toWhere: "West 4th, Vancouver", who: "Sam" },
  { from: "Studio Ghibli", fromWhere: "Films", to: "Dr. Sun Yat-Sen Classical Chinese Garden", toWhere: "Chinatown, Vancouver", who: "Priya" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 pt-24 sm:pt-32">
      <Container>
        <div className="max-w-[40rem]">
          <h2 className="font-display text-4xl leading-[1.05] tracking-normal text-balance sm:text-5xl">
            Your thing, their answers, their taste
          </h2>
          <p className="mt-5 text-lg text-pretty text-slate">
            Loro needs all three. Leave out the taste and you&rsquo;re back to the email everyone gets.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.15fr]">
          {parts.map((part, i) => (
            <div key={part.title} className="contents">
              <div className="rounded-3xl border border-hairline bg-raised p-6">
                <h3 className="font-display text-xl font-medium">{part.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{part.body}</p>
              </div>
              <Operator>{i < parts.length - 1 ? "+" : "="}</Operator>
            </div>
          ))}
          <div className="rounded-3xl bg-accent p-6 text-white">
            <h3 className="font-display text-xl font-medium">A page only you could send</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/85">
              Bob&rsquo;s drive to your festival. Maya&rsquo;s weekend at your cottage. Sam&rsquo;s week in your
              listing.
            </p>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="font-display text-3xl leading-tight tracking-normal text-balance">
              One festival, two emails
            </h3>
            <p className="mt-4 text-[17px] leading-relaxed text-pretty text-slate">
              Both come from Mirage Valley. Only one could have been written for Bob.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
            <div className="rounded-3xl bg-muted p-6 sm:p-7">
              <p className="text-sm font-medium text-quiet">The email everyone gets</p>
              <ul className="mt-5 space-y-3.5">
                {everyone.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] text-slate">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[#cfcac5]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-accent/40 bg-raised p-6 shadow-[0_12px_40px_-16px_rgb(140_140_200/0.45)] sm:p-7">
              <p className="text-sm font-medium text-accent-hover">The page Bob gets</p>
              <ul className="mt-5 space-y-3.5">
                {bob.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] text-ink">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="font-display text-3xl leading-tight tracking-normal text-balance">
              Their regulars, wherever they&rsquo;re going
            </h3>
            <p className="mt-4 text-[17px] leading-relaxed text-pretty text-slate">
              Qloo matches what someone loves at home to places near your thing. The page says which is which.
            </p>
          </div>
          <ul className="divide-y divide-hairline border-y border-hairline lg:col-span-8">
            {swaps.map((s) => (
              <li
                key={s.to}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1.2fr)_auto] sm:gap-x-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-slate">{s.from}</p>
                  <p className="text-[13px] text-quiet">{s.fromWhere}</p>
                </div>
                <ArrowRight className="hidden text-accent sm:block" />
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="text-[15px] font-medium text-ink">{s.to}</p>
                  <p className="text-[13px] text-slate">{s.toWhere}</p>
                </div>
                <span className="col-start-2 row-start-1 justify-self-end rounded-full bg-muted px-2.5 py-0.5 text-xs text-slate sm:col-start-auto sm:row-start-auto">
                  {s.who}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function Operator({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center py-1 font-display text-3xl text-stone lg:px-1 lg:py-0"
    >
      {children}
    </div>
  );
}
