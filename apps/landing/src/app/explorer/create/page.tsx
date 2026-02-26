"use client";

import { slotsHubAbi, slotsHubAddress } from "@0xslots/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Address, isAddress, parseUnits, zeroAddress } from "viem";
import { normalize } from "viem/ens";
import {
  useAccount,
  useEnsAddress,
  useSimulateContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { useHubSettings, useLandsByOwner } from "@/app/explorer/hooks";
import { useChain } from "@/context/chain";
import { formatWei } from "@/utils";

interface SlotConfig {
  currency: string;
  basePrice: string;
  taxPercentage: string;
  maxTaxPercentage: string;
  minTaxUpdatePeriod: string;
  module: string;
  decimals: number;
}

function defaultSlotConfig(): SlotConfig {
  return {
    currency: zeroAddress,
    basePrice: "1",
    taxPercentage: "1",
    maxTaxPercentage: "10",
    minTaxUpdatePeriod: "7",
    module: zeroAddress,
    decimals: 18,
  };
}

function SlotConfigForm({
  config,
  onChange,
}: {
  config: SlotConfig;
  onChange: (s: SlotConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
          Currency Address
        </label>
        <input
          type="text"
          value={config.currency}
          onChange={(e) => onChange({ ...config, currency: e.target.value })}
          placeholder="0x..."
          className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Base Price
          </label>
          <input
            type="text"
            value={config.basePrice}
            onChange={(e) =>
              onChange({ ...config, basePrice: e.target.value })
            }
            placeholder="1.0"
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Decimals
          </label>
          <input
            type="number"
            value={config.decimals}
            onChange={(e) =>
              onChange({ ...config, decimals: Number(e.target.value) })
            }
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Tax Rate (%)
          </label>
          <input
            type="text"
            value={config.taxPercentage}
            onChange={(e) =>
              onChange({ ...config, taxPercentage: e.target.value })
            }
            placeholder="1"
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Max Tax Rate (%)
          </label>
          <input
            type="text"
            value={config.maxTaxPercentage}
            onChange={(e) =>
              onChange({ ...config, maxTaxPercentage: e.target.value })
            }
            placeholder="10"
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Min Tax Update (days)
          </label>
          <input
            type="text"
            value={config.minTaxUpdatePeriod}
            onChange={(e) =>
              onChange({ ...config, minTaxUpdatePeriod: e.target.value })
            }
            placeholder="7"
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
            Module Address
          </label>
          <input
            type="text"
            value={config.module}
            onChange={(e) => onChange({ ...config, module: e.target.value })}
            placeholder="0x000..."
            className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { chainId } = useChain();
  const hubAddress = slotsHubAddress[chainId];

  const { data: hubData, isLoading } = useHubSettings(chainId);
  const hub = hubData?.hub;

  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { mutate: switchChain } = useSwitchChain();
  const { mutate: writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Single mode — user always configures slot params
  const [useCustomOwner, setUseCustomOwner] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [slotConfig, setSlotConfig] = useState<SlotConfig | null>(null);
  const [slotCount, setSlotCount] = useState(1);

  // Initialize config when hub loads
  useEffect(() => {
    if (hub && !slotConfig) {
      setSlotConfig(defaultSlotConfig());
      setSlotCount(6);
    }
  }, [hub, slotConfig]);

  const isEns = /\.eth$/i.test(customInput.trim());
  const { data: ensResolvedAddress, isLoading: ensLoading } = useEnsAddress({
    name: isEns ? normalize(customInput.trim()) : undefined,
    chainId: mainnet.id,
  });

  const resolvedCustom = isEns ? (ensResolvedAddress ?? "") : customInput;
  const targetAddress = useCustomOwner ? resolvedCustom : (address ?? "");
  const isValidTarget = isAddress(targetAddress);

  const { data: existingLands } = useLandsByOwner(
    chainId,
    isValidTarget ? targetAddress : undefined,
  );
  const ownerHasLand = (existingLands?.length ?? 0) > 0;

  const wrongChain = walletChainId !== (chainId as number);

  function encodeSlotParam() {
    if (!slotConfig) return null;
    return {
      currency: slotConfig.currency as Address,
      basePrice: parseUnits(slotConfig.basePrice || "0", slotConfig.decimals),
      taxPercentage: BigInt(Math.round(Number(slotConfig.taxPercentage || "0") * 100)),
      maxTaxPercentage: BigInt(
        Math.round(Number(slotConfig.maxTaxPercentage || "0") * 100),
      ),
      minTaxUpdatePeriod: BigInt(
        Math.round(Number(slotConfig.minTaxUpdatePeriod || "0") * 86400),
      ),
      module: (slotConfig.module || zeroAddress) as Address,
    };
  }

  const canSimulate =
    isConnected &&
    isValidTarget &&
    !ownerHasLand &&
    !!hub &&
    !wrongChain;

  const { error: simulateError, isLoading: isSimulating } =
    useSimulateContract({
      address: hubAddress as Address,
      abi: slotsHubAbi,
      functionName: "openLand",
      args: [targetAddress as Address, encodeSlotParam()!, BigInt(slotCount)],
      value: hub ? BigInt(hub.landCreationFee) : undefined,
      query: { enabled: canSimulate && slotCount > 0 && !!slotConfig },
    });

  const simErrorMessage = simulateError
    ? ((simulateError.cause as any)?.reason ??
      (simulateError.cause as any)?.shortMessage ??
      simulateError.message)
    : null;

  const busy = isPending || isConfirming;

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        router.push("/explorer");
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router]);

  function handleCreate() {
    if (!isValidTarget || !hub || !slotConfig) return;
    writeContract({
      address: hubAddress as Address,
      abi: slotsHubAbi,
      functionName: "openLand",
      args: [targetAddress as Address, encodeSlotParam()!, BigInt(slotCount)],
      value: BigInt(hub.landCreationFee),
    });
  }

  const canCreate =
    isConnected && isValidTarget && !ownerHasLand && !!hub && !wrongChain;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Create Land
          </h1>
          <p className="text-gray-500 font-mono text-sm">
            Open a new land on-chain
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
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
        ) : hub ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Left column */}
            <div className="space-y-6">
              {/* Mode toggle */}
              <div className="border-2 border-black">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight">
                    Slot Configuration
                  </h2>
                </div>
                <div className="p-4">
                  {slotConfig ? (
                    <div className="space-y-4">
                      <div>
                        <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
                          Number of Slots
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={slotCount}
                          onChange={(e) => setSlotCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-20 border-2 border-black px-3 py-1.5 font-mono text-xs"
                        />
                        <p className="font-mono text-[10px] text-gray-400 mt-1">
                          This config will be applied to all {slotCount} slot{slotCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <SlotConfigForm config={slotConfig} onChange={setSlotConfig} />
                    </div>
                  ) : null}
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
                      onClick={() => setUseCustomOwner(false)}
                      className={`font-mono text-xs uppercase px-3 py-1.5 border-2 border-black transition-colors ${
                        !useCustomOwner
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      My Wallet
                    </button>
                    <button
                      onClick={() => setUseCustomOwner(true)}
                      className={`font-mono text-xs uppercase px-3 py-1.5 border-2 border-black transition-colors ${
                        useCustomOwner
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      Address or ENS
                    </button>
                  </div>

                  {useCustomOwner ? (
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
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-500">Slots</span>
                      <span className="font-bold">{slotCount}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-gray-500">Tax Rate</span>
                      <span className="font-bold">
                        {slotConfig ? `${slotConfig.taxPercentage}%` : "—"}
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
                            !canCreate ||
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
                                : `CREATE LAND (${slotCount} SLOTS)`}
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
