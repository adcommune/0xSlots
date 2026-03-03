"use client";

import { batchCollectorAbi, batchCollectorAddress } from "@0xslots/contracts";
import { use } from "react";
import type { Address } from "viem";
import { baseSepolia, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import {
  useAccount,
  useEnsAvatar,
  useEnsName,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { useChain } from "@/context/chain";
import { useV3SlotsByRecipient } from "@/hooks/use-v3";
import { formatPrice, truncateAddress } from "@/utils";

import { RecipientSlotsTable } from "./components/slots-table";

export default function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { explorerUrl } = useChain();
  const { data: slots, isLoading } = useV3SlotsByRecipient(address);
  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  const { address: connectedAddress } = useAccount();
  const { writeContract: write, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();
  const occupied = slots?.filter((s) => !s.isVacant).length ?? 0;
  const vacant = (slots?.length ?? 0) - occupied;
  const totalCollected =
    slots?.reduce((sum, s) => sum + BigInt(s.collectedTax), 0n) ?? 0n;
  const occupiedSlots =
    slots?.filter((s) => !s.isVacant).map((s) => s.id as Address) ?? [];
  console.log({ occupiedSlots });
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {ensAvatar && (
                <img
                  src={ensAvatar}
                  alt={ensName ?? address}
                  className="w-12 h-12 rounded-full border"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href="/explorer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Explorer
                  </a>
                </div>
                {ensName ? (
                  <h1 className="text-xl font-bold tracking-tight leading-tight">
                    {ensName}
                  </h1>
                ) : (
                  <h1 className="text-xl font-bold tracking-tight leading-tight">
                    Recipient
                  </h1>
                )}
                <a
                  href={`${explorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {truncateAddress(address)}
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
            <div key={stat.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Collect All */}
        {isOwner && occupied > 0 && (
          <div className="mb-6">
            <Button
              className="w-full"
              disabled={isPending || isConfirming}
              onClick={() => {
                const occupiedSlots =
                  slots
                    ?.filter((s) => !s.isVacant)
                    .map((s) => s.id as Address) ?? [];
                if (occupiedSlots.length === 0) return;
                write({
                  address: batchCollectorAddress[baseSepolia.id] as Address,
                  abi: batchCollectorAbi,
                  functionName: "collectAll",
                  args: [occupiedSlots],
                });
              }}
            >
              {isPending || isConfirming
                ? "Collecting..."
                : `Collect All Tax (${occupied} slots)`}
            </Button>
            {isSuccess && (
              <p className="text-sm text-green-600 text-center mt-2">
                Tax collected from all slots
              </p>
            )}
          </div>
        )}

        <RecipientSlotsTable slots={slots} isLoading={isLoading} />
      </div>
    </div>
  );
}
