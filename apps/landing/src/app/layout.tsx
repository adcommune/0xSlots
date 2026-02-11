import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "0xSlots — Perpetual Onchain Slots",
  description:
    "Onchain slots for every Ethereum address. Earn recurrent revenue through partial common ownership and Superfluid token streaming.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-white text-black`}>
        {children}
      </body>
    </html>
  );
}
