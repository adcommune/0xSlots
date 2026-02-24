"use client";

import { useReadContracts } from "wagmi";
import { type Address } from "viem";
import { formatBalance, formatDuration } from "@/utils";

const slotsViewAbi = [
  {
    type: "function",
    name: "getEscrow",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "deposit", type: "uint256" },
          { name: "lastSettled", type: "uint256" },
          { name: "collectedTax", type: "uint256" },
          {
            name: "pendingTaxUpdate",
            type: "tuple",
            components: [
              { name: "newRate", type: "uint256" },
              { name: "proposedAt", type: "uint256" },
              { name: "status", type: "uint8" },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "taxOwed",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "secondsUntilLiquidation",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

interface SlotBalanceProps {
  landAddress: string;
  slotId: number;
  isOccupied: boolean;
  currencySymbol: string;
  currencyDecimals: number;
}

export function SlotBalance({
  landAddress,
  slotId,
  isOccupied,
  currencySymbol,
  currencyDecimals,
}: SlotBalanceProps) {
  const contract = { address: landAddress as Address, abi: slotsViewAbi } as const;

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: "getEscrow", args: [BigInt(slotId)] },
      { ...contract, functionName: "taxOwed", args: [BigInt(slotId)] },
      { ...contract, functionName: "secondsUntilLiquidation", args: [BigInt(slotId)] },
    ],
    query: { enabled: Boolean(isOccupied) },
  });

  if (!isOccupied) {
    return (
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">BALANCE</span>
          <span>—</span>
        </div>
        <div className="border border-green-600 bg-green-50 text-green-800 text-center py-1.5 font-bold">
          AVAILABLE FOR PURCHASE
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">BALANCE</span>
          <span className="animate-pulse">Loading…</span>
        </div>
      </div>
    );
  }

  const escrow = data[0].result;
  const owed = data[1].result;
  const secsUntilLiq = data[2].result;

  if (!escrow || owed === undefined || secsUntilLiq === undefined) {
    return null;
  }

  const deposit = escrow.deposit;
  const remaining = deposit > owed ? deposit - owed : 0n;
  const isInsolvent = owed >= deposit;
  const secsNum = Number(secsUntilLiq);

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">DEPOSIT</span>
        <span>{formatBalance(deposit, currencyDecimals)} {currencySymbol}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">TAX OWED</span>
        <span>{formatBalance(owed, currencyDecimals)} {currencySymbol}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">BALANCE</span>
        <span className={`font-bold ${isInsolvent ? "text-red-600" : ""}`}>
          {formatBalance(remaining, currencyDecimals)} {currencySymbol}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">TIME TO LIQUIDATION</span>
        <span className={isInsolvent ? "text-red-600 font-bold" : ""}>
          {isInsolvent ? "NOW" : formatDuration(secsNum)}
        </span>
      </div>
      {isInsolvent ? (
        <div className="border border-red-600 bg-red-50 text-red-800 text-center py-1.5 font-bold">
          INSOLVENT — CAN BE LIQUIDATED
        </div>
      ) : (
        <div className="border border-blue-600 bg-blue-50 text-blue-800 text-center py-1.5 font-bold">
          CAN BE PURCHASED (HARBERGER)
        </div>
      )}
    </div>
  );
}
