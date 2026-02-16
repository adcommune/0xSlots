export default function Docs() {
  return (
    <>
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
                desc: "Fair token launches without bot sniping. Slots are launch positions — holders self-assess value and pay continuous tax. The market prices hype in real time. Tax streams fund the treasury before launch.",
              },
              {
                title: "Onchain Ads",
                desc: "Ad slots priced by the market, not ad networks. Content managed via modules.",
              },
              {
                title: "AI Agent Resources",
                desc: "Agents compete for compute, API access, or bandwidth. No negotiation — just set prices.",
              },
              {
                title: "Domain Names",
                desc: "Prevent squatting through continuous cost of ownership.",
              },
              {
                title: "Protocol Positions",
                desc: "Validator slots, oracle seats, governance — hold as long as you pay.",
              },
              {
                title: "Digital Real Estate",
                desc: "Virtual land, metaverse plots — always contestable.",
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

      {/* Start Building */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter">
            Start Building
          </h2>
          <p className="mt-4 text-lg">Clone the repo. Deploy a module.</p>
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
