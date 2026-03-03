"use client";

import { slotAbi } from "@0xslots/contracts";
import { type Address, erc20Abi } from "viem";
import { useReadContract, useReadContracts, useBlockNumber } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type SlotOnChain = {
  // Identity
  id: string;
  recipient: string;
  currency: string;
  manager: string;
  mutableTax: boolean;
  mutableModule: boolean;
  // State
  occupant: string | null;
  price: bigint;
  taxPercentage: bigint;
  module: string;
  liquidationBountyBps: bigint;
  minDepositSeconds: bigint;
  // Financials
  deposit: bigint;
  collectedTax: bigint;
  taxOwed: bigint;
  secondsUntilLiquidation: bigint;
  insolvent: boolean;
  // Pending
  hasPendingTax: boolean;
  pendingTaxPercentage: bigint;
  hasPendingModule: boolean;
  pendingModule: string;
  // Currency metadata
  currencyName?: string;
  currencySymbol?: string;
  currencyDecimals?: number;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type SlotInfoResult = {
  recipient: string;
  currency: string;
  manager: string;
  mutableTax: boolean;
  mutableModule: boolean;
  occupant: string;
  price: bigint;
  taxPercentage: bigint;
  module: string;
  liquidationBountyBps: bigint;
  minDepositSeconds: bigint;
  deposit: bigint;
  collectedTax: bigint;
  taxOwed: bigint;
  secondsUntilLiquidation: bigint;
  insolvent: boolean;
  hasPendingTax: boolean;
  pendingTaxPercentage: bigint;
  hasPendingModule: boolean;
  pendingModule: string;
};

function parseSlotInfo(
  slotAddress: string,
  info: SlotInfoResult,
  currencyMeta?: { name?: string; symbol?: string; decimals?: number },
): SlotOnChain {
  return {
    id: slotAddress.toLowerCase(),
    recipient: info.recipient.toLowerCase(),
    currency: info.currency.toLowerCase(),
    manager: info.manager.toLowerCase(),
    mutableTax: info.mutableTax,
    mutableModule: info.mutableModule,
    occupant:
      info.occupant === ZERO_ADDRESS ? null : info.occupant.toLowerCase(),
    price: info.price,
    taxPercentage: info.taxPercentage,
    module: info.module.toLowerCase(),
    liquidationBountyBps: info.liquidationBountyBps,
    minDepositSeconds: info.minDepositSeconds,
    deposit: info.deposit,
    collectedTax: info.collectedTax,
    taxOwed: info.taxOwed,
    secondsUntilLiquidation: info.secondsUntilLiquidation,
    insolvent: info.insolvent,
    hasPendingTax: info.hasPendingTax,
    pendingTaxPercentage: info.pendingTaxPercentage,
    hasPendingModule: info.hasPendingModule,
    pendingModule: info.pendingModule.toLowerCase(),
    currencyName: currencyMeta?.name,
    currencySymbol: currencyMeta?.symbol,
    currencyDecimals: currencyMeta?.decimals,
  };
}

/**
 * Invalidate all contract reads on every new block — ensures fresh data after txs
 */
function useInvalidateOnBlock() {
  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
    }
  }, [blockNumber, queryClient]);
}

/**
 * Fetch a single slot's complete state from on-chain via getSlotInfo() + currency metadata
 */
export function useSlotOnChain(slotAddress: string) {
  useInvalidateOnBlock();
  const addr = slotAddress as Address;

  const {
    data: info,
    isLoading: infoLoading,
    refetch,
  } = useReadContract({
    address: addr,
    abi: slotAbi,
    functionName: "getSlotInfo",
    query: { gcTime: 0, staleTime: 0, refetchOnMount: "always" },
  });

  // Currency metadata — only fetch when we have info (static, can cache)
  const currencyAddr = info
    ? ((info as SlotInfoResult).currency as Address)
    : undefined;
  const { data: currencyMeta, isLoading: metaLoading } = useReadContracts({
    contracts: currencyAddr
      ? [
          { address: currencyAddr, abi: erc20Abi, functionName: "name" },
          { address: currencyAddr, abi: erc20Abi, functionName: "symbol" },
          { address: currencyAddr, abi: erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: !!currencyAddr, staleTime: Infinity },
  });

  const isLoading = infoLoading || metaLoading;

  const slot = info
    ? parseSlotInfo(
        slotAddress,
        info as SlotInfoResult,
        currencyMeta
          ? {
              name: currencyMeta[0]?.result as string | undefined,
              symbol: currencyMeta[1]?.result as string | undefined,
              decimals: currencyMeta[2]?.result as number | undefined,
            }
          : undefined,
      )
    : null;

  return { data: slot, isLoading, refetch };
}

/**
 * Fetch multiple slots' state via multicall getSlotInfo()
 * Used for recipient page — slot addresses from subgraph, data from RPC
 */
export function useSlotsOnChain(slotAddresses: string[]) {
  useInvalidateOnBlock();
  const contracts = slotAddresses.map((addr) => ({
    address: addr as Address,
    abi: slotAbi,
    functionName: "getSlotInfo" as const,
  }));

  const {
    data: infos,
    isLoading: infosLoading,
    refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: slotAddresses.length > 0,
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: "always",
    },
  });

  // Get unique currencies to fetch metadata
  const currencies = new Set<string>();
  if (infos) {
    for (const r of infos) {
      if (r.result)
        currencies.add(
          (r.result as SlotInfoResult).currency.toLowerCase(),
        );
    }
  }
  const currencyList = Array.from(currencies);

  const { data: metaResults, isLoading: metaLoading } = useReadContracts({
    contracts: currencyList.flatMap((c) => [
      { address: c as Address, abi: erc20Abi, functionName: "name" as const },
      { address: c as Address, abi: erc20Abi, functionName: "symbol" as const },
      {
        address: c as Address,
        abi: erc20Abi,
        functionName: "decimals" as const,
      },
    ]),
    query: { enabled: currencyList.length > 0 },
  });

  // Build currency metadata map
  const currencyMeta: Record<
    string,
    { name?: string; symbol?: string; decimals?: number }
  > = {};
  if (metaResults) {
    currencyList.forEach((c, i) => {
      currencyMeta[c] = {
        name: metaResults[i * 3]?.result as string | undefined,
        symbol: metaResults[i * 3 + 1]?.result as string | undefined,
        decimals: metaResults[i * 3 + 2]?.result as number | undefined,
      };
    });
  }

  const isLoading = infosLoading || metaLoading;

  const slots: SlotOnChain[] = [];
  if (infos) {
    for (let i = 0; i < infos.length; i++) {
      const r = infos[i];
      if (r.result) {
        const result = r.result as SlotInfoResult;
        const currency = result.currency.toLowerCase();
        slots.push(
          parseSlotInfo(slotAddresses[i], result, currencyMeta[currency]),
        );
      }
    }
  }

  return { data: slots, isLoading, refetch };
}
