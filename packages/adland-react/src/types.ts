import { AdData } from "@adland/data";

export type Network = "testnet" | "mainnet";

export interface AdProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The slot contract address (0xSlots v3)
   */
  slot: string;
  /**
   * MetadataModule contract address (to fetch ad content URI)
   */
  metadataModule?: string;
  /**
   * Network to use for tracking requests (currently only "testnet" is supported)
   */
  network?: Network;
  /**
   * Optional base URL override. If not provided, uses relative URL in browser or production URL in SSR
   */
  baseUrl?: string;
  /**
   * RPC URL for reading MetadataModule on-chain
   */
  rpcUrl?: string;
}

export enum AdDataQueryError {
  NO_AD = "NO_AD",
  ERROR = "ERROR",
}

export interface AdDataQueryResponse {
  error?: AdDataQueryError;
  data?: AdData;
}
