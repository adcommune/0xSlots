import { truncateAddress } from "@/utils";

const OWNER_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const LINES = [
  { endX: 53, startX: 160, id: "line-1" },
  { endX: 160, startX: 160, id: "line-2" },
  { endX: 267, startX: 160, id: "line-3" },
  { endX: 53, startX: 160, id: "line-4" },
  { endX: 160, startX: 160, id: "line-5" },
  { endX: 267, startX: 160, id: "line-6" },
];

const SLOTS = [
  { id: "0x1a2b", color: "bg-black text-white" },
  { id: "0x3c4d", color: "bg-white text-black" },
  { id: "0x5e6f", color: "bg-black text-white" },
  { id: "0x7a8b", color: "bg-white text-black" },
  { id: "0x9c0d", color: "bg-black text-white" },
  { id: "0xef12", color: "bg-white text-black" },
];

export function SlotsDemo() {
  return (
    <div className="w-full lg:w-90 shrink-0 self-center">
      {/* Address */}
      <div className="border-2 border-black bg-black text-white px-4 py-3 text-center">
        <span className="font-mono text-[10px] uppercase tracking-wider opacity-50 block">
          Owner
        </span>
        <span className="font-mono text-xs font-bold">
          {truncateAddress(OWNER_ADDRESS)}
        </span>
      </div>
      {/* Static lines */}
      <svg
        viewBox="0 0 320 48"
        className="w-full h-12"
        preserveAspectRatio="none"
        role="img"
      >
        <title>Connections from address to slots</title>
        {LINES.map((line) => (
          <path
            key={line.id}
            d={`M${line.startX},0 C${line.startX},24 ${line.endX},24 ${line.endX},48`}
            fill="none"
            stroke="black"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      {/* Slots grid */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4 border p-2 border-black">
        {SLOTS.map((slot, i) => (
          <div
            key={slot.id}
            className={`aspect-square border border-black flex flex-col items-center justify-center ${slot.color}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-50">
              Slot {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-xs font-bold mt-1">{slot.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
