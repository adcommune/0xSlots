"use client";

import { slotsAbi } from "@0xslots/contracts";
import { useState } from "react";
import { erc20Abi, parseUnits, type Address } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { arbitrum } from "wagmi/chains";
import { EnsName } from "@/components/ens-name";
import { formatBalance, formatDuration, formatPrice } from "@/utils";

const CHAIN_ID = arbitrum.id;

// --- Types ---

interface SlotData {
  id: string;
  slotId: string;
  occupant: string | null;
  price: string;
  basePrice?: string;
  taxPercentage: string;
  active: boolean;
  currency: {
    id: string;
    name: string | null;
    symbol: string | null;
    decimals: number | null;
  };
}

interface LandViewProps {
  landId: string;
  landOwner: string;
  slots: SlotData[];
}

// --- Sub-components ---

function SlotEscrow({
  landAddress,
  slotId,
  isOccupied,
  currencySymbol,
  currencyDecimals,
}: {
  landAddress: string;
  slotId: number;
  isOccupied: boolean;
  currencySymbol: string;
  currencyDecimals: number;
}) {
  const contract = { address: landAddress as Address, abi: slotsAbi } as const;

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: "getEscrow", args: [BigInt(slotId)] },
      { ...contract, functionName: "taxOwed", args: [BigInt(slotId)] },
      {
        ...contract,
        functionName: "secondsUntilLiquidation",
        args: [BigInt(slotId)],
      },
    ],
    query: { enabled: isOccupied },
  });

  if (!isOccupied) {
    return (
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Balance</span>
          <span>—</span>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Balance</span>
          <span className="animate-pulse">Loading…</span>
        </div>
      </div>
    );
  }

  const escrow = data[0].result;
  const owed = data[1].result;
  const secsUntilLiq = data[2].result;

  if (!escrow || owed === undefined || secsUntilLiq === undefined) return null;

  const deposit = escrow.deposit;
  const remaining = deposit > owed ? deposit - owed : 0n;
  const isInsolvent = owed >= deposit;
  const secsNum = Number(secsUntilLiq);

  return (
    <div className="space-y-1.5 font-mono text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">Deposit</span>
        <span>
          {formatBalance(deposit, currencyDecimals)} {currencySymbol}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Tax Owed</span>
        <span>
          {formatBalance(owed, currencyDecimals)} {currencySymbol}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Balance</span>
        <span className={`font-bold ${isInsolvent ? "text-red-600" : ""}`}>
          {formatBalance(remaining, currencyDecimals)} {currencySymbol}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Liquidation</span>
        <span className={isInsolvent ? "text-red-600 font-bold" : ""}>
          {isInsolvent ? "NOW" : formatDuration(secsNum)}
        </span>
      </div>
      {isInsolvent && (
        <div className="border border-red-600 bg-red-50 text-red-800 text-center py-1 text-[10px] font-bold">
          INSOLVENT
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export function LandView({ landId, landOwner, slots }: LandViewProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [collectFrom, setCollectFrom] = useState("0");
  const [collectTo, setCollectTo] = useState(
    String(slots.length > 0 ? slots.length - 1 : 0),
  );

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const wrongChain = chainId !== CHAIN_ID;
  const busy = isPending || isConfirming;
  const isOwner = address?.toLowerCase() === landOwner.toLowerCase();

  const sorted = [...slots].sort((a, b) => Number(a.slotId) - Number(b.slotId));
  const selected = sorted.find((s) => s.slotId === selectedSlotId) ?? null;

  const selectedIsOccupied = selected
    ? !!selected.occupant &&
      selected.occupant !== "0x0000000000000000000000000000000000000000" &&
      selected.occupant.toLowerCase() !== landOwner.toLowerCase()
    : false;

  const isOccupant = selected?.occupant
    ? address?.toLowerCase() === selected.occupant.toLowerCase()
    : false;

  const currency = selected
    ? {
        symbol: selected.currency.symbol ?? "???",
        decimals: selected.currency.decimals ?? 18,
        address: selected.currency.id,
      }
    : null;

  function toUnits(value: string): bigint {
    try {
      return parseUnits(value || "0", currency?.decimals ?? 6);
    } catch {
      return 0n;
    }
  }

  async function approveAndCall(amount: bigint, fn: () => void) {
    if (!currency) return;
    try {
      await writeContractAsync({
        address: currency.address as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [landId as Address, amount],
      });
    } catch (e) {
      console.error("Approve failed:", e);
      return;
    }
    fn();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* Left: Slot Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((slot) => {
            const isOccupied =
              !!slot.occupant &&
              slot.occupant !== "0x0000000000000000000000000000000000000000" &&
              slot.occupant.toLowerCase() !== landOwner.toLowerCase();
            const cur = {
              symbol: slot.currency.symbol ?? "???",
              decimals: slot.currency.decimals ?? 18,
            };
            const isSelected = selectedSlotId === slot.slotId;

            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => {
                  setSelectedSlotId(slot.slotId);
                  setDepositAmount("");
                  setNewPrice("");
                  setWithdrawAmount("");
                }}
                className={`border-2 text-left transition-all ${
                  isSelected
                    ? "border-black ring-2 ring-black ring-offset-1"
                    : "border-black hover:border-gray-600"
                } ${!slot.active ? "opacity-40" : ""}`}
              >
                {/* Header */}
                <div
                  className={`px-3 py-2 border-b-2 border-black flex items-center justify-between ${
                    isOccupied ? "bg-black text-white" : "bg-gray-50"
                  }`}
                >
                  <span className="font-black text-xs">#{slot.slotId}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 border ${
                      isOccupied
                        ? "border-white/40 text-white/80"
                        : "border-black/30 text-black/60"
                    }`}
                  >
                    {isOccupied ? "OCCUPIED" : "VACANT"}
                  </span>
                </div>

                {/* Body */}
                <div className="px-3 py-2 space-y-1 font-mono text-[11px]">
                  {isOccupied && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Occupant</span>
                      <EnsName
                        address={slot.occupant ?? ""}
                        className="font-bold"
                      />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price</span>
                    <span className="font-bold">
                      {formatPrice(slot.price, cur.decimals)} {cur.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax</span>
                    <span>{Number(slot.taxPercentage) / 100}%/mo</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Land Owner Actions */}
        {isOwner && isConnected && !wrongChain && (
          <div className="border-2 border-black p-4">
            <h3 className="font-black text-xs uppercase mb-3">Collect Tax</h3>
            <div className="flex gap-2 items-end">
              <div>
                <label className="font-mono text-[10px] text-gray-500 block mb-1">
                  FROM
                </label>
                <input
                  type="number"
                  value={collectFrom}
                  onChange={(e) => setCollectFrom(e.target.value)}
                  className="border-2 border-black px-2 py-1 font-mono text-xs w-16"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-gray-500 block mb-1">
                  TO
                </label>
                <input
                  type="number"
                  value={collectTo}
                  onChange={(e) => setCollectTo(e.target.value)}
                  className="border-2 border-black px-2 py-1 font-mono text-xs w-16"
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  writeContract({
                    address: landId as Address,
                    abi: slotsAbi,
                    functionName: "collectRange",
                    args: [BigInt(collectFrom), BigInt(collectTo)],
                  })
                }
                className="border-2 border-black bg-black text-white px-3 py-1 font-mono text-xs uppercase hover:bg-white hover:text-black disabled:opacity-50"
              >
                {busy ? "..." : "COLLECT"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Checkout Sidebar */}
      <div className="lg:sticky lg:top-6">
        <div className="border-2 border-black">
          <div className="bg-gray-50 border-b-2 border-black p-3">
            <h2 className="text-sm font-bold uppercase tracking-tight">
              {selected ? `Slot #${selected.slotId}` : "Select a Slot"}
            </h2>
          </div>

          {!selected ? (
            <div className="p-6 text-center">
              <p className="font-mono text-xs text-gray-400">
                Click a slot to view details
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Recap */}
              <div className="p-4 space-y-1.5 font-mono text-xs">
                {selectedIsOccupied && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occupant</span>
                    <EnsName
                      address={selected.occupant ?? ""}
                      className="font-bold"
                      showAvatar
                    />
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-bold">{currency!.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-bold">
                    {formatPrice(selected.price, currency!.decimals)}{" "}
                    {currency!.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Price</span>
                  <span>
                    {formatPrice(
                      selected.basePrice ?? selected.price,
                      currency!.decimals,
                    )}{" "}
                    {currency!.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Rate</span>
                  <span>{Number(selected.taxPercentage) / 100}%/mo</span>
                </div>
              </div>

              {/* Balance */}
              <div className="p-4">
                <SlotEscrow
                  landAddress={landId}
                  slotId={Number(selected.slotId)}
                  isOccupied={selectedIsOccupied}
                  currencySymbol={currency!.symbol}
                  currencyDecimals={currency!.decimals}
                />
              </div>

              {/* Actions */}
              <div className="p-4 space-y-3">
                {!isConnected ? (
                  <p className="font-mono text-xs text-gray-400 text-center py-2">
                    CONNECT WALLET
                  </p>
                ) : wrongChain ? (
                  <button
                    type="button"
                    onClick={() => switchChain({ chainId: CHAIN_ID })}
                    className="w-full font-mono text-xs bg-red-900 border-2 border-red-500 text-red-300 px-3 py-2 hover:bg-red-800 uppercase tracking-widest"
                  >
                    Switch to Arbitrum
                  </button>
                ) : (
                  <>
                    {/* Buy (anyone who isn't the current occupant) */}
                    {(!selectedIsOccupied || !isOccupant) && (
                      <div className="space-y-2">
                        <label className="font-mono text-[10px] text-gray-500 block">
                          DEPOSIT ({currency!.symbol})
                        </label>
                        <input
                          type="text"
                          placeholder="1.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="border-2 border-black px-2 py-1.5 font-mono text-xs w-full"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const amt = toUnits(depositAmount);
                            const slotPrice = BigInt(selected.price);
                            const total = slotPrice + amt;
                            approveAndCall(total, () =>
                              writeContract({
                                address: landId as Address,
                                abi: slotsAbi,
                                functionName: "buy",
                                args: [BigInt(selected.slotId), amt],
                              }),
                            );
                          }}
                          className="w-full border-4 border-black bg-black text-white px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                        >
                          {busy
                            ? "PROCESSING..."
                            : selectedIsOccupied
                              ? "FORCE BUY"
                              : "BUY SLOT"}
                        </button>
                      </div>
                    )}

                    {/* Occupant actions */}
                    {isOccupant && (
                      <div className="space-y-3">
                        {/* Self-assess */}
                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">
                            NEW PRICE ({currency!.symbol})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="1.00"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                writeContract({
                                  address: landId as Address,
                                  abi: slotsAbi,
                                  functionName: "selfAssess",
                                  args: [
                                    BigInt(selected.slotId),
                                    toUnits(newPrice),
                                  ],
                                })
                              }
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
                            >
                              {busy ? "..." : "SET"}
                            </button>
                          </div>
                        </div>

                        {/* Add deposit */}
                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">
                            ADD DEPOSIT ({currency!.symbol})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="1.00"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                const amt = toUnits(depositAmount);
                                approveAndCall(amt, () =>
                                  writeContract({
                                    address: landId as Address,
                                    abi: slotsAbi,
                                    functionName: "deposit",
                                    args: [BigInt(selected.slotId), amt],
                                  }),
                                );
                              }}
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
                            >
                              {busy ? "..." : "ADD"}
                            </button>
                          </div>
                        </div>

                        {/* Withdraw */}
                        <div>
                          <label className="font-mono text-[10px] text-gray-500 block mb-1">
                            WITHDRAW ({currency!.symbol})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="1.00"
                              value={withdrawAmount}
                              onChange={(e) =>
                                setWithdrawAmount(e.target.value)
                              }
                              className="border-2 border-black px-2 py-1 font-mono text-xs flex-1"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                writeContract({
                                  address: landId as Address,
                                  abi: slotsAbi,
                                  functionName: "withdraw",
                                  args: [
                                    BigInt(selected.slotId),
                                    toUnits(withdrawAmount),
                                  ],
                                })
                              }
                              className="border-2 border-black px-3 py-1 font-mono text-xs uppercase hover:bg-black hover:text-white disabled:opacity-50"
                            >
                              {busy ? "..." : "OUT"}
                            </button>
                          </div>
                        </div>

                        {/* Release */}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            writeContract({
                              address: landId as Address,
                              abi: slotsAbi,
                              functionName: "release",
                              args: [BigInt(selected.slotId)],
                            })
                          }
                          className="w-full border-2 border-red-600 text-red-600 px-3 py-1.5 font-mono text-xs uppercase hover:bg-red-600 hover:text-white disabled:opacity-50"
                        >
                          {busy ? "..." : "RELEASE SLOT"}
                        </button>
                      </div>
                    )}

                    {/* Liquidate (anyone, if occupied and not occupant) */}
                    {selectedIsOccupied && !isOccupant && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          writeContract({
                            address: landId as Address,
                            abi: slotsAbi,
                            functionName: "liquidate",
                            args: [BigInt(selected.slotId)],
                          })
                        }
                        className="w-full border-2 border-red-600 text-red-600 px-3 py-1.5 font-mono text-xs uppercase hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {busy ? "..." : "LIQUIDATE"}
                      </button>
                    )}

                    {isSuccess && (
                      <p className="font-mono text-xs text-green-600 text-center">
                        TX CONFIRMED
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
