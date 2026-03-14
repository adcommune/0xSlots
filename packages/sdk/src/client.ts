import { GraphQLClient, gql } from "graphql-request";
import { getSdk } from "./generated/graphql";
import {
  type Address,
  type Hash,
  type WalletClient,
  type PublicClient,
  encodeFunctionData,
  erc20Abi,
} from "viem";
import { slotAbi, slotFactoryAbi, getSlotsHubAddress } from "@0xslots/contracts";

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

  getChainId(): SlotsChain {
    return this.chainId;
  }
  getClient(): GraphQLClient {
    return this.gqlClient;
  }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — Subgraph Queries
  // ═══════════════════════════════════════════════════════════════════════════

  // Slot queries
  getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetSlots"]>) {
    return this.sdk.GetSlots(...args);
  }
  getSlot(...args: Parameters<ReturnType<typeof getSdk>["GetSlot"]>) {
    return this.sdk.GetSlot(...args);
  }
  getSlotsByRecipient(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByRecipient"]>
  ) {
    return this.sdk.GetSlotsByRecipient(...args);
  }
  getSlotsByOccupant(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByOccupant"]>
  ) {
    return this.sdk.GetSlotsByOccupant(...args);
  }

  // Factory queries
  getFactory() {
    return this.sdk.GetFactory();
  }
  getModules(...args: Parameters<ReturnType<typeof getSdk>["GetModules"]>) {
    return this.sdk.GetModules(...args);
  }

  // Event queries
  getBoughtEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetBoughtEvents"]>
  ) {
    return this.sdk.GetBoughtEvents(...args);
  }
  getSettledEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSettledEvents"]>
  ) {
    return this.sdk.GetSettledEvents(...args);
  }
  getTaxCollectedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetTaxCollectedEvents"]>
  ) {
    return this.sdk.GetTaxCollectedEvents(...args);
  }
  getSlotActivity(
    ...args: Parameters<ReturnType<typeof getSdk>["GetSlotActivity"]>
  ) {
    return this.sdk.GetSlotActivity(...args);
  }
  getRecentEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetRecentEvents"]>
  ) {
    return this.sdk.GetRecentEvents(...args);
  }

  // Account queries
  getAccount(...args: Parameters<ReturnType<typeof getSdk>["GetAccount"]>) {
    return this.sdk.GetAccount(...args);
  }
  getAccounts(...args: Parameters<ReturnType<typeof getSdk>["GetAccounts"]>) {
    return this.sdk.GetAccounts(...args);
  }

  // Individual event queries
  getReleasedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetReleasedEvents"]>
  ) {
    return this.sdk.GetReleasedEvents(...args);
  }
  getLiquidatedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetLiquidatedEvents"]>
  ) {
    return this.sdk.GetLiquidatedEvents(...args);
  }
  getDepositedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetDepositedEvents"]>
  ) {
    return this.sdk.GetDepositedEvents(...args);
  }
  getWithdrawnEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetWithdrawnEvents"]>
  ) {
    return this.sdk.GetWithdrawnEvents(...args);
  }
  getPriceUpdatedEvents(
    ...args: Parameters<ReturnType<typeof getSdk>["GetPriceUpdatedEvents"]>
  ) {
    return this.sdk.GetPriceUpdatedEvents(...args);
  }

  // Meta
  getMeta(): Promise<SubgraphMeta> {
    return this.gqlClient.request<SubgraphMeta>(META_QUERY);
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

  async createSlot(params: CreateSlotParams): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.factory,
      abi: slotFactoryAbi,
      functionName: "createSlot",
      args: [params.recipient, params.currency, params.config, params.initParams],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  async createSlots(params: CreateSlotsParams): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.factory,
      abi: slotFactoryAbi,
      functionName: "createSlots",
      args: [params.recipient, params.currency, params.config, params.initParams, params.count],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Slot Functions
  // ═══════════════════════════════════════════════════════════════════════════

  /** Buy a slot (or force buy an occupied one). Handles ERC-20 approval automatically. */
  async buy(params: BuyParams): Promise<Hash> {
    return this.withAllowance(params.slot, params.depositAmount, {
      to: params.slot,
      abi: slotAbi,
      functionName: "buy",
      args: [params.depositAmount, params.selfAssessedPrice],
    });
  }

  /** Self-assess a new price for an occupied slot (occupant only). */
  async selfAssess(slot: Address, newPrice: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "selfAssess",
      args: [newPrice],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Top up deposit on a slot (occupant only). Handles ERC-20 approval automatically. */
  async topUp(slot: Address, amount: bigint): Promise<Hash> {
    return this.withAllowance(slot, amount, {
      to: slot,
      abi: slotAbi,
      functionName: "topUp",
      args: [amount],
    });
  }

  /** Withdraw from deposit (occupant only). Cannot go below minimum deposit. */
  async withdraw(slot: Address, amount: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "withdraw",
      args: [amount],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Release a slot (occupant only). Returns remaining deposit. */
  async release(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "release",
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Collect accumulated tax (permissionless). */
  async collect(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "collect",
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Liquidate an insolvent slot (permissionless). Caller receives bounty. */
  async liquidate(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "liquidate",
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Manager Functions
  // ═══════════════════════════════════════════════════════════════════════════

  /** Propose a tax rate update (manager only, slot must have mutableTax). */
  async proposeTaxUpdate(slot: Address, newPct: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "proposeTaxUpdate",
      args: [newPct],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Propose a module update (manager only, slot must have mutableModule). */
  async proposeModuleUpdate(slot: Address, newModule: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "proposeModuleUpdate",
      args: [newModule],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Cancel pending updates (manager only). */
  async cancelPendingUpdates(slot: Address): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "cancelPendingUpdates",
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  /** Set liquidation bounty bps (manager only). */
  async setLiquidationBounty(slot: Address, newBps: bigint): Promise<Hash> {
    return this.wallet.writeContract({
      address: slot,
      abi: slotAbi,
      functionName: "setLiquidationBounty",
      args: [newBps],
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Multicall
  // ═══════════════════════════════════════════════════════════════════════════

  /** Batch multiple slot calls into one transaction via multicall. */
  async multicall(slot: Address, calls: { functionName: string; args?: any[] }[]): Promise<Hash> {
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
      account: this.wallet.account!,
      chain: this.wallet.chain!,
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
      const chainId = this.wallet.chain!.id;
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
        account: this.wallet.account!,
        chain: this.wallet.chain!,
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
        account: this.wallet.account!,
        chain: this.wallet.chain!,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
    }

    return this.wallet.writeContract({
      address: call.to,
      abi: call.abi,
      functionName: call.functionName as any,
      args: call.args,
      account: this.wallet.account!,
      chain: this.wallet.chain!,
    });
  }
}

export function createSlotsClient(config: SlotsClientConfig): SlotsClient {
  return new SlotsClient(config);
}
