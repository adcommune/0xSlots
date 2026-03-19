"use client";

import { getMetadataModuleAddress } from "@0xslots/contracts";
import {
  Activity,
  AlertTriangle,
  ArrowUpFromLine,
  Banknote,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Cog,
  FileBox,
  Flame,
  HandCoins,
  Info,
  LandPlot,
  Loader2,
  Lock,
  Settings,
  Shield,
  Sparkles,
  Timer,
  User,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Address, zeroAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AccountTypeIcon } from "@/components/account-type-icon";
import { PageHeader } from "@/components/page-header";
import { SplitRecipientsBar } from "@/components/split-recipients-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useChain } from "@/context/chain";
import { useFarcaster } from "@/context/farcaster";
import { NavLink } from "@/context/navigation";
import { useCurrencyBalance } from "@/hooks/use-currency-balance";
import {
  slotQueryOptions,
  slotActivityQueryOptions,
} from "@/hooks/slot-queries";
import { useSlotAction } from "@/hooks/use-slot-action";
import { useSlotOnChain } from "@/hooks/use-slot-onchain";
import { useModules } from "@/hooks/use-v3";
import {
  formatBalance,
  formatBps,
  formatDuration,
  toRawUnits,
  truncateAddress,
} from "@/utils";

import { BuySection } from "./components/buy-section";
import { DepositSlider } from "./components/deposit-slider";
import {
  normalizeSlotActivity,
  SlotEventHistory,
} from "./components/event-history";
import { MetadataForm } from "./components/metadata-form";
import { UserCurrencyBalance } from "./components/user-balance";

