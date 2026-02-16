import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated/graphql";

/**
 * Supported chain IDs for 0xSlots protocol
 */
export enum SlotsChain {
  BASE_SEPOLIA = 84532,
}

/**
 * Subgraph endpoint URLs by chain ID
 */
export const SUBGRAPH_URLS: Record<SlotsChain, string> = {
  [SlotsChain.BASE_SEPOLIA]:
    "https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/version/latest",
};

/**
 * Configuration options for the Slots client
 */
export interface SlotsClientConfig {
  /**
   * The chain ID to query
   */
  chainId: SlotsChain;

  /**
   * Optional custom subgraph URL (overrides default)
   */
  subgraphUrl?: string;

  /**
   * Optional headers to include in requests
   */
  headers?: Record<string, string>;
}

/**
 * Type-safe client for querying 0xSlots subgraph data
 */
export class SlotsClient {
  private readonly sdk: ReturnType<typeof getSdk>;
  private readonly chainId: SlotsChain;
  private readonly client: GraphQLClient;

  /**
   * Create a new SlotsClient instance
   *
   * @param config - Client configuration
   *
   * @example
   * ```typescript
   * import { SlotsClient, SlotsChain } from '@0xslots/sdk';
   *
   * const client = new SlotsClient({
   *   chainId: SlotsChain.BASE_SEPOLIA,
   * });
   *
   * const hub = await client.getHub({ id: '0x...' });
   * ```
   */
  constructor(config: SlotsClientConfig) {
    this.chainId = config.chainId;

    const url = config.subgraphUrl || SUBGRAPH_URLS[config.chainId];
    if (!url) {
      throw new Error(`No subgraph URL configured for chain ${config.chainId}`);
    }

    this.client = new GraphQLClient(url, {
      headers: config.headers,
    });

    this.sdk = getSdk(this.client);
  }

  /**
   * Get the current chain ID
   */
  getChainId(): SlotsChain {
    return this.chainId;
  }

  /**
   * Get the underlying GraphQL client
   */
  getClient(): GraphQLClient {
    return this.client;
  }

  /**
   * Get the generated SDK with all typed query methods
   */
  getSdk() {
    return this.sdk;
  }

  // Convenience methods that proxy to the SDK
  // Hub queries
  getHub(...args: Parameters<ReturnType<typeof getSdk>['GetHub']>) {
    return this.sdk.GetHub(...args);
  }
  getAllowedModules(...args: Parameters<ReturnType<typeof getSdk>['GetAllowedModules']>) {
    return this.sdk.GetAllowedModules(...args);
  }
  getAllowedCurrencies(...args: Parameters<ReturnType<typeof getSdk>['GetAllowedCurrencies']>) {
    return this.sdk.GetAllowedCurrencies(...args);
  }

  // Land queries
  getLands(...args: Parameters<ReturnType<typeof getSdk>['GetLands']>) {
    return this.sdk.GetLands(...args);
  }
  getLand(...args: Parameters<ReturnType<typeof getSdk>['GetLand']>) {
    return this.sdk.GetLand(...args);
  }
  getLandsByOwner(...args: Parameters<ReturnType<typeof getSdk>['GetLandsByOwner']>) {
    return this.sdk.GetLandsByOwner(...args);
  }

  // Slot queries
  getSlots(...args: Parameters<ReturnType<typeof getSdk>['GetSlots']>) {
    return this.sdk.GetSlots(...args);
  }
  getSlot(...args: Parameters<ReturnType<typeof getSdk>['GetSlot']>) {
    return this.sdk.GetSlot(...args);
  }
  getSlotsByOccupant(...args: Parameters<ReturnType<typeof getSdk>['GetSlotsByOccupant']>) {
    return this.sdk.GetSlotsByOccupant(...args);
  }
  getAvailableSlots(...args: Parameters<ReturnType<typeof getSdk>['GetAvailableSlots']>) {
    return this.sdk.GetAvailableSlots(...args);
  }

  // Event queries
  getSlotPurchases(...args: Parameters<ReturnType<typeof getSdk>['GetSlotPurchases']>) {
    return this.sdk.GetSlotPurchases(...args);
  }
  getLandOpenedEvents(...args: Parameters<ReturnType<typeof getSdk>['GetLandOpenedEvents']>) {
    return this.sdk.GetLandOpenedEvents(...args);
  }
  getSlotCreatedEvents(...args: Parameters<ReturnType<typeof getSdk>['GetSlotCreatedEvents']>) {
    return this.sdk.GetSlotCreatedEvents(...args);
  }
  getFlowChanges(...args: Parameters<ReturnType<typeof getSdk>['GetFlowChanges']>) {
    return this.sdk.GetFlowChanges(...args);
  }
}

/**
 * Create a SlotsClient instance
 *
 * @param config - Client configuration
 * @returns A new SlotsClient instance
 *
 * @example
 * ```typescript
 * import { createSlotsClient, SlotsChain } from '@0xslots/sdk';
 *
 * const client = createSlotsClient({
 *   chainId: SlotsChain.BASE_SEPOLIA,
 * });
 * ```
 */
export function createSlotsClient(config: SlotsClientConfig): SlotsClient {
  return new SlotsClient(config);
}
