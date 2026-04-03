"use client";

import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { useQuery } from "@tanstack/react-query";
import { alchemyRpcUrl } from "@0xslots/config/transports";
import { alchemyKey } from "@/constants";

/** Standalone mainnet client — not part of wagmi config */
export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(alchemyRpcUrl(mainnet.id, alchemyKey ?? "") ?? undefined),
});

export function useEnsName(address: string | undefined) {
  return useQuery({
    queryKey: ["ens", "name", address],
    queryFn: () =>
      mainnetClient.getEnsName({ address: address as Address }),
    enabled: !!address,
    staleTime: 1000 * 60 * 60,
  });
}

export function useEnsAvatar(name: string | undefined | null) {
  return useQuery({
    queryKey: ["ens", "avatar", name],
    queryFn: () =>
      mainnetClient.getEnsAvatar({ name: normalize(name!) }),
    enabled: !!name,
    staleTime: 1000 * 60 * 60,
  });
}

export function useEnsAddress(name: string | undefined) {
  return useQuery({
    queryKey: ["ens", "address", name],
    queryFn: () =>
      mainnetClient.getEnsAddress({ name: normalize(name!) }),
    enabled: !!name,
    staleTime: 1000 * 60 * 60,
  });
}

export async function resolveEnsAddress(name: string): Promise<Address> {
  const resolved = await mainnetClient.getEnsAddress({
    name: normalize(name),
  });
  if (!resolved) throw new Error(`Could not resolve ${name}`);
  return resolved;
}
