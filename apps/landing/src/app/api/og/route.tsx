import { ImageResponse } from "next/og";

export const runtime = "edge";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.0xslots.org";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          gap: 32,
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${APP_URL}/logo.png`}
          alt=""
          width={120}
          height={120}
          style={{ borderRadius: 24 }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.05em",
          }}
        >
          0xSlots
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#a1a1aa",
          }}
        >
          Taxable Slots
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    },
  );
}
