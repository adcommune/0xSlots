import Image from "next/image";

const TOOLS = [
  { name: "get_hub_info", type: "Read", desc: "Get SlotsHub config (fees, defaults, module)" },
  { name: "get_land", type: "Read", desc: "Get land details by account (slots count, currency)" },
  { name: "get_slot", type: "Read", desc: "Get slot details (occupant, price, tax rate)" },
  { name: "list_lands", type: "Read", desc: "List all lands on the hub" },
  { name: "list_slots", type: "Read", desc: "List all slots for a given land" },
  { name: "get_slot_metadata", type: "Read", desc: "Get metadata from MetadataModule" },
  { name: "purchase_slot", type: "Write", desc: "Buy a slot at listed price" },
  { name: "update_slot_price", type: "Write", desc: "Change your slot's self-assessed price" },
  { name: "set_slot_metadata", type: "Write", desc: "Set metadata via MetadataModule" },
  { name: "create_land", type: "Write", desc: "Create a new land (admin)" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
        <span className="text-2xl font-black tracking-tighter uppercase">0xSlots</span>
        <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
          <a href="#mcp" className="hover:underline">MCP</a>
          <a href="#why" className="hover:underline">Why</a>
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

      {/* Banner */}
      <div className="border-b-4 border-black">
        <Image
          src="/banner.png"
          alt="0xSlots Banner"
          width={1536}
          height={1024}
          className="w-full block"
          priority
        />
      </div>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4">
            Harberger tax on Ethereum · Superfluid streaming
          </p>
          <h1 className="text-6xl sm:text-[8rem] font-black uppercase leading-[0.85] tracking-tighter">
            Perpetual<br />Onchain<br />Slots
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed">
            Self-assessed pricing. Continuous tax via Superfluid streams. Anyone can buy any slot
            at the posted price. Ships with an MCP server so AI agents can interact out of the box.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="#mcp" className="border-2 border-black bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black">
              MCP Tools →
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
      </section>

      {/* Vitalik Quote / Why */}
      <section id="why" className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">Why This Matters</h2>

          <blockquote className="mt-10 border-l-4 border-black pl-6 py-2">
            <p className="text-lg leading-relaxed italic">
              &ldquo;Prediction and decision markets, decentralized governance, quadratic voting, combinatorial auctions, universal barter economy, and all kinds of constructions are all beautiful in theory, but have been greatly hampered in reality by one big constraint: limits to human attention and decision-making power.&rdquo;
            </p>
            <p className="text-lg leading-relaxed italic mt-4">
              &ldquo;LLMs remove that limitation, and massively scale human judgement.&rdquo;
            </p>
            <footer className="mt-4 font-mono text-xs uppercase tracking-widest">
              — <a href="https://vitalik.eth.limo/general/2024/01/30/cryptoai.html" target="_blank" rel="noopener noreferrer" className="underline">Vitalik Buterin</a>, Feb 2026
            </footer>
          </blockquote>

          <div className="mt-12 grid gap-0 sm:grid-cols-2">
            <div className="border-2 border-black p-8">
              <h3 className="font-black uppercase text-lg">The Problem</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Harberger tax is one of the most elegant market mechanisms ever designed — continuous price discovery, zero deadweight loss, no squatting. But it requires constant attention: monitoring prices, reassessing values, responding to bids. Humans can&apos;t do this at scale.
              </p>
            </div>
            <div className="border-2 border-black border-l-0 p-8">
              <h3 className="font-black uppercase text-lg">The Unlock</h3>
              <p className="mt-3 text-sm leading-relaxed">
                AI agents can. They can monitor slot prices 24/7, bid autonomously, self-assess values based on real utility, and manage positions across thousands of slots. 0xSlots gives them the economic infrastructure to do it — onchain, permissionless, with an MCP server out of the box.
              </p>
            </div>
          </div>

          <blockquote className="mt-8 border-l-4 border-black pl-6 py-2">
            <p className="text-lg leading-relaxed italic">
              &ldquo;The goal is to enable AIs to interact economically, which makes viable more decentralized AI architectures. Economies not for the sake of economies, but to enable more decentralized authority.&rdquo;
            </p>
            <footer className="mt-4 font-mono text-xs uppercase tracking-widest">
              — Vitalik Buterin
            </footer>
          </blockquote>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed">
            0xSlots is economic infrastructure for autonomous agents. Scarce positions — ad slots, compute access, bandwidth, protocol seats — allocated not by committees or first-come-first-served, but by continuous market mechanisms that agents can operate without human intervention.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">How it works</h2>
          <div className="mt-10">
            {[
              { step: "01", title: "Open a Land", desc: "Call openLand() on the Hub. Creates a Slots contract with N slots, each priced and taxed." },
              { step: "02", title: "Buy a Slot", desc: "Pay the listed price → you're the new occupant. A Superfluid stream starts, paying continuous tax to the land owner." },
              { step: "03", title: "Set Your Price", desc: "Self-assess: set your slot's price. Higher price = more tax. Lower price = someone else buys it." },
              { step: "04", title: "Anyone Can Buy", desc: "Every slot is always for sale. If someone pays your price, you're out. No negotiation." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 py-5 border-t-2 border-black">
                <span className="font-mono text-3xl font-black flex-shrink-0 w-16">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-black uppercase text-lg">{item.title}</h3>
                  <p className="mt-1 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Server */}
      <section id="mcp" className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">MCP Server</h2>
            <span className="font-mono text-xs border-2 border-black px-2 py-1 font-bold">10 TOOLS</span>
          </div>
          <p className="max-w-2xl text-lg">
            Connect any MCP-compatible agent to read, write, and query the protocol.
          </p>

          {/* Quick start */}
          <div className="mt-8 border-2 border-black bg-black text-white p-6 font-mono text-sm overflow-x-auto">
            <div className="text-gray-500"># Claude Desktop / Cursor config</div>
            <pre>{`{
  "mcpServers": {
    "0xslots": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": { "PRIVATE_KEY": "0x..." }
    }
  }
}`}</pre>
          </div>

          {/* Tool table */}
          <div className="mt-10 border-2 border-black">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-black text-white">
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider">Tool</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((tool) => (
                  <tr key={tool.name} className="border-b border-black">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold">{tool.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs uppercase">{tool.type}</td>
                    <td className="px-4 py-2.5 text-sm">{tool.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">Use Cases</h2>
          <p className="mt-4 max-w-2xl text-lg">
            Anywhere scarce positions need fair allocation and continuous pricing.
          </p>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Onchain Ads", desc: "Ad slots priced by the market, not ad networks. Content managed via modules." },
              { title: "AI Agent Resources", desc: "Agents compete for compute, API access, or bandwidth. No negotiation — just set prices." },
              { title: "Domain Names", desc: "Prevent squatting through continuous cost of ownership." },
              { title: "Protocol Positions", desc: "Validator slots, oracle seats, governance — hold as long as you pay." },
              { title: "Digital Real Estate", desc: "Virtual land, metaverse plots — always contestable." },
              { title: "Spectrum & Bandwidth", desc: "Allocate scarce network resources to whoever values them most." },
            ].map((item) => (
              <div key={item.title} className="border-2 border-black p-5 -mt-[2px] -ml-[2px]">
                <h3 className="font-black uppercase text-sm">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter">Start Building</h2>
          <p className="mt-4 text-lg">
            Clone the repo. Plug in the MCP server. Deploy a module.
          </p>
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

      {/* Footer */}
      <footer className="px-6 py-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center font-mono text-xs uppercase tracking-widest">
          <span>0xSlots</span>
          <a href="https://github.com/adcommune" target="_blank" rel="noopener noreferrer" className="hover:underline">
            adcommune
          </a>
        </div>
      </footer>
    </main>
  );
}
