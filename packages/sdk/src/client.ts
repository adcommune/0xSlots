import { GraphQLClient, gql } from "graphql-request";
import { getSdk } from "./generated/graphql";
import {
  type Address,
  type Hash,
  type WalletClient,
  type PublicClient,
  type Chain,
  encodeFunctionData,
  erc20Abi,
} from "viem";
import { slotAbi, slotFactoryAbi, getSlotsHubAddress } from "@0xslots/contracts";
import { SlotsError } from "./errors";

// ─── GraphQL Meta ─────────────────────────────────────────────────────────────

const META_QUERY = gql`
  query GetMeta {
    _meta {
      block {
        number
        hash
        timestamp
      }
      hasIndexingErrors
    }
  }
`;

export interface SubgraphMeta {
  _meta: {
    block: { number: number; hash: string; timestamp: number };
    hasIndexingErrors: boolean;
  };
}

// ─── Chain Config ─────────────────────────────────────────────────────────────

export enum SlotsChain {
  BASE_SEPOLIA = 84532,
  ARBITRUM = 42161,
}

export const SUBGRAPH_URLS: Record<SlotsChain, string> = {
  [SlotsChain.BASE_SEPOLIA]:
    "https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/version/latest",
  [SlotsChain.ARBITRUM]:
    "https://api.studio.thegraph.com/query/958/0-x-slots-arb/version/latest",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlotConfig {
  mutableTax: boolean;
  mutableModule: boolean;
  manager: Address;
}

export interface SlotInitParams {
  taxPercentage: bigint;
  module: Address;
  liquidationBountyBps: bigint;
  minDepositSeconds: bigint;
}

export interface CreateSlotParams {
  recipient: Address;
  currency: Address;
  config: SlotConfig;
  initParams: SlotInitParams;
}

export interface CreateSlotsParams extends CreateSlotParams {
  count: bigint;
}

export interface BuyParams {
  slot: Address;
  depositAmount: bigint;
  selfAssessedPrice: bigint;
}

export interface SlotsClientConfig {
  chainId: SlotsChain;
  factoryAddress?: Address;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  subgraphUrl?: string;
  headers?: Record<string, string>;
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Client for reading and writing 0xSlots protocol data.
 *
 * Reads come from a Graph Protocol subgraph (via graphql-request).
 * Writes go through a viem WalletClient and handle ERC-20 approvals automatically.
 *
 * @example
 * ```ts
 * const client = new SlotsClient({
 *   chainId: SlotsChain.ARBITRUM,
 *   publicClient,
 *   walletClient,
 * });
 * const slots = await client.getSlots({ first: 10 });
 * ```
 */
export class SlotsClient {
  private readonly sdk: ReturnType<typeof getSdk>;
  private readonly chainId: SlotsChain;
  private readonly gqlClient: GraphQLClient;
  private readonly _publicClient?: PublicClient;
  private readonly walletClient?: WalletClient;
  private readonly _factory?: Address;
  private _atomicSupport: boolean | undefined;

  constructor(config: SlotsClientConfig) {
    this.chainId = config.chainId;
    this._publicClient = config.publicClient;
    this.walletClient = config.walletClient;
    this._factory = config.factoryAddress ?? getSlotsHubAddress(config.chainId);

    const url = config.subgraphUrl || SUBGRAPH_URLS[config.chainId];
    if (!url) throw new Error(`No subgraph URL for chain ${config.chainId}`);
    this.gqlClient = new GraphQLClient(url, { headers: config.headers });
    this.sdk = getSdk(this.gqlClient);
  }

  // ─── Accessors ──────────────────────────────────────────────────────────────

  /** Returns the chain ID this client was configured for. */
  getChainId(): SlotsChain {
    return this.chainId;
  }
  /** Returns the underlying GraphQL client (for advanced usage). */
  getClient(): GraphQLClient {
    return this.gqlClient;
  }
  /** Returns the generated GraphQL SDK (for queries not wrapped by this client). */
  getSdk() {
    return this.sdk;
  }

  private get publicClient(): PublicClient {
    if (!this._publicClient) throw new Error("No publicClient provided");
    return this._publicClient;
  }

  private get factory(): Address {
    if (!this._factory) throw new Error("No factoryAddress provided");
    return this._factory;
  }

  private get wallet(): WalletClient {
    if (!this.walletClient) throw new Error("No walletClient provided");
    return this.walletClient;
  }

  private get account(): Address {
    const account = this.wallet.account;
    if (!account) throw new Error("WalletClient must have an account");
    return account.address;
  }

  private get chain(): Chain {
    const chain = this.wallet.chain;
    if (!chain) throw new Error("WalletClient must have a chain");
    return chain;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private assertPositive(value: bigint, name: string): void {
    if (value <= 0n) throw new SlotsError(name, `${name} must be > 0`);
  }

  private async query<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw new SlotsError(operation, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — Subgraph Queries
  // ═══════════════════════════════════════════════════════════════════════════

  // Slot queries

  /** Fetch a paginated list of slots. */
  getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetSlots"]>) {
    return this.query("getSlots", () => this.sdk.GetSlots(...args));
  }
  /** Fetch a single slot by its address. */
  getSlot(...args: Parameters<ReturnType<typeof getSdk>["GetSlot"]>) {
    return this.query("getSlot", () => this.sdk.GetSlot(...args));
  }
  /** Fetch all slots owned by a given recipient address. */
  getSlotsByRecipient(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByRecipient"]>
  ) {
    return this.query("getSlotsByRecipient", () => this.sdk.GetSlotsByRecipient(...args));
  }
  /** Fetch all slots currently occupied by a given address. */
  getSlotsByOccupant(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByOccupant"]>
  ) {
    return this.query("getSlotsByOccupant", () => this.sdk.GetSlotsByOccupant(...args));
  }

  // Factory queries

  /** Fetch factory configuration. */
  getFactory() {
    return this.query("getFactory", () => this.sdk.GetFactory());
  }
  /** Fetch registered modules. */
  getModules(...args: Parameters<ReturnType<typeof getSdk>["GetModules"]>) {
    return this.query("getModules", () => this.sdk.GetModules(...args));
  }

  // Event queries

  /** Fetch bought events with optional filters. */
  getBoughtEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetBoughtEvents"]>
  ) {
    return this.query("getBoughtEvents", () => this.sdk.GetBoughtEvents(...args));
  }
  /** Fetch settled events with optional filters. */
  getSettledEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSettledEvents"]>
  ) {
    return this.query("getSettledEvents", () => this.sdk.GetSettledEvents(...args));
  }
  /** Fetch tax-collected events with optional filters. */
  getTaxCollectedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetTaxCollectedEvents"]>
  ) {
    return this.query("getTaxCollectedEvents", () => this.sdk.GetTaxCollectedEvents(...args));
  }
  /** Fetch all activity for a specific slot (all event types). */
  getSlotActivity(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotActivity"]>
  ) {
    return this.query("getSlotActivity", () => this.sdk.GetSlotActivity(...args));
  }
  /** Fetch the most recent events across all slots. */
  getRecentEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetRecentEvents"]>
  ) {
    return this.query("getRecentEvents", () => this.sdk.GetRecentEvents(...args));
  }

  // Account queries

  /** Fetch a single account by address. */
  getAccount(...args: Parameters<ReturnType<typeof getSdk>["GetAccount"]>) {
    return this.query("getAccount", () => this.sdk.GetAccount(...args));
  }
  /** Fetch a paginated list of accounts. */
  getAccounts(...args: Parameters<ReturnType<typeof getSdk>["GetAccounts"]>) {
    return this.query("getAccounts", () => this.sdk.GetAccounts(...args));
  }

  // Individual event queries

  /** Fetch released events with optional filters. */
  getReleasedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetReleasedEvents"]>
  ) {
    return this.query("getReleasedEvents", () => this.sdk.GetReleasedEvents(...args));
  }
  /** Fetch liquidated events with optional filters. */
  getLiquidatedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetLiquidatedEvents"]>
  ) {
    return this.query("getLiquidatedEvents", () => this.sdk.GetLiquidatedEvents(...args));
  }
  /** Fetch deposited events with optional filters. */
  getDepositedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetDepositedEvents"]>
  ) {
    return this.query("getDepositedEvents", () => this.sdk.GetDepositedEvents(...args));
  }
  /** Fetch withdrawn events with optional filters. */
  getWithdrawnEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetWithdrawnEvents"]>
  ) {
    return this.query("getWithdrawnEvents", () => this.sdk.GetWithdrawnEvents(...args));
  }
  /** Fetch price-updated events with optional filters. */
  getPriceUpdatedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetPriceUpdatedEvents"]>
  ) {
    return this.query("getPriceUpdatedEvents", () => this.sdk.GetPriceUpdatedEvents(...args));
  }

  // Meta

  /** Fetch subgraph indexing metadata (latest block, indexing errors). */
  getMeta(): Promise<SubgraphMeta> {
    return this.query("getMeta", () => this.gqlClient.request<SubgraphMeta>(META_QUERY));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — On-chain (RPC)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Read full slot info from on-chain (RPC, not subgraph). */
  async getSlotInfo(slot: Address) {
    return this.publicClient.readContract({
      address: slot,
      abi: slotAbi,
      functionName: "getSlotInfo",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Factory Functions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Deploy a new slot via the factory contract.
   * @param params - Slot creation parameters (recipient, currency, config, initParams).
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async createSlot(params: CreateSlotParams): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.factory,
      abi: slotFactoryAbi,
      functionName: "createSlot",
      args: [params.recipient, params.currency, params.config, params.initParams],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Deploy multiple identical slots in a single transaction via the factory contract.
   * @param params - Slot creation parameters including count.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async createSlots(params: CreateSlotsParams): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.factory,
      abi: slotFactoryAbi,
      functionName: "createSlots",
      args: [params.recipient, params.currency, params.config, params.initParams, params.count],
      account: this.account,
      chain: this.chain,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Slot Functions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Buy a slot (or force-buy an occupied one). Handles ERC-20 approval automatically.
   * @param params - Buy parameters (slot address, deposit amount, self-assessed price).
   * @returns Transaction hash.
   * @throws {SlotsError} If depositAmount or selfAssessedPrice is not positive, or the transaction fails.
   */
  async buy(params: BuyParams): Promise<Hash> {
    this.assertPositive(params.depositAmount, "depositAmount");
    this.assertPositive(params.selfAssessedPrice, "selfAssessedPrice");
    return this.withAllowance(params.slot, params.depositAmount, {
      to: params.slot,
      abi: slotAbi,
      functionName: "buy",
      args: [params.depositAmount, params.selfAssessedPrice],
    });
  }

  /**
   * Self-assess a new price for an occupied slot (occupant only).
   * @param slot - The slot contract address.
   * @param newPrice - The new self-assessed price (can be 0).
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async selfAssess(slot: Address, newPrice: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "selfAssess",
      args: [newPrice],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Top up deposit on a slot (occupant only). Handles ERC-20 approval automatically.
   * @param slot - The slot contract address.
   * @param amount - The amount to deposit (must be > 0).
   * @returns Transaction hash.
   * @throws {SlotsError} If amount is not positive, or the transaction fails.
   */
  async topUp(slot: Address, amount: bigint): Promise<Hash> {
    this.assertPositive(amount, "amount");
    return this.withAllowance(slot, amount, {
      to: slot,
      abi: slotAbi,
      functionName: "topUp",
      args: [amount],
    });
  }

  /**
   * Withdraw from deposit (occupant only). Cannot go below minimum deposit.
   * @param slot - The slot contract address.
   * @param amount - The amount to withdraw (must be > 0).
   * @returns Transaction hash.
   * @throws {SlotsError} If amount is not positive, or the transaction fails.
   */
  async withdraw(slot: Address, amount: bigint): Promise<Hash> {
    this.assertPositive(amount, "amount");
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "withdraw",
      args: [amount],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Release a slot (occupant only). Returns remaining deposit to the occupant.
   * @param slot - The slot contract address.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async release(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "release",
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Collect accumulated tax (permissionless).
   * @param slot - The slot contract address.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async collect(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "collect",
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Liquidate an insolvent slot (permissionless). Caller receives bounty.
   * @param slot - The slot contract address.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async liquidate(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "liquidate",
      account: this.account,
      chain: this.chain,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Manager Functions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Propose a tax rate update (manager only, slot must have mutableTax).
   * @param slot - The slot contract address.
   * @param newPct - The new tax percentage.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async proposeTaxUpdate(slot: Address, newPct: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "proposeTaxUpdate",
      args: [newPct],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Propose a module update (manager only, slot must have mutableModule).
   * @param slot - The slot contract address.
   * @param newModule - The new module contract address.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async proposeModuleUpdate(slot: Address, newModule: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "proposeModuleUpdate",
      args: [newModule],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Cancel pending updates (manager only).
   * @param slot - The slot contract address.
   * @returns Transaction hash.
   * @throws {SlotsError} If the transaction fails.
   */
  async cancelPendingUpdates(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "cancelPendingUpdates",
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Set liquidation bounty bps (manager only).
   * @param slot - The slot contract address.
   * @param newBps - The new bounty in basis points (0-10000).
   * @returns Transaction hash.
   * @throws {SlotsError} If newBps is outside 0-10000, or the transaction fails.
   */
  async setLiquidationBounty(slot: Address, newBps: bigint): Promise<Hash> {
    if (newBps < 0n || newBps > 10000n) throw new SlotsError("setLiquidationBounty", "newBps must be 0\u201310000");
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "setLiquidationBounty",
      args: [newBps],
      account: this.account,
      chain: this.chain,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Multicall
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Batch multiple slot calls into one transaction via multicall.
   * @param slot - The slot contract address.
   * @param calls - Array of function calls to batch.
   * @returns Transaction hash.
   * @throws {SlotsError} If calls array is empty, or the transaction fails.
   */
  async multicall(slot: Address, calls: { functionName: string; args?: any[] }[]): Promise<Hash> {
    if (calls.length === 0) throw new SlotsError("multicall", "calls array must not be empty");
    const data = calls.map((call) =>
      encodeFunctionData({
        abi: slotAbi,
        functionName: call.functionName as any,
        args: call.args as any,
      })
    );
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "multicall",
      args: [data],
      account: this.account,
      chain: this.chain,
    });
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  /** Check if wallet supports atomic batch calls (EIP-5792). */
  private async supportsAtomicBatch(): Promise<boolean> {
    if (this._atomicSupport !== undefined) return this._atomicSupport;
    try {
      const capabilities = await (this.wallet as any).getCapabilities?.();
      if (!capabilities) {
        this._atomicSupport = false;
        return false;
      }
      const chainId = this.chain.id;
      const chainCaps = capabilities[chainId] || capabilities[`0x${chainId.toString(16)}`];
      const atomic = chainCaps?.atomicBatch ?? chainCaps?.atomic;
      const status = atomic && typeof atomic === "object" && "status" in atomic
        ? (atomic as { status: string }).status
        : undefined;
      this._atomicSupport = status === "supported" || status === "ready";
    } catch {
      this._atomicSupport = false;
    }
    return this._atomicSupport;
  }

  /** Poll EIP-5792 getCallsStatus until the batch settles, then return a tx hash. */
  private async pollBatchReceipt(id: string): Promise<Hash> {
    const MAX_ATTEMPTS = 60;
    const INTERVAL = 1500;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const result = await (this.wallet as any).getCallsStatus({ id });
      if (result.status === "success") {
        const receipts: { transactionHash: Hash }[] = result.receipts ?? [];
        return receipts[receipts.length - 1]?.transactionHash ?? (id as Hash);
      }
      if (result.status === "failure") {
        throw new Error("Batch transaction reverted");
      }
      await new Promise((r) => setTimeout(r, INTERVAL));
    }
    throw new Error("Batch transaction timed out");
  }

  /**
   * Execute a contract call that needs ERC-20 allowance.
   * If wallet supports atomic batch (EIP-5792): sends approve + action as one atomic call.
   * Otherwise: chains approve tx (if needed) then action tx.
   */
  private async withAllowance(
    spender: Address,
    amount: bigint,
    call: { to: Address; abi: any; functionName: string; args: any[] },
  ): Promise<Hash> {
    const currency = await this.publicClient.readContract({
      address: spender,
      abi: slotAbi,
      functionName: "currency",
    });

    const allowance = await this.publicClient.readContract({
      address: currency,
      abi: erc20Abi,
      functionName: "allowance",
      args: [this.account, spender],
    });

    const needsApproval = allowance < amount;

    // Atomic batch path
    if (needsApproval && await this.supportsAtomicBatch()) {
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      });
      const actionData = encodeFunctionData({
        abi: call.abi,
        functionName: call.functionName as any,
        args: call.args,
      });

      const id = await (this.wallet as any).sendCalls({
        account: this.account,
        chain: this.chain,
        calls: [
          { to: currency, data: approveData },
          { to: call.to, data: actionData },
        ],
      });

      // Poll getCallsStatus until the batch settles, then return the tx hash
      const txHash = await this.pollBatchReceipt(id);
      return txHash;
    }

    // Sequential path
    if (needsApproval) {
      const hash = await this.wallet.writeContract({
        address: currency,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
        account: this.account,
        chain: this.chain,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
    }

    return this.wallet.writeContract({
      address: call.to,
      abi: call.abi,
      functionName: call.functionName as any,
      args: call.args,
      account: this.account,
      chain: this.chain,
    });
  }
}

export function createSlotsClient(config: SlotsClientConfig): SlotsClient {
  return new SlotsClient(config);
}
