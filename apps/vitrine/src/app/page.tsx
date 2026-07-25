import { Closing } from "@/components/closing";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpecSheet } from "@/components/spec-sheet";
import { TheLoop } from "@/components/the-loop";
import { Uses } from "@/components/uses";
import { WhatIsASlot } from "@/components/what-is-a-slot";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <WhatIsASlot />
        <TheLoop />
        <SpecSheet />
        <Uses />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
