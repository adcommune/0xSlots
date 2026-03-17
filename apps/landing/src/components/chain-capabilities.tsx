"use client";

import { Layers } from "lucide-react";
import { useAccount, useCapabilities, useChainId } from "wagmi";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChainCapabilities() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: capabilities } = useCapabilities();

  if (!isConnected || !capabilities) return null;

  const chainCaps = capabilities[chainId];
  if (!chainCaps) return null;

  const entries = Object.entries(chainCaps);
  if (entries.length === 0) return null;

  const atomic = chainCaps.atomic;
  const hasAtomic =
    atomic &&
    typeof atomic === "object" &&
    "status" in atomic &&
    ((atomic as { status: string }).status === "supported" ||
      (atomic as { status: string }).status === "ready");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default">
          <Layers className={`size-3.5 ${hasAtomic ? "text-green-500" : "text-muted-foreground"}`} />
          {hasAtomic && (
            <span className="text-[10px] text-green-500">5792</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Wallet capabilities — chain {chainId}</p>
        {entries.map(([key, val]) => {
          const status =
            typeof val === "object" && val !== null && "status" in val
              ? (val as { status: string }).status
              : "unknown";
          const ok = status === "supported" || status === "ready";
          return (
            <p key={key} className="text-muted-foreground">
              {key}: <span className={ok ? "text-green-400" : "text-muted-foreground"}>{ok ? "supported" : status}</span>
            </p>
          );
        })}
      </TooltipContent>
    </Tooltip>
  );
}
