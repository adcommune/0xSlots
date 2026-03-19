"use client";

import { useEnsName } from "wagmi";
import { mainnet } from "viem/chains";
import { NavLink } from "@/context/navigation";
import { truncateAddress } from "@/utils";
import type { Address } from "viem";

export function EnsAddress({
  address,
  href,
  onClick,
}: {
  address: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });

  const display = ensName || truncateAddress(address);

  if (href) {
    return (
      <NavLink
        href={href}
        className="text-blue-600 hover:underline"
        onClick={onClick}
        title={address}
      >
        {display}
      </NavLink>
    );
  }

  return <span title={address}>{display}</span>;
}
