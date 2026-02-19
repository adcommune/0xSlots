import { createSlotsClient, SlotsChain } from "@0xslots/sdk";
import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";
import { HarbergerExplainer } from "@/components/harberger-explainer";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatPrice(wei: string): string {
  const eth = Number(wei) / 1e18;
  if (eth === 0) return "0";
  if (eth < 0.001) return "<0.001";
  return eth.toFixed(4);
}

function taxPerYear(price: string, taxPct: string): string {
  // taxPercentage is in basis points (100 = 1%)
  const p = Number(price) / 1e18;
  const rate = Number(taxPct) / 10000;
  const annual = p * rate;
  if (annual === 0) return "0";
  if (annual < 0.0001) return "<0.0001";
  return annual.toFixed(4);
}

export default async function SlotsPage() {
  const client = createSlotsClient({ chainId: SlotsChain.ARBITRUM });

  let lands: any[] = [];
  let allSlots: any[] = [];
  let error: string | null = null;

  try {
    const landsResult = await client.getLands({
      first: 50,
      orderBy: "createdAt" as any,
      orderDirection: "desc" as any,
    });
    lands = landsResult.lands || [];

    const slotsResult = await client.getSlots({
      first: 200,
      orderBy: "slotId" as any,
      orderDirection: "asc" as any,
    });
    allSlots = slotsResult.slots || [];
  } catch (e: any) {
    error = e.message || "Failed to fetch data";
  }

  // Group slots by land
  const slotsByLand = new Map<string, any[]>();
  for (const slot of allSlots) {
    const landId = slot.land.id;
    if (!slotsByLand.has(landId)) slotsByLand.set(landId, []);
    slotsByLand.get(landId)!.push(slot);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                AdLand
              </h1>
              <p className="text-gray-500 font-mono text-xs">
                HARBERGER-TAXED AD SLOTS · ARBITRUM
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border-2 border-black p-6">
            <div className="text-xs font-mono uppercase text-gray-500 mb-1">Lands</div>
            <div className="text-3xl font-black">{lands.length}</div>
          </div>
          <div className="border-2 border-black p-6">
            <div className="text-xs font-mono uppercase text-gray-500 mb-1">Total Slots</div>
            <div className="text-3xl font-black">{allSlots.length}</div>
          </div>
          <div className="border-2 border-black p-6">
            <div className="text-xs font-mono uppercase text-gray-500 mb-1">Occupied</div>
            <div className="text-3xl font-black">
              {allSlots.filter((s: any) => s.occupant && s.occupant !== "0x0000000000000000000000000000000000000000").length}
            </div>
          </div>
        </div>

        {error && (
          <div className="border-2 border-black bg-red-50 p-4 mb-8 font-mono text-xs">
            ERROR: {error}
          </div>
        )}

        {/* Lands Grid */}
        {lands.length === 0 && !error ? (
          <div className="border-2 border-black p-12 text-center">
            <p className="font-mono text-sm text-gray-500">NO LANDS FOUND</p>
            <p className="font-mono text-xs text-gray-400 mt-2">
              Deploy a land via the SlotsHub contract to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {lands.map((land: any) => {
              const landSlots = slotsByLand.get(land.id) || [];
              const occupied = landSlots.filter(
                (s: any) => s.occupant && s.occupant !== "0x0000000000000000000000000000000000000000"
              );

              return (
                <Link
                  key={land.id}
                  href={`/slots/${land.id}`}
                  className="block border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="border-b-2 border-black bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-gray-500">LAND</span>
                      <h2 className="font-black text-lg tracking-tight">{shorten(land.id)}</h2>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-gray-500">OWNER</div>
                      <div>{shorten(land.owner)}</div>
                    </div>
                  </div>

                  {/* Slot Grid */}
                  <div className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {landSlots.map((slot: any) => {
                        const isOccupied = slot.occupant && slot.occupant !== "0x0000000000000000000000000000000000000000";
                        return (
                          <div
                            key={slot.id}
                            className={`w-10 h-10 border-2 border-black flex items-center justify-center font-mono text-xs font-bold ${
                              isOccupied ? "bg-black text-white" : "bg-white text-black"
                            }`}
                            title={`Slot #${slot.slotId} — ${isOccupied ? shorten(slot.occupant) : "VACANT"}`}
                          >
                            {slot.slotId}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                      <div>
                        <span className="text-gray-500">SLOTS</span>
                        <div className="font-bold">{landSlots.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">OCCUPIED</span>
                        <div className="font-bold">{occupied.length}/{landSlots.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">TAX RATE</span>
                        <div className="font-bold">
                          {landSlots[0] ? `${Number(landSlots[0].taxPercentage) / 100}%` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Harberger Explainer */}
        <div className="mt-16">
          <HarbergerExplainer />
        </div>
      </div>
    </div>
  );
}
