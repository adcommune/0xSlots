"use client";

import { type Address, erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";

export function useCurrencyBalance(currency: Address | undefined) {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: currency,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address && !!currency },
  });
  return balance ?? 0n;
}
