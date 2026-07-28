"use client";

import { useSlotAction as useSlotActionBase } from "@0xslots/sdk/react";
import type { SlotsChain } from "@0xslots/sdk";
import { useCallback } from "react";
import { toast } from "sonner";
import type { Address } from "viem";
import { useChain } from "@/context/chain";
import { usePostTxRefresh } from "./use-post-tx-refresh";
import useIPFSUpload from "./use-upload";
import { useSlotsClient } from "./use-slots-client";

export function useSlotAction() {
  const { chainId } = useChain();
  const refreshAfterTx = usePostTxRefresh();
  const action = useSlotActionBase({
    chainId: chainId as SlotsChain,
    onSuccess: (label, hash) => {
      toast.success(`${label} confirmed`);
      // Every slot action goes through here, so refreshing centrally keeps
      // callers from having to remember to invalidate their own data.
      void refreshAfterTx(hash);
    },
    onError: (label, error) => toast.error(`${label}: ${error}`),
  });

  const client = useSlotsClient();
  const { upload } = useIPFSUpload();

  const updateMetadataWithUpload = useCallback(
    (moduleAddress: Address, slot: Address, data: object) =>
      action.exec("Update metadata", async () => {
        const { uri } = await upload(data);
        return client.modules.metadata.updateMetadata(moduleAddress, slot, uri);
      }),
    [action.exec, upload, client],
  );

  return {
    ...action,
    updateMetadataWithUpload,
  };
}
