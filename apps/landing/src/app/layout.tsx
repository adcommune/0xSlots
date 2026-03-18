import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.0xslots.org";

export const metadata: Metadata = {
  title: "0xSlots — Immutable & Modular Collective Ownership Slots",
  description:
    "Immutable & modular collective ownership slots on Ethereum. Perpetual onchain real estate powered by partial common ownership. Any ERC-20.",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${APP_URL}/api/og`,
      button: {
        title: "Open 0xSlots",
        action: {
          type: "launch_miniapp",
          name: "0xSlots",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/logo.png`,
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans bg-background text-foreground`}
      >
        <Providers>
          <Toaster position="bottom-right" richColors />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
