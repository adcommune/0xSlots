"use client";

import { AlertTriangle, Banknote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Address, formatUnits, parseUnits } from "viem";
import { MONTH_SECONDS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSlotAction } from "@/hooks/use-slot-action";
import type { SlotOnChain } from "@/hooks/use-slot-onchain";
import { cn } from "@/lib/utils";
import { formatBalance, formatDuration, normalizeDecimal } from "@/utils";

interface DepositSliderProps {
  slot: SlotOnChain;
  slotAddress: string;
  walletBalance: bigint;
}

export function DepositSlider({
  slot,
  slotAddress,
  walletBalance,
}: DepositSliderProps) {
  const decimals = slot.currencyDecimals ?? 6;
  const symbol = slot.currencySymbol ?? "USDC";
  const { topUp, withdraw, busy, isSuccess } = useSlotAction();

  // On-chain derived values
  const remaining =
    slot.deposit > slot.taxOwed ? slot.deposit - slot.taxOwed : 0n;
  const minDeposit =
    slot.minDepositSeconds === 0n
      ? 0n
      : (slot.price * slot.taxPercentage * slot.minDepositSeconds) /
        (MONTH_SECONDS * 10000n);

  const currentNum = Number(formatUnits(remaining, decimals));
  const minDepositNum = Number(formatUnits(minDeposit, decimals));
  const walletNum = Number(formatUnits(walletBalance, decimals));

  // Input state — represents the desired NEW deposit level
  const [inputValue, setInputValue] = useState(currentNum.toFixed(2));
  const editing = useRef(false);

  // Sync input with on-chain data when not editing
  useEffect(() => {
    if (!editing.current) {
      setInputValue(currentNum.toFixed(2));
    }
  }, [currentNum]);

  const targetDeposit = parseFloat(normalizeDecimal(inputValue)) || 0;
  const delta = targetDeposit - currentNum;
  const isTopUp = delta > 0.005;
  const isWithdraw = delta < -0.005;
  const absDelta = Math.abs(delta);
  const hasAction = isTopUp || isWithdraw;

  // Validation
  const belowMin = minDeposit > 0n && targetDeposit < minDepositNum - 0.005;
  const exceedsWallet = isTopUp && absDelta > walletNum + 0.005;
  const invalid = belowMin || exceedsWallet;

  // Coverage estimate
  const taxPerSecond = (slot.price * slot.taxPercentage) / (MONTH_SECONDS * 10000n);
  const coverageSeconds =
    taxPerSecond > 0n
      ? Number(
          parseUnits(normalizeDecimal(Math.max(targetDeposit, 0).toFixed(decimals)), decimals) /
            taxPerSecond,
        )
      : Infinity;

  async function handleAction() {
    const deltaUnits = parseUnits(normalizeDecimal(absDelta.toFixed(decimals)), decimals);

    if (isTopUp) {
      await topUp(slotAddress as Address, deltaUnits);
    } else if (isWithdraw) {
      await withdraw(slotAddress as Address, deltaUnits);
    }
  }

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Banknote className="size-3" /> Target Deposit ({symbol})
      </label>

      {/* Input */}
      <Input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={(e) => {
          editing.current = true;
          setInputValue(e.target.value);
        }}
        onBlur={() => {
          editing.current = false;
        }}
        placeholder={currentNum.toFixed(2)}
        className={cn(
          "text-xs",
          belowMin && "border-destructive focus-visible:ring-destructive/30",
        )}
      />

      {/* Current balance context */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          Current: {formatBalance(remaining, decimals)} {symbol}
        </span>
        <span>
          Wallet: {walletNum.toFixed(2)} {symbol}
        </span>
      </div>

      {/* Below-minimum alert */}
      {belowMin && (
        <div className="flex items-start gap-1.5 rounded-md border border-destructive/50 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
          <span>
            Deposit must be at least{" "}
            <strong>
              {minDepositNum.toFixed(2)} {symbol}
            </strong>{" "}
            (minimum coverage of{" "}
            {formatDuration(Number(slot.minDepositSeconds))})
          </span>
        </div>
      )}

      {/* Exceeds wallet alert */}
      {exceedsWallet && !belowMin && (
        <div className="flex items-start gap-1.5 rounded-md border border-destructive/50 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
          <span>Insufficient wallet balance</span>
        </div>
      )}

      {/* Delta + coverage summary */}
      {hasAction && !invalid && (
        <div className="rounded-md bg-muted/50 px-2.5 py-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {isTopUp ? "Adding" : "Withdrawing"}
            </span>
            <span
              className={cn(
                "font-bold",
                isTopUp && "text-green-600",
                isWithdraw && "text-orange-600",
              )}
            >
              {isTopUp ? "+" : "-"}
              {absDelta.toFixed(2)} {symbol}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Est. coverage</span>
            <span>
              {coverageSeconds === Infinity
                ? "No tax"
                : `~${formatDuration(coverageSeconds)}`}
            </span>
          </div>
        </div>
      )}

      {/* Action button */}
      <Button
        className="w-full"
        disabled={busy || !hasAction || invalid}
        variant={isWithdraw ? "outline" : "default"}
        onClick={handleAction}
      >
        {busy
          ? "Processing..."
          : isTopUp
            ? `Add ${absDelta.toFixed(2)} ${symbol}`
            : isWithdraw
              ? `Withdraw ${absDelta.toFixed(2)} ${symbol}`
              : "Enter new deposit amount"}
      </Button>

      {isSuccess && (
        <p className="text-xs text-green-600 text-center">
          Transaction confirmed
        </p>
      )}
    </div>
  );
}
