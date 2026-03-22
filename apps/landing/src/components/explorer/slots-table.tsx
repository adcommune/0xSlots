"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isAddress } from "viem";
import { AccountTypeIcon } from "@/components/account-type-icon";
import { EnsAddress } from "@/components/ens-address";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { TableEmpty, TableSkeleton } from "@/components/table-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigation } from "@/context/navigation";
import type { SlotFilters } from "@/hooks/use-v3";
import { useModules, useSlots } from "@/hooks/use-v3";
import { loadStorage, saveStorage } from "@/lib/storage";
import { formatPrice, truncateAddress } from "@/utils";

const STORAGE_KEY = "0xslots:slot-filters";

export function SlotsTable() {
  const { push } = useNavigation();
  const [filters, setFilters] = useState<SlotFilters>({});
  const [addressInput, setAddressInput] = useState("");
  const [addressField, setAddressField] = useState<
    "recipient" | "occupant" | null
  >(null);
  const { data: modules } = useModules();

  useEffect(() => {
    setFilters(loadStorage<SlotFilters>(STORAGE_KEY, {}));
  }, []);

  const updateFilters = (next: SlotFilters) => {
    // Clean empty values
    const clean: SlotFilters = {};
    if (next.moduleIds && next.moduleIds.length > 0)
      clean.moduleIds = next.moduleIds;
    if (next.recipient) clean.recipient = next.recipient;
    if (next.occupant) clean.occupant = next.occupant;
    setFilters(clean);
    saveStorage(STORAGE_KEY, clean);
  };

  const hasFilters =
    (filters.moduleIds && filters.moduleIds.length > 0) ||
    !!filters.recipient ||
    !!filters.occupant;

  const { data: slots, isLoading } = useSlots(hasFilters ? filters : undefined);
  const { page, setPage, pageSize, setPageSize, totalPages, paged } =
    usePagination(slots ?? []);

  const toggleModule = (moduleId: string) => {
    const current = filters.moduleIds ?? [];
    const next = current.includes(moduleId)
      ? current.filter((id) => id !== moduleId)
      : [...current, moduleId];
    updateFilters({ ...filters, moduleIds: next });
  };

  const applyAddress = () => {
    if (!addressField || !addressInput.trim()) return;
    const addr = addressInput.trim();
    if (!isAddress(addr)) return;
    updateFilters({ ...filters, [addressField]: addr });
    setAddressInput("");
    setAddressField(null);
  };

  const removeFilter = (key: keyof SlotFilters, value?: string) => {
    if (key === "moduleIds" && value) {
      toggleModule(value);
    } else {
      const next = { ...filters };
      delete next[key];
      updateFilters(next);
    }
  };

  const clearFilters = () => {
    updateFilters({});
    setAddressInput("");
    setAddressField(null);
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-2 justify-end flex-wrap">
        {/* Active filter pills */}
        {hasFilters && (
          <>
            {filters.moduleIds?.map((id) => {
              const mod = modules?.find((m) => m.id === id);
              return (
                <Badge
                  key={`mod-${id}`}
                  variant="secondary"
                  className="gap-1 text-xs cursor-pointer"
                  onClick={() => removeFilter("moduleIds", id)}
                >
                  {mod?.name || truncateAddress(id)}
                  <X className="size-3" />
                </Badge>
              );
            })}
            {filters.recipient && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer"
                onClick={() => removeFilter("recipient")}
              >
                Recipient: {truncateAddress(filters.recipient)}
                <X className="size-3" />
              </Badge>
            )}
            {filters.occupant && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer"
                onClick={() => removeFilter("occupant")}
              >
                Occupant: {truncateAddress(filters.occupant)}
                <X className="size-3" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-6 px-2"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </>
        )}

        {/* Address input (shown when a field is selected) */}
        {addressField && (
          <div className="flex items-center gap-1">
            <Input
              placeholder={`${addressField === "recipient" ? "Recipient" : "Occupant"} address (0x...)`}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyAddress()}
              className="h-7 w-56 text-xs "
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={applyAddress}
              disabled={!isAddress(addressInput.trim())}
            >
              <Check className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5"
              onClick={() => {
                setAddressField(null);
                setAddressInput("");
              }}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Filter className="size-3" />
              Filters
              {hasFilters && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {(filters.moduleIds?.length ?? 0) +
                    (filters.recipient ? 1 : 0) +
                    (filters.occupant ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Address filters */}
            <DropdownMenuLabel className="text-xs">Address</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  setAddressField("recipient");
                  setAddressInput(filters.recipient ?? "");
                }}
              >
                Recipient
                {filters.recipient && (
                  <span className="ml-auto text-[10px] text-muted-foreground ">
                    {truncateAddress(filters.recipient)}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setAddressField("occupant");
                  setAddressInput(filters.occupant ?? "");
                }}
              >
                Occupant
                {filters.occupant && (
                  <span className="ml-auto text-[10px] text-muted-foreground ">
                    {truncateAddress(filters.occupant)}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Module filters */}
            <DropdownMenuLabel className="text-xs">Module</DropdownMenuLabel>
            {modules?.map((m) => (
              <DropdownMenuCheckboxItem
                key={m.id}
                checked={filters.moduleIds?.includes(m.id) ?? false}
                onCheckedChange={() => toggleModule(m.id)}
              >
                <span className="truncate">
                  {m.name || truncateAddress(m.id)}
                </span>
                {m.verified && (
                  <span className="ml-auto text-[10px] text-green-600">✓</span>
                )}
              </DropdownMenuCheckboxItem>
            ))}
            {(!modules || modules.length === 0) && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No modules found
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!slots || slots.length === 0 ? (
        <TableEmpty
          message={hasFilters ? "No slots match filters" : "No slots found"}
        />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Occupant</TableHead>
                <TableHead className="text-right">Price / Tax</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((slot) => {
                const isOccupied = slot.occupant != null;
                return (
                  <TableRow
                    key={slot.id}
                    className="cursor-pointer"
                    onClick={() => {
                      push(`/slots/${slot.id}`);
                    }}
                  >
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <AccountTypeIcon
                          type={slot.recipientAccount.type}
                          className="h-3 w-3"
                        />
                        <EnsAddress address={slot.recipient} />
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {isOccupied && slot.occupant && slot.occupantAccount ? (
                        <span className="inline-flex items-center gap-1.5">
                          <AccountTypeIcon
                            type={slot.occupantAccount.type}
                            className="h-3 w-3"
                          />
                          {truncateAddress(slot.occupant)}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          VACANT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap">
                      <span className="font-bold">
                        {isOccupied
                          ? formatPrice(slot.price, slot.currency.decimals ?? 18)
                          : "0"}
                      </span>
                      <span className="text-muted-foreground text-[10px] ml-1">
                        {slot.currency.symbol}
                      </span>
                      <span className="text-muted-foreground text-[10px] ml-1">
                        ({Number(slot.taxPercentage) / 100}%/w)
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {slot.module
                        ? `${slot.module.name || truncateAddress(slot.module.id)}${slot.module.verified ? " ✓" : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {slot.mutableTax && (
                          <Badge variant="outline" className="text-[9px]">
                            TAX
                          </Badge>
                        )}
                        {slot.mutableModule && (
                          <Badge variant="outline" className="text-[9px]">
                            MOD
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(Number(slot.createdAt) * 1000),
                        { addSuffix: true },
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={slots.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
