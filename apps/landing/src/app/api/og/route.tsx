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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          gap: 24,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${APP_URL}/logo.png`}
          alt=""
          width={80}
          height={80}
        />
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#0a0a0a",
            letterSpacing: "-0.05em",
          }}
        >
          0xSlots
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    },
  );
}
