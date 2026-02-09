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

const CONTRACTS = [
  { name: "SlotsHub (proxy)", addr: "0xFdE9...c3E49e", note: "Main entry point" },
  { name: "Slots (beacon impl)", addr: "0xF424...A156", note: "Cloned per Land" },
  { name: "SlotsStreamSuperApp", addr: "0x993C...5c59b", note: "Tax distributor, per Land" },
  { name: "MetadataModule", addr: "0x3014...80E9A", note: "Shared module" },
];

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) {
  const colors: Record<string, string> = {
    Read: "bg-emerald-100 text-emerald-700",
    Write: "bg-amber-100 text-amber-700",
    Subgraph: "bg-blue-100 text-blue-700",
    default: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${colors[variant] || colors.default}`}>
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">0xSlots</span>
        <div className="flex items-center gap-5">
          <a href="#mcp" className="text-sm text-gray-500 hover:text-gray-900 transition">MCP</a>
          <a href="#architecture" className="text-sm text-gray-500 hover:text-gray-900 transition">Architecture</a>
          <a href="#deployments" className="text-sm text-gray-500 hover:text-gray-900 transition">Deployments</a>
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5"
          >
            <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Banner */}
      <div className="max-w-6xl mx-auto px-6">
        <Image
          src="/banner.png"
          alt="0xSlots Banner"
          width={1536}
          height={1024}
          className="w-full rounded-2xl"
          priority
        />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center max-w-4xl mx-auto">
        <div className="mb-5 inline-block rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-500">
          Harberger tax on Ethereum · Superfluid streaming
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
          Perpetual Onchain Slots
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl leading-relaxed">
          Self-assessed pricing. Continuous tax via Superfluid streams. Anyone can buy any slot
          at the posted price. Ships with an MCP server so AI agents can interact out of the box.
        </p>
        <div className="mt-10 flex gap-4">
          <a href="#mcp" className="rounded-lg bg-gray-900 text-white px-6 py-3 text-sm font-medium transition hover:bg-gray-800">
            MCP Tools →
          </a>
          <a
            href="https://github.com/adcommune/0xSlots"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            View Source
          </a>
        </div>
      </section>

      {/* How it works — quick explainer */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-1">
          {[
            { step: "1", title: "Open a Land", desc: "Call openLand() on the Hub. Creates a Slots contract with N slots, each priced and taxed." },
            { step: "2", title: "Buy a Slot", desc: "Pay the listed price → you're the new occupant. A Superfluid stream starts, paying continuous tax to the land owner." },
            { step: "3", title: "Set Your Price", desc: "Self-assess: set your slot's price. Higher price = more tax. Lower price = someone else buys it." },
            { step: "4", title: "Anyone Can Buy", desc: "Every slot is always for sale. If someone pays your price, you're out. No negotiation." },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 py-5 border-b border-gray-100">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold">
                {item.step}
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MCP Server */}
      <section id="mcp" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold sm:text-4xl">MCP Server</h2>
            <Badge variant="default">10 tools</Badge>
          </div>
          <p className="text-gray-500 max-w-2xl text-lg">
            Connect any MCP-compatible agent (Claude, Cursor, custom) to read, write, and query the protocol.
          </p>

          {/* Quick start */}
          <div className="mt-8 rounded-xl bg-gray-900 text-gray-100 p-6 font-mono text-sm overflow-x-auto">
            <div className="text-gray-400"># Claude Desktop / Cursor config</div>
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
          <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tool</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((tool) => (
                  <tr key={tool.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs">{tool.name}</td>
                    <td className="px-4 py-2.5"><Badge variant={tool.type}>{tool.type}</Badge></td>
                    <td className="px-4 py-2.5 text-gray-500">{tool.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Env vars */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Environment Variables</h3>
            <div className="rounded-xl bg-gray-900 text-gray-100 p-6 font-mono text-sm">
              <div className="text-emerald-400"># Required for write operations</div>
              <div>PRIVATE_KEY=0x...</div>
              <div className="mt-3 text-gray-400"># Optional overrides</div>
              <div>SLOTS_HUB_ADDRESS=0xFdE9B7c9B8448cA5324Be5948BA6643745c3E49e</div>
              <div>METADATA_MODULE_ADDRESS=0x3014c378544013864AC4E630b7b4CFA276380E9A</div>
              <div>RPC_URL=https://sepolia.optimism.io</div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Architecture</h2>
        <p className="mt-4 text-gray-500 max-w-2xl text-lg">
          Two layers. The primitive handles pricing and tax. Modules give slots meaning.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-gray-900 p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Layer 1</div>
            <h3 className="mt-2 text-xl font-bold">Slot Primitive</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">
              ERC-721-style positions with self-assessed pricing, continuous Superfluid tax
              streaming, and atomic forced transfers. Pure mechanics.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Slots.sol", "SlotsHub.sol", "SlotsStreamSuperApp.sol"].map((c) => (
                <span key={c} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-500">{c}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Layer 2</div>
            <h3 className="mt-2 text-xl font-bold">Modules</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Pluggable contracts that give slots meaning. Modules receive callbacks on
              transfer, release, and price changes. Build an NFT wrapper, ad metadata layer, or anything.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["ISlotsModule", "MetadataModule", "Your Module"].map((c) => (
                <span key={c} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-500">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deployments */}
      <section id="deployments" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Testnet Deployments</h2>
          <p className="mt-2 text-gray-500">OP Sepolia (chain 11155420)</p>

          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Contract</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Address</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Note</th>
                </tr>
              </thead>
              <tbody>
                {CONTRACTS.map((c) => (
                  <tr key={c.name} className="border-b border-gray-50">
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{c.addr}</td>
                    <td className="px-4 py-2.5 text-gray-400">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Subgraph</h3>
            <code className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 inline-block font-mono text-gray-600">
              https://api.studio.thegraph.com/query/958/0-x-slots-opt-sepolia/v0.0.1
            </code>
          </div>
        </div>
      </section>

      {/* Built for AI Agents */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Built for AI Agents</h2>
        <p className="mt-4 text-gray-500 max-w-2xl text-lg">
          0xSlots ships with an MCP server out of the box. Any AI agent that speaks the
          Model Context Protocol can read onchain state, buy slots, set prices, and manage
          metadata — no custom integration needed.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold">Read State</h3>
            <p className="mt-2 text-sm text-gray-500">Query hub config, list lands, inspect slots and metadata — all through structured tool calls.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold">Write Onchain</h3>
            <p className="mt-2 text-sm text-gray-500">Purchase slots, update prices, set metadata. Agents can autonomously manage Harberger positions.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold">Zero Config</h3>
            <p className="mt-2 text-sm text-gray-500">Works with Claude Desktop, Cursor, and any MCP client. Just point to the server and add a private key.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Possible use cases</h2>
        <p className="mt-4 text-gray-500 max-w-2xl text-lg">
          Anywhere scarce positions need fair allocation and continuous pricing.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Onchain ads", desc: "Ad slots priced by the market, not ad networks. Content managed via modules." },
            { title: "AI agent resources", desc: "Agents compete for compute, API access, or bandwidth. No negotiation — just set prices." },
            { title: "Domain names", desc: "Prevent squatting through continuous cost of ownership." },
            { title: "Protocol positions", desc: "Validator slots, oracle seats, governance — hold as long as you pay." },
            { title: "Digital real estate", desc: "Virtual land, metaverse plots — always contestable." },
            { title: "Spectrum & bandwidth", desc: "Allocate scarce network resources to whoever values them most." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built With */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold">Built with</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {["Superfluid", "ERC-721", "Foundry", "Solidity", "OpenZeppelin", "The Graph", "MCP", "viem"].map((tech) => (
            <span key={tech} className="rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm text-gray-600">{tech}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Start building</h2>
        <p className="mt-4 text-gray-500 text-lg">
          Clone the repo, plug in the MCP server, deploy a module.
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
          <a href="https://github.com/adcommune" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition">
            adcommune
          </a>
        </span>
      </footer>
    </main>
  );
}
