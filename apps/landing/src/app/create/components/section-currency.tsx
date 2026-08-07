import { getChainTokens } from "@0xslots/sdk";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { TokenLogo } from "@/components/token-logo";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChain } from "@/context/chain";
import { truncateAddress } from "@/utils";
import { AddressInput } from "../address-input";
import { useErc20Check } from "../hooks/use-erc20-check";
import type { CreateSlotFormValues } from "../schema";

export function SectionCurrency() {
  const form = useFormContext<CreateSlotFormValues>();
  const { chainId } = useChain();
  const currencyMode = form.watch("currencyMode");
  const presetCurrency = form.watch("presetCurrency");
  const customCurrency = form.watch("customCurrency");
  const chainTokens = getChainTokens(chainId);
  const erc20 = useErc20Check(currencyMode === "custom" ? customCurrency : "");

  return (
    <>
      <FormField
        control={form.control}
        name="currencyMode"
        render={({ field }) => {
          const selectValue =
            field.value === "custom"
              ? "custom"
              : (presetCurrency ?? chainTokens[0]?.address ?? "");

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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {/* One flat row of three children on purpose. SelectItem
                      already flexes its last <span>, and Radix clones the
                      chosen item into the closed trigger — a nested stacked
                      layout would fight both. */}
                  {chainTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <TokenLogo slug={token.logo} symbol={token.symbol} />
                      <span>
                        {token.name} ({token.symbol})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {truncateAddress(token.address)}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <TokenLogo />
                    <span>Custom address</span>
                  </SelectItem>
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
                  {erc20.data.name} ({erc20.data.symbol}) ·{" "}
                  {erc20.data.decimals} decimals
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
    </>
  );
}
