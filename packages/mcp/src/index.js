#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// zod is a peer dep of @modelcontextprotocol/sdk
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";
import { SlotsHubABI, SlotsABI } from "./abi.js";

// ── Config ──────────────────────────────────────────────────────────────────
const SLOTS_HUB = process.env.SLOTS_HUB || "0xFdE9B7c9B8448cA5324Be5948BA6643745c3E49e";
const RPC_URL = process.env.RPC_URL || "https://sepolia.optimism.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || "https://api.studio.thegraph.com/query/958/0-x-slots-opt-sepolia/v0.0.1";

const chain = optimismSepolia;
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

function getWalletClient() {
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY env required for write operations");
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
  return createWalletClient({ account, chain, transport: http(RPC_URL) });
}

async function gqlQuery(query, variables = {}) {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(", "));
  return json.data;
}

// ── Server ──────────────────────────────────────────────────────────────────
const server = new McpServer({ name: "0xSlots MCP", version: "0.1.0" });

// ── READ TOOLS ──────────────────────────────────────────────────────────────

server.tool("hub_settings", "Get the current SlotsHub configuration", {}, async () => {
  const settings = await publicClient.readContract({
    address: SLOTS_HUB, abi: SlotsHubABI, functionName: "hubSettings",
  });
  return { content: [{ type: "text", text: JSON.stringify({
    protocolFeeBps: Number(settings.protocolFeeBps),
    protocolFeeRecipient: settings.protocolFeeRecipient,
    slotPrice: formatEther(settings.slotPrice),
    defaultCurrency: settings.newLandInitialCurrency,
    defaultSlotCount: Number(settings.newLandInitialAmount),
    defaultPrice: formatEther(settings.newLandInitialPrice),
    defaultTaxBps: Number(settings.newLandInitialTaxPercentage),
    maxTaxBps: Number(settings.newLandInitialMaxTaxPercentage),
    minTaxUpdatePeriod: `${Number(settings.newLandInitialMinTaxUpdatePeriod) / 86400} days`,
    defaultModule: settings.newLandInitialModule,
  }, null, 2) }] };
});

server.tool("get_land", "Get the Slots contract address for an account", {
  account: z.string().describe("Account address"),
}, async ({ account }) => {
  const land = await publicClient.readContract({
    address: SLOTS_HUB, abi: SlotsHubABI, functionName: "getLand", args: [account],
  });
  return { content: [{ type: "text", text: land === "0x0000000000000000000000000000000000000000" ? "No land found" : `Land: ${land}` }] };
});

server.tool("get_slot", "Get details of a specific slot in a Land", {
  land: z.string().describe("Land (Slots contract) address"),
  slotId: z.number().describe("Slot ID"),
}, async ({ land, slotId }) => {
  const slot = await publicClient.readContract({
    address: land, abi: SlotsABI, functionName: "getSlot", args: [BigInt(slotId)],
  });
  return { content: [{ type: "text", text: JSON.stringify({
    occupant: slot.occupant,
    currency: slot.currency,
    basePrice: formatEther(slot.basePrice),
    price: formatEther(slot.price),
    active: slot.active,
    taxBps: Number(slot.taxPercentage),
    maxTaxBps: Number(slot.maxTaxPercentage),
    module: slot.module,
    pendingTaxUpdate: {
      newRate: Number(slot.pendingTaxUpdate.newRate),
      status: ["None", "Pending", "Confirmed"][Number(slot.pendingTaxUpdate.status)],
    },
  }, null, 2) }] };
});

server.tool("list_slots", "List all slots in a Land contract", {
  land: z.string().describe("Land (Slots contract) address"),
}, async ({ land }) => {
  const nextId = await publicClient.readContract({ address: land, abi: SlotsABI, functionName: "nextSlotId" });
  const slots = [];
  for (let i = 1; i < Number(nextId); i++) {
    const slot = await publicClient.readContract({ address: land, abi: SlotsABI, functionName: "getSlot", args: [BigInt(i)] });
    slots.push({ id: i, occupant: slot.occupant, price: formatEther(slot.price), active: slot.active, taxBps: Number(slot.taxPercentage) });
  }
  return { content: [{ type: "text", text: JSON.stringify(slots, null, 2) }] };
});

