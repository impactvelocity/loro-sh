import { Logo } from "@/components/logo";
import { DemoVideo } from "@/components/demo-video";
import { Creator } from "@/components/home/creator";
import { Demos } from "@/components/home/demos";
import { Flexible } from "@/components/home/flexible";
import { Footer } from "@/components/home/footer";
import { FrameworkFeatures } from "@/components/home/framework-features";
import { GitHubIcon } from "@/components/home/icons";
import { Hackathon } from "@/components/home/hackathon";
import { Parts } from "@/components/home/parts";
import { Stack } from "@/components/home/stack";
import { Workflow } from "@/components/home/workflow";
import { ButtonLink, Container } from "@/components/ui";
import { links } from "@/lib/links";
import type { CSSProperties } from "react";

// The page's sections, in order.
const nav = [
  { href: "#parts", label: "How It Works" },
  { href: "#framework", label: "Framework" },
  { href: "#examples", label: "Examples" },
  { href: "#workflow", label: "Workflow" },
  { href: "#flexible", label: "Extend" },
  { href: "#stack", label: "Stack" },
];

const lines = "url(/topography.svg)";
const fade = "linear-gradient(330deg, black 0%, black 10%, transparent 75%)";

const topography: CSSProperties = {
  background: [
    "radial-gradient(45% 70% at 85% 90%, #e57aa8, transparent 75%)",
    "radial-gradient(40% 65% at 62% 25%, #eaa94e, transparent 75%)",
    "radial-gradient(45% 70% at 35% 95%, #7fa673, transparent 75%)",
    "radial-gradient(40% 70% at 100% 15%, #4f93a3, transparent 75%)",
    "#8c8cc8",
  ].join(", "),
  maskImage: `${lines}, ${fade}`,
  maskSize: "600px 600px, 100% 100%",
  maskRepeat: "repeat, no-repeat",
  maskComposite: "intersect",
  WebkitMaskImage: `${lines}, ${fade}`,
  WebkitMaskSize: "600px 600px, 100% 100%",
  WebkitMaskRepeat: "repeat, no-repeat",
  WebkitMaskComposite: "source-in",
};

// The same lines in white, faint, for texture on the header bar.
const headerTopography: CSSProperties = {
  background: "white",
  maskImage: lines,
  maskSize: "600px 600px",
  WebkitMaskImage: lines,
  WebkitMaskSize: "600px 600px",
};

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-linear-to-r from-[#1a1832]/90 via-[#211d40]/85 to-[#2c2350]/85 shadow-lg shadow-[#1a1733]/10 backdrop-blur-lg">
        <div aria-hidden className="absolute inset-0 opacity-[0.06]" style={headerTopography} />
        <Container className="relative flex h-16 items-center justify-between gap-6">
          <a href="/" className="text-white" aria-label="Loro home">
            <Logo className="h-7 w-auto" />
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-7 text-[15px] font-medium text-white/90 md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
        </Container>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-stone/80 pt-16 pb-36 sm:pt-20 sm:pb-44 lg:pt-28 lg:pb-56">
          {/*
            Topography by Hero Patterns (heropatterns.com, CC BY 4.0). The lines are a mask over a
            wash of the palette's hues, so they shift colour across the hero; a second mask fades
            them out toward the top left.
          */}
          <div aria-hidden className="absolute inset-0 opacity-15" style={topography} />
          <Container className="relative">
            <div>
              <h1 className="max-w-[24ch] font-display text-[2.1rem] leading-[1.06] tracking-normal text-balance sm:text-5xl lg:text-[3.5rem]">
                Loro is an Agentic Framework for Brand Experiences
                <span className="mt-2 block text-[0.6em] leading-[1.15] text-accent-hover">
                  Grounded in Qloo&rsquo;s Taste Intelligence
                </span>
              </h1>
              <p className="mt-6 max-w-[44ch] text-xl leading-relaxed text-balance sm:text-[1.375rem] text-slate">
                Turn what customers love into marketing that goes beyond the obvious and the tracking pixel
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href={links.hackathon} variant="outline">
                  Built for the Qloo Hackathon
                </ButtonLink>
                <ButtonLink href={links.app}>Open Loro App</ButtonLink>
                {links.repo ? (
                  <ButtonLink href={links.repo} variant="secondary">
                    <GitHubIcon />
                    GitHub
                  </ButtonLink>
                ) : null}
              </div>
              <Creator className="mt-6" />
            </div>
          </Container>
        </section>

        <DemoVideo />
        <Parts />
        <FrameworkFeatures />
        <Demos />
        <Workflow />
        <Flexible />
        <Stack />
        <Hackathon />
      </main>

      <Footer />
    </div>
  );
}
