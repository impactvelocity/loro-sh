import { Logo } from "@/components/logo";
import { ButtonLink, Container } from "@/components/ui";
import { links } from "@/lib/links";

const nav = [
  { href: "#examples", label: "Examples" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#framework", label: "Framework" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-ground/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#top" className="text-ink" aria-label="Loro, back to top">
          <Logo className="h-7 w-auto" />
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-[15px] text-slate md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {links.repo ? (
            <ButtonLink href={links.repo} variant="secondary" size="sm" className="hidden sm:inline-flex">
              Read the code
            </ButtonLink>
          ) : null}
          <ButtonLink href={links.demo} size="sm">
            Open the demo
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}

export function Closing() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="flex flex-col items-center text-center">
        <h2 className="max-w-[18ch] font-display text-4xl leading-[1.05] tracking-[-0.015em] text-balance sm:text-6xl">
          Watch your own page get made
        </h2>
        <p className="mt-5 max-w-[46ch] text-lg text-pretty text-slate">
          Sign up as a Mirage Valley ticket holder, answer eight questions, and your drive to the festival is planned
          while you watch.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={links.demo}>Open the demo</ButtonLink>
          {links.repo ? (
            <ButtonLink href={links.repo} variant="secondary">
              Read the code
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <Logo className="h-7 w-auto text-ink" />
          <p className="max-w-[44ch] text-sm text-slate">
            Taste from{" "}
            <a href={links.qloo} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink">
              Qloo
            </a>
            . Runs on Cloudflare. The brands in the demo are made up; the places, acts and matches are real.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
          <a href={links.demo} target="_blank" rel="noreferrer" className="hover:text-ink">
            Demo
          </a>
          {links.repo ? (
            <a href={links.repo} target="_blank" rel="noreferrer" className="hover:text-ink">
              Code
            </a>
          ) : null}
          <a href="#framework" className="hover:text-ink">
            Self-host
          </a>
        </nav>
      </Container>
    </footer>
  );
}
