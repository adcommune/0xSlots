"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Address, Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import type {
  BuyParams,
  CreateSlotParams,
  CreateSlotsParams,
  CreateSlotV3Params,
  SlotsChain,
} from "../client";
import { useSlotsClient } from "./useSlotsClient";

function extractErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("User rejected") || message.includes("User denied"))
    return "Transaction rejected";

  // viem ContractFunctionExecutionError: extract the shortMessage or reason
  const err = error as Record<string, unknown> | undefined;
  if (err && typeof err === "object") {
    if (typeof err.shortMessage === "string") return err.shortMessage;
    const cause = err.cause as Record<string, unknown> | undefined;
    if (cause && typeof cause.shortMessage === "string")
      return cause.shortMessage;
    if (cause && typeof cause.reason === "string") return cause.reason;
  }

  return message.split("\n")[0] || "Transaction failed";
}

export interface SlotActionCallbacks {
  chainId?: SlotsChain;
  onSuccess?: (label: string, hash: Hash) => void;
  onError?: (label: string, error: string) => void;
}

export function useSlotAction(opts?: SlotActionCallbacks) {
  const client = useSlotsClient(opts?.chainId);

  // --- state ---
  const [hash, setHash] = useState<Hash | undefined>();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const labelRef = useRef<string>("");

  // --- receipt tracking ---
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({ hash });

  const busy = isPending || isConfirming;

  // --- callback on success ---
  useEffect(() => {
    if (isSuccess && labelRef.current) {
      opts?.onSuccess?.(labelRef.current, hash!);
      setActiveAction(null);
      labelRef.current = "";
    }
  }, [isSuccess]);

  // --- callback on on-chain error ---
  useEffect(() => {
    if (isError && labelRef.current) {
      opts?.onError?.(labelRef.current, `${labelRef.current} failed on-chain`);
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
   * Execute an SDK method with shared pending/receipt tracking.
   *
   * Reports failures through `onError` rather than throwing, so a single action
   * needs no try/catch at the call site. Returns the hash — or `undefined` when
   * it failed, which is what a multi-step action must check before continuing.
   */
  const exec = useCallback(
    async (
      label: string,
      fn: () => Promise<Hash>,
    ): Promise<Hash | undefined> => {
      labelRef.current = label;
      setActiveAction(label);
      setIsPending(true);
      setHash(undefined);
      try {
        const txHash = await fn();
        setHash(txHash);
        return txHash;
      } catch (error) {
        console.error(`[useSlotAction] ${label} failed:`, error);
        setActiveAction(null);
        labelRef.current = "";
        opts?.onError?.(label, extractErrorMessage(error));
        return undefined;
      } finally {
        setIsPending(false);
      }
    },
    [opts?.onError],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Named actions — each calls one SDK method
  // ═══════════════════════════════════════════════════════════════════════════

  // Factory
  const createSlot = useCallback(
    (params: CreateSlotParams) =>
      exec("Create slot", () => client.createSlot(params)),
    [exec, client],
  );
  const createSlotV3 = useCallback(
    (params: CreateSlotV3Params) =>
      exec("Create slot", () => client.createSlotV3(params)),
    [client, exec],
  );
  /**
   * Ensure the minimum-tenure policy for `tenureSeconds` exists, then create the
   * slot pointing at it. Two transactions only the first time anyone uses that
   * duration — afterwards the policy already exists and this is a single tx.
   */
  const createSlotWithTenure = useCallback(
    async (
      params: Omit<CreateSlotV3Params, "occupancyPolicy">,
      tenureSeconds: bigint,
    ) => {
      const policy = await client.predictTenurePolicy(tenureSeconds);
      const exists = await client.isTenurePolicyDeployed(tenureSeconds);
      if (!exists) {
        const deployed = await exec("Deploy tenure policy", () =>
          client.deployTenurePolicy(tenureSeconds),
        );
        // Bail on a rejected or reverted deploy: `createSlotV3` requires code at
        // `policy` and would otherwise fail a second time, more confusingly.
        if (!deployed) return undefined;
      }
      return exec("Create slot", () =>
        client.createSlotV3({ ...params, occupancyPolicy: policy }),
      );
    },
    [client, exec],
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

  return {
    // Actions
    createSlot,
    createSlotV3,
    createSlotWithTenure,
    createSlots,
    buy,
    selfAssess,
    topUp,
    withdraw,
    release,
    collect,
    liquidate,
    proposeTaxUpdate,
    proposeModuleUpdate,
    cancelPendingUpdates,
    setLiquidationBounty,
    updateMetadata,
    // Executor
    exec,
    // State
    busy,
    isPending,
    isConfirming,
    isSuccess,
    activeAction,
  };
}
