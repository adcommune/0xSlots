"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Address, isAddress, parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ConnectButton } from "@/components/connect-button";
import { truncateAddress } from "@/utils";

const CHAIN_ID = baseSepolia.id;
const FACTORY_ADDRESS = "0xd8d1b8DaeC8Dd0Ad62a5C30Ccd1BaBF98916edc4" as Address;

const factoryAbi = [
  {
    type: "function", name: "createSlot",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "currency", type: "address" },
      { name: "config", type: "tuple", components: [
        { name: "mutableTax", type: "bool" },
        { name: "mutableModule", type: "bool" },
        { name: "manager", type: "address" },
      ]},
      { name: "initParams", type: "tuple", components: [
        { name: "taxPercentage", type: "uint256" },
        { name: "module", type: "address" },
        { name: "liquidationBountyBps", type: "uint256" },
        { name: "minDepositSeconds", type: "uint256" },
      ]},
    ],
    outputs: [{ name: "slot", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "predictSlotAddress",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "currency", type: "address" },
      { name: "config", type: "tuple", components: [
        { name: "mutableTax", type: "bool" },
        { name: "mutableModule", type: "bool" },
        { name: "manager", type: "address" },
      ]},
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [recipient, setRecipient] = useState("");
  const [currency, setCurrency] = useState(USDC_ADDRESS);
  const [taxPercentage, setTaxPercentage] = useState("1");
  const [module, setModule] = useState("");
  const [manager, setManager] = useState("");
  const [mutableTax, setMutableTax] = useState(false);
  const [mutableModule, setMutableModule] = useState(false);
  const [liquidationBountyBps, setLiquidationBountyBps] = useState("500");
  const [minDepositSeconds, setMinDepositSeconds] = useState("86400");
  const [predictedAddress, setPredictedAddress] = useState<string | null>(null);

  const needsManager = mutableTax || mutableModule;
  const effectiveManager = needsManager ? manager : zeroAddress;
  const effectiveRecipient = recipient || (address ?? "");

  const wrongChain = walletChainId !== CHAIN_ID;
  const busy = isPending || isConfirming;

  // Predict address
  const configTuple = {
    mutableTax,
    mutableModule,
    manager: (isAddress(effectiveManager) ? effectiveManager : zeroAddress) as Address,
  };

  const canPredict = isAddress(effectiveRecipient) && isAddress(currency);

  const { data: predicted, refetch: refetchPredict } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "predictSlotAddress",
    args: [effectiveRecipient as Address, currency as Address, configTuple],
    query: { enabled: false },
  });

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => router.push("/explorer"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router]);

  function handlePredict() {
    if (canPredict) refetchPredict().then((r) => {
      if (r.data) setPredictedAddress(r.data as string);
    });
  }

  function handleCreate() {
    if (!isAddress(effectiveRecipient) || !isAddress(currency)) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "createSlot",
      args: [
        effectiveRecipient as Address,
        currency as Address,
        configTuple,
        {
          taxPercentage: BigInt(Math.round(Number(taxPercentage) * 100)),
          module: (isAddress(module) ? module : zeroAddress) as Address,
          liquidationBountyBps: BigInt(liquidationBountyBps || "0"),
          minDepositSeconds: BigInt(minDepositSeconds || "0"),
        },
      ],
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Create Slot</h1>
          <p className="text-gray-500 font-mono text-sm">Deploy a new Harberger tax slot on Base Sepolia</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Recipient */}
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Recipient</h2>
              </div>
              <div className="p-4 space-y-3">
                <input type="text" placeholder={address ?? "0x..."} value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 font-mono text-xs" />
                <p className="font-mono text-[10px] text-gray-400">
                  Tax revenue goes to this address. Leave empty to use your wallet.
                </p>
              </div>
            </div>

            {/* Currency */}
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Currency</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setCurrency(USDC_ADDRESS)}
                    className={`font-mono text-xs px-3 py-1.5 border-2 border-black ${currency === USDC_ADDRESS ? "bg-black text-white" : ""}`}>
                    USDC
                  </button>
                  <button onClick={() => setCurrency("")}
                    className={`font-mono text-xs px-3 py-1.5 border-2 border-black ${currency !== USDC_ADDRESS ? "bg-black text-white" : ""}`}>
                    Custom
                  </button>
                </div>
                {currency !== USDC_ADDRESS && (
                  <input type="text" placeholder="0x... ERC20 address" value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-xs" />
                )}
              </div>
            </div>

            {/* Slot Parameters */}
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Slot Parameters</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Tax Rate (%/mo)</label>
                    <input type="text" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)}
                      className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Liq. Bounty (bps)</label>
                    <input type="text" value={liquidationBountyBps} onChange={(e) => setLiquidationBountyBps(e.target.value)}
                      className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Min Deposit (seconds)</label>
                  <input type="text" value={minDepositSeconds} onChange={(e) => setMinDepositSeconds(e.target.value)}
                    className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Module (optional)</label>
                  <input type="text" placeholder="0x... or leave empty" value={module} onChange={(e) => setModule(e.target.value)}
                    className="w-full border-2 border-black px-3 py-1.5 font-mono text-xs" />
                </div>
              </div>
            </div>

            {/* Mutability */}
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Mutability & Manager</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
                    <input type="checkbox" checked={mutableTax} onChange={(e) => setMutableTax(e.target.checked)}
                      className="accent-black w-4 h-4" />
                    Mutable Tax
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
                    <input type="checkbox" checked={mutableModule} onChange={(e) => setMutableModule(e.target.checked)}
                      className="accent-black w-4 h-4" />
                    Mutable Module
                  </label>
                </div>
                {needsManager && (
                  <div>
                    <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Manager Address (required)</label>
                    <input type="text" placeholder="0x..." value={manager} onChange={(e) => setManager(e.target.value)}
                      className={`w-full border-2 px-3 py-2 font-mono text-xs ${manager && !isAddress(manager) ? "border-red-500" : "border-black"}`} />
                  </div>
                )}
                {!needsManager && (
                  <p className="font-mono text-[10px] text-gray-400">No manager needed when both flags are off.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="lg:sticky lg:top-6">
            <div className="border-2 border-black">
              <div className="bg-gray-50 border-b-2 border-black p-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">Checkout</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recipient</span>
                    <span className="font-bold truncate max-w-[160px]">
                      {isAddress(effectiveRecipient) ? truncateAddress(effectiveRecipient) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax Rate</span>
                    <span className="font-bold">{taxPercentage}%/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Liq. Bounty</span>
                    <span className="font-bold">{Number(liquidationBountyBps) / 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mutable</span>
                    <span className="font-bold">
                      {mutableTax && mutableModule ? "Tax + Module" : mutableTax ? "Tax" : mutableModule ? "Module" : "None"}
                    </span>
                  </div>
                </div>

                {/* Predict */}
                {predictedAddress && (
                  <div className="border-2 border-green-500 bg-green-50 px-3 py-2">
                    <p className="font-mono text-[10px] text-green-700 font-bold">PREDICTED ADDRESS</p>
                    <p className="font-mono text-xs text-green-800 break-all mt-1">{predictedAddress}</p>
                  </div>
                )}

                <button onClick={handlePredict} disabled={!canPredict}
                  className="w-full border-2 border-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-50">
                  PREDICT ADDRESS
                </button>

                <div className="border-t-2 border-black pt-3">
                  {!isConnected ? (
                    <p className="font-mono text-xs text-gray-400 text-center py-2">CONNECT WALLET</p>
                  ) : wrongChain ? (
                    <button onClick={() => switchChain({ chainId: CHAIN_ID })}
                      className="w-full font-mono text-xs bg-red-900 border-2 border-red-500 text-red-300 px-4 py-3 hover:bg-red-800 uppercase tracking-widest">
                      Switch to Base Sepolia
                    </button>
                  ) : isSuccess ? (
                    <div className="text-center space-y-1 py-2">
                      <p className="font-mono text-sm text-green-600 font-bold">✓ SLOT CREATED</p>
                      <p className="font-mono text-[10px] text-gray-500">Redirecting...</p>
                    </div>
                  ) : (
                    <button disabled={busy || !isAddress(effectiveRecipient) || !isAddress(currency)}
                      onClick={handleCreate}
                      className="w-full border-4 border-black bg-black text-white px-4 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                      {isPending ? "CONFIRM IN WALLET..." : isConfirming ? "CONFIRMING..." : "CREATE SLOT"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
