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
import { slotAbi } from "@0xslots/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectButton } from "@/components/connect-button";
import { useSlotOnChain } from "@/hooks/use-slot-onchain";
import { useV3SlotActivity } from "@/hooks/use-v3";
import { useChain } from "@/context/chain";
import { truncateAddress, formatBalance, formatDuration, formatBps } from "@/utils";

import { BuySection } from "./components/buy-section";
import { UserCurrencyBalance } from "./components/user-balance";
import { SlotEventHistory, normalizeSlotActivity } from "./components/event-history";

const CHAIN_ID = baseSepolia.id;

export default function SlotPage({ params }: { params: Promise<{ slotAddress: string }> }) {
  const { slotAddress } = use(params);
  const { explorerUrl } = useChain();
  const { data: slot, isLoading } = useSlotOnChain(slotAddress);
  const { data: activityData } = useV3SlotActivity(slotAddress);
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [depositAmount, setDepositAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const wrongChain = chainId !== CHAIN_ID;
  const busy = isPending || isConfirming;
  const decimals = slot?.currencyDecimals ?? 6;
  const symbol = slot?.currencySymbol ?? "USDC";

  function toUnits(v: string): bigint {
    try { return parseUnits(v || "0", decimals); } catch { return 0n; }
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
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border p-12 text-center animate-pulse">
            <p className="text-sm text-muted-foreground">Loading slot...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border p-12 text-center">
            <p className="text-sm">Slot not found</p>
            <Link href="/explorer" className="text-sm text-primary underline mt-4 block">← Back to Explorer</Link>
          </div>
        </div>
      </div>
    );
  }

  const isOccupied = slot.occupant != null;
  const isOccupant = address?.toLowerCase() === slot.occupant?.toLowerCase();
  const isRecipient = address?.toLowerCase() === slot.recipient.toLowerCase();
  const remaining = slot.deposit > slot.taxOwed ? slot.deposit - slot.taxOwed : 0n;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/explorer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Explorer</Link>
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                Slot {truncateAddress(slot.id)}
              </h1>
              <p className="text-xs text-muted-foreground">
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
            {/* Slot Details */}
            <div className="rounded-lg border">
              <div className="bg-muted/50 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Slot Details</h2>
              </div>
              <div className="p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span>
                  <a href={`${explorerUrl}/address/${slot.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">{truncateAddress(slot.id)}</a>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span>
                  <Link href={`/recipient/${slot.recipient}`} className="text-primary hover:underline font-mono text-xs">{truncateAddress(slot.recipient)}</Link>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-mono text-xs">{slot.currencyName ?? truncateAddress(slot.currency)} ({symbol})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Manager</span><span className="font-mono text-xs">{truncateAddress(slot.manager)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax Rate</span><span>{formatBps(slot.taxPercentage.toString())}/mo</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Liq. Bounty</span><span>{formatBps(slot.liquidationBountyBps.toString())}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mutable Tax</span><span>{slot.mutableTax ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mutable Module</span><span>{slot.mutableModule ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Module</span><span className="font-mono text-xs">{slot.module === "0x0000000000000000000000000000000000000000" ? "None" : truncateAddress(slot.module)}</span></div>
              </div>
            </div>

            {/* Pending Updates */}
            {(slot.hasPendingTax || slot.hasPendingModule) && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5">
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
                  <h2 className="text-sm font-semibold text-yellow-600">Pending Updates</h2>
                </div>
                <div className="p-4 space-y-1.5 text-sm">
                  {slot.hasPendingTax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Tax Rate</span>
                      <span>{formatBps(slot.pendingTaxPercentage.toString())}/mo</span>
                    </div>
                  )}
                  {slot.hasPendingModule && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Module</span>
                      <span className="font-mono text-xs">{truncateAddress(slot.pendingModule)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Applied on next ownership transition</p>
                </div>
              </div>
            )}

            <SlotEventHistory events={normalizeSlotActivity(activityData, decimals)} explorerUrl={explorerUrl} />
          </div>

          {/* Right: Actions */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-lg border">
              <div className="bg-muted/50 border-b px-3 py-3">
                <h2 className="text-sm font-semibold">
                  {isOccupied ? `Price: ${formatBalance(slot.price, decimals)} ${symbol}` : "Vacant Slot"}
                </h2>
              </div>

              {/* Live on-chain financials */}
              {isOccupied && (
                <div className="p-4 border-b space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit</span>
                    <span>{formatBalance(slot.deposit, decimals)} {symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Owed</span>
                    <span>{formatBalance(slot.taxOwed, decimals)} {symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Balance</span>
                    <span className={`font-bold ${slot.insolvent ? "text-destructive" : ""}`}>
                      {formatBalance(remaining, decimals)} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidation In</span>
                    <span className={slot.insolvent ? "text-destructive font-bold" : ""}>
                      {slot.insolvent ? "NOW" : formatDuration(Number(slot.secondsUntilLiquidation))}
                    </span>
                  </div>
                  {slot.insolvent && (
                    <div className="rounded border border-destructive bg-destructive/10 text-destructive text-center py-1 text-xs font-bold">
                      INSOLVENT
                    </div>
                  )}
                </div>
              )}

              {!isOccupied && (
                <div className="p-4 border-b">
                  <p className="text-sm text-muted-foreground">Vacant — No escrow data</p>
                </div>
              )}

              {isConnected && <UserCurrencyBalance currency={slot.currency as Address} />}

              <div className="p-4 space-y-3">
                {!isConnected ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Connect wallet to interact</p>
                ) : wrongChain ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => switchChain({ chainId: CHAIN_ID })}
                  >
                    Switch to Base Sepolia
                  </Button>
                ) : (
                  <>
                    {/* Buy / Force Buy */}
                    {(slot.occupant == null || !isOccupant) && (
                      <BuySection
                        slot={slot}
                        slotAddress={slotAddress}
                        isOccupied={isOccupied}
                      />
                    )}

                    {isOccupant && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">New Price ({symbol})</label>
                          <div className="flex gap-2">
                            <Input type="text" placeholder="1.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                              className="font-mono text-xs flex-1" />
                            <Button size="sm" variant="outline" disabled={busy}
                              onClick={() => writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "selfAssess", args: [toUnits(newPrice)] })}>
                              {busy ? "..." : "Set"}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Add Deposit ({symbol})</label>
                          <div className="flex gap-2">
                            <Input type="text" placeholder="1.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                              className="font-mono text-xs flex-1" />
                            <Button size="sm" variant="outline" disabled={busy}
                              onClick={() => {
                                const amt = toUnits(depositAmount);
                                approveAndCall(amt, () =>
                                  writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "topUp", args: [amt] })
                                );
                              }}>
                              {busy ? "..." : "Add"}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Withdraw ({symbol})</label>
                          <div className="flex gap-2">
                            <Input type="text" placeholder="1.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="font-mono text-xs flex-1" />
                            <Button size="sm" variant="outline" disabled={busy}
                              onClick={() => writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "withdraw", args: [toUnits(withdrawAmount)] })}>
                              {busy ? "..." : "Out"}
                            </Button>
                          </div>
                        </div>

                        <Button variant="destructive" className="w-full" disabled={busy}
                          onClick={() => writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "release", args: [] })}>
                          {busy ? "..." : "Release Slot"}
                        </Button>
                      </div>
                    )}

                    {isOccupied && !isOccupant && (
                      <Button variant="destructive" className="w-full" disabled={busy}
                        onClick={() => writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "liquidate", args: [] })}>
                        {busy ? "..." : "Liquidate"}
                      </Button>
                    )}

                    {isRecipient && (
                      <Button variant="outline" className="w-full" disabled={busy}
                        onClick={() => writeContract({ address: slotAddress as Address, abi: slotAbi, functionName: "collect", args: [] })}>
                        {busy ? "..." : "Collect Tax"}
                      </Button>
                    )}

                    {isSuccess && <p className="text-sm text-green-600 text-center">Transaction confirmed</p>}
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