export function SlotPageContent({
  slotAddress,
}: {
  slotAddress: string;
}) {
  const router = useRouter();
  const { explorerUrl, chainId: selectedChainId } = useChain();
  const { isMiniApp } = useFarcaster();
  const { data: slot, isLoading } = useSlotOnChain(slotAddress);

  // Subgraph data — prefetched on the server, reads from cache instantly
  const { data: subgraphSlot } = useSuspenseQuery(
    slotQueryOptions(selectedChainId, slotAddress),
  );
  const { data: activityData } = useSuspenseQuery(
    slotActivityQueryOptions(selectedChainId, slotAddress),
  );

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    selfAssess,
    release,
    collect,
    payTax,
    liquidate,
    proposeTaxUpdate,
    proposeModuleUpdate,
    cancelPendingUpdates,
    busy,
    activeAction,
  } = useSlotAction();
  const { data: modules } = useModules();
  const [newPrice, setNewPrice] = useState("");
  const [newTaxPct, setNewTaxPct] = useState<number | null>(null);
  const [newModule, setNewModule] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "manage">(
    "details",
  );
  const walletBalance = useCurrencyBalance(slot?.currency as Address);

  // Initialize tax slider from current on-chain value
  useEffect(() => {
    if (slot && newTaxPct === null) {
      setNewTaxPct(Number(slot.taxPercentage) / 100);
    }
  }, [slot, newTaxPct]);

  const wrongChain = chainId !== selectedChainId;
  const decimals = slot?.currencyDecimals ?? 6;
  const symbol = slot?.currencySymbol ?? "USDC";

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
            <NavLink
              href="/"
              className="text-sm text-primary underline mt-4 block"
            >
              ← Back to Explorer
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  const isOccupied = slot.occupant != null;
  const isOccupant = address?.toLowerCase() === slot.occupant?.toLowerCase();
  const isRecipient = address?.toLowerCase() === slot.recipient.toLowerCase();
  const isManager = address?.toLowerCase() === slot.manager.toLowerCase();
  const remaining =
    slot.deposit > slot.taxOwed ? slot.deposit - slot.taxOwed : 0n;

  const hasModule = slot.module !== zeroAddress;
  const moduleEntity = hasModule
    ? modules?.find((m) => m.id.toLowerCase() === slot.module.toLowerCase())
    : null;
  const moduleUnverified = hasModule && moduleEntity && !moduleEntity.verified;
  const isMetadataModule =
    hasModule &&
    slot.module.toLowerCase() ===
      getMetadataModuleAddress(selectedChainId)?.toLowerCase();

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

  // Contextual label for the mobile actions drawer trigger
  const actionLabel = isOccupant
    ? "Manage"
    : isRecipient
      ? "Collect"
      : !isOccupied
        ? "Buy Slot"
        : "Buy";

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
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
              <Badge variant="outline" className={role.badge}>
                {role.label}
              </Badge>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto p-2 md:p-6 pb-32 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: Tabbed content */}
          <div className="space-y-6">
            <div className="rounded-lg border">
              {/* Tab bar in card header */}
              <div className="bg-muted/50 border-b px-4 flex items-center gap-0">
                <button
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "details" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveTab("details")}
                >
                  <Info className="size-3.5" /> Info
                </button>
                <button
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "activity" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveTab("activity")}
                >
                  <Activity className="size-3.5" /> Activity
                </button>
                {isManager && (
                  <button
                    className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "manage" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("manage")}
                  >
                    <Cog className="size-3.5" /> Manage
                  </button>
                )}
              </div>

              {/* Details tab */}
              {activeTab === "details" && (
                <div>
                  <div className="p-4 space-y-3 text-sm">
                    {/* Identity */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <LandPlot className="size-3" /> Slot contract
                      </span>
                      <a
                        href={`${explorerUrl}/address/${slot.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        {truncateAddress(slot.id)}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        {subgraphSlot?.recipientAccount?.type ? (
                          <AccountTypeIcon
                            type={subgraphSlot.recipientAccount.type}
                            className="size-3"
                          />
                        ) : (
                          <User className="size-3" />
                        )}{" "}
                        Recipient
                      </span>
                      <NavLink
                        href={`/recipient/${slot.recipient}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {truncateAddress(slot.recipient)}
                      </NavLink>
                    </div>
                    {subgraphSlot?.recipientAccount?.type === "SPLIT" && (
                      <SplitRecipientsBar
                        chainId={selectedChainId}
                        splitAddress={slot.recipient}
                      />
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CircleDollarSign className="size-3" /> Currency
                      </span>
                      <span className="text-xs">
                        {slot.currencyName ?? truncateAddress(slot.currency)} (
                        {symbol})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Shield className="size-3" /> Manager
                      </span>
                      <span className="text-xs">
                        {truncateAddress(slot.manager)}
                      </span>
                    </div>

                    <div className="border-t" />

                    {/* Economics */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <HandCoins className="size-3" /> Tax Rate
                      </span>
                      <span>{formatBps(slot.taxPercentage.toString())}/mo</span>
                    </div>
                    {slot.hasPendingTax && (
                      <div className="flex justify-between pl-5">
                        <p className="text-xs text-amber-600">
                          Pending update{" "}
                          <span className="text-[10px]">
                            Applied on next ownership transition
                          </span>
                        </p>
                        <span className="text-[11px] text-amber-600">
                          {formatBps(slot.pendingTaxPercentage.toString())}/mo
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Timer className="size-3" /> Min. Deposit
                      </span>
                      <span>
                        {formatDuration(Number(slot.minDepositSeconds))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-500" /> Liq.
                        Bounty
                      </span>
                      <span>
                        {formatBps(slot.liquidationBountyBps.toString())}
                      </span>
                    </div>

                    <div className="border-t" />

                    {/* Module */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <FileBox className="size-3" /> Module
                      </span>
                      <span className="text-xs">
                        {!hasModule
                          ? "None"
                          : moduleEntity?.name || truncateAddress(slot.module)}
                      </span>
                    </div>
                    {slot.hasPendingModule && (
                      <div className="pl-5">
                        <p className="text-xs text-indigo-600">
                          Pending module update — applied on next ownership
                          transition
                        </p>
                      </div>
                    )}

                    <div className="border-t" />

                    {/* Configuration flags */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Lock className="size-3" /> Mutable Tax
                      </span>
                      <span>{slot.mutableTax ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Settings className="size-3" /> Mutable Module
                      </span>
                      <span>{slot.mutableModule ? "Yes" : "No"}</span>
                    </div>

                    {moduleUnverified && (
                      <>
                        <div className="border-t" />
                        <div className="flex items-start gap-1.5 rounded-md border border-destructive/50 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
                          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                          <span>
                            This slot uses an <strong>unverified module</strong>
                            . Unverified modules have not been reviewed by the
                            factory admin and may behave unexpectedly.
                          </span>
                        </div>
                      </>
                    )}

                    {(slot.mutableTax || slot.mutableModule) && (
                      <>
                        <div className="border-t" />
                        <div className="flex items-start gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-700">
                          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                          <span>
                            The manager can change{" "}
                            {slot.mutableTax && slot.mutableModule
                              ? "the tax rate and module"
                              : slot.mutableTax
                                ? "the tax rate"
                                : "the module"}{" "}
                            on this slot. Changes take effect on the next
                            ownership transition.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Activity tab */}
              {activeTab === "activity" && (
                <SlotEventHistory
                  events={normalizeSlotActivity(activityData)}
                  explorerUrl={explorerUrl}
                />
              )}

              {/* Manage tab (manager only) */}
              {activeTab === "manage" && isManager && (
                <div className="p-6 space-y-6">
                  {/* Tax Update */}
                  {slot.mutableTax && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <HandCoins className="size-4" /> Propose Tax Rate
                        </label>
                        <span className="text-sm font-semibold">
                          {(newTaxPct ?? 0).toFixed(1)}%/mo
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newTaxPct ?? 0}
                        onChange={(e) => setNewTaxPct(Number(e.target.value))}
                        className="w-full h-2 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                      {slot.hasPendingTax && (
                        <div className="text-sm bg-amber-500/10 text-amber-600 rounded px-3 py-2">
                          Pending:{" "}
                          {formatBps(slot.pendingTaxPercentage.toString())}/mo —
                          applied on next ownership transition
                        </div>
                      )}
                      <Button
                        className="w-full"
                        disabled={
                          busy ||
                          newTaxPct === null ||
                          Math.round(newTaxPct * 100) ===
                            Number(slot.taxPercentage)
                        }
                        onClick={() =>
                          proposeTaxUpdate(
                            slotAddress as Address,
                            BigInt(Math.round((newTaxPct ?? 0) * 100)),
                          )
                        }
                      >
                        {busy && activeAction === "Propose tax" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          `Propose ${(newTaxPct ?? 0).toFixed(1)}%/mo (currently ${formatBps(slot.taxPercentage.toString())}/mo)`
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Module Update */}
                  {slot.mutableModule && (
                    <div
                      className={`space-y-4 ${slot.mutableTax ? "border-t pt-6" : ""}`}
                    >
                      <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Settings className="size-4" /> Propose Module
                      </label>
                      {slot.hasPendingModule && (
                        <div className="text-sm bg-indigo-500/10 text-indigo-600 rounded px-3 py-2">
                          Pending module update — applied on next ownership
                          transition
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {modules
                          ?.filter((m) => m.verified)
                          .map((m) => (
                            <Button
                              key={m.id}
                              variant={
                                newModule.toLowerCase() === m.id.toLowerCase()
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => setNewModule(m.id)}
                            >
                              {m.name || truncateAddress(m.id)}
                            </Button>
                          ))}
                        <Button
                          variant={
                            newModule ===
                            "0x0000000000000000000000000000000000000000"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setNewModule(
                              "0x0000000000000000000000000000000000000000",
                            )
                          }
                        >
                          None
                        </Button>
                      </div>
                      <Input
                        type="text"
                        placeholder="Or paste module address..."
                        value={newModule}
                        onChange={(e) => setNewModule(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        disabled={
                          busy ||
                          !newModule ||
                          newModule.toLowerCase() === slot.module.toLowerCase()
                        }
                        onClick={() =>
                          proposeModuleUpdate(
                            slotAddress as Address,
                            newModule as Address,
                          )
                        }
                      >
                        {busy && activeAction === "Propose module" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          `Propose Module ${newModule ? truncateAddress(newModule) : ""}`
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Cancel Pending Updates */}
                  {(slot.hasPendingTax || slot.hasPendingModule) && (
                    <div className="border-t pt-4">
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() =>
                          cancelPendingUpdates(slotAddress as Address)
                        }
                      >
                        {busy && activeAction === "Cancel updates" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Cancel Pending Updates"
                        )}
                      </Button>
                    </div>
                  )}

                  {!slot.mutableTax && !slot.mutableModule && (
                    <p className="text-muted-foreground text-center py-6">
                      This slot has no mutable parameters
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Metadata Module card — desktop only */}
            {isMetadataModule && (
              <div className="hidden lg:block rounded-lg border">
                <div className="bg-muted/50 border-b px-4 py-3 flex items-center gap-1.5">
                  <FileBox className="size-3.5" />
                  <h2 className="text-sm font-semibold">Ad Metadata</h2>
                </div>
                <div className="p-4">
                  <MetadataForm
                    slotAddress={slotAddress}
                    isOccupant={!!isOccupant}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions — desktop only */}
          <div className="hidden lg:block lg:sticky lg:top-6">
            {renderActionsCard()}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar with drawers */}
      <MobileSlotBar
        actionLabel={actionLabel}
        actionsTitle={
          isOccupied
            ? `Price: ${formatBalance(slot.price, decimals)} ${symbol}`
            : "Vacant Slot"
        }
        actionsContent={renderActionsContent()}
        showModule={!!isMetadataModule}
        moduleContent={
          <MetadataForm slotAddress={slotAddress} isOccupant={!!isOccupant} />
        }
      />
    </div>
  );

  function renderActionsCard() {
    if (!slot) return null;
    return (
      <div className={`rounded-lg border ${role ? role.accent : ""}`}>
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
        {renderActionsContent()}
      </div>
    );
  }

  function renderActionsContent() {
    if (!slot) return null;
    return (
      <>
        {isOccupied && (
          <div className="p-4 border-b space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Banknote className="size-3" /> Deposit
              </span>
              <span>
                {formatBalance(slot.deposit, decimals)} {symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <HandCoins className="size-3" /> Tax Owed
              </span>
              <span>
                {formatBalance(slot.taxOwed, decimals)} {symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-3" /> Net Balance
              </span>
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
                className={slot.insolvent ? "text-destructive font-bold" : ""}
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
          {!isConnected && !isMiniApp ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Connect wallet to interact
            </p>
          ) : wrongChain && !isMiniApp ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => switchChain({ chainId: selectedChainId })}
            >
              Switch to Base Sepolia
            </Button>
          ) : (
            <>
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
                        className="text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          selfAssess(
                            slotAddress as Address,
                            toRawUnits(newPrice, decimals),
                          )
                        }
                      >
                        {busy && activeAction === "Set price" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Set"
                        )}
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

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={busy}
                      >
                        {busy && activeAction === "Release slot" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowUpFromLine className="size-4 mr-1" /> Release
                            Slot
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Release this slot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will give up your occupancy and return your
                          remaining deposit. You will lose your position and
                          someone else can claim the slot.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => release(slotAddress as Address)}
                        >
                          Release
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {isRecipient && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={busy || slot.taxOwed === 0n}
                  onClick={() => collect(slotAddress as Address)}
                >
                  {busy && activeAction === "Collect tax" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : slot.taxOwed === 0n ? (
                    "Nothing to Collect"
                  ) : (
                    <>
                      <HandCoins className="size-4 mr-1" /> Collect Tax (
                      {formatBalance(slot.taxOwed, decimals)} {symbol})
                    </>
                  )}
                </Button>
              )}

              {isOccupant && !isRecipient && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={busy || slot.taxOwed === 0n}
                  onClick={() => payTax(slotAddress as Address)}
                >
                  {busy && activeAction === "Pay tax" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : slot.taxOwed === 0n ? (
                    "No Tax Due"
                  ) : (
                    <>
                      <HandCoins className="size-4 mr-1" /> Pay Tax (
                      {formatBalance(slot.taxOwed, decimals)} {symbol})
                    </>
                  )}
                </Button>
              )}

              {isOccupied && !isOccupant && (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={busy || !slot.insolvent}
                  onClick={() => liquidate(slotAddress as Address)}
                >
                  {busy && activeAction === "Liquidate" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Flame className="size-4 mr-1" /> Liquidate
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </>
    );
  }
}

function MobileSlotBar({
  actionLabel,
  actionsTitle,
  actionsContent,
  showModule,
  moduleContent,
}: {
  actionLabel: string;
  actionsTitle: string;
  actionsContent: React.ReactNode;
  showModule: boolean;
  moduleContent: React.ReactNode;
}) {
  return (
    <div
      className="fixed left-0 right-0 lg:hidden z-40"
      style={{ bottom: `var(--bottom-bar-h, 0px)` }}
    >
      <div className="bg-background border-t p-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {showModule && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <FileBox className="size-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Ad Metadata</DrawerTitle>
                </DrawerHeader>
                <div className="pb-2">{moduleContent}</div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="default" className="flex-1 gap-2">
                <ChevronUp className="size-4" />
                {actionLabel}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{actionsTitle}</DrawerTitle>
              </DrawerHeader>
              <div className="pb-2 max-h-[70vh] overflow-y-auto">
                {actionsContent}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}
