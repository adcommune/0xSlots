import {
  feedModuleAbi,
  feedRouterAbi,
  feedRouterAddress,
  feedSocialGroupAbi,
  feedSocialGroupAddress,
} from "@0xslots/contracts";
import {
  type Address,
  type Chain,
  type Hash,
  type PublicClient,
  type WalletClient,
  erc20Abi,
} from "viem";
import { SlotsError } from "../errors";
import { getSdk } from "../generated/graphql";
import type { SlotsChain } from "../client";
import { slotAbi } from "@0xslots/contracts";

const EXPECTED_MODULE_NAME = "FeedPostModule";

/**
 * Module namespace for FeedPostModule operations.
 * Accessible via `client.modules.feed`.
 *
 * Read: subgraph queries for MetadataSlot entities (same schema as MetadataModule)
 * Write:
 *   - `updateMetadata(moduleAddress, slot, uri)` — direct update (occupant only)
 *   - `buyAndPost(slot, depositAmount, selfAssessedPrice, uri)` — atomic buy + post via router
 */
export class FeedModuleClient {
  private readonly sdk: ReturnType<typeof getSdk>;
  private readonly chainId: SlotsChain;
  private readonly _publicClient?: PublicClient;
  private readonly _walletClient?: WalletClient;

  constructor(opts: {
    sdk: ReturnType<typeof getSdk>;
    chainId: SlotsChain;
    publicClient?: PublicClient;
    walletClient?: WalletClient;
  }) {
    this.sdk = opts.sdk;
    this.chainId = opts.chainId;
    this._publicClient = opts.publicClient;
    this._walletClient = opts.walletClient;
  }

  private get wallet(): WalletClient {
    if (!this._walletClient)
      throw new SlotsError("feed", "No walletClient provided");
    return this._walletClient;
  }

  private get account(): Address {
    const account = this.wallet.account;
    if (!account)
      throw new SlotsError("feed", "WalletClient must have an account");
    return account.address;
  }

  private get chain(): Chain {
    const chain = this.wallet.chain;
    if (!chain) throw new SlotsError("feed", "WalletClient must have a chain");
    return chain;
  }

  private get publicClient(): PublicClient {
    if (!this._publicClient)
      throw new SlotsError("feed", "No publicClient provided");
    return this._publicClient;
  }

  private get routerAddress(): Address {
    const addr =
      feedRouterAddress[this.chainId as keyof typeof feedRouterAddress];
    if (!addr)
      throw new SlotsError("feed", `No FeedRouter for chain ${this.chainId}`);
    return addr as Address;
  }

  private get socialGroupAddress(): Address {
    const addr =
      feedSocialGroupAddress[
        this.chainId as keyof typeof feedSocialGroupAddress
      ];
    if (!addr)
      throw new SlotsError(
        "feed",
        `No FeedSocialGroup for chain ${this.chainId}`,
      );
    return addr as Address;
  }

