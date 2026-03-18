"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { ChainCapabilities } from "@/components/chain-capabilities";
import { SubgraphStatus } from "@/components/subgraph-status";
import { UserMenu } from "@/components/user-menu";
import { useFarcaster } from "@/context/farcaster";

export function AppShell({ children }: { children: ReactNode }) {
  const { isMiniApp } = useFarcaster();

  if (isMiniApp) {
    // Inside Farcaster: render content only, no nav/footer chrome
    return <main className="min-h-screen flex flex-col flex-1">{children}</main>;
  }

  // Regular web: full nav + footer
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex flex-row items-center gap-6">
          <a
            href="/"
            className="text-2xl flex flex-row gap-2 items-center font-black tracking-tighter"
          >
            <Image
              src="/logo.png"
              width={100}
              height={100}
              alt=""
              className="w-6 aspect-square h-6"
            />
            0xSlots
          </a>
          <div className="flex flex-row items-center gap-2">
            <SubgraphStatus />
            <ChainCapabilities />
          </div>
        </div>
        <UserMenu />
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
  );
}
