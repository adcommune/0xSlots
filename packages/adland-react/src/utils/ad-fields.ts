import type { AdData, AdType } from "@adland/data";

const IMAGE_KEYS = ["image", "icon", "pfpUrl", "logoURI", "imageUrl"] as const;
const TITLE_KEYS = ["title", "displayName", "username", "name", "symbol"] as const;
const DESC_KEYS = ["description", "bio", "text", "name"] as const;

function flatFields(data: AdData): Record<string, unknown> {
  return { ...data.data, ...(data.metadata ?? {}) };
}

export function getAdImage(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  for (const key of IMAGE_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export function getAdTitle(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  for (const key of TITLE_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export function getAdDescription(data: AdData | null): string | null {
  if (!data) return null;
  const fields = flatFields(data);
  const title = getAdTitle(data);
  for (const key of DESC_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v && v !== title) return v;
  }
  return null;
}

export function getAdType(data: AdData | null): AdType | null {
  if (!data) return null;
  return data.type as AdType;
}
