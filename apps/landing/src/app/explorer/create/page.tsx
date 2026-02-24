"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useEnsAddress,
  useSimulateContract,
} from "wagmi";
import { isAddress, type Address } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "wagmi/chains";
import { parseChain } from "@/lib/config";
import { useHubSettings, useLandsByOwner, HUB_IDS } from "@/app/explorer/hooks";
import { slotsHubAbi } from "@0xslots/contracts";
import { formatWei, formatBps } from "@/utils";

function CreateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chainParam = searchParams.get("chain") ?? undefined;
  const chainId = parseChain(chainParam);
  const hubAddress = HUB_IDS[chainId];

  const { data: hubData, isLoading } = useHubSettings(chainId);
  const hub = hubData?.hub;

  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { mutate: switchChain } = useSwitchChain();
  const { mutate: writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [useCustom, setUseCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const isEns = /\.eth$/i.test(customInput.trim());
  const { data: ensResolvedAddress, isLoading: ensLoading } = useEnsAddress({
    name: isEns ? normalize(customInput.trim()) : undefined,
    chainId: mainnet.id,
  });

  const resolvedCustom = isEns ? (ensResolvedAddress ?? "") : customInput;
  const targetAddress = useCustom ? resolvedCustom : (address ?? "");
  const isValidTarget = isAddress(targetAddress);

  const { data: existingLands } = useLandsByOwner(
    chainId,
    isValidTarget ? targetAddress : undefined,
  );
  const ownerHasLand = (existingLands?.length ?? 0) > 0;

  const canSimulate =
    isConnected &&
    isValidTarget &&
    !ownerHasLand &&
    !!hub &&
    walletChainId === (chainId as number);
  const { error: simulateError, isLoading: isSimulating } = useSimulateContract(
    {
      address: hubAddress as Address,
      abi: slotsHubAbi,
      functionName: "openLand",
      args: canSimulate ? [targetAddress as Address] : undefined,
      value: hub ? BigInt(hub.landCreationFee) : undefined,
      query: { enabled: canSimulate },
    },
  );

  if (simulateError) {
    console.error("[openLand simulation]", simulateError);
  }

  const simErrorMessage = simulateError
    ? ((simulateError.cause as any)?.reason ??
      (simulateError.cause as any)?.shortMessage ??
      simulateError.message)
    : null;

  const wrongChain = walletChainId !== (chainId as number);
  const busy = isPending || isConfirming;

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        router.push(`/explorer?chain=${chainParam || "arbitrum"}`);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router, chainParam]);

  function handleCreate() {
    if (!isValidTarget || !hub) return;
    writeContract({
      address: hubAddress as Address,
      abi: slotsHubAbi,
      functionName: "openLand",
      args: [targetAddress as Address],
      value: BigInt(hub.landCreationFee),
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Create Land
          </h1>
          <p className="text-gray-500 font-mono text-sm">
            Open a new land on-chain with hub defaults
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="space-y-6">
              <div className="border-2 border-black">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <div className="h-5 w-48 bg-gray-200 animate-pulse" />
                </div>
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 w-32 bg-gray-100 animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="h-5 w-24 bg-gray-200 animate-pulse mb-4" />
              <div className="h-10 w-full bg-gray-100 animate-pulse" />
            </div>
          </div>
        ) : hub ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Left column — config cards */}
            <div className="space-y-6">
              {/* Defaults info panel */}
              <div className="border-2 border-black">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight">
                    Land Defaults
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {[
                    ["Creation Fee", `${formatWei(hub.landCreationFee)} ETH`],
                    ["Initial Slots", hub.defaultSlotCount],
                    [
                      "Default Price",
                      `${formatWei(
                        hub.defaultPrice,
                        hub.defaultCurrency?.decimals ?? 18,
                      )} ${hub.defaultCurrency?.symbol || ""}`,
                    ],
                    [
                      "Default Currency",
                      hub.defaultCurrency
                        ? `${
                            hub.defaultCurrency.symbol
                          } (${hub.defaultCurrency.id.slice(
                            0,
                            6,
                          )}…${hub.defaultCurrency.id.slice(-4)})`
                        : "—",
                    ],
                    ["Tax Rate", formatBps(hub.defaultTaxPercentage)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <span className="font-mono text-xs text-gray-500 uppercase">
                        {label}
                      </span>
                      <span className="font-mono text-xs font-bold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner address section */}
              <div className="border-2 border-black">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight">
                    Land Owner
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUseCustom(false)}
                      className={`font-mono text-xs uppercase px-3 py-1.5 border-2 border-black transition-colors ${
                        !useCustom
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      My Wallet
                    </button>
                    <button
                      onClick={() => setUseCustom(true)}
                      className={`font-mono text-xs uppercase px-3 py-1.5 border-2 border-black transition-colors ${
                        useCustom
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      Address or ENS
                    </button>
                    <button
                      type="button"
                      disabled
                      className="font-mono text-xs uppercase px-3 py-1.5 border-2 border-gray-300 text-gray-300 cursor-not-allowed"
                      title="Coming soon"
                    >
                      Group
                    </button>
                  </div>

                  {useCustom ? (
                    <div>
                      <label className="font-mono text-xs text-gray-500 block mb-1">
                        ADDRESS OR ENS NAME
                      </label>
                      <input
                        type="text"
                        placeholder="0x... or vitalik.eth"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className={`w-full border-2 px-3 py-2 font-mono text-xs ${
                          customInput && !isValidTarget && !ensLoading
                            ? "border-red-500"
                            : "border-black"
                        }`}
                      />
                      {isEns && ensLoading && (
                        <p className="font-mono text-xs text-gray-400 mt-1">
                          Resolving ENS...
                        </p>
                      )}
                      {isEns && !ensLoading && ensResolvedAddress && (
                        <p className="font-mono text-xs text-green-600 mt-1 break-all">
                          {ensResolvedAddress}
                        </p>
                      )}
                      {isEns &&
                        !ensLoading &&
                        customInput &&
                        !ensResolvedAddress && (
                          <p className="font-mono text-xs text-red-500 mt-1">
                            ENS name not found
                          </p>
                        )}
                      {!isEns && customInput && !isValidTarget && (
                        <p className="font-mono text-xs text-red-500 mt-1">
                          Invalid address
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-mono text-xs break-all">
                      {address ? (
                        <span className="text-black">{address}</span>
                      ) : (
                        <span className="text-gray-400">
                          Connect wallet to see address
                        </span>
                      )}
                    </p>
                  )}

                  <p className="font-mono text-[10px] text-gray-400">
                    The land will be owned by this address. The creation fee is
                    paid by your connected wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Right column — Checkout */}
            <div className="lg:sticky lg:top-6">
              <div className="border-2 border-black">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight">
                    Checkout
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-500">Slots</span>
                      <span className="font-bold">{hub.defaultSlotCount}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-500">Tax Rate</span>
                      <span className="font-bold">
                        {formatBps(hub.defaultTaxPercentage)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-500">Owner</span>
                      <span className="font-bold truncate max-w-[160px]">
                        {isValidTarget
                          ? `${targetAddress.slice(0, 6)}…${targetAddress.slice(-4)}`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-3">
                    <div className="flex justify-between font-mono text-xs mb-4">
                      <span className="text-gray-500">Creation Fee</span>
                      <span className="font-black text-sm">
                        {formatWei(hub.landCreationFee)} ETH
                      </span>
                    </div>

                    {!isConnected ? (
                      <p className="font-mono text-xs text-gray-400 text-center py-2">
                        CONNECT WALLET
                      </p>
                    ) : ownerHasLand ? (
                      <div className="border-2 border-yellow-500 bg-yellow-50 px-3 py-2 text-center">
                        <p className="font-mono text-xs text-yellow-700 font-bold">
                          LAND ALREADY EXISTS
                        </p>
                        <p className="font-mono text-[10px] text-yellow-600 mt-1">
                          This address already owns a land
                        </p>
                      </div>
                    ) : wrongChain ? (
                      <button
                        onClick={() => switchChain({ chainId: chainId })}
                        className="w-full font-mono text-xs bg-red-900 border-2 border-red-500 text-red-300 px-4 py-3 hover:bg-red-800 uppercase tracking-widest"
                      >
                        Switch Chain
                      </button>
                    ) : isSuccess ? (
                      <div className="text-center space-y-1 py-2">
                        <p className="font-mono text-sm text-green-600 font-bold">
                          LAND CREATED
                        </p>
                        <p className="font-mono text-[10px] text-gray-500">
                          Redirecting...
                        </p>
                      </div>
                    ) : (
                      <>
                        {simErrorMessage && (
                          <div className="border-2 border-red-500 bg-red-50 px-3 py-2 mb-3">
                            <p className="font-mono text-[10px] text-red-600 break-all">
                              {simErrorMessage}
                            </p>
                          </div>
                        )}
                        <button
                          disabled={
                            busy ||
                            !isValidTarget ||
                            !!simulateError ||
                            isSimulating
                          }
                          onClick={handleCreate}
                          className="w-full border-4 border-black bg-black text-white px-4 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                        >
                          {isPending
                            ? "CONFIRM IN WALLET..."
                            : isConfirming
                              ? "CONFIRMING..."
                              : isSimulating
                                ? "SIMULATING..."
                                : "CREATE LAND"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-black p-12 text-center">
            <p className="font-mono text-sm text-gray-500">NO HUB DATA</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="h-10 w-48 bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 animate-pulse mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<CreateSkeleton />}>
      <CreateContent />
    </Suspense>
  );
}
