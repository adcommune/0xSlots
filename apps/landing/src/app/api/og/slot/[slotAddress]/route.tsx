import { ImageResponse } from "next/og";
import { APP_URL } from "@/constants";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slotAddress: string }> },
) {
  const { slotAddress } = await params;
  const truncated = `${slotAddress.slice(0, 6)}…${slotAddress.slice(-4)}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        gap: 24,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${APP_URL}/logo.png`} alt="" width={120} height={120} />
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#0a0a0a",
          letterSpacing: "-0.04em",
        }}
      >
        0xSlots
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: "#737373",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Slot {truncated}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
