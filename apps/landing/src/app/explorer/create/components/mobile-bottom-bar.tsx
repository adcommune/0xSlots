import { SlotCounter } from "./slot-counter";
import { SubmitButton, type SubmitState } from "./submit-button";

interface MobileBottomBarProps {
  slotCount: number;
  setSlotCount: (count: number) => void;
  submitState: SubmitState;
  switchChain: (params: { chainId: number }) => void;
  chainId: number;
}

export function MobileBottomBar({
  slotCount,
  setSlotCount,
  submitState,
  switchChain,
  chainId,
}: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t p-4 z-50">
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <SlotCounter
          value={slotCount}
          onChange={setSlotCount}
          variant="connected"
        />
        <SubmitButton
          state={submitState}
          switchChain={switchChain}
          chainId={chainId}
          className="flex-1"
        />
      </div>
    </div>
  );
}
