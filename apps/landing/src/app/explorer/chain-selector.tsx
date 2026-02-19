"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHAINS = [
  { value: "base-sepolia", label: "Base Sepolia", icon: "🔵" },
  { value: "arbitrum", label: "Arbitrum", icon: "🔷" },
] as const;

export function ChainSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        router.push(`/explorer?chain=${value}`);
      }}
    >
      <SelectTrigger className="w-[200px] border-2 border-black font-mono text-sm font-bold uppercase bg-white cursor-pointer rounded-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="font-mono text-sm rounded-none border-2 border-black">
        {CHAINS.map((chain) => (
          <SelectItem
            key={chain.value}
            value={chain.value}
            className="font-mono text-sm font-bold uppercase cursor-pointer"
          >
            {chain.icon} {chain.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
