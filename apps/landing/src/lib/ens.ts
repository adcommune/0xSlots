"use client";

import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { useQuery } from "@tanstack/react-query";
import { alchemyRpcUrl } from "@0xslots/config/transports";
import { alchemyKey } from "@/constants";

const rpcUrl = alchemyRpcUrl(mainnet.id, alchemyKey ?? "") ?? undefined;
console.log("[ens] mainnet rpc url:", rpcUrl);
console.log("[ens] alchemy key present:", !!alchemyKey);

/** Standalone mainnet client — not part of wagmi config */
export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

export function useEnsName(address: string | undefined) {
  return useQuery({
    queryKey: ["ens", "name", address],
    queryFn: async () => {
      console.log("[ens] resolving name for:", address);
      try {
        const name = await mainnetClient.getEnsName({ address: address as Address });
        console.log("[ens] resolved name:", address, "→", name);
        return name;
      } catch (err) {
        console.error("[ens] name error:", address, err);
        throw err;
      }
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 60,
  });
}

export function useEnsAvatar(name: string | undefined | null) {
  return useQuery({
    queryKey: ["ens", "avatar", name],
    queryFn: async () => {
      console.log("[ens] resolving avatar for:", name);
      try {
        const avatar = await mainnetClient.getEnsAvatar({ name: normalize(name!) });
        console.log("[ens] resolved avatar:", name, "→", avatar);
        return avatar;
      } catch (err) {
        console.error("[ens] avatar error:", name, err);
        throw err;
      }
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 60,
  });
}

export function useEnsAddress(name: string | undefined) {
  return useQuery({
    queryKey: ["ens", "address", name],
    queryFn: async () => {
      console.log("[ens] resolving address for:", name);
      try {
        const addr = await mainnetClient.getEnsAddress({ name: normalize(name!) });
        console.log("[ens] resolved address:", name, "→", addr);
        return addr;
      } catch (err) {
        console.error("[ens] address error:", name, err);
        throw err;
      }
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 60,
  });
}

export async function resolveEnsAddress(name: string): Promise<Address> {
  console.log("[ens] resolveEnsAddress:", name);
  const resolved = await mainnetClient.getEnsAddress({
    name: normalize(name),
  });
  console.log("[ens] resolveEnsAddress result:", name, "→", resolved);
  if (!resolved) throw new Error(`Could not resolve ${name}`);
  return resolved;
}
