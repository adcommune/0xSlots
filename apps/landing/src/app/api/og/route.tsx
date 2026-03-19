import { ImageResponse } from "next/og";
import { APP_URL } from "@/constants";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        gap: 48,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${APP_URL}/logo.png`} alt="" width={160} height={160} />
      <div
        style={{
          fontSize: 128,
          fontWeight: 900,
          color: "#0a0a0a",
          letterSpacing: "-0.05em",
        }}
      >
        0xSlots
      </div>
    </div>,
    {
      width: 1200,
      height: 800,
    },
  );
}
