"use client";

import { type Address, erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { useCurrencyBalance } from "@/hooks/use-currency-balance";
import { formatBalance } from "@/utils";

export function UserCurrencyBalance({ currency }: { currency: Address }) {
  const balance = useCurrencyBalance(currency);
  const { data: symbol } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "symbol",
  });
  const { data: decimals } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "decimals",
  });

  return (
    <div className="px-4 py-2 border-b flex justify-between text-sm">
      <span className="text-muted-foreground">Your {symbol ?? "Token"} Balance</span>
      <span className="font-bold">
        {decimals !== undefined
          ? formatBalance(balance, decimals)
          : "—"}
      </span>
    </div>
  );
}
