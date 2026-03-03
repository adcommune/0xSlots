import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChainSelector } from "@/app/explorer/chain-selector";
import { ConnectButton } from "@/components/connect-button";
import { Providers } from "@/components/providers";
import { SubgraphStatus } from "@/components/subgraph-status";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "0xSlots — Immutable & Modular Collective Ownership Slots",
  description:
    "Immutable & modular collective ownership slots on Ethereum. Perpetual onchain real estate powered by partial common ownership and Harberger tax. Any ERC-20.",
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
          <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-4 border-b">
              <a
                href="/"
                className="text-2xl font-black tracking-tighter"
              >
                0xSlots
              </a>
              <div className="flex items-center gap-4 text-sm">
                <a href="/explorer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Explorer
                </a>
                <a href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Profile
                </a>
                <SubgraphStatus />
                <ChainSelector />
                <ConnectButton />
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="px-6 py-6 border-t">
              <div className="max-w-5xl mx-auto flex justify-between items-center text-sm text-muted-foreground">
                <span>0xSlots</span>
                <div className="flex items-center gap-6">
                  <a
                    href="https://github.com/adcommune/0xSlots"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://github.com/adcommune"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    adcommune
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
