import { z } from "zod";
import { isAddress } from "viem";

function isValidAddressOrEns(val: string) {
  if (!val) return true;
  if (isAddress(val)) return true;
  if (/^[a-zA-Z0-9-]+\.(eth|xyz|id)$/.test(val)) return true;
  return false;
}

export const timeDenominations = ["hours", "days", "months"] as const;
export type TimeDenomination = (typeof timeDenominations)[number];

export const TIME_MULTIPLIERS: Record<TimeDenomination, number> = {
  hours: 3600,
  days: 86400,
  months: 2592000, // 30 days
};

export const createSlotSchema = z
  .object({
    recipientMode: z.enum(["self", "custom", "group"]),
    recipient: z.string().refine(isValidAddressOrEns, {
      message: "Enter a valid address (0x…) or ENS name",
    }),
    currencyMode: z.enum(["usdc", "custom"]),
    customCurrency: z.string().refine(isValidAddressOrEns, {
      message: "Enter a valid address (0x…) or ENS name",
    }),
    taxPercentage: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0,
        "Must be a non-negative number",
      ),
    liquidationBountyPercent: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
        "Must be 0–100",
      ),
    minDepositValue: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0,
        "Must be a non-negative number",
      ),
    minDepositUnit: z.enum(timeDenominations),
    module: z.string().refine(isValidAddressOrEns, {
      message: "Enter a valid address (0x…) or ENS name",
    }),
    mutableTax: z.boolean(),
    mutableModule: z.boolean(),
    manager: z.string().refine(isValidAddressOrEns, {
      message: "Enter a valid address (0x…) or ENS name",
    }),
  })
  .refine(
    (d) => {
      if (d.mutableTax || d.mutableModule) return d.manager.length > 0;
      return true;
    },
    { message: "Manager is required when mutability is enabled", path: ["manager"] },
  )
  .refine(
    (d) => {
      if (d.currencyMode === "custom") return d.customCurrency.length > 0;
      return true;
    },
    { message: "Currency address is required", path: ["customCurrency"] },
  )
  .refine(
    (d) => {
      if (d.recipientMode === "custom") return d.recipient.length > 0;
      return true;
    },
    { message: "Recipient address is required", path: ["recipient"] },
  );

export type CreateSlotFormValues = z.input<typeof createSlotSchema>;

export const defaultValues: CreateSlotFormValues = {
  recipientMode: "self",
  recipient: "",
  currencyMode: "usdc",
  customCurrency: "",
  taxPercentage: "1",
  liquidationBountyPercent: "5",
  minDepositValue: "1",
  minDepositUnit: "days",
  module: "",
  mutableTax: false,
  mutableModule: false,
  manager: "",
};

/** "5" → 500n */
export function percentToBps(percent: string): bigint {
  return BigInt(Math.round(Number(percent) * 100));
}

/** ("1", "days") → 86400n */
export function toSeconds(value: string, unit: TimeDenomination): bigint {
  return BigInt(Math.round(Number(value) * TIME_MULTIPLIERS[unit]));
}
