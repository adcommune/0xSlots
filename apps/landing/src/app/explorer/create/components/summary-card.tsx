import { HandCoins, Sparkles } from "lucide-react";
import { isAddress } from "viem";
import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@/utils";

interface SummaryCardProps {
  slotCount: number;
  setSlotCount: (count: number) => void;
  effectiveRecipient: string;
  address: string | undefined;
  watchedTaxPercentage: string;
  watchedBounty: string;
  watchedMinDepositValue: string;
  watchedMinDepositUnit: string;
  watchedMutableTax: boolean;
  watchedMutableModule: boolean;
  isConnected: boolean;
  wrongChain: boolean;
  isSuccess: boolean;
  isPending: boolean;
  isConfirming: boolean;
  busy: boolean;
  anyResolving: boolean;
  isFormValid: boolean;
  switchChain: (params: { chainId: number }) => void;
  chainId: number;
}

export function SummaryCard({
  slotCount,
  setSlotCount,
  effectiveRecipient,
  address,
  watchedTaxPercentage,
  watchedBounty,
  watchedMinDepositValue,
  watchedMinDepositUnit,
  watchedMutableTax,
  watchedMutableModule,
  isConnected,
  wrongChain,
  isSuccess,
  isPending,
  isConfirming,
  busy,
  anyResolving,
  isFormValid,
  switchChain,
  chainId,
}: SummaryCardProps) {
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
              >
                −
              </Button>
              <span className="w-10 h-6 border rounded-md flex items-center justify-center text-sm font-semibold">
                {slotCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setSlotCount(Math.min(50, slotCount + 1))}
              >
                +
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold truncate max-w-32 text-xs">
                {isAddress(effectiveRecipient as `0x${string}`)
                  ? truncateAddress(effectiveRecipient)
                  : address
                    ? truncateAddress(address)
                    : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><HandCoins className="size-3" /> Tax Rate</span>
              <span className="font-semibold">
                {watchedTaxPercentage || "0"}%/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Sparkles className="size-3 text-amber-500" /> Liq. Bounty</span>
              <span className="font-semibold">{watchedBounty || "0"}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Deposit</span>
              <span className="font-semibold">
                {watchedMinDepositValue || "0"} {watchedMinDepositUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mutable</span>
              <span className="font-semibold">
                {watchedMutableTax && watchedMutableModule
                  ? "Tax + Module"
                  : watchedMutableTax
                    ? "Tax"
                    : watchedMutableModule
                      ? "Module"
                      : "None"}
              </span>
            </div>
            {slotCount > 1 && (
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{slotCount}× identical</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : wrongChain ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => switchChain({ chainId })}
            >
              Switch to Base Sepolia
            </Button>
          ) : isSuccess ? (
            <div className="text-center space-y-1 py-2">
              <p className="text-sm text-green-600 font-bold">
                {slotCount > 1 ? `${slotCount} SLOTS CREATED` : "SLOT CREATED"}
              </p>
              <p className="text-xs text-muted-foreground">Redirecting…</p>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full"
              disabled={busy || anyResolving || !isFormValid}
            >
              {isPending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Confirming…"
                  : slotCount > 1
                    ? `Create ${slotCount} Slots`
                    : "Create Slot"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
