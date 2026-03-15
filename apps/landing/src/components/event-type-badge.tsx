import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  CircleDollarSign,
  Flame,
  Gavel,
  HandCoins,
  Puzzle,
  Rocket,
  ShoppingCart,
  Tag,
} from "lucide-react";
import type { ReactNode } from "react";

const EVENT_TYPES: Record<string, { color: string; icon: ReactNode }> = {
  Deploy: { color: "bg-sky-500/10 text-sky-600", icon: <Rocket className="size-3" /> },
  Buy: { color: "bg-green-500/10 text-green-600", icon: <ShoppingCart className="size-3" /> },
  Release: { color: "bg-yellow-500/10 text-yellow-600", icon: <ArrowUpFromLine className="size-3" /> },
  Liquidate: { color: "bg-red-500/10 text-red-600", icon: <Flame className="size-3" /> },
  Price: { color: "bg-blue-500/10 text-blue-600", icon: <Tag className="size-3" /> },
  Deposit: { color: "bg-emerald-500/10 text-emerald-600", icon: <ArrowDownToLine className="size-3" /> },
  Withdraw: { color: "bg-orange-500/10 text-orange-600", icon: <CircleDollarSign className="size-3" /> },
  Collect: { color: "bg-purple-500/10 text-purple-600", icon: <HandCoins className="size-3" /> },
  "Tax Proposed": { color: "bg-indigo-500/10 text-indigo-600", icon: <Gavel className="size-3" /> },
  "Module Proposed": { color: "bg-cyan-500/10 text-cyan-600", icon: <Puzzle className="size-3" /> },
  "Update Cancelled": { color: "bg-gray-500/10 text-gray-600", icon: <Ban className="size-3" /> },
};

export function EventTypeBadge({ type }: { type: string }) {
  const style = EVENT_TYPES[type];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${style?.color ?? "bg-muted text-muted-foreground"}`}
    >
      {style?.icon}
      {type}
    </span>
  );
}
