"use client";

import { useRouter } from "next/navigation";

const CHAINS = [
  { value: "base-sepolia", label: "Base Sepolia", icon: "🔵" },
  { value: "arbitrum", label: "Arbitrum", icon: "🔷" },
] as const;

export function ChainSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => {
        router.push(`/explorer?chain=${e.target.value}`);
      }}
      className="border-2 border-black px-4 py-2 font-mono text-sm font-bold uppercase bg-white cursor-pointer hover:bg-gray-50 focus:outline-none"
    >
      {CHAINS.map((chain) => (
        <option key={chain.value} value={chain.value}>
          {chain.icon} {chain.label}
        </option>
      ))}
    </select>
  );
}
