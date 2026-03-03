"use client";

import { useQuery } from "@tanstack/react-query";
import { useBlockNumber } from "wagmi";
import { createSlotsClient, SlotsChain } from "@0xslots/sdk";

const client = createSlotsClient({ chainId: SlotsChain.BASE_SEPOLIA });

function useSubgraphMeta() {
  return useQuery({
    queryKey: ["subgraph-meta"],
    queryFn: async () => {
      const res = await client.getMeta();
      return res._meta;
    },
    refetchInterval: 10_000,
  });
}

export function SubgraphStatus() {
  const { data: meta, isError } = useSubgraphMeta();
  const { data: chainBlock } = useBlockNumber({ watch: true });

  if (isError || meta?.hasIndexingErrors) {
    return (
      <div className="flex items-center gap-1.5" title="Subgraph error">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[10px] text-red-500 font-mono">ERR</span>
      </div>
    );
  }

  if (!meta || !chainBlock) {
    return (
      <div className="flex items-center gap-1.5" title="Loading subgraph status...">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/30" />
        </span>
      </div>
    );
  }

  const subgraphBlock = BigInt(meta.block.number);
  const behind = Number(chainBlock - subgraphBlock);

  // Color: green (0-5), yellow-green (6-20), orange (21-100), red (100+)
  let color: string;
  let label: string;
  if (behind <= 5) {
    color = "bg-green-500";
    label = "synced";
  } else if (behind <= 20) {
    color = "bg-yellow-500";
    label = `${behind} behind`;
  } else if (behind <= 100) {
    color = "bg-orange-500";
    label = `${behind} behind`;
  } else {
    color = "bg-red-500";
    label = `${behind} behind`;
  }

  return (
    <div
      className="flex items-center gap-1.5 cursor-default"
      title={`Subgraph: block ${meta.block.number} / chain: block ${chainBlock.toString()} (${behind} blocks behind)`}
    >
      <span className="relative flex h-2 w-2">
        {behind <= 5 && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
      </span>
      {behind > 5 && (
        <span className={`text-[10px] font-mono ${behind > 100 ? "text-red-500" : behind > 20 ? "text-orange-500" : "text-yellow-500"}`}>
          {label}
        </span>
      )}
    </div>
  );
}
