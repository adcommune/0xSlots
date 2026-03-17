"use client";

import type { AccountType } from "@0xslots/sdk";
import { type AdType, adTypes, getAd } from "@adland/data";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  ChevronLeft,
  Eye,
  FileEdit,
  Loader2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Address } from "viem";

import { AccountTypeIcon } from "@/components/account-type-icon";
import { EnsAddress } from "@/components/ens-address";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChain } from "@/context/chain";
import { useSlotAction } from "@/hooks/use-slot-action";
import {
  useHistoryAdTypes,
  useIpfsContent,
  useMetadataHistory,
  useMetadataUri,
} from "../hooks/use-metadata";
import {
  type AdContent,
  adTypeColors,
  adTypeIcons,
  adTypeLabels,
} from "../lib/ad-helpers";
import { CurrentAdBanner } from "./current-ad-banner";
import { MetadataPreview } from "./metadata-preview";
import { ZodFormBuilder } from "./zod-form-builder";

type Phase = "edit" | "verifying" | "preview" | "publishing" | "done";

interface MetadataFormProps {
  slotAddress: string;
  isOccupant: boolean;
}

export function MetadataForm({ slotAddress, isOccupant }: MetadataFormProps) {
  const [selectedType, setSelectedType] = useState<AdType | "">("");
  const [phase, setPhase] = useState<Phase>("edit");
  const [processedResult, setProcessedResult] = useState<AdContent | null>(
    null,
  );

  const queryClient = useQueryClient();
  const { chainId } = useChain();
  const { updateMetadataWithUpload, busy, activeAction } = useSlotAction();

  const ad = selectedType ? getAd(selectedType as AdType) : null;

  const { data: currentUri } = useMetadataUri(slotAddress);
  const { data: currentAdData, isLoading: loadingCurrentAd } =
    useIpfsContent(currentUri);
  const { data: updateHistory } = useMetadataHistory(slotAddress);
  const { data: historyAdTypes } = useHistoryAdTypes(updateHistory);

  console.log(updateHistory);

  const invalidateMetadata = () => {
    queryClient.invalidateQueries({
      queryKey: ["metadata-uri", chainId, slotAddress],
    });
    queryClient.invalidateQueries({
      queryKey: ["metadata-history", chainId, slotAddress],
    });
  };

  const onVerify = async (formData: Record<string, unknown>) => {
    if (!ad) return;
    setPhase("verifying");
    try {
      const result = await ad.safeProcess(formData as any);
      if (result.success) {
        setProcessedResult({
          type: selectedType as string,
          data: result.data as Record<string, unknown>,
          metadata: result.metadata as Record<string, unknown> | undefined,
        });
        setPhase("preview");
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : result.error instanceof Error
              ? result.error.message
              : "Validation failed";
        toast.error(errorMsg);
        setPhase("edit");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
      setPhase("edit");
    }
  };

  const onPublish = async () => {
    if (!processedResult) return;
    setPhase("publishing");
    try {
      await updateMetadataWithUpload(slotAddress as Address, processedResult);
      setPhase("done");
      setTimeout(() => invalidateMetadata(), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publishing failed");
      setPhase("preview");
    }
  };

  const resetForm = () => {
    setPhase("edit");
    setProcessedResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Current Ad */}
      {loadingCurrentAd && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
          <Loader2 className="size-3 animate-spin" />
          Loading current ad...
        </div>
      )}

      {currentAdData && !loadingCurrentAd && (
        <CurrentAdBanner ad={currentAdData} uri={currentUri ?? null} />
      )}

      {!currentUri && !loadingCurrentAd && (
        <p className="text-sm text-muted-foreground">No ad content yet.</p>
      )}

      {!isOccupant && !loadingCurrentAd && (
        <p className="text-xs text-muted-foreground">
          Occupy this slot to publish ad content.
        </p>
      )}

      {/* Occupant-only: form */}
      {isOccupant && (
        <>
          <div className="border-t pt-3" />

          {phase === "done" && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Check className="size-3.5" />
                Metadata updated successfully
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={resetForm}
              >
                Update Again
              </Button>
            </div>
          )}

          {(phase === "edit" || phase === "verifying") && (
            <div className="space-y-3">
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as AdType);
                  setProcessedResult(null);
                }}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Select ad type..." />
                </SelectTrigger>
                <SelectContent>
                  {adTypes.map((type) => {
                    const Icon = adTypeIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <Icon className="size-3.5" />
                        {adTypeLabels[type]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {ad && (
                <DynamicAdForm
                  key={selectedType}
                  ad={ad}
                  onSubmit={onVerify}
                  isVerifying={phase === "verifying"}
                />
              )}
            </div>
          )}

          {phase === "preview" && processedResult && (
            <div className="space-y-3">
              <MetadataPreview
                type={processedResult.type}
                data={processedResult.data}
                metadata={processedResult.metadata}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={resetForm}
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  Edit
                </Button>
                <Button size="sm" className="flex-1" onClick={onPublish}>
                  <Upload className="size-3.5 mr-1" />
                  Publish
                </Button>
              </div>
            </div>
          )}

          {phase === "publishing" && (
            <div className="space-y-3">
              {processedResult && (
                <MetadataPreview
                  type={processedResult.type}
                  data={processedResult.data}
                  metadata={processedResult.metadata}
                />
              )}
              <Button disabled className="w-full" size="sm">
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                {busy && activeAction === "Update metadata"
                  ? "Confirming on-chain..."
                  : "Uploading to IPFS..."}
              </Button>
            </div>
          )}
        </>
      )}

      {/* History */}
      <div className="border-t pt-3">
        {!updateHistory || updateHistory.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No updates yet
          </p>
        ) : (
          <Accordion type="single" collapsible>
            {updateHistory.map((event) => (
              <AccordionItem key={event.tx} value={event.tx}>
                <AccordionTrigger className="py-2.5 px-1 text-sm hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                      <AccountTypeIcon
                        type={event.author.type as AccountType}
                        className="size-3"
                      />
                      <EnsAddress address={event.author.id} />
                    </div>
                    <HistoryTypeBadge adType={historyAdTypes?.[event.uri]} />
                    <span className="text-muted-foreground text-xs whitespace-nowrap ml-auto">
                      {formatDistanceToNow(
                        new Date(Number(event.timestamp) * 1000),
                        { addSuffix: true },
                      )}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <HistoryItemContent uri={event.uri} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

function HistoryTypeBadge({ adType }: { adType?: string }) {
  if (!adType) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-600">
        <FileEdit className="size-3" />
        Update
      </span>
    );
  }

  const label = adTypeLabels[adType as AdType] ?? adType;
  const Icon = adTypeIcons[adType as AdType] ?? FileEdit;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${adTypeColors[adType] ?? "bg-violet-500/10 text-violet-600"}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function HistoryItemContent({ uri }: { uri: string }) {
  const { data: adContent, isLoading } = useIpfsContent(uri);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
        <Loader2 className="size-3 animate-spin" />
        Loading ad content...
      </div>
    );
  }

  if (!adContent) {
    return (
      <p className="text-xs text-muted-foreground">Could not load content</p>
    );
  }

  return <CurrentAdBanner ad={adContent} uri={uri} />;
}

function createAdResolver(ad: ReturnType<typeof getAd>): Resolver {
  return async (values) => {
    const result = ad.data.safeParse(values);
    if (result.success) {
      return { values: result.data as Record<string, unknown>, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of (result as any).error?.issues ?? []) {
      const path = issue.path?.join(".") || "root";
      if (!errors[path]) {
        errors[path] = {
          type: issue.code ?? "validation",
          message: issue.message,
        };
      }
    }
    return { values: {}, errors };
  };
}

function DynamicAdForm({
  ad,
  onSubmit,
  isVerifying,
}: {
  ad: ReturnType<typeof getAd>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  isVerifying: boolean;
}) {
  const form = useForm({
    resolver: createAdResolver(ad),
    defaultValues: {},
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <ZodFormBuilder schema={ad.data as any} control={form.control} />
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Eye className="size-3.5 mr-1" />
              Verify & Preview
            </>
          )}
        </Button>
      </form>
    </FormProvider>
  );
}
