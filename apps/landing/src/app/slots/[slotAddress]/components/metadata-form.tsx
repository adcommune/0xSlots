"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import {
  type AdType,
  adTypes,
  getAd,
  adlandApiUrl,
} from "@adland/data";
import type { Address } from "viem";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  ChevronLeft,
  Eye,
  FileEdit,
  Loader2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useSlotsClient } from "@/hooks/use-slots-client";
import { useSlotsClient as useSubgraphSlotsClient } from "@/hooks/use-v3";
import { useSlotAction } from "@/hooks/use-slot-action";
import { useChain } from "@/context/chain";

import { ZodFormBuilder } from "./zod-form-builder";
import { MetadataPreview } from "./metadata-preview";

const adTypeLabels: Record<AdType, string> = {
  link: "Link",
  cast: "Farcaster Cast",
  miniapp: "Mini App",
  token: "Token",
  farcasterProfile: "Farcaster Profile",
};

type AdContent = {
  type: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Fetch IPFS content via the cached Next.js API route.
 */
async function fetchIpfsContent(uri: string): Promise<AdContent | null> {
  try {
    const res = await fetch(`/api/ipfs?uri=${encodeURIComponent(uri)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

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
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentAdData, setCurrentAdData] = useState<AdContent | null>(null);
  const [loadingCurrentAd, setLoadingCurrentAd] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<
    Array<{ uri: string; timestamp: string; tx: string; adType?: string }>
  >([]);

  const client = useSlotsClient();
  const subgraphClient = useSubgraphSlotsClient();
  const { updateMetadata, busy, activeAction } = useSlotAction();
  const { explorerUrl } = useChain();

  const ad = selectedType ? getAd(selectedType as AdType) : null;

  // Fetch current URI, load its content, and fetch history
  const fetchMetadata = async () => {
    try {
      const uri = await client.modules.metadata.getURI(
        slotAddress as Address,
      );
      setCurrentUri(uri || null);

      if (uri) {
        setLoadingCurrentAd(true);
        const data = await fetchIpfsContent(uri);
        setCurrentAdData(data);
        setLoadingCurrentAd(false);
      }
    } catch {
      // No metadata set yet
    }

    try {
      const { metadataUpdatedEvents } =
        await subgraphClient.modules.metadata.getUpdateHistory({
          slot: slotAddress.toLowerCase(),
          first: 10,
        });

      const historyEntries = metadataUpdatedEvents.map((e) => ({
        uri: e.uri,
        timestamp: e.timestamp,
        tx: e.tx,
        adType: undefined as string | undefined,
      }));
      setUpdateHistory(historyEntries);

      // Resolve ad types for each history entry in parallel
      const resolved = await Promise.all(
        historyEntries.map(async (entry) => {
          const content = await fetchIpfsContent(entry.uri);
          return { ...entry, adType: content?.type };
        }),
      );
      setUpdateHistory(resolved);
    } catch {
      // Subgraph may not have data yet
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [client, subgraphClient, slotAddress]);

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
      const res = await fetch(`${adlandApiUrl}/ipfs/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedResult),
      });
      if (!res.ok) {
        throw new Error("IPFS upload failed");
      }
      const { uri } = await res.json();

      await updateMetadata(slotAddress as Address, uri);
      setCurrentUri(uri);
      setCurrentAdData(processedResult);
      setPhase("done");
      setTimeout(() => fetchMetadata(), 5000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Publishing failed",
      );
      setPhase("preview");
    }
  };

  const resetForm = () => {
    setPhase("edit");
    setProcessedResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Current Ad — loaded from IPFS via cached route */}
      {loadingCurrentAd && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-2">
          <Loader2 className="size-3 animate-spin" />
          Loading current ad...
        </div>
      )}

      {currentAdData && !loadingCurrentAd && (
        <CurrentAdBanner ad={currentAdData} uri={currentUri} />
      )}

      {!currentUri && !loadingCurrentAd && (
        <p className="text-sm text-muted-foreground">No ad content yet.</p>
      )}

      {!isOccupant && !loadingCurrentAd && (
        <p className="text-xs text-muted-foreground">
          Occupy this slot to publish ad content.
        </p>
      )}

      {/* Occupant-only: form to update metadata */}
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
                  {adTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {adTypeLabels[type]}
                    </SelectItem>
                  ))}
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

      {/* History table */}
      <div className="border-t pt-3">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  URI
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {updateHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center text-muted-foreground py-6 text-sm"
                  >
                    No updates yet
                  </td>
                </tr>
              ) : (
                updateHistory.map((event) => (
                  <tr
                    key={event.tx}
                    className="text-sm hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <HistoryTypeBadge adType={event.adType} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono break-all">
                      {event.uri}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(Number(event.timestamp) * 1000),
                        { addSuffix: true },
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge for history rows — shows the ad type once resolved, or a generic "Update" while loading.
 */
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

  // Color per ad type
  const colors: Record<string, string> = {
    link: "bg-blue-500/10 text-blue-600",
    cast: "bg-purple-500/10 text-purple-600",
    miniapp: "bg-cyan-500/10 text-cyan-600",
    token: "bg-amber-500/10 text-amber-600",
    farcasterProfile: "bg-pink-500/10 text-pink-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors[adType] ?? "bg-violet-500/10 text-violet-600"}`}
    >
      <FileEdit className="size-3" />
      {label}
    </span>
  );
}

/**
 * Banner displaying the current ad content loaded from IPFS.
 */
function CurrentAdBanner({
  ad,
  uri,
}: {
  ad: AdContent;
  uri: string | null;
}) {
  const typeLabel = adTypeLabels[ad.type as AdType] ?? ad.type;

  const displayFields = { ...ad.data, ...(ad.metadata ?? {}) };

  const imageFieldNames = ["pfpUrl", "image", "imageUrl", "icon", "logoURI"];
  const imageKey = Object.keys(displayFields).find((k) => {
    const v = displayFields[k];
    if (typeof v !== "string" || !v) return false;
    // Match by known image field names
    if (imageFieldNames.includes(k) && (v.startsWith("http") || v.startsWith("data:"))) return true;
    // Match by file extension
    return /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i.test(v) || v.startsWith("data:image/");
  });
  const imageUrl = imageKey ? (displayFields[imageKey] as string) : null;

  const titleKey = ["title", "name", "displayName", "username", "text"].find(
    (k) => displayFields[k] && typeof displayFields[k] === "string",
  );
  const title = titleKey ? (displayFields[titleKey] as string) : null;

  const descKey = ["description", "bio", "symbol", "text"].find(
    (k) =>
      displayFields[k] &&
      typeof displayFields[k] === "string" &&
      k !== titleKey,
  );
  const description = descKey ? (displayFields[descKey] as string) : null;

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="size-10 rounded-md object-cover shrink-0"
          />
        )}

        <div className="flex-1 min-w-0 space-y-0.5">
          {title && (
            <p className="text-sm font-medium truncate">{title}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {!title && !description && (
            <div className="space-y-0.5">
              {Object.entries(ad.data).map(([key, value]) => (
                <p key={key} className="text-xs truncate">
                  <span className="text-muted-foreground">
                    {humanizeKey(key)}:
                  </span>{" "}
                  {String(value)}
                </p>
              ))}
            </div>
          )}
          {uri && (
            <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">
              {uri}
            </p>
          )}
        </div>

        <Badge variant="outline" className="shrink-0 text-[10px]">
          {typeLabel}
        </Badge>
      </div>
    </div>
  );
}

function humanizeKey(key: string): string {
  const acronyms: Record<string, string> = {
    url: "URL",
    uri: "URI",
    id: "ID",
    fid: "FID",
  };
  if (acronyms[key.toLowerCase()]) return acronyms[key.toLowerCase()];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
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
