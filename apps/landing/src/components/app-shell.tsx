"use client";

import { CHAINS } from "@0xslots/contracts";
import { BookOpen, Check, ChevronDown, Menu, User } from "lucide-react";
import Image from "next/image";
import { NavLink } from "@/context/navigation";
import type { ReactNode } from "react";
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
import { useNavigation } from "@/context/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { isMiniApp, user, miniappContext } = useFarcaster();
  const { chainId, setChain } = useChain();
  const { push, isPending } = useNavigation();

  const logo = (
    <NavLink
      href="/"
      className="text-2xl flex flex-row gap-1.5 items-center font-black tracking-tighter"
    >
      <Image
        src="/logo.png"
        width={100}
        height={100}
        alt=""
        className={`w-6 aspect-square h-6 transition-transform ${isPending ? "animate-spin" : ""}`}
      />
      0xSlots
    </NavLink>
  );

  const chainSelector = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
          {CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {CHAINS.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => setChain(c.id)}>
            {c.name}
            {c.id === chainId && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const mobileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-2">
          {isMiniApp && user?.pfpUrl ? (
            <Image
              src={user.pfpUrl}
              alt=""
              width={20}
              height={20}
              className="size-5 rounded-full"
            />
          ) : (
            <Menu className="size-4" />
          )}
          {isMiniApp && user?.username && (
            <span className="text-xs font-medium">
              {user.displayName ?? user.username}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => push("/profile")}>
          <User className="size-4" />
          My Slots
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => push("/docs")}>
          <BookOpen className="size-4" />
          Docs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const bottomBar = (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex items-center justify-between px-4 md:hidden"
      style={{
        paddingBottom: isMiniApp
          ? (miniappContext?.client.safeAreaInsets?.bottom ?? 5)
          : 5,
        paddingTop: 5,
      }}
    >
      {chainSelector}
      <div className="flex items-center gap-2">
        <SubgraphStatus />
        <ChainCapabilities />
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav — compact on mobile, full on desktop */}
      <nav className="flex items-center justify-between p-2 md:px-6 md:py-4 border-b">
        <div className="flex flex-row items-center gap-6">
          {logo}
          {/* Desktop: inline indicators */}
          <div className="hidden md:flex flex-row items-center gap-2">
            <SubgraphStatus />
            <ChainCapabilities />
          </div>
        </div>

        {/* Miniapp: compact dropdown, Web: full user menu (connect + dropdown) */}
        {isMiniApp ? mobileMenu : <UserMenu />}
      </nav>

      {/* Main Content — bottom padding on mobile for fixed bar */}
      <main className="flex-1 flex flex-col pb-10 md:pb-0">{children}</main>

      {/* Mobile bottom bar */}
      {bottomBar}

      {/* Desktop footer */}
      <footer className="hidden md:block px-6 py-6 border-t">
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
