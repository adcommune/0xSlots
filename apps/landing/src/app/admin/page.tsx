const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/v0.4.0";

const QUERY = `{
  hubs(first: 1) {
    id
    protocolFeeBps
    protocolFeeRecipient
    slotPrice
    defaultCurrency {
      id
      name
      symbol
    }
    defaultSlotCount
    defaultPrice
    defaultTaxPercentage
    defaultMaxTaxPercentage
    defaultMinTaxUpdatePeriod
    defaultModule
    lands {
      id
      owner
      createdAt
      slots {
        id
        slotId
        occupant
        currency
        price
        taxPercentage
        active
        module
      }
    }
    allowedModules {
      id
      allowed
      name
      version
    }
    allowedCurrencies {
      id
      allowed
      name
      symbol
      decimals
      underlyingToken
      underlyingName
      underlyingSymbol
      underlyingDecimals
    }
  }
}`;

function formatWei(wei: string, symbol?: string): string {
  return (Number(wei) / 1e18).toFixed(6) + (symbol ? ` ${symbol}` : "");
}

function shorten(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function formatSeconds(s: string): string {
  const n = Number(s);
  if (n >= 86400) return `${n / 86400}d`;
  if (n >= 3600) return `${n / 3600}h`;
  return `${n}s`;
}

export default async function AdminPage() {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY }),
    cache: "no-store",
  });
  const { data } = await res.json();
  const hub = data?.hubs?.[0];

  if (!hub) {
    return (
      <main className="min-h-screen bg-white text-black font-mono p-8">
        <h1 className="text-2xl mb-4">0xSlots Admin</h1>
        <p className="text-red-600">No hub found in subgraph.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-mono p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">0xSlots Admin</h1>
      <p className="text-xs text-gray-400 mb-8">Base Sepolia · {shorten(hub.id)}</p>

      {/* Hub Settings */}
      <section className="mb-10">
        <h2 className="text-lg font-bold border-b border-black pb-1 mb-4">Hub Settings</h2>
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Protocol Fee", `${(Number(hub.protocolFeeBps) / 100).toFixed(2)}%`],
              ["Fee Recipient", shorten(hub.protocolFeeRecipient)],
              ["Land Creation Fee", formatWei(hub.slotPrice, hub.defaultCurrency?.symbol)],
              ["Default Currency", hub.defaultCurrency ? `${hub.defaultCurrency.symbol || "?"} · ${hub.defaultCurrency.name || shorten(hub.defaultCurrency.id)}` : "—"],
              ["Default Slot Count", hub.defaultSlotCount],
              ["Initial Slot Price", formatWei(hub.defaultPrice, hub.defaultCurrency?.symbol)],
              ["Default Tax", `${(Number(hub.defaultTaxPercentage) / 100).toFixed(2)}%`],
              ["Max Tax", `${(Number(hub.defaultMaxTaxPercentage) / 100).toFixed(2)}%`],
              ["Min Tax Update Period", formatSeconds(hub.defaultMinTaxUpdatePeriod)],
              ["Default Module", shorten(hub.defaultModule)],
            ].map(([label, value]) => (
              <tr key={label as string} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-500">{label}</td>
                <td className="py-2 font-medium">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Allowed Currencies */}
      <section className="mb-10">
        <h2 className="text-lg font-bold border-b border-black pb-1 mb-4">
          Currencies ({hub.allowedCurrencies.length})
        </h2>
        {hub.allowedCurrencies.length === 0 ? (
          <p className="text-gray-400 text-sm">None</p>
        ) : (
          <ul className="text-sm space-y-1">
            {hub.allowedCurrencies.map((c: any) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${c.allowed ? "bg-green-500" : "bg-red-500"}`} />
                <a href={`https://base-sepolia.blockscout.com/token/${c.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  <code>{shorten(c.id)}</code>
                </a>
                {c.symbol && <span className="font-bold">{c.symbol}</span>}
                {c.name && <span className="text-gray-400">· {c.name}</span>}
                {c.decimals != null && <span className="text-gray-300 text-xs">({c.decimals} dec)</span>}
                {c.underlyingToken && c.underlyingToken !== "0x0000000000000000000000000000000000000000" && (
                  <span className="text-blue-400 text-xs">
                    →{" "}
                    <a href={`https://base-sepolia.blockscout.com/token/${c.underlyingToken}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {c.underlyingSymbol || shorten(c.underlyingToken)}
                    </a>
                    {c.underlyingName && ` (${c.underlyingName})`}
                  </span>
                )}
                {c.underlyingToken === "0x0000000000000000000000000000000000000000" && (
                  <span className="text-gray-300 text-xs">· native wrapper</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Allowed Modules */}
      <section className="mb-10">
        <h2 className="text-lg font-bold border-b border-black pb-1 mb-4">
          Modules ({hub.allowedModules.length})
        </h2>
        {hub.allowedModules.length === 0 ? (
          <p className="text-gray-400 text-sm">None</p>
        ) : (
          <ul className="text-sm space-y-1">
            {hub.allowedModules.map((m: any) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${m.allowed ? "bg-green-500" : "bg-red-500"}`} />
                <code>{shorten(m.id)}</code>
                {m.name && <span className="text-gray-400">· {m.name} {m.version}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lands */}
      <section className="mb-10">
        <h2 className="text-lg font-bold border-b border-black pb-1 mb-4">
          Lands ({hub.lands.length})
        </h2>
        {hub.lands.length === 0 ? (
          <p className="text-gray-400 text-sm">No lands created yet.</p>
        ) : (
          hub.lands.map((land: any) => (
            <div key={land.id} className="mb-6 border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <code className="text-xs">{land.id}</code>
                <span className="text-xs text-gray-400">owner: {shorten(land.owner)}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400">
                    <th className="text-left py-1">Slot</th>
                    <th className="text-left py-1">Occupant</th>
                    <th className="text-left py-1">Price</th>
                    <th className="text-left py-1">Tax</th>
                    <th className="text-left py-1">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {land.slots.map((slot: any) => (
                    <tr key={slot.id} className="border-b border-gray-50">
                      <td className="py-1">#{slot.slotId}</td>
                      <td className="py-1">{slot.occupant ? shorten(slot.occupant) : "—"}</td>
                      <td className="py-1">{formatWei(slot.price, slot.currency?.symbol)}</td>
                      <td className="py-1">{(Number(slot.taxPercentage) / 100).toFixed(2)}%</td>
                      <td className="py-1">{slot.active ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      <footer className="text-xs text-gray-300 mt-16">
        0xSlots · Base Sepolia · Subgraph v0.1.0
      </footer>
    </main>
  );
}
