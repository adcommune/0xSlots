"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useSwitchChain} from "wagmi"
import {baseSepolia, arbitrum} from 'viem/chains'

const CHAINS = [
  { value: "base-sepolia", label: "Base Sepolia", icon: "🔵", chainId: baseSepolia.id },
  { value: "arbitrum", label: "Arbitrum", icon: "🔷", chainId: arbitrum.id },
] as const;

export function ChainSelector({ current }: { current: string }) {
  const router = useRouter();
  const { mutate: switchChain } = useSwitchChain()

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        router.push(`/explorer?chain=${value}`);
        // @ts-ignore
        switchChain({chainId: CHAINS.find(c => c.value === value)?.chainId})
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
