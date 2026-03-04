"use client";

import { slotAbi } from "@0xslots/contracts";
import {
  Banknote,
  CircleDollarSign,
  Clock,
  FileBox,
  HandCoins,
  LandPlot,
  Lock,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Timer,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { type Address, parseUnits } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/connect-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChain } from "@/context/chain";
import { useCurrencyBalance } from "@/hooks/use-currency-balance";
import { useSlotOnChain } from "@/hooks/use-slot-onchain";
import { useSlotActivity } from "@/hooks/use-v3";
import {
  truncateAddress,
  formatBalance,
  formatDuration,
  formatBps,
} from "@/utils";

import { BuySection } from "./components/buy-section";
import { DepositSlider } from "./components/deposit-slider";
import {
  normalizeSlotActivity,
  SlotEventHistory,
} from "./components/event-history";
import { UserCurrencyBalance } from "./components/user-balance";

const CHAIN_ID = baseSepolia.id;

export default function SlotPage({
  params,
}: {
  params: Promise<{ slotAddress: string }>;
}) {
  const { slotAddress } = use(params);
  const { explorerUrl } = useChain();
  const { data: slot, isLoading } = useSlotOnChain(slotAddress);
  const { data: activityData } = useSlotActivity(slotAddress);
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    writeContract,
    data: hash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [newPrice, setNewPrice] = useState("");
  const walletBalance = useCurrencyBalance(slot?.currency as Address);

  const wrongChain = chainId !== CHAIN_ID;
  const busy = isPending || isConfirming;
  const decimals = slot?.currencyDecimals ?? 6;
  const symbol = slot?.currencySymbol ?? "USDC";

  function toUnits(v: string): bigint {
    try {
      return parseUnits(v || "0", decimals);
    } catch {
      return 0n;
    }
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
            <Link
              href="/explorer"
              className="text-sm text-primary underline mt-4 block"
            >
              ← Back to Explorer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOccupied = slot.occupant != null;
  const isOccupant = address?.toLowerCase() === slot.occupant?.toLowerCase();
  const isRecipient = address?.toLowerCase() === slot.recipient.toLowerCase();
  const remaining =
    slot.deposit > slot.taxOwed ? slot.deposit - slot.taxOwed : 0n;

  const role = isConnected
    ? isOccupant && isRecipient
      ? {
          label: "Owner & Occupant",
          badge: "border-purple-200 bg-purple-50 text-purple-700",
          accent: "border-t-2 border-t-purple-500",
        }
      : isRecipient
        ? {
            label: "Owner",
            badge: "border-blue-200 bg-blue-50 text-blue-700",
            accent: "border-t-2 border-t-blue-500",
          }
        : isOccupant
          ? {
              label: "Occupant",
              badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
              accent: "border-t-2 border-t-emerald-500",
            }
          : null
    : null;

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div>
          <Link
            href="/explorer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Explorer
          </Link>
          <h1 className="text-xl font-bold tracking-tight leading-tight">
            Slot {truncateAddress(slot.id)}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {isOccupied
                ? `Occupied by ${truncateAddress(slot.occupant!)}`
                : "Vacant"}{" "}
              · Base Sepolia
            </p>
            {role && (
              <Badge
                variant="outline"
                className={role.badge}
              >
                {role.label}
              </Badge>
            )}
          </div>
        </div>
        <ConnectButton />
      </PageHeader>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: Info + Events */}
          <div className="space-y-6">
            {/* Slot Details */}
            <div className="rounded-lg border">
              <div className="bg-muted/50 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Slot Details</h2>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {/* Identity */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><LandPlot className="size-3" /> Address</span>
                  <a
                    href={`${explorerUrl}/address/${slot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {truncateAddress(slot.id)}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><User className="size-3" /> Recipient</span>
                  <Link
                    href={`/recipient/${slot.recipient}`}
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {truncateAddress(slot.recipient)}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><CircleDollarSign className="size-3" /> Currency</span>
                  <span className="font-mono text-xs">
                    {slot.currencyName ?? truncateAddress(slot.currency)} ({symbol})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="size-3" /> Manager</span>
                  <span className="font-mono text-xs">
                    {truncateAddress(slot.manager)}
                  </span>
                </div>

                <div className="border-t" />

                {/* Economics */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><HandCoins className="size-3" /> Tax Rate</span>
                  <span>{formatBps(slot.taxPercentage.toString())}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Sparkles className="size-3 text-amber-500" /> Liq. Bounty</span>
                  <span>{formatBps(slot.liquidationBountyBps.toString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Timer className="size-3" /> Min. Deposit</span>
                  <span>{formatDuration(Number(slot.minDepositSeconds))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Receipt className="size-3" /> Tax Collected</span>
                  <span>
                    {formatBalance(slot.collectedTax, decimals)} {symbol}
                  </span>
                </div>

                <div className="border-t" />

                {/* Configuration */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Lock className="size-3" /> Mutable Tax</span>
                  <span>{slot.mutableTax ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Settings className="size-3" /> Mutable Module</span>
                  <span>{slot.mutableModule ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><FileBox className="size-3" /> Module</span>
                  <span className="font-mono text-xs">
                    {slot.module ===
                    "0x0000000000000000000000000000000000000000"
                      ? "None"
                      : truncateAddress(slot.module)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pending Updates */}
            {(slot.hasPendingTax || slot.hasPendingModule) && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5">
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
                  <h2 className="text-sm font-semibold text-yellow-600">
                    Pending Updates
                  </h2>
                </div>
                <div className="p-4 space-y-1.5 text-sm">
                  {slot.hasPendingTax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        New Tax Rate
                      </span>
                      <span>
                        {formatBps(slot.pendingTaxPercentage.toString())}/mo
                      </span>
                    </div>
                  )}
                  {slot.hasPendingModule && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Module</span>
                      <span className="font-mono text-xs">
                        {truncateAddress(slot.pendingModule)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Applied on next ownership transition
                  </p>
                </div>
              </div>
            )}

            <SlotEventHistory
              events={normalizeSlotActivity(activityData, decimals)}
              explorerUrl={explorerUrl}
            />
          </div>

          {/* Right: Actions */}
          <div className="lg:sticky lg:top-6">
            <div
              className={`rounded-lg border ${role ? role.accent : ""}`}
            >
              <div className="bg-muted/50 border-b px-3 py-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {isOccupied
                    ? `Price: ${formatBalance(slot.price, decimals)} ${symbol}`
                    : "Vacant Slot"}
                </h2>
                {role && (
                  <span
                    className={`text-[11px] font-medium rounded-full border px-2 py-0.5 ${role.badge}`}
                  >
                    {role.label}
                  </span>
                )}
              </div>

              {/* Live on-chain financials */}
              {isOccupied && (
                <div className="p-4 border-b space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Banknote className="size-3" /> Deposit</span>
                    <span>
                      {formatBalance(slot.deposit, decimals)} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><HandCoins className="size-3" /> Tax Owed</span>
                    <span>
                      {formatBalance(slot.taxOwed, decimals)} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Wallet className="size-3" /> Net Balance</span>
                    <span
                      className={`font-bold ${slot.insolvent ? "text-destructive" : ""}`}
                    >
                      {formatBalance(remaining, decimals)} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3" /> Liquidation In
                    </span>
                    <span
                      className={
                        slot.insolvent ? "text-destructive font-bold" : ""
                      }
                    >
                      {slot.insolvent
                        ? "NOW"
                        : formatDuration(Number(slot.secondsUntilLiquidation))}
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
                  <p className="text-sm text-muted-foreground">
                    Vacant — No escrow data
                  </p>
                </div>
              )}

              {isConnected && (
                <UserCurrencyBalance currency={slot.currency as Address} />
              )}

              <div className="p-4 space-y-3">
                {!isConnected ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Connect wallet to interact
                  </p>
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
                    {(slot.occupant == null || !isOccupant) && !isRecipient && (
                      <BuySection
                        slot={slot}
                        slotAddress={slotAddress}
                        isOccupied={isOccupied}
                      />
                    )}

                    {isOccupant && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            New Price ({symbol})
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="1.00"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="font-mono text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                writeContract({
                                  address: slotAddress as Address,
                                  abi: slotAbi,
                                  functionName: "selfAssess",
                                  args: [toUnits(newPrice)],
                                })
                              }
                            >
                              {busy ? "..." : "Set"}
                            </Button>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <DepositSlider
                            slot={slot}
                            slotAddress={slotAddress}
                            walletBalance={walletBalance}
                          />
                        </div>

                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={busy}
                          onClick={() =>
                            writeContract({
                              address: slotAddress as Address,
                              abi: slotAbi,
                              functionName: "release",
                              args: [],
                            })
                          }
                        >
                          {busy ? "..." : "Release Slot"}
                        </Button>
                      </div>
                    )}

                    {isOccupied && !isOccupant && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={busy}
                        onClick={() =>
                          writeContract({
                            address: slotAddress as Address,
                            abi: slotAbi,
                            functionName: "liquidate",
                            args: [],
                          })
                        }
                      >
                        {busy ? "..." : "Liquidate"}
                      </Button>
                    )}

                    {isRecipient && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={busy || slot.taxOwed === 0n}
                        onClick={() =>
                          writeContract({
                            address: slotAddress as Address,
                            abi: slotAbi,
                            functionName: "collect",
                            args: [],
                          })
                        }
                      >
                        {busy
                          ? "..."
                          : slot.taxOwed === 0n
                            ? "Nothing to Collect"
                            : `Collect Tax (${formatBalance(slot.taxOwed, decimals)} ${symbol})`}
                      </Button>
                    )}

                    {isSuccess && (
                      <p className="text-sm text-green-600 text-center">
                        Transaction confirmed
                      </p>
                    )}
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
