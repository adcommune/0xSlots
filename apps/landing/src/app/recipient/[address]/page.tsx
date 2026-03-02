"use client";

import { use } from "react";
import type { Address } from "viem";
import { useEnsName, useEnsAvatar } from "wagmi";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { ConnectButton } from "@/components/connect-button";
import { useV3SlotsByRecipient } from "@/hooks/use-v3";
import { formatPrice } from "@/utils";

import { RecipientSlotsTable } from "./components/slots-table";

const EXPLORER = "https://sepolia.basescan.org";

export default function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { data: slots, isLoading } = useV3SlotsByRecipient(address);
  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  const occupied = slots?.filter((s) => !s.isVacant).length ?? 0;
  const vacant = (slots?.length ?? 0) - occupied;
  const totalCollected = slots?.reduce((sum, s) => sum + BigInt(s.collectedTax), 0n) ?? 0n;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {ensAvatar && (
                <img
                  src={ensAvatar}
                  alt={ensName ?? address}
                  className="w-12 h-12 border-2 border-black"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href="/explorer"
                    className="font-mono text-[10px] text-gray-400 hover:text-black"
                  >
                    ← EXPLORER
                  </a>
                </div>
                {ensName ? (
                  <h1 className="text-xl font-black tracking-tighter leading-tight">
                    {ensName}
                  </h1>
                ) : (
                  <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                    Recipient
                  </h1>
                )}
                <a
                  href={`${EXPLORER}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {address}
                </a>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Slots", value: slots?.length ?? 0 },
            { label: "Occupied", value: occupied },
            { label: "Vacant", value: vacant },
            {
              label: "Total Tax Collected",
              value: formatPrice(totalCollected.toString(), 6),
            },
          ].map((stat) => (
            <div key={stat.label} className="border-2 border-black p-3">
              <p className="font-mono text-[10px] uppercase text-gray-500">
                {stat.label}
              </p>
              <p className="font-mono text-lg font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <RecipientSlotsTable slots={slots} isLoading={isLoading} />
      </div>
    </div>
  );
}
