"use client";

import Link from "next/link";
import { use, useState } from "react";
import { type Address, erc20Abi, parseUnits } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { slotsAbi } from "@0xslots/contracts";
import { ConnectButton } from "@/components/connect-button";
import { useV3Slot, useV3SlotEvents } from "@/hooks/use-v3";
import { truncateAddress, formatPrice } from "@/utils";

import { SlotOnChainData } from "./components/on-chain-data";
import { UserCurrencyBalance } from "./components/user-balance";
import { SlotEventHistory } from "./components/event-history";

const CHAIN_ID = baseSepolia.id;
const EXPLORER = "https://sepolia.basescan.org";

export default function SlotPage({ params }: { params: Promise<{ slotAddress: string }> }) {
  const { slotAddress } = use(params);
  const { data: slot, isLoading } = useV3Slot(slotAddress);
  const { data: events } = useV3SlotEvents(slotAddress);
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [depositAmount, setDepositAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDeposit, setBuyDeposit] = useState("");

  const wrongChain = chainId !== CHAIN_ID;
  const busy = isPending || isConfirming;

  function toUnits(v: string): bigint {
    try { return parseUnits(v || "0", 6); } catch { return 0n; }
  }

  async function approveAndCall(amount: bigint, fn: () => void) {
    if (!slot) return;
    try {
      await writeContractAsync({
        address: slot.currency as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [slotAddress as Address, amount],
      });
    } catch { return; }
    fn();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="border-2 border-black p-12 text-center animate-pulse">
            <p className="font-mono text-sm">Loading slot...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="border-2 border-black p-12 text-center">
            <p className="font-mono text-sm">SLOT NOT FOUND</p>
            <Link href="/explorer" className="font-mono text-xs underline mt-4 block">← Back to Explorer</Link>
          </div>
        </div>
      </div>
    );
  }

  const isOccupied = !slot.isVacant;
  const isOccupant = address?.toLowerCase() === slot.occupant?.toLowerCase();
  const isRecipient = address?.toLowerCase() === slot.recipient.toLowerCase();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/explorer" className="font-mono text-[10px] text-gray-500 hover:underline">← Explorer</Link>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                Slot {truncateAddress(slot.id)}
              </h1>
              <p className="font-mono text-[10px] text-gray-400">
                {isOccupied ? `Occupied by ${truncateAddress(slot.occupant!)}` : "Vacant"} · Base Sepolia
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: Info + Events */}
          <div className="space-y-6">
            {/* Slot Info */}
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Slot Details</h2>
              </div>
              <div className="p-4 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Address</span>
                  <a href={`${EXPLORER}/address/${slot.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{truncateAddress(slot.id)}</a>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Recipient</span><span>{truncateAddress(slot.recipient)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Currency</span><span>{truncateAddress(slot.currency)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Manager</span><span>{truncateAddress(slot.manager)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax Rate</span><span>{Number(slot.taxPercentage) / 100}%/mo</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Liq. Bounty</span><span>{Number(slot.liquidationBountyBps) / 100}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mutable Tax</span><span>{slot.mutableTax ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mutable Module</span><span>{slot.mutableModule ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Module</span><span>{slot.module === "0x0000000000000000000000000000000000000000" ? "None" : truncateAddress(slot.module)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Collected Tax</span><span>{formatPrice(slot.collectedTax, 6)} USDC</span></div>
              </div>
            </div>

            {/* Pending Updates */}
            {(slot.hasPendingTaxUpdate || slot.hasPendingModuleUpdate) && (
              <div className="border-2 border-yellow-500 bg-yellow-50">
                <div className="p-4">
                  <h3 className="font-black text-xs uppercase mb-2 text-yellow-800">Pending Updates</h3>
                  <div className="space-y-1 font-mono text-xs">
                    {slot.hasPendingTaxUpdate && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700">New Tax</span>
                        <span className="font-bold">{Number(slot.pendingTaxPercentage ?? 0) / 100}%/mo</span>
                      </div>
                    )}
                    {slot.hasPendingModuleUpdate && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700">New Module</span>
                        <span className="font-bold">{truncateAddress(slot.pendingModule ?? "")}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-yellow-600 mt-2">Applied on next ownership transition</p>
                  </div>
                </div>
              </div>
            )}

            <SlotEventHistory events={events} />
          </div>

          {/* Right: Actions */}
          <div className="lg:sticky lg:top-6">
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-3">
                <h2 className="text-sm font-bold uppercase tracking-tight">
                  {isOccupied ? `Price: ${formatPrice(slot.price, 6)} USDC` : "Vacant Slot"}
                </h2>
              </div>

              <div className="p-4 border-b border-gray-200">
                <SlotOnChainData slotAddress={slot.id} isOccupied={isOccupied} />
              </div>

              {isConnected && <UserCurrencyBalance currency={slot.currency as Address} />}

              <div className="p-4 space-y-3">
                {!isConnected ? (
                  <p className="font-mono text-xs text-gray-400 text-center py-2">CONNECT WALLET</p>
                ) : wrongChain ? (
                  <button
                    onClick={() => switchChain({ chainId: CHAIN_ID })}
                    className="w-full font-mono text-xs bg-red-900 border-2 border-red-500 text-red-300 px-3 py-2 hover:bg-red-800 uppercase tracking-widest"
                  >
                    Switch to Base Sepolia
                  </button>
                ) : (
                  <>
                    {(slot.isVacant || !isOccupant) && (
                      <div className="space-y-2">
                        <label className="font-mono text-[10px] text-gray-500 block">SELF-ASSESSED PRICE (USDC)</label>
                        <input type="text" placeholder="10.00" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                          className="border-2 border-black px-2 py-1.5 font-mono text-xs w-full" />
                        <label className="font-mono text-[10px] text-gray-500 block">DEPOSIT AMOUNT (USDC)</label>
                        <input type="text" placeholder="5.00" value={buyDeposit} onChange={(e) => setBuyDeposit(e.target.value)}
                          className="border-2 border-black px-2 py-1.5 font-mono text-xs w-full" />
                        <button
                          disabled={busy}
                          onClick={() => {
                            const dep = toUnits(buyDeposit);
                            const price = isOccupied ? BigInt(slot.price) : 0n;
                            approveAndCall(dep + price, () =>
                              writeContract({
                                address: slotAddress as Address,
                                abi: slotsAbi,
                                functionName: "buy",
                                args: [dep, toUnits(buyPrice)],
                              })
                            );
                          }}
                          className="w-full border-4 border-black bg-black text-white px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                        >
                          {busy ? "PROCESSING..." : isOccupied ? "FORCE BUY" : "BUY SLOT"}
                        </button>
                      </div>
                    )}

                    {isOccupant && (
                      <div className="space-y-3">
                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">NEW PRICE (USDC)</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="1.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1" />
                            <button disabled={busy}
                              onClick={() => writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "selfAssess", args: [toUnits(newPrice)] })}
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50">
                              {busy ? "..." : "SET"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">ADD DEPOSIT (USDC)</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="1.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1" />
                            <button disabled={busy}
                              onClick={() => {
                                const amt = toUnits(depositAmount);
                                approveAndCall(amt, () =>
                                  writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "topUp", args: [amt] })
                                );
                              }}
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50">
                              {busy ? "..." : "ADD"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">WITHDRAW (USDC)</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="1.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1" />
                            <button disabled={busy}
                              onClick={() => writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "withdraw", args: [toUnits(withdrawAmount)] })}
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50">
                              {busy ? "..." : "OUT"}
                            </button>
                          </div>
                        </div>

                        <button disabled={busy}
                          onClick={() => writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "release", args: [] })}
                          className="w-full border-2 border-red-600 text-red-600 px-3 py-1.5 font-mono text-xs uppercase hover:bg-red-600 hover:text-white disabled:opacity-50">
                          {busy ? "..." : "RELEASE SLOT"}
                        </button>
                      </div>
                    )}

                    {isOccupied && !isOccupant && (
                      <button disabled={busy}
                        onClick={() => writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "liquidate", args: [] })}
                        className="w-full border-2 border-red-600 text-red-600 px-3 py-1.5 font-mono text-xs uppercase hover:bg-red-600 hover:text-white disabled:opacity-50">
                        {busy ? "..." : "LIQUIDATE"}
                      </button>
                    )}

                    {isRecipient && (
                      <button disabled={busy}
                        onClick={() => writeContract({ address: slotAddress as Address, abi: slotsAbi, functionName: "collect", args: [] })}
                        className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50">
                        {busy ? "..." : "COLLECT TAX"}
                      </button>
                    )}

                    {isSuccess && <p className="font-mono text-xs text-green-600 text-center">✓ TX CONFIRMED</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
