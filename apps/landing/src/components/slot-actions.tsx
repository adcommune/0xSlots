"use client";

import { useState } from "react";
import { type Address, parseUnits } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { arbitrum } from "wagmi/chains";

const CHAIN_ID = arbitrum.id;

const slotsAbi = [
  {
    type: "function",
    name: "buy",
    inputs: [
      { name: "slotId", type: "uint256" },
      { name: "depositAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "selfAssess",
    inputs: [
      { name: "slotId", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "slotId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "slotId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "liquidate",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "collectRange",
    inputs: [
      { name: "fromId", type: "uint256" },
      { name: "toId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

interface SlotActionsProps {
  landAddress: string;
  slotIndex: number;
  isOccupied: boolean;
  occupant: string | null;
  price: string;
  landOwner: string;
  isLandOwnerPanel?: boolean;
  currencyAddress?: string;
  currencyDecimals?: number;
  currencySymbol?: string;
}

export function SlotActions({
  landAddress,
  slotIndex,
  isOccupied,
  occupant,
  price,
  landOwner,
  isLandOwnerPanel,
  currencyAddress,
  currencyDecimals = 6,
  currencySymbol = "USDC",
}: SlotActionsProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [newPrice, setNewPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [collectFrom, setCollectFrom] = useState("0");
  const [collectTo, setCollectTo] = useState("5");

  const isOwner = address?.toLowerCase() === landOwner.toLowerCase();
  const isOccupant = address?.toLowerCase() === occupant?.toLowerCase();
  const wrongChain = chainId !== CHAIN_ID;
  const busy = isPending || isConfirming;

  function toUnits(value: string): bigint {
    try {
      return parseUnits(value || "0", currencyDecimals);
    } catch {
      return 0n;
    }
  }

  async function approveAndCall(amount: bigint, fn: () => void) {
    if (!currencyAddress) return;
    try {
      await writeContractAsync({
        address: currencyAddress as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [landAddress as Address, amount],
      });
    } catch (e) {
      console.error("Approve failed:", e);
      return;
    }
    fn();
  }

  if (!isConnected) {
    return (
      <p className="font-mono text-xs text-gray-400">
        CONNECT WALLET TO INTERACT
      </p>
    );
  }

  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        className="w-full font-mono text-xs bg-red-900 border border-red-500 text-red-300 px-3 py-2 hover:bg-red-800"
      >
        SWITCH TO ARBITRUM
      </button>
    );
  }

  // Land owner panel: collect tax
  if (isLandOwnerPanel) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 items-end">
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">
              FROM SLOT
            </label>
            <input
              type="number"
              value={collectFrom}
              onChange={(e) => setCollectFrom(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-20"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">
              TO SLOT
            </label>
            <input
              type="number"
              value={collectTo}
              onChange={(e) => setCollectTo(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-20"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              writeContract({
                address: landAddress as Address,
                abi: slotsAbi,
                functionName: "collectRange",
                args: [BigInt(collectFrom), BigInt(collectTo)],
              })
            }
            className="border-2 border-black bg-black text-white px-4 py-1 font-mono text-xs uppercase hover:bg-white hover:text-black disabled:opacity-50"
          >
            {busy ? "..." : "COLLECT TAX"}
          </button>
        </div>
        {isSuccess && (
          <p className="font-mono text-xs text-green-600">✓ TX CONFIRMED</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Purchase (if vacant or buying from someone) */}
      {(!isOccupied || !isOccupant) && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-xs text-gray-500 block mb-1">
              DEPOSIT ({currencySymbol})
            </label>
            <input
              type="text"
              placeholder="1.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() => {
              const amt = toUnits(depositAmount);
              const slotPrice = BigInt(price); // price in wei from subgraph
              const total = slotPrice + amt;
              approveAndCall(total, () =>
                writeContract({
                  address: landAddress as Address,
                  abi: slotsAbi,
                  functionName: "buy",
                  args: [BigInt(slotIndex), amt],
                }),
              );
            }}
            className="border-2 border-black bg-black text-white px-3 py-1 font-mono text-xs uppercase hover:bg-white hover:text-black disabled:opacity-50"
          >
            {busy ? "..." : "BUY"}
          </button>
        </div>
      )}

      {/* Self-assess price (if occupant) */}
      {isOccupant && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-xs text-gray-500 block mb-1">
              NEW PRICE ({currencySymbol})
            </label>
            <input
              type="text"
              placeholder="1.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              writeContract({
                address: landAddress as Address,
                abi: slotsAbi,
                functionName: "selfAssess",
                args: [BigInt(slotIndex), toUnits(newPrice)],
              })
            }
            className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
          >
            {busy ? "..." : "SET PRICE"}
          </button>
        </div>
      )}

      {/* Deposit more (if occupant) */}
      {isOccupant && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-xs text-gray-500 block mb-1">
              ADD DEPOSIT ({currencySymbol})
            </label>
            <input
              type="text"
              placeholder="1.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() => {
              const amt = toUnits(depositAmount);
              approveAndCall(amt, () =>
                writeContract({
                  address: landAddress as Address,
                  abi: slotsAbi,
                  functionName: "deposit",
                  args: [BigInt(slotIndex), amt],
                }),
              );
            }}
            className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
          >
            {busy ? "..." : "DEPOSIT"}
          </button>
        </div>
      )}

      {/* Withdraw (if occupant) */}
      {isOccupant && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-xs text-gray-500 block mb-1">
              WITHDRAW ({currencySymbol})
            </label>
            <input
              type="text"
              placeholder="1.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              writeContract({
                address: landAddress as Address,
                abi: slotsAbi,
                functionName: "withdraw",
                args: [BigInt(slotIndex), toUnits(withdrawAmount)],
              })
            }
            className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
          >
            {busy ? "..." : "WITHDRAW"}
          </button>
        </div>
      )}

      {/* Liquidate (anyone, if occupied) */}
      {isOccupied && !isOccupant && (
        <button
          disabled={busy}
          onClick={() =>
            writeContract({
              address: landAddress as Address,
              abi: slotsAbi,
              functionName: "liquidate",
              args: [BigInt(slotIndex)],
            })
          }
          className="border-2 border-red-600 text-red-600 px-3 py-1 font-mono text-xs uppercase hover:bg-red-600 hover:text-white disabled:opacity-50 w-full"
        >
          {busy ? "..." : "LIQUIDATE"}
        </button>
      )}

      {isSuccess && (
        <p className="font-mono text-xs text-green-600">✓ TX CONFIRMED</p>
      )}
    </div>
  );
}
