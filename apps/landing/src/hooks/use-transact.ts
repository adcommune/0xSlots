"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Abi, type Address, encodeFunctionData } from "viem";
import { toast } from "sonner";
import {
  useCallsStatus,
  useCapabilities,
  useChainId,
  useSendCalls,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

type BatchCall = {
  to: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
};

function extractErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return message.includes("User rejected") || message.includes("User denied")
    ? "Transaction rejected"
    : message.split("\n")[0] || "Transaction failed";
}

export function useTransact() {
  // --- single-call path (unchanged) ---
  const {
    writeContract: write,
    writeContractAsync,
    data: hash,
    isPending,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } =
    useWaitForTransactionReceipt({ hash });

  // --- batch/atomic path ---
  const chainId = useChainId();
  const { data: capabilities } = useCapabilities();
  const { sendCalls, data: batchId, isPending: isBatchPending } = useSendCalls();
  const [batchDone, setBatchDone] = useState(false);
  const { data: callsStatus } = useCallsStatus({
    id: batchId as string,
    query: {
      enabled: !!batchId && !batchDone,
      refetchInterval: 1500,
    },
  });

  const supportsAtomic =
    capabilities?.[chainId]?.atomic?.status === "supported" ||
    capabilities?.[chainId]?.atomic?.status === "ready";

  // --- shared state ---
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const labelRef = useRef<string>("");
  const [isFallbackBusy, setIsFallbackBusy] = useState(false);

  const busy = isPending || isConfirming || isBatchPending || isFallbackBusy || (!!batchId && !batchDone);

  // --- single-call toasts ---
  useEffect(() => {
    if (isSuccess && labelRef.current) {
      toast.success(`${labelRef.current} confirmed`);
      setActiveAction(null);
      labelRef.current = "";
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isError && labelRef.current) {
      toast.error(`${labelRef.current} failed on-chain`);
      setActiveAction(null);
      labelRef.current = "";
    }
  }, [isError]);

  useEffect(() => {
    if (!isPending && !isConfirming && !isSuccess && !isError && !isBatchPending && !isFallbackBusy && !batchId) {
      setActiveAction(null);
    }
  }, [isPending, isConfirming, isSuccess, isError, isBatchPending, isFallbackBusy, batchId]);

  // --- batch status toasts ---
  useEffect(() => {
    if (!callsStatus || !labelRef.current) return;
    const status = callsStatus.status;
    if (status === "CONFIRMED") {
      toast.success(`${labelRef.current} confirmed`);
      setActiveAction(null);
      labelRef.current = "";
      setBatchDone(true);
    } else if (status === "REVERTED") {
      toast.error(`${labelRef.current} reverted`);
      setActiveAction(null);
      labelRef.current = "";
      setBatchDone(true);
    }
  }, [callsStatus]);

  // --- single call ---
  const transact = useCallback(
    (label: string, params: Parameters<typeof write>[0]) => {
      labelRef.current = label;
      setActiveAction(label);
      write(params, {
        onError: (error) => {
          setActiveAction(null);
          labelRef.current = "";
          toast.error(`${label}: ${extractErrorMessage(error)}`);
        },
      });
    },
    [write],
  );

  // --- batch call ---
  const transactBatch = useCallback(
    async (label: string, calls: BatchCall[]) => {
      labelRef.current = label;
      setActiveAction(label);
      setBatchDone(false);

      if (supportsAtomic) {
        // EIP-5792 atomic batch
        const encoded = calls.map((c) => ({
          to: c.to,
          data: encodeFunctionData({
            abi: c.abi,
            functionName: c.functionName,
            args: c.args as unknown[],
          }),
          value: c.value,
        }));

        sendCalls(
          { calls: encoded },
          {
            onError: (error) => {
              setActiveAction(null);
              labelRef.current = "";
              toast.error(`${label}: ${extractErrorMessage(error)}`);
            },
          },
        );
      } else {
        // Fallback: sequential calls
        setIsFallbackBusy(true);
        try {
          // Execute all but the last call sequentially
          for (let i = 0; i < calls.length - 1; i++) {
            await writeContractAsync({
              address: calls[i].to,
              abi: calls[i].abi,
              functionName: calls[i].functionName,
              args: calls[i].args as unknown[],
              value: calls[i].value,
            });
          }
          // Last call uses write() so it gets receipt tracking via useWaitForTransactionReceipt
          const last = calls[calls.length - 1];
          setIsFallbackBusy(false);
          write(
            {
              address: last.to,
              abi: last.abi,
              functionName: last.functionName,
              args: last.args as unknown[],
              value: last.value,
            },
            {
              onError: (error) => {
                setActiveAction(null);
                labelRef.current = "";
                toast.error(`${label}: ${extractErrorMessage(error)}`);
              },
            },
          );
        } catch (error) {
          setIsFallbackBusy(false);
          setActiveAction(null);
          labelRef.current = "";
          toast.error(`${label}: ${extractErrorMessage(error)}`);
        }
      }
    },
    [supportsAtomic, sendCalls, writeContractAsync, write],
  );

  return { transact, transactBatch, busy, activeAction, reset, supportsAtomic };
}
