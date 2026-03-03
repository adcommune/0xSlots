export type EventType =
  // V3 subgraph event types
  | "Buy"
  | "Release"
  | "Liquidate"
  | "PriceUpdate"
  | "Deposit"
  | "Withdraw"
  | "TaxCollect"
  | "Settle"
  | "TaxProposed"
  | "ModuleProposed"
  | "UpdateCancelled"
  | "UpdateApplied"
  | "LiquidationBountyUpdated"
  // V2 SDK event types
  | "landOpened"
  | "slotCreated"
  | "slotPurchased"
  | "slotReleased"
  | "priceUpdated";
