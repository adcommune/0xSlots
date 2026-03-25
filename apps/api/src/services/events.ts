import { alchemyRpcUrl } from "@0xslots/config";
import {
  createPublicClient,
  decodeAbiParameters,
  http,
  parseAbiItem,
} from "viem";
import { base, baseSepolia } from "viem/chains";

// ═══════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════

const FACTORIES: Record<number, `0x${string}`> = {
  [base.id]: "0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e",
  [baseSepolia.id]: "0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF",
};

const slotEvent = parseAbiItem(
  "event SlotEvent(address indexed slot, uint8 indexed eventType, bytes data)",
);

// ═══════════════════════════════════════════════════════════
// Event type registry
// ═══════════════════════════════════════════════════════════

enum EventType {
  BOUGHT = 1,
  RELEASED = 2,
  LIQUIDATED = 3,
  PRICE_UPDATED = 4,
  DEPOSITED = 5,
  WITHDRAWN = 6,
  TAX_COLLECTED = 7,
  SETTLED = 8,
}

const EVENT_TYPES: Record<
  EventType,
  { name: string; params: { name: string; type: string }[] }
> = {
  [EventType.BOUGHT]: {
    name: "Bought",
    params: [
      { name: "buyer", type: "address" },
      { name: "previousOccupant", type: "address" },
      { name: "price", type: "uint256" },
      { name: "deposit", type: "uint256" },
      { name: "selfAssessedPrice", type: "uint256" },
    ],
  },
  [EventType.RELEASED]: {
    name: "Released",
    params: [
      { name: "occupant", type: "address" },
      { name: "refund", type: "uint256" },
    ],
  },
  [EventType.LIQUIDATED]: {
    name: "Liquidated",
    params: [
      { name: "liquidator", type: "address" },
      { name: "occupant", type: "address" },
      { name: "bounty", type: "uint256" },
    ],
  },
  [EventType.PRICE_UPDATED]: {
    name: "PriceUpdated",
    params: [
      { name: "oldPrice", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
  },
  [EventType.DEPOSITED]: {
    name: "Deposited",
    params: [
      { name: "depositor", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  [EventType.WITHDRAWN]: {
    name: "Withdrawn",
    params: [
      { name: "occupant", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  [EventType.TAX_COLLECTED]: {
    name: "TaxCollected",
    params: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  [EventType.SETTLED]: {
    name: "Settled",
    params: [
      { name: "taxOwed", type: "uint256" },
      { name: "taxPaid", type: "uint256" },
      { name: "depositRemaining", type: "uint256" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// Decoder
// ═══════════════════════════════════════════════════════════

function decodeSlotEvent(eventType: EventType, data: `0x${string}`) {
  const def = EVENT_TYPES[eventType];
  if (!def) return { eventName: `Unknown(${eventType})`, decoded: data };

  try {
    const types = def.params.map((p) => ({ name: p.name, type: p.type }));
    const values = decodeAbiParameters(types, data);

    const decoded: Record<string, string> = {};
    def.params.forEach((p, i) => {
      decoded[p.name] = String(values[i]);
    });

    return { eventName: def.name, decoded };
  } catch {
    return { eventName: def.name, decoded: data };
  }
}

// ═══════════════════════════════════════════════════════════
// Listener
// ═══════════════════════════════════════════════════════════

export function startEventListener(alchemyKey: string) {
  const chainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : base.id;
  const chain = chainId === baseSepolia.id ? baseSepolia : base;
  const factory = FACTORIES[chainId];

  if (!factory) {
    console.error(`[events] No factory configured for chain ${chainId}`);
    return;
  }

  const rpcUrl = alchemyRpcUrl(chainId, alchemyKey);
  if (!rpcUrl) {
    console.error(`[events] No RPC URL for chain ${chainId}`);
    return;
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
    pollingInterval: 15000,
  });

  console.log(`[events] Watching SlotEvent on ${chain.name}`);
  console.log(`[events] Factory: ${factory}`);

  client.watchEvent({
    address: factory,
    event: slotEvent,
    onLogs: (logs) => {
      for (const log of logs) {
        const { slot, eventType, data } = log.args as {
          slot: `0x${string}`;
          eventType: EventType;
          data: `0x${string}`;
        };

        const { eventName, decoded } = decodeSlotEvent(eventType, data);

        console.log(
          `[events] ${eventName} | slot=${slot} | block=${log.blockNumber}`,
        );
        console.log(`[events]   data:`, decoded);
      }
    },
    onError: (err) => console.error("[events] Error:", err.message),
  });
}
