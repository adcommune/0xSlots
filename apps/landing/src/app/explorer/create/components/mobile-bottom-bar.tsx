import { ConnectButton } from "@/components/connect-button";

interface MobileBottomBarProps {
  slotCount: number;
  setSlotCount: (count: number) => void;
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

export function MobileBottomBar({
  slotCount,
  setSlotCount,
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
}: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-black p-4 z-50">
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-0 shrink-0">
          <button
            type="button"
            onClick={() => setSlotCount(Math.max(1, slotCount - 1))}
            className="w-8 h-8 border-2 border-black font-mono text-sm font-bold hover:bg-gray-100"
          >
            −
          </button>
          <span className="w-10 h-8 border-y-2 border-black flex items-center justify-center font-mono text-sm font-bold">
            {slotCount}
          </span>
          <button
            type="button"
            onClick={() => setSlotCount(Math.min(50, slotCount + 1))}
            className="w-8 h-8 border-2 border-black font-mono text-sm font-bold hover:bg-gray-100"
          >
            +
          </button>
        </div>
        {!isConnected ? (
          <ConnectButton />
        ) : wrongChain ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId })}
            className="flex-1 font-mono text-xs bg-red-900 border-2 border-red-500 text-red-300 px-4 py-2.5 uppercase tracking-widest"
          >
            Switch Chain
          </button>
        ) : isSuccess ? (
          <p className="flex-1 text-center font-mono text-sm text-green-600 font-bold">
            {slotCount > 1 ? `${slotCount} SLOTS CREATED` : "SLOT CREATED"}
          </p>
        ) : (
          <button
            type="submit"
            disabled={busy || anyResolving || !isFormValid}
            className="flex-1 border-3 border-black bg-black text-white px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            {isPending
              ? "CONFIRMING…"
              : isConfirming
                ? "CONFIRMING…"
                : slotCount > 1
                  ? `CREATE ${slotCount} SLOTS`
                  : "CREATE SLOT"}
          </button>
        )}
      </div>
    </div>
  );
}
