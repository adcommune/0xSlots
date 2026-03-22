"use client";

import blockies from "blockies-ts";
import { useMemo } from "react";

interface BlockieProps {
  address: string;
  size?: number;
  className?: string;
}

export function Blockie({ address, size = 8, className }: BlockieProps) {
  const dataUrl = useMemo(
    () => blockies.create({ seed: address.toLowerCase(), size, scale: 4 }).toDataURL(),
    [address, size],
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt="" className={className} />
  );
}
