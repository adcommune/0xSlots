import { createSlotsClient, GetLandQuery, SlotsChain } from "@0xslots/sdk";
import { ConnectButton } from "@/components/connect-button";
import { SlotActions } from "@/components/slot-actions";
import { SlotBalance } from "@/components/slot-balance";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatPrice(wei: string, decimals: number = 18): string {
  const value = Number(wei) / 10 ** decimals;
  if (value === 0) return "0";
  if (value < 0.0001) return "<0.0001";
  return value.toFixed(decimals <= 6 ? decimals : 6);
}

export default async function LandPage({
  params,
}: {
  params: Promise<{ landAddress: string }>;
}) {
  const { landAddress } = await params;
  const client = createSlotsClient({ chainId: SlotsChain.ARBITRUM });

  let land: GetLandQuery["land"] = null;
  let error: string | null = null;

  try {
    const result = await client.getLand({ id: landAddress.toLowerCase() });
    land = result.land;
  } catch (e: any) {
    error = e.message || "Failed to fetch land";
  }

  if (error || !land) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="border-2 border-black p-12 text-center">
            <p className="font-mono text-sm">{error || "LAND NOT FOUND"}</p>
            <a href="/slots" className="font-mono text-xs underline mt-4 block">
              ← Back to AdLand
            </a>
          </div>
        </div>
      </div>
    );
  }

  const slots = land.slots || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/slots"
                className="font-mono text-xs text-gray-500 hover:underline"
              >
                ← AdLand
              </a>
              <h1 className="text-2xl font-black tracking-tighter uppercase mt-2">
                Land {shorten(land.id)}
              </h1>
              <p className="font-mono text-xs text-gray-500 mt-1">
                OWNER: {land.owner} · {slots.length} SLOTS
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots
            .sort((a: any, b: any) => Number(a.slotId) - Number(b.slotId))
            .map((slot: any) => {
              const isOccupied =
                slot.occupant &&
                slot.occupant !== "0x0000000000000000000000000000000000000000" &&
                slot.occupant.toLowerCase() !== land.owner.toLowerCase();
              const currency = {
                name: slot.currency.name ?? "Unknown",
                symbol: slot.currency.symbol ?? "???",
                decimals: slot.currency.decimals ?? 18,
              };

              return (
                <div key={slot.id} className="border-2 border-black">
                  {/* Slot Header */}
                  <div
                    className={`px-4 py-3 border-b-2 border-black flex items-center justify-between ${
                      isOccupied ? "bg-black text-white" : "bg-gray-50"
                    }`}
                  >
                    <span className="font-black text-sm">
                      SLOT #{slot.slotId}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-1 border ${
                        isOccupied
                          ? "border-white text-white"
                          : "border-black text-black"
                      }`}
                    >
                      {isOccupied ? "OCCUPIED" : "VACANT"}
                    </span>
                  </div>

                  {/* Slot Details */}
                  <div className="px-4 py-3 space-y-2 font-mono text-xs">
                    {isOccupied && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">OCCUPANT</span>
                        <span className="font-bold">
                          {shorten(slot.occupant)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">CURRENCY</span>
                      <span className="font-bold">
                        {currency.name} ({currency.symbol})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PRICE</span>
                      <span className="font-bold">
                        {formatPrice(slot.price, currency.decimals)}{" "}
                        {currency.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">BASE PRICE</span>
                      <span>
                        {formatPrice(
                          slot.basePrice ?? slot.price,
                          currency.decimals,
                        )}{" "}
                        {currency.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">TAX RATE</span>
                      <span>{Number(slot.taxPercentage) / 100}%/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">STATUS</span>
                      <span>{slot.active ? "ACTIVE" : "INACTIVE"}</span>
                    </div>
                  </div>

                  {/* Balance & Purchase Status */}
                  <div className="px-4 py-3 border-t border-dashed border-gray-300">
                    <SlotBalance
                      landAddress={land.id}
                      slotId={Number(slot.slotId)}
                      isOccupied={isOccupied}
                      currencySymbol={currency.symbol}
                      currencyDecimals={currency.decimals}
                    />
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t-2 border-black bg-gray-50">
                    <SlotActions
                      landAddress={land.id}
                      slotIndex={Number(slot.slotId)}
                      isOccupied={isOccupied}
                      occupant={slot.occupant}
                      price={slot.price}
                      landOwner={land.owner}
                      currencyAddress={slot.currency.id}
                      currencyDecimals={slot.currency.decimals ?? 6}
                      currencySymbol={slot.currency.symbol ?? "???"}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Land Owner Actions */}
        <div className="mt-8 border-2 border-black p-6">
          <h2 className="font-black text-sm uppercase mb-4">
            LAND OWNER ACTIONS
          </h2>
          <SlotActions
            landAddress={land.id}
            slotIndex={-1}
            isOccupied={false}
            occupant={null}
            price="0"
            landOwner={land.owner}
            isLandOwnerPanel
          />
        </div>
      </div>
    </div>
  );
}
