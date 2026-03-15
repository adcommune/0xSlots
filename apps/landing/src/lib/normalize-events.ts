import { formatPrice, truncateAddress } from "@/utils";

export type UnifiedEvent = {
  id: string;
  type: string;
  slot?: string;
  actor: string;
  detail: string;
  timestamp: number;
  tx: string;
};

export function normalizeEvents(data: any): UnifiedEvent[] {
  if (!data) return [];
  const events: UnifiedEvent[] = [];

  const getDecimals = (e: any) => e.currency?.decimals ?? 6;
  const getSymbol = (e: any) => e.currency?.symbol ?? "";
  const getSlot = (e: any) => e.slot?.id ?? e.slot ?? undefined;

  for (const e of data.slotDeployedEvents ?? []) {
    events.push({
      id: e.id, type: "Deploy", slot: getSlot(e), actor: e.deployer,
      detail: `→ ${truncateAddress(e.recipient)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.boughtEvents ?? []) {
    const d = getDecimals(e);
    const s = getSymbol(e);
    events.push({
      id: e.id, type: "Buy", slot: getSlot(e), actor: e.buyer,
      detail: e.previousOccupant === "0x0000000000000000000000000000000000000000"
        ? `claimed @ ${formatPrice(e.selfAssessedPrice, d)} ${s}`
        : `force-bought @ ${formatPrice(e.price, d)} → ${formatPrice(e.selfAssessedPrice, d)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.releasedEvents ?? []) {
    events.push({
      id: e.id, type: "Release", slot: getSlot(e), actor: e.occupant,
      detail: `refund ${formatPrice(e.refund, getDecimals(e))} ${getSymbol(e)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.liquidatedEvents ?? []) {
    events.push({
      id: e.id, type: "Liquidate", slot: getSlot(e), actor: e.liquidator,
      detail: `bounty ${formatPrice(e.bounty, getDecimals(e))} ${getSymbol(e)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.priceUpdatedEvents ?? []) {
    const d = getDecimals(e);
    const s = getSymbol(e);
    events.push({
      id: e.id, type: "Price", slot: getSlot(e), actor: "",
      detail: `${formatPrice(e.oldPrice, d)} → ${formatPrice(e.newPrice, d)} ${s}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.depositedEvents ?? []) {
    events.push({
      id: e.id, type: "Deposit", slot: getSlot(e), actor: e.depositor,
      detail: `+${formatPrice(e.amount, getDecimals(e))} ${getSymbol(e)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.withdrawnEvents ?? []) {
    events.push({
      id: e.id, type: "Withdraw", slot: getSlot(e), actor: e.occupant,
      detail: `-${formatPrice(e.amount, getDecimals(e))} ${getSymbol(e)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxCollectedEvents ?? []) {
    events.push({
      id: e.id, type: "Collect", slot: getSlot(e), actor: e.recipient,
      detail: `${formatPrice(e.amount, getDecimals(e))} ${getSymbol(e)}`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.taxUpdateProposedEvents ?? []) {
    events.push({
      id: e.id, type: "Tax Proposed", slot: getSlot(e), actor: "",
      detail: `→ ${(Number(e.newPercentage) / 100).toFixed(1)}%/mo`,
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.moduleUpdateProposedEvents ?? []) {
    events.push({
      id: e.id, type: "Module Proposed", slot: getSlot(e), actor: "",
      detail: truncateAddress(e.newModule),
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }
  for (const e of data.pendingUpdateCancelledEvents ?? []) {
    events.push({
      id: e.id, type: "Update Cancelled", slot: getSlot(e), actor: "",
      detail: "",
      timestamp: Number(e.timestamp), tx: e.tx,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}
