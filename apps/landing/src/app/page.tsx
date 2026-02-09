export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center">
        <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60">
          On-chain coordination primitive
        </div>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          Partial Common{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Ownership
          </span>{" "}
          Protocol
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/50 sm:text-xl">
          Efficient resource allocation for autonomous agents. Assets are always
          for sale. Tax streams continuously. No central coordination needed.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="https://github.com/adcommune/pco-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* What is PCO */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">What is PCO?</h2>
        <p className="mt-4 max-w-3xl text-lg text-white/50">
          Partial Common Ownership applies{" "}
          <span className="text-white/80">Harberger tax</span> mechanics to
          digital assets. Holders self-assess an asset&apos;s value and pay
          continuous tax proportional to that price. Anyone can purchase the
          asset at the declared price — creating a system where resources flow
          to whoever values them most.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Self-Assess",
              desc: "Set your own price. The higher you set it, the more tax you pay — but the harder it is for others to buy.",
            },
            {
              title: "Stream Tax",
              desc: "Tax flows continuously per-second via Superfluid. No lump-sum payments, no collection overhead.",
            },
            {
              title: "Always For Sale",
              desc: "Anyone can buy at the self-assessed price. Ownership transfers instantly on-chain.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
        <div className="mt-12 space-y-8">
          {[
            {
              step: "01",
              title: "Mint ERC721PCO slots",
              desc: "Deploy a Harberger instance with configurable slots. Each slot is a PCO position with its own tax rate, currency, and module.",
            },
            {
              step: "02",
              title: "Self-assess value",
              desc: "Occupants declare their price. This is both the sale price and the tax basis — creating an honest incentive.",
            },
            {
              step: "03",
              title: "Stream tax via Superfluid",
              desc: "Tax is calculated as a per-second flow rate and streamed continuously to the beneficiary. No epochs, no claims.",
            },
            {
              step: "04",
              title: "Anyone can buy",
              desc: "Pay the self-assessed price + protocol fee and ownership transfers atomically. The old occupant's stream stops, yours begins.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6">
              <span className="text-3xl font-bold text-white/10">
                {item.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">Use Cases</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "AI Agent Resource Markets",
              desc: "Agents compete for compute, API slots, and bandwidth through honest price discovery — no auctions, no central allocator.",
            },
            {
              title: "Ad Space & Attention",
              desc: "Billboard-style ad slots where the market sets the price. AdLand module adds metadata and content management on Layer 2.",
            },
            {
              title: "Spectrum & Bandwidth",
              desc: "Allocate scarce resources like frequency bands or network capacity to whoever values them most, continuously.",
            },
            {
              title: "Domain Names & Identifiers",
              desc: "Prevent squatting through continuous cost of ownership. Names flow to active users who value them.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">Architecture</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8">
            <div className="text-sm font-medium text-emerald-400">Layer 1</div>
            <h3 className="mt-2 text-xl font-bold">PCO Primitive</h3>
            <p className="mt-3 text-sm text-white/40">
              Pure Harberger tax mechanics. Slot management, self-assessment,
              continuous tax streaming, atomic transfers. No opinions about what
              the slots represent.
            </p>
            <div className="mt-4 font-mono text-xs text-white/20">
              Harberger.sol · HarbergerHub.sol · SuperApp
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8">
            <div className="text-sm font-medium text-cyan-400">Layer 2</div>
            <h3 className="mt-2 text-xl font-bold">Modules</h3>
            <p className="mt-3 text-sm text-white/40">
              Pluggable logic that gives slots meaning. Modules receive callbacks
              on transfer, release, and price updates. AdLand adds ad metadata
              and content — but any module can be built.
            </p>
            <div className="mt-4 font-mono text-xs text-white/20">
              IHarbergerModule · AdLand · Your Module
            </div>
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">Built With</h2>
        <div className="mt-12 flex flex-wrap gap-4">
          {["Superfluid", "ERC-721", "Foundry", "Solidity", "OpenZeppelin"].map(
            (tech) => (
              <span
                key={tech}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm text-white/60"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12 text-center text-sm text-white/30">
        <a
          href="https://github.com/adcommune/pco-protocol"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 transition hover:text-white"
        >
          github.com/adcommune/pco-protocol
        </a>
      </footer>
    </main>
  );
}
