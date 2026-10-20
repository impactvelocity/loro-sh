import { Logo } from "@/components/logo";
import { ButtonLink, Container } from "@/components/ui";
import { links } from "@/lib/links";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-hairline/70">
        <Container className="flex h-16 items-center justify-between gap-6">
          <a href="/" className="text-ink" aria-label="Loro home">
            <Logo className="h-7 w-auto" />
          </a>
          <ButtonLink href={links.demo} size="sm">
            Open the demo
          </ButtonLink>
        </Container>
      </header>

      <main className="flex-1">
        <section className="py-24 sm:py-32 lg:py-40">
          <Container>
            <h1 className="max-w-[20ch] font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4.5rem]">
              Loro turns your customer&rsquo;s taste into an experience only your brand could send.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate">
              Loro turns what your customers love into branded experiences around the thing you sell: road trips to
              your festival, weekends at your hotel, a life at your listing.
            </p>
          </Container>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-6 w-auto text-ink" />
          <p className="text-sm text-slate">
            Taste from{" "}
            <a href={links.qloo} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink">
              Qloo
            </a>
            . Runs on Cloudflare.
          </p>
        </Container>
      </footer>
    </div>
  );
}
