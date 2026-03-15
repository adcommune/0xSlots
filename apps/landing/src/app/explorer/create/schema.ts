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

export const splitRecipientSchema = z.object({
  address: z.string(),
  percentAllocation: z.number(),
});

export type SplitRecipientInput = z.infer<typeof splitRecipientSchema>;

export const createSlotSchema = z
  .object({
    recipientMode: z.enum(["single", "group"]),
    recipient: z.string().refine(isValidAddressOrEns, {
      message: "Enter a valid address (0x…) or ENS name",
    }),
    splitRecipients: z.array(splitRecipientSchema).default([]),
    distributorFeePercent: z.number().min(0).max(10).default(0),
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
      if (d.recipientMode === "group") return d.splitRecipients.length >= 2;
      return true;
    },
    {
      message: "A split requires at least 2 recipients",
      path: ["splitRecipients"],
    },
  )
  .refine(
    (d) => {
      if (d.recipientMode === "group") {
        return d.splitRecipients.every(
          (r) => r.address.length > 0 && isValidAddressOrEns(r.address),
        );
      }
      return true;
    },
    {
      message: "All recipients must have a valid address",
      path: ["splitRecipients"],
    },
  )
  .refine(
    (d) => {
      if (d.recipientMode === "group") {
        return d.splitRecipients.every(
          (r) => r.percentAllocation > 0 && r.percentAllocation <= 100,
        );
      }
      return true;
    },
    {
      message: "All allocations must be between 0 and 100",
      path: ["splitRecipients"],
    },
  )
  .refine(
    (d) => {
      if (d.recipientMode === "group") {
        const total = d.splitRecipients.reduce(
          (sum, r) => sum + r.percentAllocation,
          0,
        );
        return Math.abs(total - 100) < 0.01;
      }
      return true;
    },
    {
      message: "Allocations must sum to 100%",
      path: ["splitRecipients"],
    },
  );

export type CreateSlotFormValues = z.input<typeof createSlotSchema>;

export const defaultValues: CreateSlotFormValues = {
  recipientMode: "single" as const,
  recipient: "",
  splitRecipients: [
    { address: "", percentAllocation: 0 },
  ],
  distributorFeePercent: 0,
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
