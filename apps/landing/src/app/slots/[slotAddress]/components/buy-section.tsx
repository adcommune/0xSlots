"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { type Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MONTH_SECONDS } from "@/constants";
import {
  formatDuration,
  useSecondsUntilEffective,
} from "@/hooks/use-effective-occupancy";
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
  const { buy, selfAssess, busy } = useSlotAction();
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDeposit, setBuyDeposit] = useState("");
  const { address } = useAccount();

  const isOccupant =
    !!address &&
    !!slot.occupant &&
    slot.occupant.toLowerCase() === address.toLowerCase();

  // Only a buy that takes the slot FROM someone is scheduled — claiming a
  // vacant slot is taken immediately however long the epoch is.
  const isScheduledBuy = isOccupied && Number(slot.epochSeconds) > 0;
  const secondsUntilEffective = useSecondsUntilEffective(slot.epochSeconds);

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

  function handleSelfAssess() {
    if (!address || !buyPrice) return;
    selfAssess(slotAddress as Address, toRawUnits(buyPrice, decimals));
  }

  // ── Self-assess view (connected wallet is the current occupant) ──────────
  if (isOccupant) {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            New Price ({symbol})
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
            Current: {currentPriceDisplay} {symbol}
          </p>
        </div>
        <Button
          disabled={busy || !buyPrice}
          onClick={handleSelfAssess}
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" /> Processing...
            </>
          ) : (
            "Update Price"
          )}
        </Button>
      </div>
    );
  }

  // ── Buy view ─────────────────────────────────────────────────────────────
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

      {/* Taking an OCCUPIED epoch slot is scheduled, not immediate. Without
          this the button reads as an instant purchase and the buyer only
          discovers the wait afterwards, from a badge. Claiming a vacant slot
          is immediate whatever the epoch, so say nothing there. */}
      {isScheduledBuy && (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          This slot changes hands on the clock. You take it{" "}
          <span className="font-medium text-foreground">
            in {formatDuration(secondsUntilEffective)}
          </span>
          , — at the next {formatDuration(Number(slot.epochSeconds))} boundary.
          the current occupant holds it and pays its tax until then. Your funds
          are escrowed now and the commit cannot be cancelled, but nobody can
          outbid or displace you in the meantime.
        </p>
      )}

      <Button
        disabled={busy || !address}
        onClick={handleBuy}
        className="w-full"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Processing...
          </>
        ) : isOccupied ? (
          isScheduledBuy ? (
            `Commit @ ${currentPriceDisplay} ${symbol}`
          ) : (
            `Buy @ ${currentPriceDisplay} ${symbol}`
          )
        ) : (
          "Buy Slot"
        )}
      </Button>
    </div>
  );
}
