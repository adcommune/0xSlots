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
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/50 mb-6">
          0xSlots Protocol
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight">
          0xSlots
          <span className="block mt-2 text-xl lg:text-2xl font-bold normal-case tracking-normal leading-tight">
            Modular & Immutable collective ownership slot.
          </span>
        </h1>

        <p className="mt-8 text-base leading-relaxed max-w-lg text-black/70">
          Perpetual onchain real estate powered by partial common ownership. No
          permanent monopolies. No idle assets. Only recurring market selection.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-black bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
          >
            Source Code
          </a>
          <a
            href="/explorer/create"
            className="border-2 border-black bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            Create a slot
          </a>
        </div>
      </section>

      {/* Properties */}
      <section className="px-6 py-16 border-t-4 border-black">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/50 mb-8">
            Core Properties
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {PROPERTIES.map((prop, i) => (
              <div
                key={prop.label}
                className={`p-6 border-2 border-black ${i > 0 ? "md:border-l-0" : ""} ${i > 0 ? "border-t-0 md:border-t-2" : ""}`}
              >
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold mb-3">
                  {prop.label}
                </h3>
                <p className="text-sm leading-relaxed text-black/70">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto strip */}
      <section className="px-6 py-16 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-xl font-bold leading-relaxed">
            As AI agents begin transacting, optimizing, and competing
            autonomously, static property models break down.
          </p>
          <p className="mt-6 text-lg sm:text-xl font-bold leading-relaxed">
            0xSlots introduces infrastructure built for machine-speed markets —
            fair, contestable, and capital-efficient.
          </p>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.4em] text-white/50">
            The next property primitive is here.
          </p>
        </div>
      </section>
    </>
  );
}
