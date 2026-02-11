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

export default function Docs() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
        <a href="/" className="text-2xl font-black tracking-tighter uppercase">0xSlots</a>
        <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
          <a href="/docs" className="underline">Docs</a>
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

      {/* Header */}
      <section className="px-6 pt-10 pb-8 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-black uppercase leading-[0.85] tracking-tighter">
            Docs
          </h1>
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
              { title: "Token Launcher", desc: "Fair token launches without bot sniping. Slots are launch positions — holders self-assess value and pay continuous tax. The market prices hype in real time. Tax streams fund the treasury before launch.", featured: true },
              { title: "Onchain Ads", desc: "Ad slots priced by the market, not ad networks. Content managed via modules." },
              { title: "AI Agent Resources", desc: "Agents compete for compute, API access, or bandwidth. No negotiation — just set prices." },
              { title: "Domain Names", desc: "Prevent squatting through continuous cost of ownership." },
              { title: "Protocol Positions", desc: "Validator slots, oracle seats, governance — hold as long as you pay." },
              { title: "Digital Real Estate", desc: "Virtual land, metaverse plots — always contestable." },
              { title: "Spectrum & Bandwidth", desc: "Allocate scarce network resources to whoever values them most." },
            ].map((item: any) => (
              <div key={item.title} className={`border-2 border-black p-5 -mt-[2px] -ml-[2px] ${item.featured ? "bg-black text-white col-span-2 lg:col-span-1" : ""}`}>
                <h3 className="font-black uppercase text-sm">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed">{item.desc}</p>
                {item.featured && (
                  <a href="#token-launcher" className="mt-2 inline-block text-xs font-mono underline">
                    Read more ↓
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Launcher Deep Dive */}
      <section id="token-launcher" className="px-6 py-16 border-b-4 border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">Token Launcher</h2>
          <p className="mt-4 max-w-2xl text-lg">
            Harberger-priced token launches. Fair, continuous, bot-proof.
          </p>

          {/* How it works */}
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="font-black uppercase text-lg mb-3">How It Works</h3>
              <p className="text-sm leading-relaxed max-w-2xl">
                A token launch is a <strong>Land</strong>. Each <strong>Slot</strong> represents a position on the launch curve — an allocation of tokens at a given tier. To hold a slot, you self-assess its value and pay continuous tax via Superfluid streams. Anyone can take your slot by paying your self-assessed price.
              </p>
            </div>

            <div className="border-2 border-black bg-black text-white p-6 font-mono text-sm overflow-x-auto">
              <div className="text-gray-500"># Example: $FAIR token launch</div>
              <pre>{`Land: $FAIR Token Launch (6 slots, 1M tokens)
├── Slot 0: 250,000 tokens  ← earliest tier, most valuable
├── Slot 1: 200,000 tokens
├── Slot 2: 175,000 tokens
├── Slot 3: 150,000 tokens
├── Slot 4: 125,000 tokens
└── Slot 5: 100,000 tokens  ← latest tier

Pre-launch (7 days):
  Day 1: Alice claims Slot 0 → assesses $500 → pays ~$0.07/day tax
  Day 3: Bob outbids → pays Alice $500 → assesses $2,000
  Day 5: Carol outbids → pays Bob $2,000 → assesses $5,000
  Day 7: Launch triggers → Carol gets 250K tokens
         Treasury: ~$15 accumulated tax → seeds liquidity`}</pre>
            </div>

            {/* Comparison */}
            <div>
              <h3 className="font-black uppercase text-lg mb-3">vs Existing Models</h3>
              <div className="border-2 border-black overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-black text-white">
                      <th className="px-4 py-3 text-left font-mono uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-left font-mono uppercase tracking-wider">pump.fun</th>
                      <th className="px-4 py-3 text-left font-mono uppercase tracking-wider">Whitelists</th>
                      <th className="px-4 py-3 text-left font-mono uppercase tracking-wider">0xSlots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Bot resistance", "❌ Bots win", "✅ Manual", "✅ Harberger"],
                      ["Price discovery", "Post-launch", "None", "Pre-launch, continuous"],
                      ["Treasury funding", "Buy fees", "None", "Streaming tax"],
                      ["Position fairness", "Speed wins", "Connections win", "Conviction wins"],
                      ["Idle positions", "Dead wallets", "N/A", "Taken over"],
                      ["Dev accountability", "Zero", "Zero", "Dev pays tax"],
                    ].map(([label, pump, wl, slots]) => (
                      <tr key={label} className="border-b border-black">
                        <td className="px-4 py-2 font-bold">{label}</td>
                        <td className="px-4 py-2">{pump}</td>
                        <td className="px-4 py-2">{wl}</td>
                        <td className="px-4 py-2 font-bold">{slots}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dev accountability */}
            <div className="border-2 border-black p-6">
              <h3 className="font-black uppercase text-lg mb-3">Dev Accountability</h3>
              <p className="text-sm leading-relaxed max-w-2xl">
                Creators can reserve slots for themselves (dev allocation). But those slots follow the same Harberger rules — self-assess the value, pay continuous tax. If the dev thinks their own token is worthless (low assessment), anyone can buy the allocation cheap. If they think it{"'"}s valuable, they{"'"}re paying real tax to hold it. <strong>First memecoin where the dev literally can{"'"}t hold a free allocation.</strong>
              </p>
            </div>

            {/* Architecture */}
            <div>
              <h3 className="font-black uppercase text-lg mb-3">Architecture</h3>
              <p className="text-sm leading-relaxed max-w-2xl mb-4">
                No new core contracts. The token launcher is a <strong>module</strong> on the existing 0xSlots primitive.
              </p>
              <div className="border-2 border-black bg-black text-white p-6 font-mono text-sm overflow-x-auto">
                <pre>{`SlotsHub (existing)
├── openLand() → creates a new token launch
│   └── Slots.sol (existing) — Harberger-priced positions
│       └── Module: TokenLauncherModule (new)
│
TokenLauncherModule.sol
├── setTokenConfig(land, name, symbol, supply, allocations[])
├── launch(land) → deploy token, distribute to holders
├── claimAllocation(land, slotId) → claim tokens
└── withdrawTreasury(land) → withdraw accumulated tax`}</pre>
              </div>
            </div>

            <div>
              <a
                href="https://github.com/adcommune/0xSlots/blob/main/docs/TOKEN_LAUNCHER.md"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white inline-block"
              >
                Full Design Doc →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Start Building */}
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
