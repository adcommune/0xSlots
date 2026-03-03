"use client";

import { slotAbi } from "@0xslots/contracts";
import { useState } from "react";
import { type Address, erc20Abi, parseUnits } from "viem";
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { V3Slot } from "@/hooks/use-v3";
import { formatBalance, formatPrice } from "@/utils";

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
  slot: V3Slot;
  slotAddress: string;
  isOccupied: boolean;
}) {
  const decimals = slot.currencyDecimals ?? 6;
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
  const [expanded, setExpanded] = useState(false);
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDeposit, setBuyDeposit] = useState("");

  // Read on-chain params for min deposit
  const slotContract = {
    address: slotAddress as Address,
    abi: slotAbi,
  } as const;
  const { data: slotParams } = useReadContracts({
    contracts: [
      { ...slotContract, functionName: "minDepositSeconds" },
      { ...slotContract, functionName: "taxPercentage" },
      { ...slotContract, functionName: "MONTH" },
    ],
  });
  const minDepositSeconds = slotParams?.[0]?.result as bigint | undefined;
  const onChainTax = slotParams?.[1]?.result as bigint | undefined;
  const MONTH = slotParams?.[2]?.result as bigint | undefined;

  function computeMinDeposit(price: bigint): string {
    if (!minDepositSeconds || !onChainTax || !MONTH || minDepositSeconds === 0n)
      return "0";
    const min = (price * onChainTax * minDepositSeconds) / (MONTH * 10000n);
    return formatBalance(min, decimals);
  }

  const currentPrice = isOccupied ? formatPrice(slot.price, slot.currencyDecimals ?? 18) : "0";
  const defaultPrice = isOccupied ? formatPrice(slot.price, slot.currencyDecimals ?? 18) : "";

  const effectivePrice = buyPrice || defaultPrice;
  const priceForMin = effectivePrice ? toUnits(effectivePrice, decimals) : 0n;
  const minDep = computeMinDeposit(priceForMin);
  const effectiveDeposit = buyDeposit || (minDep !== "0" ? minDep : "");

  const label = isOccupied ? "Buy" : "Buy Slot";
  const costPrice = isOccupied ? currentPrice : "0";

  async function handleBuy() {
    const dep = toUnits(effectiveDeposit || "0", decimals);
    const price = isOccupied ? BigInt(slot.price) : 0n;
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
    <div className="space-y-0">
      {/* Main button + dropdown toggle */}
      <div className="flex">
        <Button
          disabled={busy}
          onClick={handleBuy}
          className="flex-1 rounded-r-none"
        >
          {busy ? (
            "Processing..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              {label}
              {isOccupied && (
                <span className="opacity-60">@ {currentPrice} USDC</span>
              )}
            </span>
          )}
        </Button>
        <Button
          variant="default"
          size="sm"
          className="rounded-l-none border-l border-primary-foreground/20 px-2.5"
          onClick={() => {
            if (!expanded) {
              if (!buyPrice) setBuyPrice(defaultPrice);
              if (!buyDeposit && minDep !== "0") setBuyDeposit(minDep);
            }
            setExpanded(!expanded);
          }}
        >
          {expanded ? "▲" : "▼"}
        </Button>
      </div>

      {/* Expandable detail panel */}
      {expanded && (
        <div className="rounded-b-lg border border-t-0 p-3 space-y-2 bg-muted/50">
          {isOccupied && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Purchase cost</span>
              <span className="font-bold text-foreground">{currentPrice} USDC</span>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Your Price (USDC)
            </label>
            <Input
              type="text"
              placeholder={defaultPrice || "1.00"}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[9px] text-muted-foreground mt-0.5">
              Others can force-buy at this price
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Deposit (USDC)
            </label>
            <Input
              type="text"
              placeholder={minDep !== "0" ? `Min: ${minDep}` : "0.00"}
              value={buyDeposit}
              onChange={(e) => setBuyDeposit(e.target.value)}
              className="font-mono text-xs"
            />
            {minDep !== "0" && (
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Minimum deposit: {minDep} USDC
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {isOccupied ? "Purchase" : "Cost"}
              </span>
              <span>{costPrice} USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Deposit</span>
              <span>{effectiveDeposit || "0"} USDC</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-1">
              <span>Total approval</span>
              <span>
                {(() => {
                  try {
                    const dep = parseFloat(effectiveDeposit || "0");
                    const cost = parseFloat(costPrice);
                    return (dep + cost).toFixed(2);
                  } catch {
                    return "0";
                  }
                })()} USDC
              </span>
            </div>
          </div>
        </div>
      )}

      {isSuccess && (
        <p className="text-sm text-green-600 text-center mt-2">
          Transaction confirmed
        </p>
      )}
    </div>
  );
}
