"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useAccount, useConnect } from "wagmi";

import { ChainCapabilities } from "@/components/chain-capabilities";
import { SubgraphStatus } from "@/components/subgraph-status";
import { UserMenu } from "@/components/user-menu";
import { useFarcaster } from "@/context/farcaster";
import { truncateAddress } from "@/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { isMiniApp, user } = useFarcaster();
  const { address } = useAccount();

  if (isMiniApp) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-4 py-3 border-b">
          <a
            href="/"
            className="text-xl flex flex-row gap-2 items-center font-black tracking-tighter"
          >
            <Image
              src="/logo.png"
              width={100}
              height={100}
              alt=""
              className="w-5 aspect-square h-5"
            />
            0xSlots
          </a>
          <div className="flex items-center gap-2">
            {user?.pfpUrl && (
              <Image
                src={user.pfpUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-full"
              />
            )}
            <div className="flex flex-col items-end">
              {user?.username && (
                <span className="text-sm font-medium leading-tight">
                  {user.displayName ?? user.username}
                </span>
              )}
              {address && (
                <span className="text-xs text-muted-foreground font-mono leading-tight">
                  {truncateAddress(address)}
                </span>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
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
