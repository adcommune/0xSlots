"use client";

import { useSplitMetadata } from "@0xsplits/splits-sdk-react";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress } from "@/utils";

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
];

export function SplitRecipientsBar({
  chainId,
  splitAddress,
}: {
  chainId: number;
  splitAddress: string;
}) {
  const { data: splitMetadata, isLoading } = useSplitMetadata(
    chainId,
    splitAddress,
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        <span className="text-[10px]">Loading split...</span>
      </div>
    );
  }

  if (!splitMetadata?.recipients?.length) return null;

  const recipients = splitMetadata.recipients;

  return (
    <div className="space-y-1.5">
      {/* Segmented progress bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {recipients.map((r, i) => (
          <Tooltip key={r.recipient.address}>
            <TooltipTrigger asChild>
              <div
                className={`${COLORS[i % COLORS.length]} transition-all first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${r.percentAllocation}%` }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {truncateAddress(r.recipient.address)} — {r.percentAllocation}%
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {recipients.map((r, i) => (
          <span
            key={r.recipient.address}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <span
              className={`inline-block size-1.5 rounded-full ${COLORS[i % COLORS.length]}`}
            />
            {truncateAddress(r.recipient.address)}{" "}
            <span className="font-medium text-foreground">
              {r.percentAllocation}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