  private async query<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw new SlotsError(operation, error);
    }
  }

  /**
   * Verify that a given address is a FeedPostModule by calling `name()` on-chain.
   */
  private async verifyModule(moduleAddress: Address): Promise<void> {
    const name = await this.publicClient.readContract({
      address: moduleAddress,
      abi: feedModuleAbi,
      functionName: "name",
    });
    if (name !== EXPECTED_MODULE_NAME) {
      throw new SlotsError(
        "feed",
        `Contract at ${moduleAddress} is not a FeedPostModule (name: "${name}")`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — Subgraph (reuses MetadataSlot entities)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get all slots with metadata, ordered by most recently updated. */
  getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataSlots"]>) {
    return this.query("feed.getSlots", () =>
      this.sdk.GetMetadataSlots(...args),
    );
  }

  /** Get a single metadata slot by slot address. */
  getSlot(...args: Parameters<ReturnType<typeof getSdk>["GetMetadataSlot"]>) {
    return this.query("feed.getSlot", () => this.sdk.GetMetadataSlot(...args));
  }

  /** Get metadata update history for a slot. */
  getUpdateHistory(
    ...args: Parameters<ReturnType<typeof getSdk>["GetMetadataUpdatedEvents"]>
  ) {
    return this.query("feed.getUpdateHistory", () =>
      this.sdk.GetMetadataUpdatedEvents(...args),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ — RPC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Read the current URI for a slot directly from chain.
   */
  async getURI(moduleAddress: Address, slot: Address): Promise<string> {
    return this.query(
      "feed.getURI",
      () =>
        this.publicClient.readContract({
          address: moduleAddress,
          abi: feedModuleAbi,
          functionName: "tokenURI",
          args: [slot],
        }) as Promise<string>,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Direct (occupant only)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update the metadata URI for a slot. Only callable by the current occupant.
   */
  async updateMetadata(
    moduleAddress: Address,
    slot: Address,
    uri: string,
  ): Promise<Hash> {
    await this.verifyModule(moduleAddress);
    return this.wallet.writeContract({
      address: moduleAddress,
      abi: feedModuleAbi,
      functionName: "updateMetadata",
      args: [slot, uri],
      account: this.account,
      chain: this.chain,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Router (atomic buy + post)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Buy a slot and post metadata in one transaction via FeedRouter.
   * User must approve the router for the slot's currency.
   * Handles ERC-20 approval automatically.
   *
   * @param slot - The slot contract address
   * @param depositAmount - Amount to deposit for tax escrow
   * @param selfAssessedPrice - The price you're setting
   * @param uri - The metadata URI to post
   * @returns Transaction hash
   */
  async buyAndPost(
    slot: Address,
    depositAmount: bigint,
    selfAssessedPrice: bigint,
    uri: string,
  ): Promise<Hash> {
    const router = this.routerAddress;

    // Read slot state to calculate total approval needed
    const [occupant, currentPrice, currency] = await Promise.all([
      this.publicClient.readContract({
        address: slot,
        abi: slotAbi,
        functionName: "occupant",
      }) as Promise<Address>,
      this.publicClient.readContract({
        address: slot,
        abi: slotAbi,
        functionName: "price",
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: slot,
        abi: slotAbi,
        functionName: "currency",
      }) as Promise<Address>,
    ]);

    const price =
      occupant !== "0x0000000000000000000000000000000000000000"
        ? currentPrice
        : 0n;
    const total = price + depositAmount;

    // Ensure router has sufficient allowance
    if (total > 0n) {
      const allowance = await this.publicClient.readContract({
        address: currency,
        abi: erc20Abi,
        functionName: "allowance",
        args: [this.account, router],
      });

      if (allowance < total) {
        const approveTx = await this.wallet.writeContract({
          address: currency,
          abi: erc20Abi,
          functionName: "approve",
          args: [router, total],
          account: this.account,
          chain: this.chain,
        });
        await this.publicClient.waitForTransactionReceipt({
          hash: approveTx,
        });
      }
    }

    return this.wallet.writeContract({
      address: router,
      abi: feedRouterAbi,
      functionName: "buyAndPost",
      args: [slot, depositAmount, selfAssessedPrice, uri],
      account: this.account,
      chain: this.chain,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE — Social Group
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Post via the social group contract. Anyone can call — attributed to msg.sender.
   *
   * @param slot - The slot address to post to
   * @param uri - The metadata URI
   * @returns Transaction hash
   */
  async socialGroupPost(slot: Address, uri: string): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.socialGroupAddress,
      abi: feedSocialGroupAbi,
      functionName: "post",
      args: [slot, uri],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Force post via the social group contract. Only callable by POSTING_MANAGER.
   * The poster is passed as an argument — backend is trusted to attribute correctly.
   *
   * @param poster - The address to attribute the post to
   * @param slot - The slot address to post to
   * @param uri - The metadata URI
   * @returns Transaction hash
   */
  async socialGroupPostAdmin(
    poster: Address,
    slot: Address,
    uri: string,
  ): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.socialGroupAddress,
      abi: feedSocialGroupAbi,
      functionName: "postAdmin",
      args: [poster, slot, uri],
      account: this.account,
      chain: this.chain,
    });
  }

  /**
   * Relayed post via the social group contract. Only callable by POSTING_MANAGER.
   * The poster is cryptographically proven via their EIP-712 signature.
   *
   * @param slot - The slot address to post to
   * @param uri - The metadata URI
   * @param nonce - Unique bytes32 nonce for replay protection
   * @param signature - EIP-712 signature from the poster
   * @returns Transaction hash
   */
  async socialGroupPostWithSignature(
    slot: Address,
    uri: string,
    nonce: `0x${string}`,
    signature: `0x${string}`,
  ): Promise<Hash> {
    return this.wallet.writeContract({
      address: this.socialGroupAddress,
      abi: feedSocialGroupAbi,
      functionName: "postWithSignature",
      args: [slot, uri, nonce, signature],
      account: this.account,
      chain: this.chain,
    });
  }
}
