"use client";

import { CHAINS } from "@0xslots/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChain } from "@/context/chain";

export function ChainSelector() {
  const { chainId, setChain } = useChain();

  return (
    <Select
      value={chainId.toString()}
      onValueChange={(v) => setChain(Number(v))}
    >
      <SelectTrigger className="w-[200px] border-2 border-black font-mono text-sm font-bold uppercase bg-white cursor-pointer rounded-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="font-mono text-sm rounded-none border-2 border-black">
        {CHAINS.map((chain) => (
          <SelectItem
            key={chain.id}
            value={chain.id.toString()}
            className="font-mono text-sm font-bold uppercase cursor-pointer"
          >
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
