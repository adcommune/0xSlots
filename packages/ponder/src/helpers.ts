import type { Context } from "ponder:registry";
import { account, accountSlot, currency, module } from "ponder:schema";
import { type Address, type Hex, getAddress, toFunctionSelector } from "viem";
import { ERC20Abi } from "../abis";

// Function selector for splitHash() — used to detect 0xSplits contracts
// by scanning bytecode (avoids noisy failed eth_calls on non-Splits contracts).
const SPLIT_HASH_SELECTOR = toFunctionSelector("splitHash()").slice(2);

export const ZERO_ADDR =
  "0x0000000000000000000000000000000000000000" as const satisfies Hex;

export const evtId = (txHash: Hex, logIndex: number | bigint): string =>
  `${txHash}-${logIndex.toString()}`;

export const lower = (a: Hex): Hex => a.toLowerCase() as Hex;

type AccountTypeValue = "EOA" | "CONTRACT" | "DELEGATED" | "SPLIT";

async function detectAccountType(
  ctx: Context,
  address: Address,
  isTxSender: boolean,
): Promise<AccountTypeValue> {
  const code = await ctx.client.getCode({ address });
  if (!code || code === "0x") return "EOA";
  if (isTxSender) return "DELEGATED";

  // Detect 0xSplits by scanning the bytecode for splitHash() selector.
  // No extra RPC call (vs. readContract) — avoids reverts spamming logs.
  if (code.toLowerCase().includes(SPLIT_HASH_SELECTOR.toLowerCase())) {
    return "SPLIT";
  }

  return "CONTRACT";
}

export async function getOrCreateAccount(
  ctx: Context,
  addressRaw: Hex,
  isTxSender = false,
) {
  const id = lower(addressRaw);
  const existing = await ctx.db.find(account, { id });
  if (existing) {
    if (existing.type === "CONTRACT" && isTxSender) {
      return ctx.db.update(account, { id }).set({ type: "DELEGATED" });
    }
    return existing;
  }
  const type = await detectAccountType(ctx, getAddress(id), isTxSender);
  return ctx.db.insert(account).values({
    id,
    type,
    slotCount: 0,
    occupiedCount: 0,
    metadataUpdateCount: 0n,
    totalHoldTime: 0n,
  });
}

export async function getOrCreateAccountSlot(
  ctx: Context,
  accountAddr: Hex,
  slotAddr: Hex,
  timestamp: bigint,
  chainId: number,
) {
  const acc = lower(accountAddr);
  const slt = lower(slotAddr);
  const existing = await ctx.db.find(accountSlot, {
    account: acc,
    slot: slt,
  });
  if (existing) return existing;
  return ctx.db.insert(accountSlot).values({
    account: acc,
    slot: slt,
    chainId,
    metadataUpdateCount: 0n,
    taxPaid: 0n,
    holdTime: 0n,
    lastOccupiedAt: null,
    firstInteractedAt: timestamp,
    lastInteractedAt: timestamp,
  });
}

export async function getOrCreateCurrency(ctx: Context, addressRaw: Hex) {
  const id = lower(addressRaw);
  const existing = await ctx.db.find(currency, { id });
  if (existing) return existing;

  let name: string | null = null;
  let symbol: string | null = null;
  let decimals = 18;

  if (id !== ZERO_ADDR) {
    try {
      const checksum = getAddress(id);
      const abi = ERC20Abi as unknown as readonly unknown[];
      const [n, s, d] = await ctx.client.multicall({
        allowFailure: true,
        contracts: [
          { address: checksum, abi, functionName: "name" },
          { address: checksum, abi, functionName: "symbol" },
          { address: checksum, abi, functionName: "decimals" },
        ],
      });
      if (n.status === "success" && typeof n.result === "string") name = n.result;
      if (s.status === "success" && typeof s.result === "string") symbol = s.result;
      if (d.status === "success") {
        if (typeof d.result === "number") decimals = d.result;
        else if (typeof d.result === "bigint") decimals = Number(d.result);
      }
    } catch {
      // leave defaults (e.g. chain has no Multicall3 deployment)
    }
  }

  return ctx.db.insert(currency).values({ id, name, symbol, decimals });
}

export async function getOrCreateModule(
  ctx: Context,
  moduleAddr: Hex,
  factoryAddr: Hex,
  chainId: number,
) {
  const id = lower(moduleAddr);
  const existing = await ctx.db.find(module, { id });
  if (existing) return existing;
  return ctx.db.insert(module).values({
    id,
    chainId,
    factory: lower(factoryAddr),
    verified: false,
    name: "",
    version: "",
    feeBps: 0n,
    moduleURI: null,
    image: null,
    description: null,
    totalFeesCollected: 0n,
  });
}

export async function tryFetchIpfsJson(uri: string): Promise<string | null> {
  let cid: string | null = null;
  if (uri.startsWith("ipfs://")) cid = uri.slice(7);
  else if (uri.startsWith("Qm") || uri.startsWith("bafy")) cid = uri;
  else if (uri.startsWith("{")) return uri;
  if (!cid) return null;
  try {
    const res = await fetch(`https://ipfs.io/ipfs/${cid}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function extractCid(uri: string): string | null {
  if (uri.startsWith("Qm") || uri.startsWith("bafy")) return uri;
  if (uri.startsWith("ipfs://")) return uri.slice(7);
  return null;
}

export function extractAdType(rawJson: string): string | null {
  try {
    const obj = JSON.parse(rawJson);
    return typeof obj?.type === "string" ? obj.type : null;
  } catch {
    return null;
  }
}
