"use client";

import type { Address } from "viem";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { truncateAddress } from "@/utils";

interface EnsNameProps {
  address: string;
  className?: string;
  showAvatar?: boolean;
}

export function EnsName({ address, className, showAvatar }: EnsNameProps) {
  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });

  const { data: avatarUrl } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  const label = ensName ?? truncateAddress(address);

  if (showAvatar) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
        title={address}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-5 h-5 border border-black object-cover"
          />
        ) : (
          <span className="w-5 h-5 border border-black bg-gray-200" />
        )}
        {label}
      </span>
    );
  }

  return (
    <span className={className} title={address}>
      {label}
    </span>
  );
}
