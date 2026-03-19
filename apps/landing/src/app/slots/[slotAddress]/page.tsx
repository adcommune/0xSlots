import { DEFAULT_CHAIN } from "@0xslots/contracts";
import type { SlotsChain } from "@0xslots/sdk";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import {
  slotQueryOptions,
  slotActivityQueryOptions,
} from "@/hooks/slot-queries";

import { SlotPageContent } from "./slot-page-content";

export default async function SlotPage({
  params,
}: {
  params: Promise<{ slotAddress: string }>;
}) {
  const { slotAddress } = await params;
  const chainId = DEFAULT_CHAIN.id as SlotsChain;

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(slotQueryOptions(chainId, slotAddress)),
    queryClient.prefetchQuery(slotActivityQueryOptions(chainId, slotAddress)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-6 py-12">
              <div className="rounded-lg border p-12 text-center animate-pulse">
                <p className="text-sm text-muted-foreground">
                  Loading slot...
                </p>
              </div>
            </div>
          </div>
        }
      >
        <SlotPageContent slotAddress={slotAddress} />
      </Suspense>
    </HydrationBoundary>
  );
}
