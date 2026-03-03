"use client";

import { slotAbi } from "@0xslots/contracts";
import { useState } from "react";
import { type Address, erc20Abi, parseUnits } from "viem";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SlotOnChain } from "@/hooks/use-slot-onchain";
import { formatBalance } from "@/utils";

function toUnits(v: string, decimals: number = 6): bigint {
  try {
    return parseUnits(v || "0", decimals);
  } catch {
    return 0n;
  }
}

export function BuySection({
  slot,
  slotAddress,
  isOccupied,
}: {
  slot: SlotOnChain;
  slotAddress: string;
  isOccupied: boolean;
}) {
  const decimals = slot.currencyDecimals ?? 6;
  const symbol = slot.currencySymbol ?? "USDC";
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const busy = isPending || isConfirming;
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDeposit, setBuyDeposit] = useState("");

  const MONTH = 30n * 24n * 60n * 60n;

  function computeMinDeposit(price: bigint): string {
    if (slot.minDepositSeconds === 0n) return "0";
    const min = (price * slot.taxPercentage * slot.minDepositSeconds) / (MONTH * 10000n);
    return formatBalance(min, decimals);
  }

  const currentPrice = isOccupied ? formatBalance(slot.price, decimals) : "0";
  const defaultPrice = isOccupied ? formatBalance(slot.price, decimals) : "";

  const effectivePrice = buyPrice || defaultPrice;
  const priceForMin = effectivePrice ? toUnits(effectivePrice, decimals) : 0n;
  const minDep = computeMinDeposit(priceForMin);
  const effectiveDeposit = buyDeposit || (minDep !== "0" ? minDep : "");

  const costPrice = isOccupied ? currentPrice : "0";

  function totalApprovalDisplay(): string {
    try {
      const dep = Number.parseFloat(effectiveDeposit || "0");
      const cost = Number.parseFloat(costPrice);
      return (dep + cost).toFixed(2);
    } catch {
      return "0";
    }
  }

  async function handleBuy() {
    const dep = toUnits(effectiveDeposit || "0", decimals);
    const price = isOccupied ? slot.price : 0n;
    const totalApproval = dep + price;

    try {
      await writeContractAsync({
        address: slot.currency as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [slotAddress as Address, totalApproval],
      });
    } catch {
      return;
    }

    writeContract({
      address: slotAddress as Address,
      abi: slotAbi,
      functionName: "buy",
      args: [dep, toUnits(effectivePrice || "0", decimals)],
    });
  }

  return (
    <div className="space-y-3">
      {isOccupied && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Purchase cost</span>
          <span className="font-bold text-foreground">
            {currentPrice} {symbol}
          </span>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Your Price ({symbol})
        </label>
        <Input
          type="text"
          placeholder={defaultPrice || "1.00"}
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          className="font-mono text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Others can force-buy at this price
        </p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Deposit ({symbol})
        </label>
        <Input
          type="text"
          placeholder={minDep !== "0" ? `Min: ${minDep}` : "0.00"}
          value={buyDeposit}
          onChange={(e) => setBuyDeposit(e.target.value)}
          className="font-mono text-xs"
        />
        {minDep !== "0" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Minimum deposit: {minDep} {symbol}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
        {isOccupied && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Purchase</span>
            <span>
              {costPrice} {symbol}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Deposit</span>
          <span>
            {effectiveDeposit || "0"} {symbol}
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
          <span>Total</span>
          <span>
            {totalApprovalDisplay()} {symbol}
          </span>
        </div>
      </div>

      <Button disabled={busy} onClick={handleBuy} className="w-full">
        {busy
          ? "Processing..."
          : isOccupied
            ? `Buy @ ${currentPrice} ${symbol}`
            : "Buy Slot"}
      </Button>

      {isSuccess && (
        <p className="text-sm text-green-600 text-center">
          Transaction confirmed
        </p>
      )}
    </div>
  );
}
