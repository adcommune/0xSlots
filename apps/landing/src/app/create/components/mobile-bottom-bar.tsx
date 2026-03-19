import { ChevronUp, HandCoins, Sparkles } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
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
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@/utils";
import { useResolveAddress } from "../address-input";
import type { CreateSlotFormValues } from "../schema";
import { SlotCounter } from "./slot-counter";
import { SubmitButton, type SubmitState } from "./submit-button";

interface MobileBottomBarProps {
  step: number;
  slotCount: number;
  setSlotCount: (count: number) => void;
  submitState: SubmitState;
  switchChain: (params: { chainId: number }) => void;
  chainId: number;
}

export function MobileBottomBar({
  step,
  slotCount,
  setSlotCount,
  submitState,
  switchChain,
  chainId,
}: MobileBottomBarProps) {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
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
      ? "Group"
      : recipientResolved.resolved || recipient || (address ?? "");

  const ready = step === 3;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
      <Drawer open={open} onOpenChange={setOpen}>
        {/* Collapsed bar */}
        <div className="bg-background border-t p-3">
          <div className="max-w-3xl mx-auto">
            <DrawerTrigger asChild>
              <Button
                variant={ready ? "default" : "outline"}
                className={`w-full gap-2 ${ready ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              >
                <ChevronUp className="size-4" />
                Finalize
              </Button>
            </DrawerTrigger>
          </div>
        </div>

        {/* Bottom sheet */}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Slot Summary</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2 space-y-4">
            {/* Slot count */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Slots</span>
              <SlotCounter value={slotCount} onChange={setSlotCount} />
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold text-xs">
                  {recipientMode === "group"
                    ? "Group (created on submit)"
                    : isAddress(effectiveRecipient as `0x${string}`)
                      ? truncateAddress(effectiveRecipient)
                      : "My Account"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HandCoins className="size-3" /> Tax Rate
                </span>
                <span className="font-semibold">
                  {taxPercentage || "0"}%/mo
                </span>
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
              {slotCount > 1 && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{slotCount}x identical</span>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <SubmitButton
              state={submitState}
              switchChain={switchChain}
              chainId={chainId}
              className="w-full"
              formId="create-slot-form"
            />
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
