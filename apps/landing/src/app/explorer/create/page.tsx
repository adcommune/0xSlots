"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type Address, isAddress, zeroAddress } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";

import { slotFactoryAbi, slotFactoryAddress } from "@0xslots/contracts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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

const CHAIN_ID = baseSepolia.id;
const FACTORY_ADDRESS = slotFactoryAddress[CHAIN_ID];

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [slotCount, setSlotCount] = useState(1);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // ── Form ──
  const form = useForm<CreateSlotFormValues>({
    resolver: zodResolver(createSlotSchema),
    defaultValues,
    mode: "onChange",
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
    watchedRecipientMode === "self"
      ? (address ?? "")
      : recipientResolved.resolved || "";
  const wrongChain = walletChainId !== CHAIN_ID;
  const busy = isPending || isConfirming;
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

  function onSubmit(data: CreateSlotFormValues) {
    const recipient =
      data.recipientMode === "self"
        ? (address ?? "")
        : recipientResolved.resolved || data.recipient;
    const currency =
      data.currencyMode === "usdc"
        ? USDC_ADDRESS
        : currencyResolved.resolved || data.customCurrency;
    const module = moduleResolved.resolved || "";
    const manager = needsManager ? managerResolved.resolved : zeroAddress;

    if (!isAddress(recipient as string) || !isAddress(currency as string))
      return;

    const config = {
      mutableTax: data.mutableTax,
      mutableModule: data.mutableModule,
      manager: (isAddress(manager as string)
        ? manager
        : zeroAddress) as Address,
    };
    const initParams = {
      taxPercentage: BigInt(Math.round(Number(data.taxPercentage) * 100)),
      module: (isAddress(module as string)
        ? module
        : zeroAddress) as Address,
      liquidationBountyBps: percentToBps(data.liquidationBountyPercent),
      minDepositSeconds: toSeconds(
        data.minDepositValue,
        data.minDepositUnit,
      ),
    };

    if (slotCount === 1) {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: slotFactoryAbi,
        functionName: "createSlot",
        args: [recipient as Address, currency as Address, config, initParams],
      });
    } else {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: slotFactoryAbi,
        functionName: "createSlots",
        args: [recipient as Address, currency as Address, config, initParams, BigInt(slotCount)],
      });
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Create Slot
          </h1>
          <p className="text-muted-foreground text-sm">
            Deploy a new Harberger tax slot on Base Sepolia
          </p>
        </div>
      </div>

      {/* Form + Sidebar */}
      <div className="max-w-5xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6 items-start">
            {/* Left: Form */}
            <div className="flex-1 min-w-0 rounded-lg border">
              {/* Card header */}
              <div className="bg-muted/50 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Configure Your Slot
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* ── Recipient ── */}
                <div>
                  <FormField
                    control={form.control}
                    name="recipientMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={field.value === "self" ? "default" : "outline"}
                            onClick={() => {
                              field.onChange("self");
                              form.setValue("recipient", "");
                            }}
                          >
                            My Address
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={field.value === "custom" ? "default" : "outline"}
                            onClick={() => field.onChange("custom")}
                          >
                            Custom
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            Group
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchedRecipientMode === "self" && address && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Tax revenue goes to {truncateAddress(address)}
                    </p>
                  )}
                  {watchedRecipientMode === "self" && !address && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Connect your wallet to use your address.
                    </p>
                  )}

                  {watchedRecipientMode === "custom" && (
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name="recipient"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <AddressInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="0x… or vitalik.eth"
                              hint="Supports ENS names (.eth, .xyz, .id)"
                              error={fieldState.error?.message}
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

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
                          variant={field.value === "usdc" ? "default" : "outline"}
                          onClick={() => field.onChange("usdc")}
                        >
                          USDC
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={field.value === "custom" ? "default" : "outline"}
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

                {/* ── Slot Parameters ── */}
                <div>
                  <p className="text-sm font-medium mb-4">
                    Slot Parameters
                  </p>

                  {/* Tax Rate — Slider */}
                  <FormField
                    control={form.control}
                    name="taxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Tax Rate</FormLabel>
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
                                Allocative efficiency · anti-squat · volatility
                              </span>
                            </div>
                          );
                        })()}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Min Deposit Time */}
                  <div className="mt-4">
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
                                      <SelectItem
                                        key={unit}
                                        value={unit}
                                      >
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
                  </div>

                  {/* Module */}
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="module"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Module (optional)</FormLabel>
                          <AddressInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="0x… or ENS (optional)"
                            error={fieldState.error?.message}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

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
                            <FormLabel>Manager Address (required)</FormLabel>
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
                      <FormLabel>Liquidation Bounty</FormLabel>
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
              busy={busy}
              anyResolving={anyResolving}
              isFormValid={form.formState.isValid}
              switchChain={switchChain}
              chainId={CHAIN_ID}
            />

            <MobileBottomBar
              slotCount={slotCount}
              setSlotCount={setSlotCount}
              isConnected={isConnected}
              wrongChain={wrongChain}
              isSuccess={isSuccess}
              isPending={isPending}
              isConfirming={isConfirming}
              busy={busy}
              anyResolving={anyResolving}
              isFormValid={form.formState.isValid}
              switchChain={switchChain}
              chainId={CHAIN_ID}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
