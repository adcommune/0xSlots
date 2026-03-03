import { GraphQLClient, gql } from "graphql-request";
import { getSdk } from "./generated/graphql";

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

export enum SlotsChain {
  BASE_SEPOLIA = 84532,
  ARBITRUM = 42161,
}

export const SUBGRAPH_URLS: Record<SlotsChain, string> = {
  [SlotsChain.BASE_SEPOLIA]:
    "https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/v3.4.0",
  [SlotsChain.ARBITRUM]:
    "https://api.studio.thegraph.com/query/958/0-x-slots-arb/version/latest",
};

export interface SlotsClientConfig {
  chainId: SlotsChain;
  subgraphUrl?: string;
  headers?: Record<string, string>;
}

export class SlotsClient {
  private readonly sdk: ReturnType<typeof getSdk>;
  private readonly chainId: SlotsChain;
  private readonly client: GraphQLClient;

  constructor(config: SlotsClientConfig) {
    this.chainId = config.chainId;
    const url = config.subgraphUrl || SUBGRAPH_URLS[config.chainId];
    if (!url) throw new Error(`No subgraph URL for chain ${config.chainId}`);
    this.client = new GraphQLClient(url, { headers: config.headers });
    this.sdk = getSdk(this.client);
  }

  getChainId(): SlotsChain { return this.chainId; }
  getClient(): GraphQLClient { return this.client; }
  getSdk() { return this.sdk; }

  // Slot queries
  getSlots(...args: Parameters<ReturnType<typeof getSdk>["GetSlots"]>) {
    return this.sdk.GetSlots(...args);
  }
  getSlot(...args: Parameters<ReturnType<typeof getSdk>["GetSlot"]>) {
    return this.sdk.GetSlot(...args);
  }
  getSlotsByRecipient(...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByRecipient"]>) {
    return this.sdk.GetSlotsByRecipient(...args);
  }
  getSlotsByOccupant(...args: Parameters<ReturnType<typeof getSdk>["GetSlotsByOccupant"]>) {
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
  getBoughtEvents(...args: Parameters<ReturnType<typeof getSdk>["GetBoughtEvents"]>) {
    return this.sdk.GetBoughtEvents(...args);
  }
  getSettledEvents(...args: Parameters<ReturnType<typeof getSdk>["GetSettledEvents"]>) {
    return this.sdk.GetSettledEvents(...args);
  }
  getTaxCollectedEvents(...args: Parameters<ReturnType<typeof getSdk>["GetTaxCollectedEvents"]>) {
    return this.sdk.GetTaxCollectedEvents(...args);
  }
  getSlotActivity(...args: Parameters<ReturnType<typeof getSdk>["GetSlotActivity"]>) {
    return this.sdk.GetSlotActivity(...args);
  }
  getRecentEvents(...args: Parameters<ReturnType<typeof getSdk>["GetRecentEvents"]>) {
    return this.sdk.GetRecentEvents(...args);
  }

  // Meta
  getMeta(): Promise<SubgraphMeta> {
    return this.client.request<SubgraphMeta>(META_QUERY);
  }
}

export function createSlotsClient(config: SlotsClientConfig): SlotsClient {
  return new SlotsClient(config);
}