server.tool("calculate_flow_rate", "Calculate the Superfluid flow rate for a slot's tax", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID"),
}, async ({ land, slotId }) => {
  const rate = await publicClient.readContract({ address: land, abi: SlotsABI, functionName: "calculateFlowRate", args: [BigInt(slotId)] });
  const perSecond = Number(rate);
  return { content: [{ type: "text", text: JSON.stringify({
    flowRatePerSecond: perSecond,
    flowRatePerDay: perSecond * 86400,
    flowRatePerMonth: perSecond * 86400 * 30,
    unit: "wei/second",
  }, null, 2) }] };
});

// ── SUBGRAPH TOOLS ──────────────────────────────────────────────────────────

server.tool("query_lands", "List all Lands from the subgraph", {}, async () => {
  const data = await gqlQuery(`{ lands(first: 100) { id owner createdAt slots { id slotId occupant price active } } }`);
  return { content: [{ type: "text", text: JSON.stringify(data.lands, null, 2) }] };
});

server.tool("query_slot_purchases", "Get recent slot purchases from subgraph", {
  first: z.number().optional().describe("Number of results (default 20)"),
}, async ({ first = 20 }) => {
  const data = await gqlQuery(`{ slotPurchases(first: ${first}, orderBy: timestamp, orderDirection: desc) { id slot { id slotId land { id owner } } newOccupant timestamp tx } }`);
  return { content: [{ type: "text", text: JSON.stringify(data.slotPurchases, null, 2) }] };
});

server.tool("query_price_history", "Get price update history for a slot", {
  slotEntityId: z.string().describe("Slot entity ID (land-slotId)"),
}, async ({ slotEntityId }) => {
  const data = await gqlQuery(`{ priceUpdates(where: { slot: "${slotEntityId}" }, orderBy: timestamp, orderDirection: desc, first: 50) { oldPrice newPrice timestamp tx } }`);
  return { content: [{ type: "text", text: JSON.stringify(data.priceUpdates, null, 2) }] };
});

server.tool("query_flows", "Get recent Superfluid flow changes", {
  first: z.number().optional().describe("Number of results (default 20)"),
}, async ({ first = 20 }) => {
  const data = await gqlQuery(`{ flowChanges(first: ${first}, orderBy: timestamp, orderDirection: desc) { from to oldRate newRate operation timestamp } }`);
  return { content: [{ type: "text", text: JSON.stringify(data.flowChanges, null, 2) }] };
});

// ── WRITE TOOLS ─────────────────────────────────────────────────────────────

server.tool("open_land", "Open a new Land (slot collection) for an account", {
  account: z.string().describe("Account to open land for"),
}, async ({ account }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: SLOTS_HUB, abi: SlotsHubABI, functionName: "openLand", args: [account],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Land opened! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

server.tool("buy_slot", "Buy a slot at its listed price (requires prior token approval + Superfluid flow)", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID to buy"),
}, async ({ land, slotId }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: land, abi: SlotsABI, functionName: "buy", args: [BigInt(slotId)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Slot ${slotId} purchased! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

server.tool("release_slot", "Release a slot you occupy (stops tax stream)", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID to release"),
}, async ({ land, slotId }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: land, abi: SlotsABI, functionName: "release", args: [BigInt(slotId)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Slot ${slotId} released! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

server.tool("self_assess", "Update the price of a slot you occupy", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID"),
  newPrice: z.string().describe("New price in ETH (e.g. '0.01')"),
}, async ({ land, slotId, newPrice }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: land, abi: SlotsABI, functionName: "selfAssess", args: [BigInt(slotId), parseEther(newPrice)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Price updated to ${newPrice} ETH! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

server.tool("propose_tax_update", "Propose a new tax rate for a slot (as land owner)", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID"),
  newPercentageBps: z.number().describe("New tax in basis points (100 = 1%)"),
}, async ({ land, slotId, newPercentageBps }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: land, abi: SlotsABI, functionName: "proposeTaxRateUpdate", args: [BigInt(slotId), BigInt(newPercentageBps)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Tax update proposed (${newPercentageBps} bps)! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

server.tool("confirm_tax_update", "Confirm a pending tax rate update (after timelock)", {
  land: z.string().describe("Land address"),
  slotId: z.number().describe("Slot ID"),
}, async ({ land, slotId }) => {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: land, abi: SlotsABI, functionName: "confirmTaxRateUpdate", args: [BigInt(slotId)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { content: [{ type: "text", text: `Tax update confirmed! tx: ${hash}\nStatus: ${receipt.status}` }] };
});

// ── Start ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
