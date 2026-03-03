"use client";

import { type Address } from "viem";
import { useReadContracts } from "wagmi";
import { slotsAbi } from "@0xslots/contracts";
import { formatBalance, formatDuration } from "@/utils";

export function SlotOnChainData({ slotAddress, isOccupied }: { slotAddress: string; isOccupied: boolean }) {
  const contract = { address: slotAddress as Address, abi: slotsAbi } as const;
  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: "deposit" },
      { ...contract, functionName: "taxOwed" },
      { ...contract, functionName: "secondsUntilLiquidation" },
      { ...contract, functionName: "isInsolvent" },
    ],
    query: { enabled: isOccupied },
  });

  if (!isOccupied) return <p className="text-sm text-muted-foreground">Vacant — No escrow data</p>;
  if (isLoading || !data) return <p className="text-sm text-muted-foreground animate-pulse">Loading on-chain data...</p>;

  const deposit = data[0].result as bigint | undefined;
  const owed = data[1].result as bigint | undefined;
  const secsUntilLiq = data[2].result as bigint | undefined;
  const insolvent = data[3].result as boolean | undefined;

  if (deposit === undefined) return null;

  const remaining = deposit > (owed ?? 0n) ? deposit - (owed ?? 0n) : 0n;

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Deposit</span>
        <span>{formatBalance(deposit, 6)} USDC</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax Owed</span>
        <span>{formatBalance(owed ?? 0n, 6)} USDC</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Net Balance</span>
        <span className={`font-bold ${insolvent ? "text-destructive" : ""}`}>
          {formatBalance(remaining, 6)} USDC
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Liquidation In</span>
        <span className={insolvent ? "text-destructive font-bold" : ""}>
          {insolvent ? "NOW" : formatDuration(Number(secsUntilLiq ?? 0n))}
        </span>
      </div>
      {insolvent && (
        <div className="rounded border border-destructive bg-destructive/10 text-destructive text-center py-1 text-xs font-bold">
          INSOLVENT
        </div>
      )}
    </div>
  );
}
