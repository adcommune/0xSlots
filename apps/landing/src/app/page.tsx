import { Button } from "@/components/ui/button";

const PROPERTIES = [
  {
    label: "Harberger Tax",
    description:
      "Deposit-based partial common ownership. Control is earned, defended, and reallocated through open competition.",
  },
  {
    label: "Any ERC-20",
    description:
      "Deploy slots denominated in any token. No protocol lock-in, no wrapped assets, no permission needed.",
  },
  {
    label: "Agent-Ready",
    description:
      "Built for machine-speed markets. AI agents can transact, optimize, and compete autonomously onchain.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 lg:pt-24 lg:pb-20 min-h-[85vh] flex flex-col justify-center items-start max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground mb-6">
          0xSlots Protocol
        </p>

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
            <a href="/explorer/create">
              Create a slot
            </a>
          </Button>
        </div>
      </section>

      {/* Properties */}
      <section className="px-6 py-16 border-t">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground mb-8">
            Core Properties
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROPERTIES.map((prop) => (
              <div
                key={prop.label}
                className="p-6 rounded-lg border"
              >
                <h3 className="text-sm font-semibold mb-3">
                  {prop.label}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto strip */}
      <section className="px-6 py-16 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-xl font-bold leading-relaxed">
            As AI agents begin transacting, optimizing, and competing
            autonomously, static property models break down.
          </p>
          <p className="mt-6 text-lg sm:text-xl font-bold leading-relaxed">
            0xSlots introduces infrastructure built for machine-speed markets —
            fair, contestable, and capital-efficient.
          </p>
          <p className="mt-8 text-xs opacity-50">
            The next property primitive is here.
          </p>
        </div>
      </section>
    </>
  );
}
