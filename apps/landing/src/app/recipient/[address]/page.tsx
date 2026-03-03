"use client";

import { batchCollectorAbi, batchCollectorAddress } from "@0xslots/contracts";
import Link from "next/link";
import { use } from "react";
import { type Address, formatUnits } from "viem";
import { normalize } from "viem/ens";
import {
  useAccount,
  useEnsAvatar,
  useEnsName,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia, mainnet } from "wagmi/chains";
import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { useChain } from "@/context/chain";
import { type SlotOnChain, useSlotsOnChain } from "@/hooks/use-slot-onchain";
import { useV3SlotsByRecipient } from "@/hooks/use-v3";
import { formatBalance, truncateAddress } from "@/utils";

export default function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { explorerUrl } = useChain();

  // Step 1: Get slot addresses from subgraph (discovery only)
  const { data: subgraphSlots, isLoading: subgraphLoading } =
    useV3SlotsByRecipient(address);
  const slotAddresses = subgraphSlots?.map((s) => s.id) ?? [];

  // Step 2: Get live on-chain data for all slots via multicall
  const { data: slots, isLoading: onchainLoading } =
    useSlotsOnChain(slotAddresses);

  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  const { address: connectedAddress } = useAccount();
  const {
    writeContract: write,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const isLoading = subgraphLoading || onchainLoading;
  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();
  const occupied = slots.filter((s) => s.occupant != null);
  const vacant = slots.length - occupied.length;
  const decimals = slots[0]?.currencyDecimals ?? 6;
  const symbol = slots[0]?.currencySymbol ?? "USDC";
  const totalTaxOwed = slots.reduce((sum, s) => sum + s.taxOwed, 0n);
  const totalDeposit = slots.reduce((sum, s) => sum + s.deposit, 0n);

  console.log({ slots });

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
                  <Link
                    href="/explorer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Explorer
                  </Link>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Slots", value: slots.length.toString() },
            { label: "Occupied", value: occupied.length.toString() },
            { label: "Vacant", value: vacant.toString() },
            {
              label: "Pending Tax",
              value: `${formatBalance(totalTaxOwed, decimals)} ${symbol}`,
            },
            {
              label: "Total Deposit",
              value: `${formatBalance(totalDeposit, decimals)} ${symbol}`,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Collect All */}
        {isOwner && occupied.length > 0 && (
          <div className="mb-6">
            <Button
              className="w-full"
              disabled={isPending || isConfirming}
              onClick={() => {
                const addrs = occupied.map((s) => s.id as Address);
                if (addrs.length === 0) return;
                write({
                  address: batchCollectorAddress[baseSepolia.id] as Address,
                  abi: batchCollectorAbi,
                  functionName: "collectAll",
                  args: [addrs],
                });
              }}
            >
              {isPending || isConfirming
                ? "Collecting..."
                : `Collect All Tax (${occupied.length} slots)`}
            </Button>
            {isSuccess && (
              <p className="text-sm text-green-600 text-center mt-2">
                Tax collected from all slots
              </p>
            )}
            {(writeError || receiptError) && (
              <p className="text-sm text-destructive text-center mt-2">
                {(writeError || receiptError)?.message?.split("\n")[0] ??
                  "Transaction failed"}
              </p>
            )}
          </div>
        )}

        {/* Slots Table */}
        <div className="rounded-lg border">
          <div className="bg-muted/50 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Slots</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center animate-pulse">
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No slots found for this recipient
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2">Slot</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Occupant</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Tax</th>
                    <th className="px-4 py-2 text-right">Deposit</th>
                    <th className="px-4 py-2 text-right">Tax Owed</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => (window.location.href = `/slots/${s.id}`)}
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        {truncateAddress(s.id)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            s.insolvent
                              ? "bg-destructive/10 text-destructive"
                              : s.occupant
                                ? "bg-green-500/10 text-green-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.insolvent
                            ? "INSOLVENT"
                            : s.occupant
                              ? "OCCUPIED"
                              : "VACANT"}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {s.occupant ? truncateAddress(s.occupant) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.price, decimals)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(s.taxPercentage) / 100}%
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.deposit, decimals)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.taxOwed, decimals)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
