import { createSlotsClient, GetLandQuery, SlotsChain } from "@0xslots/sdk";
import { ConnectButton } from "@/components/connect-button";
import { EnsName } from "@/components/ens-name";
import { LandView } from "@/components/land-view";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
            <a
              href="/explorer"
              className="font-mono text-xs underline mt-4 block"
            >
              ← Back to Explorer
            </a>
          </div>
        </div>
      </div>
    );
  }

  const slots = (land.slots || []).map((s: any) => ({
    id: s.id,
    slotId: s.slotId,
    occupant: s.occupant,
    price: s.price,
    basePrice: s.basePrice,
    taxPercentage: s.taxPercentage,
    active: s.active,
    currency: {
      id: s.currency.id,
      name: s.currency.name ?? null,
      symbol: s.currency.symbol ?? null,
      decimals: s.currency.decimals ?? null,
    },
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/explorer"
                className="font-mono text-[10px] text-gray-500 hover:underline"
              >
                ← Explorer
              </a>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                Land {shorten(land.id)}
              </h1>
              <p className="font-mono text-[10px] flex flex-row gap-1.5 items-center text-gray-400">
                <EnsName address={land.owner} showAvatar /> · {slots.length}{" "}
                slots
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <LandView landId={land.id} landOwner={land.owner} slots={slots} />
      </div>
    </div>
  );
}
