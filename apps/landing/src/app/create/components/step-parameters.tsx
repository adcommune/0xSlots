import { AlertCircle, Check, HandCoins, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { getChainTokens } from "@0xslots/sdk";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useErc20Check } from "../hooks/use-erc20-check";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useChain } from "@/context/chain";
import { AddressInput } from "../address-input";
import { type CreateSlotFormValues, timeDenominations } from "../schema";

const VERIFIED_MODULES = [
  {
    name: "Metadata",
    address: "0x6c5A8A7f061bEd94b1b88CFAd4e1a1a8C5c4e527",
    description: "Store IPFS URIs per slot. Occupant controls the data.",
  },
] as const;

export function StepParameters() {
  const form = useFormContext<CreateSlotFormValues>();
  const { chainId } = useChain();
  const currencyMode = form.watch("currencyMode");
  const presetCurrency = form.watch("presetCurrency");
  const customCurrency = form.watch("customCurrency");
  const moduleMode = form.watch("moduleMode");
  const chainTokens = getChainTokens(chainId);
  const erc20 = useErc20Check(currencyMode === "custom" ? customCurrency : "");

  return (
    <>
      {/* Currency */}
      <FormField
        control={form.control}
        name="currencyMode"
        render={({ field }) => {
          const selectValue =
            field.value === "custom"
              ? "custom"
              : presetCurrency ?? chainTokens[0]?.address ?? "";

          return (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  if (v === "custom") {
                    field.onChange("custom");
                  } else {
                    field.onChange("preset");
                    form.setValue("presetCurrency", v as `0x${string}`);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {chainTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <span>{token.name} ({token.symbol})</span>
                      <span className="block text-xs text-muted-foreground">
                        {token.address.slice(0, 6)}...{token.address.slice(-3)}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom address</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          );
        }}
      />

      {currencyMode === "custom" && (
        <FormField
          control={form.control}
          name="customCurrency"
          render={({ field, fieldState }) => (
            <FormItem>
              <AddressInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0x… ERC-20 address or ENS"
                error={fieldState.error?.message}
              />
              {erc20.isLoading && (
                <p className="flex items-center gap-1.5 text-[10px] text-blue-500">
                  <Loader2 className="size-3 animate-spin" />
                  Checking ERC-20 token...
                </p>
              )}
              {erc20.data && (
                <p className="flex items-center gap-1.5 text-[10px] text-green-600">
                  <Check className="size-3" />
                  {erc20.data.name} ({erc20.data.symbol}) · {erc20.data.decimals} decimals
                </p>
              )}
              {erc20.isError && erc20.isValidAddress && (
                <p className="flex items-center gap-1.5 text-[10px] text-destructive">
                  <AlertCircle className="size-3" />
                  Not a valid ERC-20 token on this chain
                </p>
              )}
            </FormItem>
          )}
        />
      )}

      <Separator />

      {/* Tax Rate */}
      <FormField
        control={form.control}
        name="taxPercentage"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-1.5">
                <HandCoins className="size-3.5" /> Tax Rate
              </FormLabel>
              <span className="text-sm font-semibold">
                {parseFloat(field.value).toFixed(1) || "0"}%/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={Number(field.value) || 0}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full h-2 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <TaxRateHint value={Number(field.value) || 0} />
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Min Deposit Time */}
      <FormField
        control={form.control}
        name="minDepositValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Deposit Time</FormLabel>
            <div className="flex gap-0">
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                className="rounded-r-none"
              />
              <FormField
                control={form.control}
                name="minDepositUnit"
                render={({ field: selectField }) => (
                  <Select
                    value={selectField.value}
                    onValueChange={selectField.onChange}
                  >
                    <SelectTrigger className="w-25 rounded-l-none border-l-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeDenominations.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Module */}
      <FormField
        control={form.control}
        name="module"
        render={({ field, fieldState }) => {
          const selectValue =
            moduleMode === "custom"
              ? "custom"
              : field.value === ""
                ? "none"
                : field.value;

          return (
            <FormItem>
              <FormLabel>Module (optional)</FormLabel>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  if (v === "none") {
                    form.setValue("moduleMode", "none");
                    field.onChange("");
                  } else if (v === "custom") {
                    form.setValue("moduleMode", "custom");
                    field.onChange("");
                  } else {
                    form.setValue("moduleMode", "verified");
                    field.onChange(v);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {VERIFIED_MODULES.map((m) => (
                    <SelectItem key={m.address} value={m.address}>
                      {m.name} — {m.description}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom address</SelectItem>
                </SelectContent>
              </Select>
              {moduleMode === "custom" && (
                <div className="mt-2">
                  <AddressInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0x… or ENS"
                    error={fieldState.error?.message}
                  />
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </>
  );
}

function TaxRateHint({ value }: { value: number }) {
  const isLow = value <= 20;
  const isHigh = value >= 30;

  return (
    <div className="flex justify-between mt-1.5 text-[9px] leading-tight gap-4">
      <span
        className={
          isLow ? "font-bold text-foreground" : "text-muted-foreground"
        }
      >
        Predictability · low churn · squat risk
      </span>
      <span
        className={`text-right ${isHigh ? "font-bold text-foreground" : "text-muted-foreground"}`}
      >
        Allocative efficiency · anti-squat · volatility
      </span>
    </div>
  );
}
