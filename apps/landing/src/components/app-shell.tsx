"use client";

import { CHAINS } from "@0xslots/contracts";
import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ChainCapabilities } from "@/components/chain-capabilities";
import { SubgraphStatus } from "@/components/subgraph-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "@/components/user-menu";
import { useChain } from "@/context/chain";
import { useFarcaster } from "@/context/farcaster";
import { truncateAddress } from "@/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { isMiniApp, user, miniappContext } = useFarcaster();
  const { address } = useAccount();
  const { chainId, setChain } = useChain();

  if (isMiniApp) {
    return (
      <div className="min-h-screen flex flex-col pb-14">
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Fixed bottom bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex items-center justify-between px-4"
          style={{
            paddingBottom: miniappContext?.client.safeAreaInsets?.bottom,
          }}
        >
          <a
            href="/"
            className="text-lg flex flex-row gap-1.5 items-center font-black tracking-tighter"
          >
            <Image
              src="/logo.png"
              width={100}
              height={100}
              alt=""
              className="w-4 aspect-square h-4"
            />
            0xSlots
          </a>

          {/* Chain selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7 px-2"
              >
                {CHAINS.find((c) => c.id === chainId)?.name ??
                  `Chain ${chainId}`}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {CHAINS.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => setChain(c.id)}>
                  {c.name}
                  {c.id === chainId && <Check className="ml-auto size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            {user?.pfpUrl && (
              <Image
                src={user.pfpUrl}
                alt=""
                width={20}
                height={20}
                className="size-5 rounded-full"
              />
            )}
            <div className="flex flex-col items-end">
              {user?.username && (
                <span className="text-xs font-medium leading-tight">
                  {user.displayName ?? user.username}
                </span>
              )}
              {address && (
                <span className="text-[10px] text-muted-foreground font-mono leading-tight">
                  {truncateAddress(address)}
                </span>
              )}
            </div>
          </div>
        </nav>
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
