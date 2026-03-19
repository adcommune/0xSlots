import { HandCoins, Sparkles } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { isAddress } from "viem";
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@/utils";
import { useResolveAddress } from "../address-input";
import type { CreateSlotFormValues } from "../schema";
import { SlotCounter } from "./slot-counter";
import { SubmitButton, type SubmitState } from "./submit-button";

interface SummaryCardProps {
  slotCount: number;
  setSlotCount: (count: number) => void;
  submitState: SubmitState;
  switchChain: (params: { chainId: number }) => void;
  chainId: number;
}

export function SummaryCard({
  slotCount,
  setSlotCount,
  submitState,
  switchChain,
  chainId,
}: SummaryCardProps) {
  const form = useFormContext<CreateSlotFormValues>();
  const recipientMode = form.watch("recipientMode");
  const recipient = form.watch("recipient");
  const taxPercentage = form.watch("taxPercentage");
  const bounty = form.watch("liquidationBountyPercent");
  const minDepositValue = form.watch("minDepositValue");
  const minDepositUnit = form.watch("minDepositUnit");
  const mutableTax = form.watch("mutableTax");
  const mutableModule = form.watch("mutableModule");

  const recipientResolved = useResolveAddress(recipient);
  const effectiveRecipient =
    recipientMode === "group"
      ? "Group (created on submit)"
      : recipientResolved.resolved || "";

  return (
    <div className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-8 rounded-lg border">
        <div className="bg-muted/50 border-b px-3 py-3">
          <p className="text-xs text-muted-foreground font-semibold">Summary</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Slot count selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Slots</span>
            <SlotCounter value={slotCount} onChange={setSlotCount} />
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold truncate max-w-32 text-xs">
                {isAddress(effectiveRecipient as `0x${string}`)
                  ? truncateAddress(effectiveRecipient)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <HandCoins className="size-3" /> Tax Rate
              </span>
              <span className="font-semibold">{taxPercentage || "0"}%/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" /> Liq. Bounty
              </span>
              <span className="font-semibold">{bounty || "0"}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Deposit</span>
              <span className="font-semibold">
                {minDepositValue || "0"} {minDepositUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mutable</span>
              <span className="font-semibold">
                {mutableTax && mutableModule
                  ? "Tax + Module"
                  : mutableTax
                    ? "Tax"
                    : mutableModule
                      ? "Module"
                      : "None"}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{slotCount}× identical</span>
            </div>
          </div>

          <Separator />

          <SubmitButton
            state={submitState}
            switchChain={switchChain}
            chainId={chainId}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
