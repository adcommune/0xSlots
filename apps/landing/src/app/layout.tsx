import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConnectButton } from "@/components/connect-button";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "0xSlots — Perpetual Onchain Slots",
  description:
    "Onchain slots for every Ethereum address. Earn recurrent revenue through partial common ownership and deposit-based Harberger tax. Any ERC-20.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans bg-white text-black`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
              <a
                href="/"
                className="text-2xl font-black tracking-tighter uppercase"
              >
                0xSlots
              </a>
              <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
                <a href="/explorer" className="hover:underline">
                  Explorer
                </a>
                <a
                  href="https://github.com/adcommune/0xSlots"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  GitHub ↗
                </a>
                <ConnectButton />
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="px-6 py-6 border-t-4 border-black">
              <div className="max-w-5xl mx-auto flex justify-between items-center font-mono text-xs uppercase tracking-widest">
                <span>0xSlots</span>
                <a
                  href="https://github.com/adcommune"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  adcommune
                </a>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
