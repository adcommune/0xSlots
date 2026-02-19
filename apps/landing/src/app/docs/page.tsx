import { HarbergerExplainer } from "@/components/harberger-explainer";

export default function Docs() {
  return (
    <>
      {/* Harberger Tax Explainer */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <HarbergerExplainer />
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">
            Ideas to build
          </h2>
          <p className="mt-4 max-w-2xl text-lg">
            Anywhere scarce positions need fair allocation and continuous
            pricing.
          </p>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Token Launcher",
                desc: "Fair token launches without bot sniping. Slots are launch positions — holders self-assess value and pay deposit-based tax. The market prices hype in real time. Tax deposits fund the treasury before launch.",
              },
              {
                title: "Onchain Ads",
                desc: "Ad slots priced by the market, not ad networks. Content managed via modules. Any ERC-20 as payment.",
              },
              {
                title: "AI Agent Resources",
                desc: "Agents compete for compute, API access, or bandwidth. No negotiation — just set prices and deposit escrow.",
              },
              {
                title: "Domain Names",
                desc: "Prevent squatting through continuous cost of ownership via escrow-based tax.",
              },
              {
                title: "Protocol Positions",
                desc: "Validator slots, oracle seats, governance — hold as long as your deposit covers the tax.",
              },
              {
                title: "Digital Real Estate",
                desc: "Virtual land, metaverse plots — always contestable, settled on-demand.",
              },
              {
                title: "Spectrum & Bandwidth",
                desc: "Allocate scarce network resources to whoever values them most.",
              },
            ].map((item: any) => (
              <div
                key={item.title}
                className="border-2 border-black p-5 -mt-[2px] -ml-[2px]"
              >
                <h3 className="font-black uppercase text-sm">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">
            How It Works
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Deposit & Buy",
                desc: "Deposit any ERC-20 as escrow. Buy a slot at the self-assessed price. Your deposit covers the Harberger tax over time.",
              },
              {
                step: "02",
                title: "Hold & Settle",
                desc: "Tax accrues against your escrow deposit. Anyone can trigger settlement on-chain. When your deposit runs out, you're liquidatable.",
              },
              {
                step: "03",
                title: "Compete",
                desc: "Anyone can buy your slot at your self-assessed price. Set it high to deter buyers — but you'll pay more tax. Set it low and risk losing it.",
              },
            ].map((item: any) => (
              <div
                key={item.step}
                className="border-2 border-black p-6"
              >
                <span className="font-mono text-xs opacity-50">{item.step}</span>
                <h3 className="font-black uppercase text-sm mt-2">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Start Building */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter">
            Start Building
          </h2>
          <p className="mt-4 text-lg">Clone the repo. Deploy a module. Use any ERC-20.</p>
          <div className="mt-8">
            <a
              href="https://github.com/adcommune/0xSlots"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-black bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black inline-block"
            >
              GitHub →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
