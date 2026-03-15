"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { AccountTypeIcon } from "@/components/account-type-icon";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { PageHeader } from "@/components/page-header";
import { useSlotsOnChain } from "@/hooks/use-slot-onchain";
import { type V3Slot, useSlotsByOccupant, useSlotsByRecipient } from "@/hooks/use-v3";
import { formatBalance, truncateAddress } from "@/utils";

function SlotTable({
  slots,
  subgraphSlots,
  isLoading,
  emptyMessage,
}: {
  slots: ReturnType<typeof useSlotsOnChain>["data"];
  subgraphSlots: V3Slot[];
  isLoading: boolean;
  emptyMessage: string;
}) {
  const decimals = slots[0]?.currencyDecimals ?? 6;
  const symbol = slots[0]?.currencySymbol ?? "USDC";

  // Build lookup map for account types from subgraph data
  const subgraphMap = new Map(subgraphSlots.map((s) => [s.id, s]));

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <p className="text-sm text-muted-foreground">Loading slots...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">Slot</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Recipient</th>
              <th className="px-4 py-2">Occupant</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Deposit</th>
              <th className="px-4 py-2 text-right">Tax Owed</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => {
              const sg = subgraphMap.get(s.id);
              return (
              <tr
                key={s.id}
                className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => { window.location.href = `/slots/${s.id}`; }}
              >
                <td className="px-4 py-2 text-xs">{truncateAddress(s.id)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                      s.insolvent
                        ? "bg-destructive/10 text-destructive"
                        : s.occupant
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.insolvent
                      ? "INSOLVENT"
                      : s.occupant
                        ? "OCCUPIED"
                        : "VACANT"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    {sg?.recipientAccount?.type && (
                      <AccountTypeIcon type={sg.recipientAccount.type} className="h-3 w-3" />
                    )}
                    {truncateAddress(s.recipient)}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">
                  {s.occupant ? (
                    <span className="inline-flex items-center gap-1.5">
                      {sg?.occupantAccount?.type && (
                        <AccountTypeIcon type={sg.occupantAccount.type} className="h-3 w-3" />
                      )}
                      {truncateAddress(s.occupant)}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatUnits(s.price, decimals)} {symbol}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatUnits(s.deposit, decimals)} {symbol}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatUnits(s.taxOwed, decimals)} {symbol}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileContent({ address }: { address: string }) {
  const { data: recipientSubgraph, isLoading: recipientSubLoading } =
    useSlotsByRecipient(address);
  const { data: occupantSubgraph, isLoading: occupantSubLoading } =
    useSlotsByOccupant(address);

  const recipientAddresses = recipientSubgraph?.map((s) => s.id) ?? [];
  const occupantAddresses = occupantSubgraph?.map((s) => s.id) ?? [];

  const { data: recipientSlots, isLoading: recipientOnchainLoading } =
    useSlotsOnChain(recipientAddresses);
  const { data: occupantSlots, isLoading: occupantOnchainLoading } =
    useSlotsOnChain(occupantAddresses);

  const recipientLoading = recipientSubLoading || recipientOnchainLoading;
  const occupantLoading = occupantSubLoading || occupantOnchainLoading;

  const decimals =
    recipientSlots[0]?.currencyDecimals ??
    occupantSlots[0]?.currencyDecimals ??
    6;
  const symbol =
    recipientSlots[0]?.currencySymbol ??
    occupantSlots[0]?.currencySymbol ??
    "USDC";

  const totalTaxOwed = recipientSlots.reduce((sum, s) => sum + s.taxOwed, 0n);
  const totalDeposit = occupantSlots.reduce((sum, s) => sum + s.deposit, 0n);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Owned Slots</p>
          <p className="text-lg font-bold">{recipientSlots.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Occupying</p>
          <p className="text-lg font-bold">{occupantSlots.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Collectable Tax</p>
          <p className="text-lg font-bold">
            {formatBalance(totalTaxOwed, decimals)} {symbol}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Deposit</p>
          <p className="text-lg font-bold">
            {formatBalance(totalDeposit, decimals)} {symbol}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ExplorerTabs
        tabs={[
          {
            id: "owned",
            label: `Owned (${recipientSlots.length})`,
            content: () => (
              <SlotTable
                slots={recipientSlots}
                subgraphSlots={recipientSubgraph ?? []}
                isLoading={recipientLoading}
                emptyMessage="You don't own any slots yet"
              />
            ),
          },
          {
            id: "occupying",
            label: `Occupying (${occupantSlots.length})`,
            content: () => (
              <SlotTable
                slots={occupantSlots}
                subgraphSlots={occupantSubgraph ?? []}
                isLoading={occupantLoading}
                emptyMessage="You're not occupying any slots"
              />
            ),
          },
        ]}
      />
    </>
  );
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div>
          <Link
            href="/explorer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Explorer
          </Link>
          <h1 className="text-xl font-bold tracking-tight leading-tight">
            My Profile
          </h1>
          {address && (
            <p className="text-xs text-muted-foreground">
              {truncateAddress(address)}
            </p>
          )}
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {!isConnected || !address ? (
          <div className="rounded-lg border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to see your slots
            </p>
          </div>
        ) : (
          <ProfileContent address={address} />
        )}
      </div>
    </div>
  );
}
