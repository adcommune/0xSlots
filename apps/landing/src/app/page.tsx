import { SlotsDemo } from "@/components/slots-demo";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
        <span className="text-2xl font-black tracking-tighter uppercase">
          0xSlots
        </span>
        <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
          <a href="/docs" className="hover:underline">
            Docs
          </a>
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub ↗
          </a>
        </div>
      </nav>
      {/* Hero */}
      <section className="px-6 pt-10 pb-8 border-b-4 border-black flex flex-col lg:flex-row gap-10 lg:gap-16 justify-center items-center">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.3em] mb-3">
            ONCHAIN REAL ESTATE
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            0xSlots grants every Ethereum address, productive onchain real
            estate.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed">
            Powered by partial common ownership and token streams, slots are
            never locked, never stagnant. Control is earned, defended, and
            reallocated through open competition — continuously aligning
            ownership with real productivity.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            No permanent monopolies. No idle assets.
            <br />
            Only recurring market selection.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed">
            As AI agents begin transacting, optimizing, and competing
            autonomously, static property models break down. 0xSlots introduces
            infrastructure built for machine-speed markets — fair, contestable,
            and capital-efficient.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            The next property primitive is here.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="/docs"
              className="border-2 border-black bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
            >
              Docs →
            </a>
            <a
              href="https://github.com/adcommune/0xSlots"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white"
            >
              Source Code
            </a>
          </div>
        </div>
        <div className=" flex-1 w-full md:w-auto min-w-0 flex items-center justify-center h-full">
          <SlotsDemo />
        </div>
      </section>
      {/* Use Cases */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.3em] mb-8">
            USE CASES
          </p>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-lg font-black uppercase mb-3">
                Token Launcher
              </h3>
              <p className="text-sm leading-relaxed">
                Fair token launches without bot sniping. Each slot is a position
                in the launch curve — holders self-assess their value and pay
                continuous tax. Outbid someone? You take their spot. Stop caring?
                Someone takes yours. The market prices hype in real time, and tax
                streams fund the token treasury before it even launches.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-black uppercase mb-3">
                Ad Space
              </h3>
              <p className="text-sm leading-relaxed">
                Digital billboards, website banners, in-app placements — all
                Harberger-priced. No more locked annual contracts at stale rates.
                Advertisers compete continuously for placement, and publishers
                earn streaming revenue proportional to real demand.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-black uppercase mb-3">
                Domain / Name Markets
              </h3>
              <p className="text-sm leading-relaxed">
                Eliminate domain squatting. Names, handles, and identifiers are
                held under partial common ownership — if you're not using it and
                someone values it more, they take it. Idle speculation becomes
                impossible.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-black uppercase mb-3">
                AI Agent Resources
              </h3>
              <p className="text-sm leading-relaxed">
                Agents competing for compute, API slots, data feeds, or priority
                access. Harberger pricing ensures resources flow to whoever
                values them most — at machine speed, with streaming payments.
                No negotiation, no downtime.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="px-6 py-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center font-mono text-xs uppercase tracking-widest">
          <span>0xSlots</span>
          <a
            href="https://github.com/adcommune"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            adcommune
          </a>
        </div>
      </footer>
    </main>
  );
}
