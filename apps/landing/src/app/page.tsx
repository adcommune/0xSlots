import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 lg:pt-24 lg:pb-20 min-h-[85vh] flex flex-col justify-center items-start max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground mb-6">0xSlots Protocol</p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
          0xSlots
          <span className="block mt-2 text-xl lg:text-2xl font-bold normal-case tracking-normal leading-tight">
            Modular & Immutable collective ownership slot.
          </span>
        </h1>

        <p className="mt-8 text-base leading-relaxed max-w-lg text-muted-foreground">
          Perpetual onchain real estate powered by partial common ownership. No
          permanent monopolies. No idle assets. Only recurring market selection.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <a
              href="https://github.com/adcommune/0xSlots"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source Code
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/explorer">Explore</a>
          </Button>
        </div>
      </section>
    </>
  );
}
