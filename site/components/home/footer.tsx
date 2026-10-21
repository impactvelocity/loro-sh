import { Logo } from "@/components/logo";
import { ArrowUpRight, Container } from "@/components/ui";
import { deployUrl, links } from "@/lib/links";

type Link = { label: string; href: string | null };

const columns: { title: string; links: Link[] }[] = [
  {
    title: "Loro",
    links: [
      { label: "Open the Demo", href: links.demo },
      { label: "Read the Code", href: links.repo || null },
      { label: "Deploy to Cloudflare", href: deployUrl },
    ],
  },
  {
    title: "Hackathon",
    links: [
      { label: "Qloo Hackathon", href: links.hackathon },
      { label: "Qloo", href: links.qloo },
    ],
  },
  {
    title: "Made by Dylan Jones",
    links: [
      { label: "hidylanjones.com", href: links.creator.site },
      { label: "X", href: links.creator.twitter },
      { label: "LinkedIn", href: links.creator.linkedin },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-hairline sm:mt-20">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
        <div>
          <Logo className="h-7 w-auto text-ink" />
          <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-slate">
            An agentic framework for brand experiences, built on taste from Qloo.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-medium text-ink">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links
                .filter((link): link is { label: string; href: string } => Boolean(link.href))
                .map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1 text-[15px] whitespace-nowrap text-slate transition-colors hover:text-ink"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3.5 text-stone transition-colors group-hover:text-ink" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-hairline">
        <Container className="flex flex-col gap-2 py-6 text-sm text-quiet sm:flex-row sm:items-center sm:justify-between">
          <p>Taste from Qloo. Runs on Cloudflare.</p>
          <p>Built for the Qloo Hackathon, 2026</p>
        </Container>
      </div>
    </footer>
  );
}
