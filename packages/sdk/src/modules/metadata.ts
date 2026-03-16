import type { Address, Hash, WalletClient, PublicClient, Chain } from "viem";
import type { GraphQLClient } from "graphql-request";
import { getSdk } from "../generated/graphql";
import { metadataModuleAbi, getMetadataModuleAddress } from "@0xslots/contracts";
import { SlotsError } from "../errors";

/**
 * Module namespace for MetadataModule operations.
 * Accessible via `client.modules.metadata`.
 *
 * Read: subgraph queries for MetadataSlot entities
 * Write: `updateMetadata(slot, uri)` on the MetadataModule contract
 * RPC read: `tokenURI(slot)` on the MetadataModule contract
 */
export class MetadataModuleClient {
  private readonly sdk: ReturnType<typeof getSdk>;
  private readonly chainId: number;
  private readonly _publicClient?: PublicClient;
  private readonly _walletClient?: WalletClient;
  private readonly _moduleAddress?: Address;

  constructor(opts: {
    sdk: ReturnType<typeof getSdk>;
    chainId: number;
    publicClient?: PublicClient;
    walletClient?: WalletClient;
    moduleAddress?: Address;
  }) {
    this.sdk = opts.sdk;
    this.chainId = opts.chainId;
    this._publicClient = opts.publicClient;
    this._walletClient = opts.walletClient;
    this._moduleAddress = opts.moduleAddress ?? getMetadataModuleAddress(opts.chainId);
  }

  private get moduleAddress(): Address {
    if (!this._moduleAddress) throw new SlotsError("metadata", `No MetadataModule deployed on chain ${this.chainId}`);
    return this._moduleAddress;
  }

  private get wallet(): WalletClient {
    if (!this._walletClient) throw new SlotsError("metadata", "No walletClient provided");
    return this._walletClient;
  }

  private get account(): Address {
    const account = this.wallet.account;
    if (!account) throw new SlotsError("metadata", "WalletClient must have an account");
    return account.address;
  }

  private get chain(): Chain {
    const chain = this.wallet.chain;
    if (!chain) throw new SlotsError("metadata", "WalletClient must have a chain");
    return chain;
  }

  private get publicClient(): PublicClient {
    if (!this._publicClient) throw new SlotsError("metadata", "No publicClient provided");
    return this._publicClient;
  }

  private async query<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw new SlotsError(operation, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — Subgraph
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get all slots with metadata, ordered by most recently updated. */
  getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataSlots"]>) {
    return this.query("metadata.getSlots", () => this.sdk.GetMetadataSlots(...args));
  }

  /** Get a single metadata slot by slot address. */
  getSlot(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataSlot"]>) {
    return this.query("metadata.getSlot", () => this.sdk.GetMetadataSlot(...args));
  }

  /** Get all metadata slots for a given recipient. */
  getSlotsByRecipient(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataSlotsByRecipient"]>) {
    return this.query("metadata.getSlotsByRecipient", () => this.sdk.GetMetadataSlotsByRecipient(...args));
  }

  /** Get metadata update history for a slot. */
  getUpdateHistory(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataUpdatedEvents"]>) {
    return this.query("metadata.getUpdateHistory", () => this.sdk.GetMetadataUpdatedEvents(...args));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — RPC
  // ═══════════════════════════════════════════════════════════════════════════

  /** Read the current URI for a slot directly from chain (bypasses subgraph). */
  async getURI(slot: Address): Promise<string> {
    return this.query("metadata.getURI", () =>
      this.publicClient.readContract({
        address: this.moduleAddress,
        abi: metadataModuleAbi,
        functionName: "tokenURI",
        args: [slot],
      }) as Promise<string>,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update the metadata URI for a slot. Only callable by the current occupant.
   * @param slot - The slot contract address
   * @param uri - The new URI (e.g. ipfs://..., https://...)
   * @returns Transaction hash
   */
  async updateMetadata(slot: Address, uri: string): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.moduleAddress,
      abi: metadataModuleAbi,
      functionName: "updateMetadata",
      args: [slot, uri],
      account: this.account,
      chain: this.chain,
    });
  }

  /** Returns the MetadataModule contract address for the configured chain. */
  getAddress(): Address {
    return this.moduleAddress;
  }
}
