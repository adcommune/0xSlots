"use client";

import { SplitV2Type } from "@0xsplits/splits-sdk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type Address, isAddress, zeroAddress } from "viem";
import { normalize } from "viem/ens";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useChain } from "@/context/chain";
import { useSlotAction } from "@/hooks/use-slot-action";
import { useSplitClient } from "@/hooks/use-split-client";
import { useResolveAddress } from "./address-input";
import { MobileBottomBar } from "./components/mobile-bottom-bar";
import { StepExtra } from "./components/step-extra";
import { StepParameters } from "./components/step-parameters";
import { StepRecipient } from "./components/step-recipient";
import { SummaryCard } from "./components/summary-card";
import {
  type CreateSlotFormValues,
  createSlotSchema,
  defaultValues,
  percentToBps,
  toSeconds,
} from "./schema";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const STEPS = [
  { n: 1, label: "Recipient" },
  { n: 2, label: "Parameters" },
  { n: 3, label: "Extra" },
] as const;

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId: walletChainId, chain } = useAccount();
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
  const [creatingSplit, setCreatingSplit] = useState(false);

  const form = useForm<CreateSlotFormValues>({
    resolver: zodResolver(createSlotSchema),
    defaultValues,
    mode: "onChange",
  });

  // Only watch what the page itself needs for submission logic
  const watchedRecipientMode = form.watch("recipientMode");
  const watchedRecipient = form.watch("recipient");
  const watchedCustomCurrency = form.watch("customCurrency");
  const watchedModule = form.watch("module");
  const watchedManager = form.watch("manager");
  const watchedMutableTax = form.watch("mutableTax");
  const watchedMutableModule = form.watch("mutableModule");

  const needsManager = watchedMutableTax || watchedMutableModule;

  // ENS resolution for submission
  const recipientResolved = useResolveAddress(watchedRecipient);
  const currencyResolved = useResolveAddress(watchedCustomCurrency);
  const moduleResolved = useResolveAddress(watchedModule);
  const managerResolved = useResolveAddress(watchedManager);

  const wrongChain = walletChainId !== selectedChainId;
  const busy = isPending || isConfirming || creatingSplit;
  const anyResolving =
    recipientResolved.isResolving ||
    currencyResolved.isResolving ||
    moduleResolved.isResolving ||
    managerResolved.isResolving;

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => router.push("/"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router]);

  const submitState = {
    isConnected,
    wrongChain,
    isSuccess,
    isPending,
    isConfirming,
    creatingSplit,
    busy,
    anyResolving,
    isFormValid: form.formState.isValid,
    slotCount,
    recipientMode: watchedRecipientMode,
  };

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
            Deploy a new slot on {chain?.name}
          </p>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-2 md:px-6 py-4 md:py-8 pb-24 lg:pb-8">
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
                  {STEPS.map(({ n, label }, i) => (
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
                {step === 1 && <StepRecipient />}
                {step === 2 && <StepParameters />}
                {step === 3 && <StepExtra />}

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
              submitState={submitState}
              switchChain={switchChain}
              chainId={selectedChainId}
            />

            <MobileBottomBar
              slotCount={slotCount}
              setSlotCount={setSlotCount}
              submitState={submitState}
              switchChain={switchChain}
              chainId={selectedChainId}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
