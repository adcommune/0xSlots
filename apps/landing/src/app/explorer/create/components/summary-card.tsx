import { isAddress } from "viem";
import { ConnectButton } from "@/components/connect-button";
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
      <div className="sticky top-8 border-2 border-black">
        <div className="bg-gray-50 border-b-2 border-black p-3">
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Summary
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Slot count selector */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase">Slots</span>
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
                className="w-7 h-7 border-2 border-black font-mono text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                −
              </button>
              <span className="w-10 h-7 border-y-2 border-black flex items-center justify-center font-mono text-sm font-bold">
                {slotCount}
              </span>
              <button
                type="button"
                onClick={() => setSlotCount(Math.min(50, slotCount + 1))}
                className="w-7 h-7 border-2 border-black font-mono text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="h-px bg-black" />

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient</span>
              <span className="font-bold truncate max-w-32">
                {isAddress(effectiveRecipient as `0x${string}`)
                  ? truncateAddress(effectiveRecipient)
                  : address
                    ? truncateAddress(address)
                    : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax Rate</span>
              <span className="font-bold">
                {watchedTaxPercentage || "0"}%/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Liq. Bounty</span>
              <span className="font-bold">{watchedBounty || "0"}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min Deposit</span>
              <span className="font-bold">
                {watchedMinDepositValue || "0"} {watchedMinDepositUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mutable</span>
              <span className="font-bold">
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
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-black">{slotCount}× identical</span>
              </div>
            )}
          </div>

          <div className="h-px bg-black" />

          {/* Actions */}
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : wrongChain ? (
            <button
              type="button"
              onClick={() => switchChain({ chainId })}
              className="w-full font-mono text-[10px] bg-red-900 border-2 border-red-500 text-red-300 px-3 py-2.5 hover:bg-red-800 uppercase tracking-widest"
            >
              Switch to Base Sepolia
            </button>
          ) : isSuccess ? (
            <div className="text-center space-y-1 py-2">
              <p className="font-mono text-sm text-green-600 font-bold">
                {slotCount > 1 ? `${slotCount} SLOTS CREATED` : "SLOT CREATED"}
              </p>
              <p className="font-mono text-[10px] text-gray-500">
                Redirecting…
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={busy || anyResolving || !isFormValid}
              className="w-full border-3 border-black bg-black text-white px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isPending
                ? "CONFIRM IN WALLET…"
                : isConfirming
                  ? "CONFIRMING…"
                  : slotCount > 1
                    ? `CREATE ${slotCount} SLOTS`
                    : "CREATE SLOT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
