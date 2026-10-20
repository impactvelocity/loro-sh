import { Examples } from "@/components/examples";
import { Framework } from "@/components/framework";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Closing, SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function Draft() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Examples />
        <HowItWorks />
        <Framework />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
