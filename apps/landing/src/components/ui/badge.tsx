import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // V3 event types
        Buy: "border-transparent bg-purple-100 text-purple-900",
        Release: "border-transparent bg-orange-100 text-orange-900",
        Liquidate: "border-transparent bg-red-100 text-red-900",
        PriceUpdate: "border-transparent bg-yellow-100 text-yellow-900",
        Deposit: "border-transparent bg-green-100 text-green-900",
        Withdraw: "border-transparent bg-amber-100 text-amber-900",
        TaxCollect: "border-transparent bg-blue-100 text-blue-900",
        Settle: "border-transparent bg-slate-100 text-slate-900",
        TaxProposed: "border-transparent bg-indigo-100 text-indigo-900",
        ModuleProposed: "border-transparent bg-cyan-100 text-cyan-900",
        UpdateCancelled: "border-transparent bg-gray-100 text-gray-900",
        UpdateApplied: "border-transparent bg-teal-100 text-teal-900",
        LiquidationBountyUpdated: "border-transparent bg-pink-100 text-pink-900",
        // V2 event types
        landOpened: "border-transparent bg-blue-100 text-blue-900",
        slotCreated: "border-transparent bg-green-100 text-green-900",
        slotPurchased: "border-transparent bg-purple-100 text-purple-900",
        slotReleased: "border-transparent bg-orange-100 text-orange-900",
        priceUpdated: "border-transparent bg-yellow-100 text-yellow-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
