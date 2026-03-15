import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";

interface MobileBottomBarProps {
  slotCount: number;
  setSlotCount: (count: number) => void;
  isConnected: boolean;
  wrongChain: boolean;
  isSuccess: boolean;
  isPending: boolean;
  isConfirming: boolean;
  creatingSplit: boolean;
  busy: boolean;
  anyResolving: boolean;
  isFormValid: boolean;
  switchChain: (params: { chainId: number }) => void;
  chainId: number;
  recipientMode: string;
}

export function MobileBottomBar({
  slotCount,
  setSlotCount,
  isConnected,
  wrongChain,
  isSuccess,
  isPending,
  isConfirming,
  creatingSplit,
  busy,
  anyResolving,
  isFormValid,
  switchChain,
  chainId,
  recipientMode,
}: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t p-4 z-50">
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-0 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
          >
            −
          </Button>
          <span className="w-10 h-8 border-y flex items-center justify-center text-sm font-semibold">
            {slotCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setSlotCount(Math.min(50, slotCount + 1))}
          >
            +
          </Button>
        </div>
        {!isConnected ? (
          <ConnectButton />
        ) : wrongChain ? (
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => switchChain({ chainId })}
          >
            Switch Chain
          </Button>
        ) : isSuccess ? (
          <p className="flex-1 text-center text-sm text-green-600 font-bold">
            {slotCount > 1 ? `${slotCount} SLOTS CREATED` : "SLOT CREATED"}
          </p>
        ) : (
          <Button
            type="submit"
            className="flex-1"
            disabled={busy || anyResolving || !isFormValid}
          >
            {creatingSplit
              ? "1/2 — Creating split…"
              : isPending
                ? recipientMode === "group"
                  ? "2/2 — Confirm in wallet…"
                  : "Confirm in wallet…"
                : isConfirming
                  ? recipientMode === "group"
                    ? "2/2 — Creating slot…"
                    : "Confirming…"
                  : slotCount > 1
                    ? `Create ${slotCount} Slots`
                    : "Create Slot"}
          </Button>
        )}
      </div>
    </div>
  );
}
