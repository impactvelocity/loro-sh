import { Creator } from "@/components/home/creator";
import { GitHubIcon } from "@/components/home/icons";
import { QDisc } from "@/components/home/mock";
import { ButtonLink, Container } from "@/components/ui";
import { links } from "@/lib/links";

/** The close before the footer: what the entry is and where to open it. */
export function Hackathon() {
  return (
    <section id="hackathon" className="scroll-mt-16 pt-24 pb-24 sm:pt-32 sm:pb-32">
      <Container>
        <div className="flex flex-col items-center rounded-[28px] bg-muted px-6 py-12 text-center sm:px-10 sm:py-16">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export; the favicon from app/icon.svg */}
            <img src="/icon.svg" alt="Loro" width={48} height={48} className="size-12" />
            <span aria-hidden className="text-lg text-stone">
              &times;
            </span>
            <QDisc />
          </div>
          <h2 className="mt-6 font-display text-4xl leading-[1.15] text-pretty sm:text-5xl">Built for the Qloo Hackathon</h2>
          <p className="mt-5 max-w-[40rem] text-lg leading-relaxed text-pretty text-slate">
            Loro is an entry in the Qloo Hackathon on Devpost. The admin opens in view-only mode with all seven demo
            experiences, and the code is on GitHub under the MIT licence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={links.app}>Open Loro App</ButtonLink>
            {links.repo ? (
              <ButtonLink href={links.repo} variant="secondary">
                <GitHubIcon />
                GitHub
              </ButtonLink>
            ) : null}
            <ButtonLink href={links.hackathon} variant="outline">
              See the Hackathon
            </ButtonLink>
          </div>
          <Creator className="mt-8" />
        </div>
      </Container>
    </section>
  );
}
