"use client";

import { Layers } from "lucide-react";
import { useAccount, useCapabilities } from "wagmi";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChain } from "@/context/chain";

/**
 * Check if a capability value is supported.
 * Supports both formats:
 *   - { status: "supported" | "ready" }
 *   - { supported: true }
 */
function isSupported(val: unknown): boolean {
  if (typeof val !== "object" || val === null) return false;
  if ("status" in val) {
    const s = (val as { status: string }).status;
    return s === "supported" || s === "ready";
  }
  if ("supported" in val) {
    return (val as { supported: boolean }).supported === true;
  }
  return false;
}

export function ChainCapabilities() {
  const { isConnected } = useAccount();
  const { chainId } = useChain();
  const { data: capabilities } = useCapabilities();

  if (!isConnected || !capabilities) return null;

  const chainCaps = capabilities[chainId];
  if (!chainCaps) return null;

  const entries = Object.entries(chainCaps);
  if (entries.length === 0) return null;

  const supportedCount = entries.filter(([, v]) => isSupported(v)).length;
  const hasAtomic =
    isSupported(chainCaps.atomic) || isSupported(chainCaps.atomicBatch);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default">
          <Layers
            className={`size-3.5 ${hasAtomic ? "text-green-500" : "text-muted-foreground"}`}
          />
          {supportedCount > 0 && (
            <span
              className={`text-[10px] ${hasAtomic ? "text-green-500" : "text-muted-foreground"}`}
            >
              {supportedCount}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Wallet capabilities — chain {chainId}</p>
        {entries.map(([key, val]) => {
          const ok = isSupported(val);
          return (
            <p key={key} className="text-muted-foreground">
              {key}:{" "}
              <span className={ok ? "text-green-400" : "text-muted-foreground"}>
                {ok ? "supported" : "unsupported"}
              </span>
            </p>
          );
        })}
      </TooltipContent>
    </Tooltip>
  );
}
