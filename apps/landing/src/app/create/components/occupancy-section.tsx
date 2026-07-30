"use client";

import { Clock, ShieldCheck } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KNOWN_POLICIES, knownPoliciesForChain } from "@/config/policies";
import { useChain } from "@/context/chain";
import { AddressInput } from "../address-input";
import { type CreateSlotFormValues, timeDenominations } from "../schema";

/**
 * Occupancy terms — when a slot can change hands, and under what rule.
 *
 * Both default to off, so an untouched form still produces a plain instant-buy
 * slot. The copy leads with the consequence rather than the mechanism, because
 * both dials change what it *feels* like to hold the slot far more than the
 * mutability flags next to them do.
 */
export function OccupancySection() {
  const form = useFormContext<CreateSlotFormValues>();
  const { chainId } = useChain();
  const policyMode = form.watch("occupancyPolicyMode");
  const epochValue = form.watch("epochValue");
  const epochUnit = form.watch("epochUnit");

  // A policy address is chain-specific — offering one from another chain would
  // produce a slot whose policy has no code.
  const knownForChain = knownPoliciesForChain(chainId);

  const epochIsOn = Number(epochValue) > 0;
  // "1 hours" reads as a bug even when the value is right.
  const epochUnitLabel =
    Number(epochValue) === 1 ? epochUnit.replace(/s$/, "") : epochUnit;

  const tenureValue = form.watch("tenureValue");
  const tenureUnit = form.watch("tenureUnit");
  const tenureUnitLabel =
    Number(tenureValue) === 1 ? tenureUnit.replace(/s$/, "") : tenureUnit;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Occupancy</p>
        <p className="text-xs text-muted-foreground mt-1">
          When this slot can change hands. Leave both off for instant buy —
          anyone can take it at its declared price, in the next block.
        </p>
      </div>

      {/* ── Epochs ── */}
      <FormField
        control={form.control}
        name="epochValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-sky-500" /> Epoch length
            </FormLabel>
            <div className="flex gap-2">
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                className="flex-1"
              />
              <FormField
                control={form.control}
                name="epochUnit"
                render={({ field: unitField }) => (
                  <Select
                    onValueChange={unitField.onChange}
                    value={unitField.value}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeDenominations.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <FormDescription>
              {epochIsOn ? (
                <>
                  Buys land on the clock, not on arrival — a buy takes effect at
                  the next {epochValue} {epochUnitLabel} boundary. Everyone
                  waits the same sub-epoch amount and nobody picks theirs, so
                  being faster stops being worth anything.
                </>
              ) : (
                <>0 = instant buy. Set a value to schedule transfers.</>
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* ── Policy ── */}
      <FormField
        control={form.control}
        name="occupancyPolicyMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-violet-500" /> Occupancy
              policy
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="tenure">Minimum tenure</SelectItem>
                <SelectItem value="known" disabled={knownForChain.length === 0}>
                  Verified policy
                  {knownForChain.length === 0 && " — none on this chain"}
                </SelectItem>
                <SelectItem value="custom">Custom address</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              A policy can delay who may take the slot, but never blocks
              liquidation or stops the occupant leaving — the core forbids both.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {policyMode === "tenure" && (
        <FormField
          control={form.control}
          name="tenureValue"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-2">
                <Input
                  {...field}
                  type="text"
                  inputMode="decimal"
                  className="flex-1"
                />
                <FormField
                  control={form.control}
                  name="tenureUnit"
                  render={({ field: unitField }) => (
                    <Select
                      onValueChange={unitField.onChange}
                      value={unitField.value}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeDenominations.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <FormDescription>
                Nobody can buy the occupant out for {field.value}{" "}
                {tenureUnitLabel}. They pay for it up front — the whole window's
                tax must be escrowed — and cannot cut their price while
                protected, so the tax stays honest even with forced sale
                suspended. Liquidation still works throughout: insolvency always
                ends the tenure.
              </FormDescription>
              <FormDescription className="text-amber-600 dark:text-amber-500">
                Softens Harberger — forced sale is delayed, not removed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {policyMode === "known" && knownForChain.length === 0 && (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
          No verified policies are deployed on this chain yet. Switch to a chain
          that has them, or use{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => form.setValue("occupancyPolicyMode", "custom")}
          >
            a custom address
          </button>
          .
        </p>
      )}

      {policyMode === "known" && knownForChain.length > 0 && (
        <FormField
          control={form.control}
          name="occupancyPolicy"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a policy" />
                </SelectTrigger>
                <SelectContent>
                  {knownForChain.map(([addr, p]) => (
                    <SelectItem key={addr} value={addr}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.value && KNOWN_POLICIES[field.value.toLowerCase()] && (
                <FormDescription>
                  {KNOWN_POLICIES[field.value.toLowerCase()].description}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {policyMode === "custom" && (
        <FormField
          control={form.control}
          name="occupancyPolicy"
          render={({ field }) => (
            <FormItem>
              <AddressInput
                value={field.value}
                onChange={field.onChange}
                placeholder="0x… policy address"
              />
              <FormDescription>
                Must implement IOccupancyPolicy. The factory rejects addresses
                with no code, but does not verify behaviour — an unrecognised
                policy is shown as such in the explorer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
