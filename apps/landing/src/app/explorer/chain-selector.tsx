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
      <SelectTrigger className="w-[200px] text-sm font-medium cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="text-sm">
        {CHAINS.map((chain) => (
          <SelectItem
            key={chain.id}
            value={chain.id.toString()}
            className="text-sm cursor-pointer"
          >
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
