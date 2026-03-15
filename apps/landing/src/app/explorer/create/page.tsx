"use client";

import { SplitV2Type } from "@0xsplits/splits-sdk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { type Address, isAddress, zeroAddress } from "viem";
import { normalize } from "viem/ens";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useChain } from "@/context/chain";
import { useSlotAction } from "@/hooks/use-slot-action";
import { useSplitClient } from "@/hooks/use-split-client";
import { truncateAddress } from "@/utils";
import { AddressInput, useResolveAddress } from "./address-input";
import { MobileBottomBar } from "./components/mobile-bottom-bar";
import { SummaryCard } from "./components/summary-card";
import {
  type CreateSlotFormValues,
  createSlotSchema,
  defaultValues,
  percentToBps,
  timeDenominations,
  toSeconds,
} from "./schema";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const VERIFIED_MODULES = [
  {
    name: "Metadata",
    address: "0x6c5A8A7f061bEd94b1b88CFAd4e1a1a8C5c4e527",
    description: "Store IPFS URIs per slot. Occupant controls the data.",
  },
] as const;

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chainId: selectedChainId } = useChain();
  const mainnetClient = usePublicClient({ chainId: mainnet.id });
  const {
    createSlot: sdkCreateSlot,
    createSlots: sdkCreateSlots,
    isPending,
    isConfirming,
    isSuccess,
  } = useSlotAction();
  const splitClient = useSplitClient();
  const [slotCount, setSlotCount] = useState(1);
  const [step, setStep] = useState(1);
  const [moduleMode, setModuleMode] = useState<"none" | "verified" | "custom">(
    "none",
  );
  const [creatingSplit, setCreatingSplit] = useState(false);

  // ── Form ──
  const form = useForm<CreateSlotFormValues>({
    resolver: zodResolver(createSlotSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    fields: splitFields,
    append: appendSplitRecipient,
    remove: removeSplitRecipient,
  } = useFieldArray({
    control: form.control,
    name: "splitRecipients",
  });

  const watchedRecipientMode = form.watch("recipientMode");
  const watchedRecipient = form.watch("recipient");
  const watchedCustomCurrency = form.watch("customCurrency");
  const watchedModule = form.watch("module");
  const watchedManager = form.watch("manager");
  const watchedCurrencyMode = form.watch("currencyMode");
  const watchedTaxPercentage = form.watch("taxPercentage");
  const watchedBounty = form.watch("liquidationBountyPercent");
  const watchedMinDepositValue = form.watch("minDepositValue");
  const watchedMinDepositUnit = form.watch("minDepositUnit");
  const watchedMutableTax = form.watch("mutableTax");
  const watchedMutableModule = form.watch("mutableModule");

  const needsManager = watchedMutableTax || watchedMutableModule;

  // ── ENS resolution ──
  const recipientResolved = useResolveAddress(watchedRecipient);
  const currencyResolved = useResolveAddress(watchedCustomCurrency);
  const moduleResolved = useResolveAddress(watchedModule);
  const managerResolved = useResolveAddress(watchedManager);

  const effectiveRecipient =
    watchedRecipientMode === "group"
      ? "Group (created on submit)"
      : recipientResolved.resolved || address || "";
  const wrongChain = walletChainId !== selectedChainId;
  const busy = isPending || isConfirming || creatingSplit;
  const anyResolving =
    recipientResolved.isResolving ||
    currencyResolved.isResolving ||
    moduleResolved.isResolving ||
    managerResolved.isResolving;

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => router.push("/explorer"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router]);

  async function onSubmit(data: CreateSlotFormValues) {
    const currency =
      data.currencyMode === "usdc"
        ? USDC_ADDRESS
        : currencyResolved.resolved || data.customCurrency;
    const module = moduleResolved.resolved || "";
    const manager = needsManager ? managerResolved.resolved : zeroAddress;

    if (!isAddress(currency as string)) return;

    let recipient: string;

    if (data.recipientMode === "group") {
      // Create split on-chain first
      setCreatingSplit(true);
      try {
        const resolvedRecipients = await Promise.all(
          data.splitRecipients.map(async (r) => {
            let addr = r.address;
            if (!isAddress(addr) && mainnetClient) {
              const resolved = await mainnetClient.getEnsAddress({
                name: normalize(addr),
              });
              if (!resolved) throw new Error(`Could not resolve ${addr}`);
              addr = resolved;
            }
            return {
              address: addr as Address,
              percentAllocation: r.percentAllocation,
            };
          }),
        );
        const { splitAddress } = await splitClient.createSplit({
          recipients: resolvedRecipients,
          splitType: SplitV2Type.Pull,
          distributorFeePercent: data.distributorFeePercent,
        });
        recipient = splitAddress;
      } catch (err) {
        console.error("Failed to create split:", err);
        setCreatingSplit(false);
        return;
      }
      setCreatingSplit(false);
    } else {
      recipient =
        recipientResolved.resolved || data.recipient || (address ?? "");
    }

    if (!isAddress(recipient as string)) return;

    const config = {
      mutableTax: data.mutableTax,
      mutableModule: data.mutableModule,
      manager: (isAddress(manager as string)
        ? manager
        : zeroAddress) as Address,
    };
    const initParams = {
      taxPercentage: BigInt(Math.round(Number(data.taxPercentage) * 100)),
      module: (isAddress(module as string) ? module : zeroAddress) as Address,
      liquidationBountyBps: percentToBps(data.liquidationBountyPercent),
      minDepositSeconds: toSeconds(data.minDepositValue, data.minDepositUnit),
    };

    if (slotCount === 1) {
      sdkCreateSlot({
        recipient: recipient as Address,
        currency: currency as Address,
        config,
        initParams,
      });
    } else {
      sdkCreateSlots({
        recipient: recipient as Address,
        currency: currency as Address,
        config,
        initParams,
        count: BigInt(slotCount),
      });
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-tight">
            Create Slot
          </h1>
          <p className="text-muted-foreground text-xs">
            Deploy a new Harberger tax slot on Base Sepolia
          </p>
        </div>
      </PageHeader>

      {/* Form + Sidebar */}
      <div className="max-w-6xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-6 items-start"
          >
            {/* Left: Form */}
            <div className="flex-1 min-w-0 rounded-lg border">
              {/* Card header */}
              <div className="bg-muted/50 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Step {step} of 3 —{" "}
                  {step === 1
                    ? "Recipient"
                    : step === 2
                      ? "Parameters"
                      : "Extra"}
                </h2>
              </div>

              {/* Step indicator */}
              <div className="px-6 pt-5 pb-1">
                <div className="flex items-center">
                  {[
                    { n: 1, label: "Recipient" },
                    { n: 2, label: "Parameters" },
                    { n: 3, label: "Extra" },
                  ].map(({ n, label }, i) => (
                    <div
                      key={n}
                      className="flex items-center flex-1 last:flex-none"
                    >
                      <button
                        type="button"
                        onClick={() => n <= step && setStep(n)}
                        className={`flex items-center gap-2 ${n <= step ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span
                          className={`size-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                            n === step
                              ? "bg-primary text-primary-foreground"
                              : n < step
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {n < step ? <Check className="size-3" /> : n}
                        </span>
                        <span
                          className={`text-xs hidden sm:inline ${n === step ? "font-medium" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </button>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-px mx-3 ${n < step ? "bg-primary/30" : "bg-border"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div
                key={step}
                className="p-6 space-y-6 animate-in fade-in duration-200"
              >
                {step === 1 && (
                  <>
                    {/* ── Recipient ── */}
                    <div>
                      <FormField
                        control={form.control}
                        name="recipientMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient</FormLabel>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => field.onChange("single")}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                                  field.value === "single"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/40"
                                }`}
                              >
                                <Wallet className="size-5" />
                                <span className="text-sm font-medium">
                                  Account
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => field.onChange("group")}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                                  field.value === "group"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/40"
                                }`}
                              >
                                <Users className="size-5" />
                                <span className="text-sm font-medium">
                                  Group
                                </span>
                              </button>
                            </div>
                          </FormItem>
                        )}
                      />

                      {watchedRecipientMode === "single" && (
                        <div className="mt-3">
                          <FormField
                            control={form.control}
                            name="recipient"
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <AddressInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      placeholder="0x… or vitalik.eth"
                                      hint={
                                        address && !field.value
                                          ? `Defaults to ${truncateAddress(address)}`
                                          : undefined
                                      }
                                      error={fieldState.error?.message}
                                    />
                                  </div>
                                  {address && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="shrink-0 text-xs h-9"
                                      onClick={() => field.onChange(address)}
                                    >
                                      Use my address
                                    </Button>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {watchedRecipientMode === "group" && (
                        <div className="mt-3 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Create a recipient group. Tax revenue will be
                            distributed to all members below via a Pull Split.{" "}
                            <a
                              href="https://splits.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Powered by 0xSplits
                            </a>
                          </p>

                          {splitFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="flex items-start gap-2"
                            >
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`splitRecipients.${index}.address`}
                                  render={({
                                    field: addrField,
                                    fieldState,
                                  }) => (
                                    <AddressInput
                                      value={addrField.value}
                                      onChange={addrField.onChange}
                                      onBlur={addrField.onBlur}
                                      placeholder="0x… or ENS"
                                      error={fieldState.error?.message}
                                    />
                                  )}
                                />
                              </div>
                              <div className="w-24">
                                <FormField
                                  control={form.control}
                                  name={`splitRecipients.${index}.percentAllocation`}
                                  render={({ field: pctField }) => (
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={pctField.value}
                                        onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          pctField.onChange(
                                            Number.isNaN(v) ? 0 : v,
                                          );
                                        }}
                                        className="pr-6 text-xs"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        %
                                      </span>
                                    </div>
                                  )}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0"
                                disabled={splitFields.length <= 2}
                                onClick={() => removeSplitRecipient(index)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          ))}

                          {(() => {
                            const total = form
                              .watch("splitRecipients")
                              .reduce(
                                (sum, r) => sum + (r.percentAllocation || 0),
                                0,
                              );
                            return (
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={
                                    Math.abs(total - 100) < 0.01
                                      ? "text-green-600"
                                      : "text-destructive"
                                  }
                                >
                                  Total: {total.toFixed(2)}%
                                  {Math.abs(total - 100) >= 0.01 &&
                                    " (must be 100%)"}
                                </span>
                              </div>
                            );
                          })()}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              appendSplitRecipient({
                                address: "",
                                percentAllocation: 0,
                              })
                            }
                          >
                            <Plus className="size-3.5 mr-1" />
                            Add Recipient
                          </Button>

                          <Separator />

                          <FormField
                            control={form.control}
                            name="distributorFeePercent"
                            render={({ field: feeField }) => (
                              <FormItem>
                                <FormLabel>Distributor Fee</FormLabel>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={feeField.value}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      feeField.onChange(
                                        Number.isNaN(v) ? 0 : v,
                                      );
                                    }}
                                    className="pr-6"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    %
                                  </span>
                                </div>
                                <FormDescription>
                                  Incentive for anyone who triggers distribution
                                  (0–10%)
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* ── Currency ── */}
                    <FormField
                      control={form.control}
                      name="currencyMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                field.value === "usdc" ? "default" : "outline"
                              }
                              onClick={() => field.onChange("usdc")}
                            >
                              USDC
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                field.value === "custom" ? "default" : "outline"
                              }
                              onClick={() => field.onChange("custom")}
                            >
                              Custom
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchedCurrencyMode === "custom" && (
                      <FormField
                        control={form.control}
                        name="customCurrency"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <AddressInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="0x… ERC-20 address or ENS"
                              error={fieldState.error?.message}
                            />
                          </FormItem>
                        )}
                      />
                    )}

                    <Separator />

                    {/* Tax Rate — Slider */}
                    <FormField
                      control={form.control}
                      name="taxPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-1.5">
                              <HandCoins className="size-3.5" /> Tax Rate
                            </FormLabel>
                            <span className="text-sm font-semibold">
                              {parseFloat(field.value).toFixed(1) || "0"}%/mo
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={Number(field.value) || 0}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full h-2 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                          />
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                          {(() => {
                            const v = Number(field.value) || 0;
                            const isLow = v <= 20;
                            const isHigh = v >= 30;
                            return (
                              <div className="flex justify-between mt-1.5 text-[9px] leading-tight gap-4">
                                <span
                                  className={
                                    isLow
                                      ? "font-bold text-foreground"
                                      : "text-muted-foreground"
                                  }
                                >
                                  Predictability · low churn · squat risk
                                </span>
                                <span
                                  className={`text-right ${isHigh ? "font-bold text-foreground" : "text-muted-foreground"}`}
                                >
                                  Allocative efficiency · anti-squat ·
                                  volatility
                                </span>
                              </div>
                            );
                          })()}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Min Deposit Time */}
                    <FormField
                      control={form.control}
                      name="minDepositValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Deposit Time</FormLabel>
                          <div className="flex gap-0">
                            <Input
                              {...field}
                              type="text"
                              inputMode="decimal"
                              className="rounded-r-none"
                            />
                            <FormField
                              control={form.control}
                              name="minDepositUnit"
                              render={({ field: selectField }) => (
                                <Select
                                  value={selectField.value}
                                  onValueChange={selectField.onChange}
                                >
                                  <SelectTrigger className="w-25 rounded-l-none border-l-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeDenominations.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit.charAt(0).toUpperCase() +
                                          unit.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Module */}
                    <FormField
                      control={form.control}
                      name="module"
                      render={({ field, fieldState }) => {
                        const selectValue =
                          moduleMode === "custom"
                            ? "custom"
                            : field.value === ""
                              ? "none"
                              : field.value;

                        return (
                          <FormItem>
                            <FormLabel>Module (optional)</FormLabel>
                            <Select
                              value={selectValue}
                              onValueChange={(v) => {
                                if (v === "none") {
                                  setModuleMode("none");
                                  field.onChange("");
                                } else if (v === "custom") {
                                  setModuleMode("custom");
                                  field.onChange("");
                                } else {
                                  setModuleMode("verified");
                                  field.onChange(v);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a module" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {VERIFIED_MODULES.map((m) => (
                                  <SelectItem key={m.address} value={m.address}>
                                    {m.name} — {m.description}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">
                                  Custom address
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {moduleMode === "custom" && (
                              <div className="mt-2">
                                <AddressInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="0x… or ENS"
                                  error={fieldState.error?.message}
                                />
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </>
                )}

                {step === 3 && (
                  <>
                    {/* ── Mutability & Manager ── */}
                    <div>
                      <p className="text-sm font-medium mb-4">
                        Mutability & Manager
                      </p>

                      <div className="flex gap-6">
                        <FormField
                          control={form.control}
                          name="mutableTax"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FormLabel className="cursor-pointer mt-0!">
                                Mutable Tax
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mutableModule"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FormLabel className="cursor-pointer mt-0!">
                                Mutable Module
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {needsManager && (
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="manager"
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel>
                                  Manager Address (required)
                                </FormLabel>
                                <AddressInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="0x… or ENS name"
                                  error={fieldState.error?.message}
                                />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {!needsManager && (
                        <p className="text-xs text-muted-foreground mt-2">
                          No manager needed when both flags are off.
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* ── Liquidation Bounty ── */}
                    <FormField
                      control={form.control}
                      name="liquidationBountyPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-amber-500" />{" "}
                            Liquidation Bounty
                          </FormLabel>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              inputMode="decimal"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
                          <FormDescription>
                            Reward for liquidators
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(step - 1)}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {step < 3 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setStep(step + 1)}
                    >
                      Next
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <SummaryCard
              slotCount={slotCount}
              setSlotCount={setSlotCount}
              effectiveRecipient={effectiveRecipient}
              address={address}
              watchedTaxPercentage={watchedTaxPercentage}
              watchedBounty={watchedBounty}
              watchedMinDepositValue={watchedMinDepositValue}
              watchedMinDepositUnit={watchedMinDepositUnit}
              watchedMutableTax={watchedMutableTax}
              watchedMutableModule={watchedMutableModule}
              isConnected={isConnected}
              wrongChain={wrongChain}
              isSuccess={isSuccess}
              isPending={isPending}
              isConfirming={isConfirming}
              creatingSplit={creatingSplit}
              busy={busy}
              anyResolving={anyResolving}
              isFormValid={form.formState.isValid}
              switchChain={switchChain}
              chainId={selectedChainId}
              recipientMode={watchedRecipientMode}
            />

            <MobileBottomBar
              slotCount={slotCount}
              setSlotCount={setSlotCount}
              isConnected={isConnected}
              wrongChain={wrongChain}
              isSuccess={isSuccess}
              isPending={isPending}
              isConfirming={isConfirming}
              creatingSplit={creatingSplit}
              busy={busy}
              anyResolving={anyResolving}
              isFormValid={form.formState.isValid}
              switchChain={switchChain}
              chainId={selectedChainId}
              recipientMode={watchedRecipientMode}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
