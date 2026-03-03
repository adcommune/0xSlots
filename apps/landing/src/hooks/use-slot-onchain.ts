"use client";

import { type Address, erc20Abi } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { slotAbi } from "@0xslots/contracts";

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

function parseSlotInfo(
  slotAddress: string,
  info: readonly [
    string, string, string, boolean, boolean,
    string, bigint, bigint, string, bigint, bigint,
    bigint, bigint, bigint, bigint, boolean,
    boolean, bigint, boolean, string,
  ],
  currencyMeta?: { name?: string; symbol?: string; decimals?: number },
): SlotOnChain {
  return {
    id: slotAddress.toLowerCase(),
    recipient: info[0].toLowerCase(),
    currency: info[1].toLowerCase(),
    manager: info[2].toLowerCase(),
    mutableTax: info[3],
    mutableModule: info[4],
    occupant: info[5] === ZERO_ADDRESS ? null : info[5].toLowerCase(),
    price: info[6],
    taxPercentage: info[7],
    module: info[8].toLowerCase(),
    liquidationBountyBps: info[9],
    minDepositSeconds: info[10],
    deposit: info[11],
    collectedTax: info[12],
    taxOwed: info[13],
    secondsUntilLiquidation: info[14],
    insolvent: info[15],
    hasPendingTax: info[16],
    pendingTaxPercentage: info[17],
    hasPendingModule: info[18],
    pendingModule: info[19].toLowerCase(),
    currencyName: currencyMeta?.name,
    currencySymbol: currencyMeta?.symbol,
    currencyDecimals: currencyMeta?.decimals,
  };
}

/**
 * Fetch a single slot's complete state from on-chain via getSlotInfo() + currency metadata
 */
export function useSlotOnChain(slotAddress: string) {
  const addr = slotAddress as Address;

  const { data: info, isLoading: infoLoading, refetch } = useReadContract({
    address: addr,
    abi: slotAbi,
    functionName: "getSlotInfo",
    query: { refetchInterval: 10_000 },
  });

  // Currency metadata — only fetch when we have info
  const currencyAddr = info ? (info as any)[1] as Address : undefined;
  const { data: currencyMeta, isLoading: metaLoading } = useReadContracts({
    contracts: currencyAddr
      ? [
          { address: currencyAddr, abi: erc20Abi, functionName: "name" },
          { address: currencyAddr, abi: erc20Abi, functionName: "symbol" },
          { address: currencyAddr, abi: erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: !!currencyAddr },
  });

  const isLoading = infoLoading || metaLoading;

  const slot = info
    ? parseSlotInfo(
        slotAddress,
        info as any,
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
  const contracts = slotAddresses.map((addr) => ({
    address: addr as Address,
    abi: slotAbi,
    functionName: "getSlotInfo" as const,
  }));

  const { data: infos, isLoading: infosLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: slotAddresses.length > 0,
      refetchInterval: 15_000,
    },
  });

  // Get unique currencies to fetch metadata
  const currencies = new Set<string>();
  if (infos) {
    for (const r of infos) {
      if (r.result) currencies.add(((r.result as any)[1] as string).toLowerCase());
    }
  }
  const currencyList = Array.from(currencies);

  const { data: metaResults, isLoading: metaLoading } = useReadContracts({
    contracts: currencyList.flatMap((c) => [
      { address: c as Address, abi: erc20Abi, functionName: "name" as const },
      { address: c as Address, abi: erc20Abi, functionName: "symbol" as const },
      { address: c as Address, abi: erc20Abi, functionName: "decimals" as const },
    ]),
    query: { enabled: currencyList.length > 0 },
  });

  // Build currency metadata map
  const currencyMeta: Record<string, { name?: string; symbol?: string; decimals?: number }> = {};
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
        const currency = ((r.result as any)[1] as string).toLowerCase();
        slots.push(parseSlotInfo(slotAddresses[i], r.result as any, currencyMeta[currency]));
      }
    }
  }

  return { data: slots, isLoading, refetch };
}
