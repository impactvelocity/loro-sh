import type { ReactNode } from "react";
import { ChartIcon, DatabaseIcon, GlobeIcon, LayersIcon } from "@/components/home/icons";
import { QDisc, spectrum } from "@/components/home/mock";
import { Section } from "@/components/home/section";
import { cx } from "@/components/ui";

const cloudflare: { title: string; body: string; detail: string; icon: ReactNode }[] = [
  {
    title: "Cloudflare Workers",
    body: "One Worker serves the admin, every public page and the API, on the brand’s own account.",
    detail: "Hono · React Router",
    icon: <GlobeIcon />,
  },
  {
    title: "D1",
    body: "One SQL database, split by workspace: profiles, answers, segments and every finished page.",
    detail: "One database per deploy",
    icon: <DatabaseIcon />,
  },
  {
    title: "Workflows and Durable Objects",
    body: "Each page is one Workflow run, saved step by step. A Durable Object streams every section to the page as it’s written.",
    detail: "Streamed to the page",
    icon: <LayersIcon />,
  },
  {
    title: "Analytics Engine",
    body: "Views, sign-ups and finished pages for every experience, counted without names or emails.",
    detail: "Plus daily counts in D1",
    icon: <ChartIcon />,
  },
];

export function Stack() {
  return (
    <Section
      id="stack"
      title="Built on Qloo and Cloudflare"
      align="center"
      className="pb-24 sm:pb-32"
      intro={<p>Taste from Qloo, and everything else on the brand&rsquo;s own Cloudflare account.</p>}
    >
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QlooCard />
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2">
          {cloudflare.map((c) => (
            <li
              key={c.title}
              className="group flex flex-col rounded-[28px] border border-hairline bg-raised p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(40_50_60/0.3)] sm:p-7"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-hover transition-colors duration-300 group-hover:bg-accent-deep group-hover:text-white [&_svg]:size-5">
                {c.icon}
              </span>
              <h3 className="mt-5 font-display text-xl">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate">{c.body}</p>
              <span className="mt-auto self-start pt-5">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-slate">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** The featured card: Qloo is what keeps every page grounded in real things. */
function QlooCard() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[28px] bg-accent-deep p-6 text-white transition-[translate] duration-300 hover:-translate-y-1 sm:p-8">
      <span
        aria-hidden
        className={cx(
          "absolute -top-24 -right-24 size-64 rounded-full opacity-35 blur-3xl transition-opacity duration-500 group-hover:opacity-55 motion-safe:animate-[spin_24s_linear_infinite]",
          spectrum,
        )}
      />
      <QDisc className="relative size-14" text="text-2xl" />
      <h3 className="relative mt-6 font-display text-2xl">Every Pick Comes from Qloo</h3>
      <p className="relative mt-3 text-[15px] leading-relaxed text-white/75">
        Every recommendation on a page is a Qloo entity: a real place, artist or brand, matched to what the person
        loves. Anything else is dropped before the page shows it.
      </p>
      <p className="relative mt-3 text-[15px] leading-relaxed text-white/75">
        Lookups weigh each favourite and filter by place, kind, price and opening day, across music, food, travel and
        brands.
      </p>
      <div className="relative mt-auto flex flex-wrap gap-1.5 pt-8">
        {["3.7B+ entities", "Cross-domain", "Insights API"].map((t) => (
          <span key={t} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[12px] text-white/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
