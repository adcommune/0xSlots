"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, type Address } from "viem";
// Import ABI inline to avoid module resolution issues
const slotsAbi = [
  { type: "function", name: "purchaseSlot", inputs: [{ name: "slotId", type: "uint256" }, { name: "depositAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "selfAssess", inputs: [{ name: "slotId", type: "uint256" }, { name: "newPrice", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "deposit", inputs: [{ name: "slotId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdraw", inputs: [{ name: "slotId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "liquidate", inputs: [{ name: "slotId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "collectRange", inputs: [{ name: "fromSlot", type: "uint256" }, { name: "toSlot", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

// USND on Arbitrum
const USND = "0x4ecf61a6c2fab8a047ceb3b3b263b401763e9d49" as Address;

// ERC20 ABI for approve
const erc20Abi = [
  {
    type: "function" as const,
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable" as const,
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
}

export function SlotActions({
  landAddress,
  slotIndex,
  isOccupied,
  occupant,
  price,
  landOwner,
  isLandOwnerPanel,
}: SlotActionsProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [newPrice, setNewPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [collectFrom, setCollectFrom] = useState("0");
  const [collectTo, setCollectTo] = useState("5");

  const isOwner = address?.toLowerCase() === landOwner.toLowerCase();
  const isOccupant = address?.toLowerCase() === occupant?.toLowerCase();
  const busy = isPending || isConfirming;

  if (!isConnected) {
    return (
      <p className="font-mono text-xs text-gray-400">CONNECT WALLET TO INTERACT</p>
    );
  }

  // Land owner panel: collect tax
  if (isLandOwnerPanel) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 items-end">
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">FROM SLOT</label>
            <input
              type="number"
              value={collectFrom}
              onChange={(e) => setCollectFrom(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-20"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-gray-500 block mb-1">TO SLOT</label>
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
        {isSuccess && <p className="font-mono text-xs text-green-600">✓ TX CONFIRMED</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Purchase (if vacant or buying from someone) */}
      {(!isOccupied || !isOccupant) && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-xs text-gray-500 block mb-1">DEPOSIT AMT</label>
            <input
              type="text"
              placeholder="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              writeContract({
                address: landAddress as Address,
                abi: slotsAbi,
                functionName: "purchaseSlot",
                args: [BigInt(slotIndex), parseEther(depositAmount || "0")],
              })
            }
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
            <label className="font-mono text-xs text-gray-500 block mb-1">NEW PRICE</label>
            <input
              type="text"
              placeholder="0.01"
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
                args: [BigInt(slotIndex), parseEther(newPrice || "0")],
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
            <label className="font-mono text-xs text-gray-500 block mb-1">ADD DEPOSIT</label>
            <input
              type="text"
              placeholder="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="border-2 border-black px-2 py-1 font-mono text-xs w-full"
            />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              writeContract({
                address: landAddress as Address,
                abi: slotsAbi,
                functionName: "deposit",
                args: [BigInt(slotIndex), parseEther(depositAmount || "0")],
              })
            }
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
            <label className="font-mono text-xs text-gray-500 block mb-1">WITHDRAW AMT</label>
            <input
              type="text"
              placeholder="0.01"
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
                args: [BigInt(slotIndex), parseEther(withdrawAmount || "0")],
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

      {isSuccess && <p className="font-mono text-xs text-green-600">✓ TX CONFIRMED</p>}
    </div>
  );
}
