"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { type Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MONTH_SECONDS } from "@/constants";
import { useSlotAction } from "@/hooks/use-slot-action";
import type { SlotOnChain } from "@/hooks/use-slot-onchain";
import { formatBalance, normalizeDecimal, toRawUnits } from "@/utils";

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
  const { buy, busy } = useSlotAction();
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDeposit, setBuyDeposit] = useState("");
  const { address } = useAccount();

  // Use formatUnits for values that feed back into toRawUnits (no K/M/B suffixes).
  // Use formatBalance only for pure display.
  const currentPriceRaw = isOccupied ? formatUnits(slot.price, decimals) : "0";
  const currentPriceDisplay = isOccupied
    ? formatBalance(slot.price, decimals)
    : "0";

  function computeMinDeposit(price: bigint): string {
    if (slot.minDepositSeconds === 0n) return "0";
    const min =
      (price * slot.taxPercentage * slot.minDepositSeconds) /
      (MONTH_SECONDS * 10000n);
    return formatUnits(min, decimals);
  }

  const effectivePrice = buyPrice || currentPriceRaw;
  const priceForMin = effectivePrice
    ? toRawUnits(effectivePrice, decimals)
    : 0n;
  const minDep = computeMinDeposit(priceForMin);
  const effectiveDeposit = buyDeposit || (minDep !== "0" ? minDep : "");

  function totalApprovalDisplay(): string {
    try {
      const dep = Number.parseFloat(normalizeDecimal(effectiveDeposit || "0"));
      const cost = Number.parseFloat(normalizeDecimal(currentPriceRaw));
      return (dep + cost).toFixed(2);
    } catch {
      return "0";
    }
  }

  function handleBuy() {
    if (!address) return;
    const dep = toRawUnits(effectiveDeposit || "0", decimals);
    buy({
      account: address,
      slot: slotAddress as Address,
      depositAmount: dep,
      selfAssessedPrice: toRawUnits(effectivePrice || "0", decimals),
    });
  }

  return (
    <div className="space-y-3">
      {isOccupied && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Purchase cost</span>
          <span className="font-bold text-foreground">
            {currentPriceDisplay} {symbol}
          </span>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Your Price ({symbol})
        </label>
        <Input
          type="text"
          inputMode="decimal"
          placeholder={currentPriceDisplay || "1.00"}
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          className="text-xs"
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
          inputMode="decimal"
          placeholder={
            minDep !== "0"
              ? `Min: ${formatBalance(toRawUnits(minDep, decimals), decimals)}`
              : "0.00"
          }
          value={buyDeposit}
          onChange={(e) => setBuyDeposit(e.target.value)}
          className="text-xs"
        />
        {minDep !== "0" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Minimum deposit:{" "}
            {formatBalance(toRawUnits(minDep, decimals), decimals)} {symbol}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
        {isOccupied && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Purchase</span>
            <span>
              {currentPriceDisplay} {symbol}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Deposit</span>
          <span>
            {effectiveDeposit
              ? formatBalance(toRawUnits(effectiveDeposit, decimals), decimals)
              : "0"}{" "}
            {symbol}
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
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Processing...
          </>
        ) : isOccupied ? (
          `Buy @ ${currentPriceDisplay} ${symbol}`
        ) : (
          "Buy Slot"
        )}
      </Button>
    </div>
  );
}
