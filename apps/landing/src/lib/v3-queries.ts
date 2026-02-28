const V3_SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/v3.0.2";

async function gqlFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(V3_SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export interface V3Slot {
  id: string;
  recipient: string;
  currency: string;
  manager: string;
  mutableTax: boolean;
  mutableModule: boolean;
  taxPercentage: string;
  module: string;
  occupant: string | null;
  price: string;
  deposit: string;
  collectedTax: string;
  liquidationBountyBps: string;
  isVacant: boolean;
  hasPendingTaxUpdate: boolean;
  hasPendingModuleUpdate: boolean;
  pendingTaxPercentage: string | null;
  pendingModule: string | null;
  createdAt: string;
  createdTx: string;
}

export interface V3SlotEvent {
  id: string;
  slot: { id: string };
  type: string;
  actor: string;
  timestamp: string;
  txHash: string;
  amount: string | null;
  newPrice: string | null;
  newTax: string | null;
}

export interface V3Factory {
  id: string;
  slotCount: number;
}

export async function fetchSlots(first = 100): Promise<V3Slot[]> {
  const data = await gqlFetch<{ slots: V3Slot[] }>(`
    query GetSlots($first: Int!) {
      slots(first: $first, orderBy: createdAt, orderDirection: desc) {
        id recipient currency manager mutableTax mutableModule
        taxPercentage module occupant price deposit collectedTax
        liquidationBountyBps isVacant hasPendingTaxUpdate hasPendingModuleUpdate
        pendingTaxPercentage pendingModule createdAt createdTx
      }
    }
  `, { first });
  return data.slots;
}

export async function fetchSlot(id: string): Promise<V3Slot | null> {
  const data = await gqlFetch<{ slot: V3Slot | null }>(`
    query GetSlot($id: ID!) {
      slot(id: $id) {
        id recipient currency manager mutableTax mutableModule
        taxPercentage module occupant price deposit collectedTax
        liquidationBountyBps isVacant hasPendingTaxUpdate hasPendingModuleUpdate
        pendingTaxPercentage pendingModule createdAt createdTx
      }
    }
  `, { id });
  return data.slot;
}

export async function fetchSlotEvents(slotId: string, first = 50): Promise<V3SlotEvent[]> {
  const data = await gqlFetch<{ slotEvents: V3SlotEvent[] }>(`
    query GetSlotEvents($slotId: String!, $first: Int!) {
      slotEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { slot: $slotId }) {
        id type actor timestamp txHash amount newPrice newTax
        slot { id }
      }
    }
  `, { slotId, first });
  return data.slotEvents;
}

export async function fetchFactory(): Promise<V3Factory | null> {
  const data = await gqlFetch<{ factories: V3Factory[] }>(`
    query GetFactory {
      factories(first: 1) { id slotCount }
    }
  `);
  return data.factories[0] ?? null;
}

export async function fetchAllEvents(first = 50): Promise<V3SlotEvent[]> {
  const data = await gqlFetch<{ slotEvents: V3SlotEvent[] }>(`
    query GetAllEvents($first: Int!) {
      slotEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
        id type actor timestamp txHash amount newPrice newTax
        slot { id }
      }
    }
  `, { first });
  return data.slotEvents;
}
