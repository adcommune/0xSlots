"use client";

import {
  Banknote,
  HandCoins,
  LandPlot,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { type Address, formatUnits } from "viem";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { AccountTypeIcon } from "@/components/account-type-icon";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { useChain } from "@/context/chain";
import { useSlotsOnChain } from "@/hooks/use-slot-onchain";
import { useSlotsByRecipient } from "@/hooks/use-v3";
import { formatBalance, truncateAddress } from "@/utils";

export default function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { explorerUrl } = useChain();
  const { push } = useRouter();

  // Step 1: Get slot addresses from subgraph (discovery only)
  const { data: subgraphSlots, isLoading: subgraphLoading } =
    useSlotsByRecipient(address);
  const slotAddresses = subgraphSlots?.map((s) => s.id) ?? [];

  // Step 2: Get live on-chain data for all slots via multicall
  const { data: slots, isLoading: onchainLoading } =
    useSlotsOnChain(slotAddresses);

  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId: mainnet.id,
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  const isLoading = subgraphLoading || onchainLoading;
  const subgraphMap = new Map((subgraphSlots ?? []).map((s) => [s.id, s]));
  const occupied = slots.filter((s) => s.occupant != null);
  const vacant = slots.length - occupied.length;
  const decimals = slots[0]?.currencyDecimals ?? 6;
  const symbol = slots[0]?.currencySymbol ?? "USDC";
  const totalTaxOwed = slots.reduce((sum, s) => sum + s.taxOwed, 0n);
  const totalDeposit = slots.reduce((sum, s) => sum + s.deposit, 0n);

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div className="flex items-center gap-4">
          {ensAvatar && (
            <img
              src={ensAvatar}
              alt={ensName ?? address}
              className="w-12 h-12 rounded-full border"
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/explorer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Explorer
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              {ensName ?? "Recipient"}
            </h1>
            <a
              href={`${explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {truncateAddress(address)}
            </a>
          </div>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            {
              label: "Total Slots",
              value: slots.length.toString(),
              icon: LandPlot,
            },
            {
              label: "Occupied",
              value: occupied.length.toString(),
              icon: UserCheck,
            },
            { label: "Vacant", value: vacant.toString(), icon: XCircle },
            {
              label: "Pending Tax",
              value: `${formatBalance(totalTaxOwed, decimals)} ${symbol}`,
              icon: HandCoins,
            },
            {
              label: "Total Deposit",
              value: `${formatBalance(totalDeposit, decimals)} ${symbol}`,
              icon: Banknote,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon className="size-3" />
                  {stat.label}
                </p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Slots Table */}
        <div className="rounded-lg border">
          <div className="bg-muted/50 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Slots</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center animate-pulse">
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No slots found for this recipient
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2">Slot</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Occupant</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Tax</th>
                    <th className="px-4 py-2 text-right">Deposit</th>
                    <th className="px-4 py-2 text-right">Tax Owed</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => {
                        push(`/slots/${s.id}`);
                      }}
                    >
                      <td className="px-4 py-2 text-xs">
                        {truncateAddress(s.id)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            s.insolvent
                              ? "destructive"
                              : s.occupant
                                ? "default"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {s.insolvent
                            ? "INSOLVENT"
                            : s.occupant
                              ? "OCCUPIED"
                              : "VACANT"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {(() => {
                          if (!s.occupant) return "—";
                          const occupantType = subgraphMap.get(s.id)?.occupantAccount?.type;
                          return (
                            <span className="inline-flex items-center gap-1.5">
                              {occupantType && <AccountTypeIcon type={occupantType} className="h-3 w-3" />}
                              {truncateAddress(s.occupant)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.price, decimals)} {symbol}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(s.taxPercentage) / 100}%
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.deposit, decimals)} {symbol}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatUnits(s.taxOwed, decimals)} {symbol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
