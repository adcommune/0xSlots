"use client";

import type {
  BuyParams,
  CreateSlotParams,
  CreateSlotsParams,
} from "@0xslots/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Address, Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { useSlotsClient } from "./use-slots-client";
import useIPFSUpload from "./use-upload";

function extractErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return message.includes("User rejected") || message.includes("User denied")
    ? "Transaction rejected"
    : message.split("\n")[0] || "Transaction failed";
}

export function useSlotAction() {
  const client = useSlotsClient();
  const { upload } = useIPFSUpload();

  // --- state ---
  const [hash, setHash] = useState<Hash | undefined>();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const labelRef = useRef<string>("");

  // --- receipt tracking (mirrors old useWaitForTransactionReceipt) ---
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({ hash });

  const busy = isPending || isConfirming;

  // --- toast on success ---
  useEffect(() => {
    if (isSuccess && labelRef.current) {
      toast.success(`${labelRef.current} confirmed`);
      setActiveAction(null);
      labelRef.current = "";
    }
  }, [isSuccess]);

  // --- toast on on-chain error ---
  useEffect(() => {
    if (isError && labelRef.current) {
      toast.error(`${labelRef.current} failed on-chain`);
      setActiveAction(null);
      labelRef.current = "";
    }
  }, [isError]);

  // --- reset if everything settles with no result ---
  useEffect(() => {
    if (!isPending && !isConfirming && !isSuccess && !isError) {
      setActiveAction(null);
    }
  }, [isPending, isConfirming, isSuccess, isError]);

  /**
   * Execute an SDK method with shared pending/toast/receipt tracking.
   */
  const exec = useCallback(async (label: string, fn: () => Promise<Hash>) => {
    labelRef.current = label;
    setActiveAction(label);
    setIsPending(true);
    setHash(undefined);
    try {
      const txHash = await fn();
      setHash(txHash);
    } catch (error) {
      setActiveAction(null);
      labelRef.current = "";
      toast.error(`${label}: ${extractErrorMessage(error)}`);
    } finally {
      setIsPending(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Named actions — each calls one SDK method
  // ═══════════════════════════════════════════════════════════════════════════

  // Factory
  const createSlot = useCallback(
    (params: CreateSlotParams) =>
      exec("Create slot", () => client.createSlot(params)),
    [exec, client],
  );
  const createSlots = useCallback(
    (params: CreateSlotsParams) =>
      exec("Create slots", () => client.createSlots(params)),
    [exec, client],
  );

  // Slot interactions
  const buy = useCallback(
    (params: BuyParams) => exec("Buy slot", () => client.buy(params)),
    [exec, client],
  );
  const selfAssess = useCallback(
    (slot: Address, newPrice: bigint) =>
      exec("Set price", () => client.selfAssess(slot, newPrice)),
    [exec, client],
  );
  const topUp = useCallback(
    (slot: Address, amount: bigint) =>
      exec("Top up", () => client.topUp(slot, amount)),
    [exec, client],
  );
  const withdraw = useCallback(
    (slot: Address, amount: bigint) =>
      exec("Withdraw", () => client.withdraw(slot, amount)),
    [exec, client],
  );
  const release = useCallback(
    (slot: Address) => exec("Release slot", () => client.release(slot)),
    [exec, client],
  );
  const collect = useCallback(
    (slot: Address) => exec("Collect tax", () => client.collect(slot)),
    [exec, client],
  );
  const payTax = useCallback(
    (slot: Address) => exec("Pay tax", () => client.collect(slot)),
    [exec, client],
  );
  const liquidate = useCallback(
    (slot: Address) => exec("Liquidate", () => client.liquidate(slot)),
    [exec, client],
  );

  // Manager
  const proposeTaxUpdate = useCallback(
    (slot: Address, newPct: bigint) =>
      exec("Propose tax", () => client.proposeTaxUpdate(slot, newPct)),
    [exec, client],
  );
  const proposeModuleUpdate = useCallback(
    (slot: Address, newModule: Address) =>
      exec("Propose module", () => client.proposeModuleUpdate(slot, newModule)),
    [exec, client],
  );
  const cancelPendingUpdates = useCallback(
    (slot: Address) =>
      exec("Cancel updates", () => client.cancelPendingUpdates(slot)),
    [exec, client],
  );
  const setLiquidationBounty = useCallback(
    (slot: Address, newBps: bigint) =>
      exec("Set bounty", () => client.setLiquidationBounty(slot, newBps)),
    [exec, client],
  );

  // Metadata module
  const updateMetadata = useCallback(
    (moduleAddress: Address, slot: Address, uri: string) =>
      exec("Update metadata", () =>
        client.modules.metadata.updateMetadata(moduleAddress, slot, uri),
      ),
    [exec, client],
  );

  const updateMetadataWithUpload = useCallback(
    (moduleAddress: Address, slot: Address, data: object) =>
      exec("Update metadata", async () => {
        const { uri } = await upload(data);
        return client.modules.metadata.updateMetadata(moduleAddress, slot, uri);
      }),
    [exec, upload, client],
  );

  return {
    // Actions
    createSlot,
    createSlots,
    buy,
    selfAssess,
    topUp,
    withdraw,
    release,
    collect,
    payTax,
    liquidate,
    proposeTaxUpdate,
    proposeModuleUpdate,
    cancelPendingUpdates,
    setLiquidationBounty,
    updateMetadata,
    updateMetadataWithUpload,
    // State
    busy,
    isPending,
    isConfirming,
    isSuccess,
    activeAction,
  };
}
