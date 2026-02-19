function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatWei(wei: string, decimals: number = 18): string {
  const value = Number(wei) / 10 ** decimals;
  if (value === 0) return "0";
  return value.toFixed(decimals <= 6 ? decimals : 6);
}

function formatBps(bps: string | number): string {
  return `${Number(bps) / 100}%`;
}

function formatSeconds(s: string | number): string {
  const sec = Number(s);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

interface HubData {
  id: string;
  protocolFeeBps: string;
  protocolFeeRecipient: string;
  landCreationFee: string;
  slotExpansionFee: string;
  defaultCurrency: { id: string; name: string; symbol: string; decimals: number } | null;
  defaultSlotCount: string;
  defaultPrice: string;
  defaultTaxPercentage: string;
  defaultMaxTaxPercentage: string;
  defaultMinTaxUpdatePeriod: string;
  defaultModule: string | null;
  moduleCallGasLimit: string;
  liquidationBountyBps: string;
  minDepositSeconds: string;
}

interface Props {
  hub: HubData | null;
  currencies: { id: string; name: string; symbol: string; decimals: number }[];
  modules: { id: string; name: string; version: string }[];
  explorerUrl: string;
}

export function HubSettings({ hub, currencies, modules, explorerUrl }: Props) {
  if (!hub) {
    return (
      <div className="border-2 border-black p-12 text-center">
        <p className="font-mono text-sm text-gray-500">NO HUB DATA</p>
      </div>
    );
  }

  const rows: [string, string, string?][] = [
    ["Hub Address", shorten(hub.id), hub.id],
    ["Protocol Fee", formatBps(hub.protocolFeeBps)],
    ["Fee Recipient", shorten(hub.protocolFeeRecipient), hub.protocolFeeRecipient],
    ["Land Creation Fee", formatWei(hub.landCreationFee)],
    ["Slot Expansion Fee", formatWei(hub.slotExpansionFee)],
    ["Default Currency", hub.defaultCurrency ? `${hub.defaultCurrency.symbol} (${shorten(hub.defaultCurrency.id)})` : "—", hub.defaultCurrency?.id],
    ["Default Slot Count", hub.defaultSlotCount],
    ["Default Price", `${formatWei(hub.defaultPrice, hub.defaultCurrency?.decimals ?? 18)} ${hub.defaultCurrency?.symbol || ""}`],
    ["Default Tax Rate", formatBps(hub.defaultTaxPercentage)],
    ["Max Tax Rate", formatBps(hub.defaultMaxTaxPercentage)],
    ["Min Tax Update Period", formatSeconds(hub.defaultMinTaxUpdatePeriod)],
    ["Module Call Gas Limit", Number(hub.moduleCallGasLimit).toLocaleString()],
    ["Liquidation Bounty", formatBps(hub.liquidationBountyBps)],
    ["Min Deposit Duration", formatSeconds(hub.minDepositSeconds)],
  ];

  return (
    <div className="space-y-6">
      {/* Settings Table */}
      <div className="border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-4">
          <h2 className="text-lg font-bold uppercase tracking-tight">Hub Configuration</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {rows.map(([label, value, fullAddr]) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <span className="font-mono text-xs text-gray-500 uppercase">{label}</span>
              {fullAddr ? (
                <a
                  href={`${explorerUrl}/address/${fullAddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold hover:underline text-blue-600"
                >
                  {value}
                </a>
              ) : (
                <span className="font-mono text-xs font-bold">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Allowed Currencies */}
      <div className="border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-4">
          <h2 className="text-sm font-bold uppercase tracking-tight">Allowed Currencies</h2>
        </div>
        {currencies.length === 0 ? (
          <p className="p-6 font-mono text-xs text-gray-400">None</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {currencies.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-mono text-xs font-bold">{c.symbol}</span>
                <a
                  href={`${explorerUrl}/address/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {shorten(c.id)}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allowed Modules */}
      <div className="border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-4">
          <h2 className="text-sm font-bold uppercase tracking-tight">Allowed Modules</h2>
        </div>
        {modules.length === 0 ? (
          <p className="p-6 font-mono text-xs text-gray-400">None</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {modules.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-mono text-xs font-bold">{m.name} v{m.version}</span>
                <a
                  href={`${explorerUrl}/address/${m.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {shorten(m.id)}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
