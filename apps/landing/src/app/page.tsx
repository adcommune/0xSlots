export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">0xSlots</span>
        <a
          href="https://github.com/adcommune/0xSlots"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-900 transition"
        >
          GitHub →
        </a>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="mb-5 inline-block rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-500">
          Perpetual onchain slots
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
          Every slot has a price.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl leading-relaxed">
          0xSlots implements Harberger tax mechanics on Ethereum. Holders set their own
          price and pay continuous tax via Superfluid streaming. Anyone can buy any slot
          at the posted price. Resources flow to whoever values them most.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gray-900 text-white px-6 py-3 text-sm font-medium transition hover:bg-gray-800"
          >
            View on GitHub
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">How slots work</h2>
        <p className="mt-4 text-gray-500 max-w-2xl text-lg">
          Three simple rules create an efficient market without any central coordination.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-8">
            <div className="text-3xl font-bold text-gray-200">01</div>
            <h3 className="mt-4 text-lg font-semibold">Set your price</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              You self-assess the value of your slot. This is the price anyone can buy it
              for — so you&apos;re incentivized to be honest.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-8">
            <div className="text-3xl font-bold text-gray-200">02</div>
            <h3 className="mt-4 text-lg font-semibold">Stream tax</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Tax flows per-second via Superfluid based on your declared price. Higher
              price = more tax. No epochs, no manual claims.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-8">
            <div className="text-3xl font-bold text-gray-200">03</div>
            <h3 className="mt-4 text-lg font-semibold">Always for sale</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Anyone can purchase your slot at the self-assessed price. Ownership
              transfers atomically. Your stream stops, theirs begins.
            </p>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Why it matters</h2>
        <div className="mt-12 grid gap-12 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">No more squatting</h3>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Traditional ownership lets people sit on valuable resources without using
              them. With 0xSlots, holding a resource costs you — so only people who
              actually value it will hold it.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Price discovery without auctions</h3>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Self-assessment creates continuous, honest price discovery. No need for
              auction houses, order books, or negotiation. The price is always known.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Revenue for creators</h3>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Tax revenue streams continuously to the beneficiary — a DAO, a protocol,
              a creator. It&apos;s a new funding model based on resource usage, not speculation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Composable primitive</h3>
            <p className="mt-2 text-gray-500 leading-relaxed">
              0xSlots doesn&apos;t have opinions about what a slot represents. Plug in
              modules to give slots meaning — ads, compute, bandwidth, names, anything.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Use cases</h2>
          <p className="mt-4 text-gray-500 max-w-2xl text-lg">
            Anywhere scarce positions need fair allocation and continuous pricing.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Onchain ads",
                desc: "Ad slots on protocols, dApps, or Farcaster frames. The market sets the price, not an ad network. Content managed via the AdLand module.",
              },
              {
                title: "AI agent resources",
                desc: "Agents compete for compute slots, API access, or bandwidth. No negotiation needed — agents just bid by setting prices programmatically.",
              },
              {
                title: "Domain names",
                desc: "Prevent squatting through continuous cost of ownership. Names flow to active projects that actually use them.",
              },
              {
                title: "Protocol positions",
                desc: "Validator slots, oracle positions, or governance seats with Harberger pricing. Hold your seat as long as you pay.",
              },
              {
                title: "Digital real estate",
                desc: "Virtual land, metaverse plots, or game territories. Perpetual slots that are always contestable.",
              },
              {
                title: "Spectrum & bandwidth",
                desc: "Allocate scarce network resources — frequency bands, relay slots, priority lanes — to whoever values them most.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Architecture</h2>
        <p className="mt-4 text-gray-500 max-w-2xl text-lg">
          A two-layer design that separates the pricing primitive from what slots represent.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-gray-900 p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Layer 1
            </div>
            <h3 className="mt-2 text-xl font-bold">Slot Primitive</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">
              ERC-721 positions with self-assessed pricing, continuous Superfluid tax
              streaming, and atomic transfers. Pure mechanics — no opinions about what
              slots represent.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Harberger.sol", "HarbergerHub.sol", "SuperApp"].map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-500"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Layer 2
            </div>
            <h3 className="mt-2 text-xl font-bold">Modules</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Pluggable contracts that give slots meaning. Modules receive callbacks on
              transfer, release, and price changes. AdLand adds ad metadata — but any
              module can be built on top.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["IHarbergerModule", "AdLand", "Your Module"].map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-500"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Built with</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            "Superfluid",
            "ERC-721",
            "Foundry",
            "Solidity",
            "OpenZeppelin",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm text-gray-600"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Start building</h2>
        <p className="mt-4 text-gray-500 text-lg">
          0xSlots is open source. Deploy your own slot market or build a module.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gray-900 text-white px-6 py-3 text-sm font-medium transition hover:bg-gray-800"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-10 text-center">
        <span className="text-sm text-gray-400">
          0xSlots — by{" "}
          <a
            href="https://github.com/adcommune"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition"
          >
            adcommune
          </a>
        </span>
      </footer>
    </main>
  );
}
