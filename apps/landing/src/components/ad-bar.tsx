"use client";

import { Ad, AdBadge, AdEmpty, AdImage, AdLoaded, AdLoading, AdTitle } from "@adland/react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { alchemyRpcUrl } from "@0xslots/config/transports";
import { useChain } from "@/context/chain";
import { AD_SLOTS, alchemyKey, APP_URL } from "@/constants";

function AdCard({ slot, chainId, rpcUrl }: { slot: string; chainId: number; rpcUrl?: string }) {
  return (
    <Ad
      slot={slot}
      chainId={chainId}
      rpcUrl={rpcUrl}
      baseLinkUrl={APP_URL}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors h-18"
    >
      <AdLoaded className="flex items-center gap-3 w-full">
        <AdImage className="size-12 rounded-md object-cover shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <AdTitle className="text-sm font-medium truncate" />
          <AdBadge className="flex items-center gap-1 text-[10px] text-muted-foreground" />
        </div>
      </AdLoaded>
      <AdEmpty className="flex items-center justify-center w-full text-sm text-muted-foreground">
        Your ad here
      </AdEmpty>
      <AdLoading className="flex items-center gap-3 w-full animate-pulse">
        <div className="size-12 rounded-md bg-muted shrink-0" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </AdLoading>
    </Ad>
  );
}

export function AdBar() {
  const { chainId } = useChain();
  const slots = AD_SLOTS[chainId];
  const rpcUrl = alchemyKey ? alchemyRpcUrl(chainId, alchemyKey) : undefined;

  if (!slots?.length) return null;

  return (
    <div className="mb-4">
      {/* Mobile: carousel */}
      <div className="md:hidden">
        <Carousel
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        >
          <CarouselContent>
            {slots.map((slot) => (
              <CarouselItem key={slot}>
                <AdCard slot={slot} chainId={chainId} rpcUrl={rpcUrl} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: flex row */}
      <div className="hidden md:grid md:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <AdCard key={slot} slot={slot} chainId={chainId} />
        ))}
      </div>
    </div>
  );
}
