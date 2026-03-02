"use client";

import { type Address, erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { formatBalance } from "@/utils";

export function UserCurrencyBalance({ currency }: { currency: Address }) {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });
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
    <div className="px-4 py-2 border-b border-gray-200 flex justify-between font-mono text-xs">
      <span className="text-gray-500">Your {symbol ?? "Token"} Balance</span>
      <span className="font-bold">
        {balance !== undefined && decimals !== undefined
          ? formatBalance(balance, decimals)
          : "—"}
      </span>
    </div>
  );
}
