import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";
import { SlotsHubABI, SlotsABI, MetadataModuleABI } from "./abi.js";

// ── Config ──────────────────────────────────────────────────────────────────

const SLOTS_HUB = (process.env.SLOTS_HUB_ADDRESS ||
  "0xFdE9B7c9B8448cA5324Be5948BA6643745c3E49e") as Address;
const METADATA_MODULE = (process.env.METADATA_MODULE_ADDRESS ||
  "0x3014c378544013864AC4E630b7b4CFA276380E9A") as Address;
const RPC_URL = process.env.RPC_URL || "https://sepolia.optimism.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const chain = optimismSepolia;
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

function getWalletClient() {
  if (!PRIVATE_KEY)
    throw new Error("PRIVATE_KEY env required for write operations");
  const key = (
    PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`
  ) as `0x${string}`;
  const account = privateKeyToAccount(key);
  return createWalletClient({ account, chain, transport: http(RPC_URL) });
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function msg(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// ── Server ──────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "0xSlots MCP",
  version: "0.2.0",
});

// ── 1. get_hub_info ─────────────────────────────────────────────────────────

server.tool(
  "get_hub_info",
  "Get SlotsHub config (owner, currencies, lands count, default params)",
  {},
  async () => {
    const settings = await publicClient.readContract({
      address: SLOTS_HUB,
      abi: SlotsHubABI,
      functionName: "hubSettings",
    });
    return ok({
      protocolFeeBps: Number(settings[0].protocolFeeBps),
      protocolFeeRecipient: settings[0].protocolFeeRecipient,
      slotPrice: formatEther(settings[0].slotPrice),
      defaultCurrency: settings[0].newLandInitialCurrency,
      defaultSlotCount: Number(settings[0].newLandInitialAmount),
      defaultPrice: formatEther(settings[0].newLandInitialPrice),
      defaultTaxBps: Number(settings[0].newLandInitialTaxPercentage),
      maxTaxBps: Number(settings[0].newLandInitialMaxTaxPercentage),
      minTaxUpdatePeriod: `${Number(settings[0].newLandInitialMinTaxUpdatePeriod)}s`,
      defaultModule: settings[0].newLandInitialModule,
    });
  }
);

// ── 2. get_land ─────────────────────────────────────────────────────────────

server.tool(
  "get_land",
  "Get land details by account address (slots count, currency, owner)",
  { account: z.string().describe("Account address that owns the land") },
  async ({ account }) => {
    const land = await publicClient.readContract({
      address: SLOTS_HUB,
      abi: SlotsHubABI,
      functionName: "getLand",
      args: [account as Address],
    });
    if (land === "0x0000000000000000000000000000000000000000") {
      return msg("No land found for this account");
    }
    const [nextId, owner] = await Promise.all([
      publicClient.readContract({
        address: land,
        abi: SlotsABI,
        functionName: "nextSlotId",
      }),
      publicClient.readContract({
        address: land,
        abi: SlotsABI,
        functionName: "owner",
      }),
    ]);
    // Get first slot to find currency/tax
    const slot = await publicClient.readContract({
      address: land,
      abi: SlotsABI,
      functionName: "getSlot",
      args: [1n],
    });
    return ok({
      landAddress: land,
      owner,
      slotsCount: Number(nextId) - 1,
      currency: slot[0].currency,
      taxBps: Number(slot[0].taxPercentage),
    });
  }
);

// ── 3. get_slot ─────────────────────────────────────────────────────────────

server.tool(
  "get_slot",
  "Get slot details (current owner, price, tax rate, metadata)",
  {
    land: z.string().describe("Land (Slots contract) address"),
    slotId: z.number().describe("Slot ID"),
  },
  async ({ land, slotId }) => {
    const slot = await publicClient.readContract({
      address: land as Address,
      abi: SlotsABI,
      functionName: "getSlot",
      args: [BigInt(slotId)],
    });
    return ok({
      occupant: slot[0].occupant,
      currency: slot[0].currency,
      basePrice: formatEther(slot[0].basePrice),
      price: formatEther(slot[0].price),
      active: slot[0].active,
      taxBps: Number(slot[0].taxPercentage),
      maxTaxBps: Number(slot[0].maxTaxPercentage),
      minTaxUpdatePeriod: `${Number(slot[0].minTaxUpdatePeriod)}s`,
      module: slot[0].module,
      pendingTaxUpdate: {
        newRate: Number(slot[0].pendingTaxUpdate.newRate),
        status: ["None", "Pending", "Confirmed"][
          Number(slot[0].pendingTaxUpdate.status)
        ],
      },
    });
  }
);

// ── 4. list_lands ───────────────────────────────────────────────────────────

server.tool(
  "list_lands",
  "List all lands on the hub (queries LandOpened events)",
  {},
  async () => {
    const logs = await publicClient.getLogs({
      address: SLOTS_HUB,
      event: {
        type: "event",
        name: "LandOpened",
        inputs: [
          { name: "land", type: "address", indexed: true },
          { name: "account", type: "address", indexed: true },
        ],
      },
      fromBlock: 0n,
      toBlock: "latest",
    });
    const lands = logs.map((log) => ({
      land: log.args.land,
      account: log.args.account,
      blockNumber: Number(log.blockNumber),
    }));
    return ok({ count: lands.length, lands });
  }
);

// ── 5. list_slots ───────────────────────────────────────────────────────────

server.tool(
  "list_slots",
  "List all slots for a given land",
  { land: z.string().describe("Land (Slots contract) address") },
  async ({ land }) => {
    const nextId = await publicClient.readContract({
      address: land as Address,
      abi: SlotsABI,
      functionName: "nextSlotId",
    });
    const slots = [];
    for (let i = 1; i < Number(nextId); i++) {
      const slot = await publicClient.readContract({
        address: land as Address,
        abi: SlotsABI,
        functionName: "getSlot",
        args: [BigInt(i)],
      });
      slots.push({
        id: i,
        occupant: slot[0].occupant,
        price: formatEther(slot[0].price),
        active: slot[0].active,
        taxBps: Number(slot[0].taxPercentage),
      });
    }
    return ok(slots);
  }
);

// ── 6. get_slot_metadata ────────────────────────────────────────────────────

server.tool(
  "get_slot_metadata",
  "Get metadata from MetadataModule for a slot",
  {
    land: z.string().describe("Land address"),
    slotId: z.number().describe("Slot ID"),
  },
  async ({ land, slotId }) => {
    const result = await publicClient.readContract({
      address: METADATA_MODULE,
      abi: MetadataModuleABI,
      functionName: "getMetadata",
      args: [land as Address, BigInt(slotId)],
    });
    return ok({
      metadata: result[0].metadata,
      owner: result[0].owner,
    });
  }
);

// ── 7. purchase_slot ────────────────────────────────────────────────────────

server.tool(
  "purchase_slot",
  "Buy a slot (requires prior token approval + CFA operator permission for Superfluid streaming)",
  {
    land: z.string().describe("Land address"),
    slotId: z.number().describe("Slot ID to purchase"),
  },
  async ({ land, slotId }) => {
    const wallet = getWalletClient();
    const hash = await wallet.writeContract({
      address: land as Address,
      abi: SlotsABI,
      functionName: "buy",
      args: [BigInt(slotId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return msg(
      `Slot ${slotId} purchased! tx: ${hash}\nStatus: ${receipt.status}`
    );
  }
);

// ── 8. update_slot_price ────────────────────────────────────────────────────

server.tool(
  "update_slot_price",
  "Change your slot's self-assessed price (updates the Superfluid tax stream)",
  {
    land: z.string().describe("Land address"),
    slotId: z.number().describe("Slot ID"),
    newPrice: z.string().describe("New price in ETH (e.g. '0.01')"),
  },
  async ({ land, slotId, newPrice }) => {
    const wallet = getWalletClient();
    const hash = await wallet.writeContract({
      address: land as Address,
      abi: SlotsABI,
      functionName: "selfAssess",
      args: [BigInt(slotId), parseEther(newPrice)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return msg(
      `Price updated to ${newPrice} ETH! tx: ${hash}\nStatus: ${receipt.status}`
    );
  }
);

// ── 9. set_slot_metadata ────────────────────────────────────────────────────

server.tool(
  "set_slot_metadata",
  "Set metadata on a slot via MetadataModule (must be slot occupant)",
  {
    land: z.string().describe("Land address"),
    slotId: z.number().describe("Slot ID"),
    metadata: z.string().describe("Metadata string to set"),
  },
  async ({ land, slotId, metadata }) => {
    const wallet = getWalletClient();
    const hash = await wallet.writeContract({
      address: METADATA_MODULE,
      abi: MetadataModuleABI,
      functionName: "setMetadata",
      args: [land as Address, BigInt(slotId), metadata],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return msg(`Metadata set! tx: ${hash}\nStatus: ${receipt.status}`);
  }
);

// ── 10. create_land ─────────────────────────────────────────────────────────

server.tool(
  "create_land",
  "Create a new land (opens a Slots contract for an account via the Hub)",
  {
    account: z.string().describe("Account address to create land for"),
  },
  async ({ account }) => {
    const wallet = getWalletClient();
    const hash = await wallet.writeContract({
      address: SLOTS_HUB,
      abi: SlotsHubABI,
      functionName: "openLand",
      args: [account as Address],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return msg(`Land created! tx: ${hash}\nStatus: ${receipt.status}`);
  }
);

// ── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
