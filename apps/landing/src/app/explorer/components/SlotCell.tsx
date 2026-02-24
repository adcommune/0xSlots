import { truncateAddress } from "@/utils";

interface SlotCellProps {
  slotId: string;
  occupant?: string | null;
  landOwner: string;
}

export function SlotCell({ slotId, occupant, landOwner }: SlotCellProps) {
  const isOccupied =
    !!occupant &&
    occupant !== "0x0000000000000000000000000000000000000000" &&
    occupant.toLowerCase() !== landOwner.toLowerCase();

  return (
    <div
      className={`w-5 h-5 border border-black flex items-center justify-center font-mono text-[8px] font-bold ${
        isOccupied ? "bg-black text-white" : "bg-white text-black"
      }`}
      title={`Slot #${slotId} — ${
        isOccupied ? truncateAddress(occupant!) : "VACANT"
      }`}
    >
      {slotId}
    </div>
  );
}
