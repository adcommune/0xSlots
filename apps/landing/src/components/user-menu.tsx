"use client";

import { CHAINS } from "@0xslots/contracts";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import {
  BookOpen,
  Check,
  Copy,
  LogOut,
  Network,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect } from "wagmi";

import { Blockie } from "@/components/blockie";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChain } from "@/context/chain";
import { useNavigation } from "@/context/navigation";
import { truncateAddress } from "@/utils";

export function UserMenu() {
  const { push } = useNavigation();
  const { chainId, setChain } = useChain();
  const { connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openChainModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
              })}
            >
              <Button onClick={openConnectModal} size="sm">
                Connect
              </Button>
            </div>
          );
        }

        if (chain.unsupported) {
          return (
            <Button onClick={openChainModal} variant="destructive" size="sm">
              Wrong Network
            </Button>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {account.ensAvatar ? (
                  <Image
                    src={account.ensAvatar}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 rounded-full"
                  />
                ) : (
                  <Blockie
                    address={account.address}
                    className="size-5 rounded-full"
                  />
                )}
                {account.ensName ?? truncateAddress(account.address)}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* Header — click to copy */}
              <DropdownMenuLabel className="font-normal">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left cursor-pointer"
                  onClick={() => copyAddress(account.address)}
                >
                  {account.ensAvatar ? (
                    <Image
                      src={account.ensAvatar}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full shrink-0"
                    />
                  ) : (
                    <Blockie
                      address={account.address}
                      className="size-8 rounded-full shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {account.ensName && (
                      <p className="text-sm font-medium truncate">
                        {account.ensName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncateAddress(account.address)}
                    </p>
                    {connector && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {connector.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={connector.icon}
                            alt=""
                            className="size-3 rounded-sm"
                          />
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {connector.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {copied ? (
                    <Check className="size-3.5 text-green-500 shrink-0" />
                  ) : (
                    <Copy className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => push("/profile")}>
                  <User className="size-4" />
                  My Slots
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => push("/docs")}>
                  <BookOpen className="size-4" />
                  Docs
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Network className="size-4" />
                    Network
                    <span className="ml-auto text-xs text-muted-foreground">
                      {CHAINS.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {CHAINS.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => setChain(c.id)}
                      >
                        {c.name}
                        {c.id === chainId && (
                          <Check className="ml-auto size-3.5" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => disconnect()}
              >
                <LogOut className="size-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
