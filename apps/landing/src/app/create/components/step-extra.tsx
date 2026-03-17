import { Sparkles } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AddressInput } from "../address-input";
import type { CreateSlotFormValues } from "../schema";

export function StepExtra() {
  const form = useFormContext<CreateSlotFormValues>();
  const mutableTax = form.watch("mutableTax");
  const mutableModule = form.watch("mutableModule");
  const needsManager = mutableTax || mutableModule;

  return (
    <>
      {/* Mutability & Manager */}
      <div>
        <p className="text-sm font-medium mb-4">Mutability & Manager</p>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="mutableTax"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel className="cursor-pointer mt-0!">
                  Mutable Tax
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mutableModule"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel className="cursor-pointer mt-0!">
                  Mutable Module
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {needsManager && (
          <div className="mt-4">
            <FormField
              control={form.control}
              name="manager"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Manager Address (required)</FormLabel>
                  <AddressInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0x… or ENS name"
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
          </div>
        )}

        {!needsManager && (
          <p className="text-xs text-muted-foreground mt-2">
            No manager needed when both flags are off.
          </p>
        )}
      </div>

      <Separator />

      {/* Liquidation Bounty */}
      <FormField
        control={form.control}
        name="liquidationBountyPercent"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" /> Liquidation
              Bounty
            </FormLabel>
            <div className="relative">
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <FormDescription>Reward for liquidators</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
