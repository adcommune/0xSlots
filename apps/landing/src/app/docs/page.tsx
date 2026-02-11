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
