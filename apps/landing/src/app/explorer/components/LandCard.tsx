"use client";

import Link from "next/link";
import type { SlotsChain } from "@0xslots/sdk";
import { useLand } from "../hooks";
import { SlotCell } from "./SlotCell";
import { truncateAddress } from "@/utils";
import { EnsName } from "@/components/ens-name";

interface LandCardProps {
  chainId: SlotsChain;
  landId: string;
  owner: string;
}

export function LandCard({ chainId, landId, owner }: LandCardProps) {
  const { data: land, isLoading } = useLand(chainId, landId);

  const slots = land?.slots ?? [];
  const landOwner = land?.owner ?? owner;
  const occupied = slots.filter(
    (s) =>
      s.occupant &&
      s.occupant !== "0x0000000000000000000000000000000000000000" &&
      s.occupant.toLowerCase() !== landOwner.toLowerCase(),
  );

  return (
    <Link
      href={`/slots/${landId}`}
      className="flex items-center gap-4 px-4 py-2 hover:bg-gray-50 transition-colors font-mono text-xs"
    >
      <span className="w-40 truncate font-bold">
        <EnsName address={owner} showAvatar />
      </span>
      <span className="w-28 text-gray-500 truncate">
        {truncateAddress(landId)}
      </span>
      {isLoading ? (
        <span className="flex-1 h-3 bg-gray-100 animate-pulse" />
      ) : (
        <>
          <span className="w-20 text-center">{slots.length}</span>
          <span className="w-24 text-center">
            {occupied.length}/{slots.length}
          </span>
          <span className="w-16 text-center">
            {slots[0] ? `${Number(slots[0].taxPercentage) / 100}%` : "—"}
          </span>
          <span className="flex-1 flex justify-end gap-0.5 flex-wrap">
            {slots.map((slot) => (
              <SlotCell
                key={slot.id}
                slotId={slot.slotId}
                occupant={slot.occupant}
                landOwner={landOwner}
              />
            ))}
          </span>
        </>
      )}
    </Link>
  );
}
