"use client";

import { Layers } from "lucide-react";
import { useAccount, useCapabilities, useChainId } from "wagmi";

export function ChainCapabilities() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: capabilities } = useCapabilities();

  if (!isConnected || !capabilities) return null;

  const chainCaps = capabilities[chainId];
  if (!chainCaps) return null;

  const entries = Object.entries(chainCaps);
  if (entries.length === 0) return null;

  const lines = entries.map(([key, val]) => {
    const status =
      typeof val === "object" && val !== null && "status" in val
        ? (val as { status: string }).status
        : "unknown";
    const ok = status === "supported" || status === "ready";
    return `${key}: ${ok ? "supported" : status}`;
  });

  const atomic = chainCaps.atomic;
  const hasAtomic =
    atomic &&
    typeof atomic === "object" &&
    "status" in atomic &&
    ((atomic as { status: string }).status === "supported" ||
      (atomic as { status: string }).status === "ready");

  return (
    <div
      className="flex items-center gap-1 cursor-default"
      title={`Chain ${chainId} capabilities:\n${lines.join("\n")}`}
    >
      <Layers className={`size-3.5 ${hasAtomic ? "text-green-500" : "text-muted-foreground"}`} />
      {hasAtomic && (
        <span className="text-[10px] text-green-500">5792</span>
      )}
    </div>
  );
}
