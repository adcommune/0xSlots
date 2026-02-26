"use client";

import type { SlotsChain } from "@0xslots/sdk";
import { useSyncStatus } from "../hooks/use-sync-status";

export function SyncBanner({ chainId }: { chainId: SlotsChain }) {
  const { data } = useSyncStatus(chainId);

  if (!data) return null;

  if (data.hasErrors) {
    return (
      <div className="bg-red-900 text-red-200 font-mono text-[11px] text-center py-1.5 px-4">
        INDEXING ERROR — Subgraph data may be stale (block{" "}
        {data.indexedBlock.toLocaleString()})
      </div>
    );
  }

  if (!data.synced) {
    return (
      <div className="bg-yellow-900 text-yellow-200 font-mono text-[11px] text-center py-1.5 px-4">
        SYNCING — {data.behind.toLocaleString()} blocks behind (
        {data.indexedBlock.toLocaleString()} / {data.chainBlock.toLocaleString()}
        )
      </div>
    );
  }

  return null;
}
