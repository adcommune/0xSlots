import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 display-tight transition-[transform,box-shadow,background-color,color] duration-150 disabled:pointer-events-none disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-ink text-chalk hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-claim)] active:shadow-[2px_2px_0_0_var(--color-claim)]",
        claim:
          "border-claim bg-claim text-chalk hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-ink)] active:shadow-[2px_2px_0_0_var(--color-ink)]",
        outline:
          "border-ink bg-transparent text-ink hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-ink)] active:shadow-[2px_2px_0_0_var(--color-ink)]",
        ghost:
          "border-transparent bg-transparent text-slate hover:text-ink active:translate-0",
      },
      size: {
        sm: "h-8 px-3 text-[11px] tracking-[0.1em]",
        default: "h-11 px-5 text-[13px] tracking-[0.08em]",
        lg: "h-14 px-7 text-[15px] tracking-[0.06em]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;
type AnchorProps = ComponentProps<"a"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: AnchorProps) {
  return (
    <a
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
