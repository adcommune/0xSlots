"use client";

import { type Abi, type Address, getAddress, isAddress } from "viem";
import { useReadContracts } from "wagmi";

/**
 * ERC-165 interface ID for ISlotsModule = XOR of selectors of:
 *   name(), version(), onTransfer(uint256,address,address),
 *   onPriceUpdate(uint256,uint256,uint256), onRelease(uint256,address),
 *   feeBps(), feeRecipient(), moduleURI()
 *
 * Computed from the canonical interface declared in
 * `apps/contracts/src/interfaces/ISlotsModule.sol`. Matches the value
 * returned by `type(ISlotsModule).interfaceId` in Solidity.
 */
export const ISLOTS_MODULE_INTERFACE_ID =
  "0x0871cc1c" as `0x${string}`;

const moduleProbeAbi = [
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const satisfies Abi;

export type ModuleCheckStatus =
  /** ERC-165 confirms ISlotsModule support — definitive valid. */
  | "verified"
  /** name()/version() succeed but ERC-165 missing — probable, allow with warning. */
  | "probable"
  /** name()/version() revert — not module-shaped. */
  | "invalid"
  /** No contract code at this address. */
  | "no-code";

export interface ModuleCheckData {
  address: Address;
  status: ModuleCheckStatus;
  /** Module display name when probe succeeds. */
  name: string | null;
  version: string | null;
}

/**
 * Probe a custom module address to check whether it actually implements
 * ISlotsModule. Surfaces three failure modes that the contract's `extcodesize`
 * check cannot distinguish at form-fill time:
 *   - no-code:  empty address (e.g. wrong-chain Sepolia/Base mismatch)
 *   - invalid:  has code but is not module-shaped (e.g. ERC-20 token)
 *   - probable: has module functions but does not advertise ERC-165
 */
export function useModuleCheck(rawAddress: string, chainId?: number) {
  let checksummed: Address | null = null;
  try {
    if (isAddress(rawAddress.trim(), { strict: false })) {
      checksummed = getAddress(rawAddress.trim());
    }
  } catch {
    // invalid
  }

  const { data, isLoading, isError, error } = useReadContracts({
    contracts: checksummed
      ? [
          {
            address: checksummed,
            abi: moduleProbeAbi,
            functionName: "supportsInterface",
            args: [ISLOTS_MODULE_INTERFACE_ID],
            chainId,
          },
          {
            address: checksummed,
            abi: moduleProbeAbi,
            functionName: "name",
            chainId,
          },
          {
            address: checksummed,
            abi: moduleProbeAbi,
            functionName: "version",
            chainId,
          },
        ]
      : [],
    query: {
      enabled: !!checksummed,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  });

  const result: ModuleCheckData | null = (() => {
    if (!checksummed || !data || data.length < 3) return null;

    const supports = data[0];
    const nameRes = data[1];
    const versionRes = data[2];
    if (!supports || !nameRes || !versionRes) return null;

    const name =
      nameRes.status === "success" ? (nameRes.result as string) : null;
    const version =
      versionRes.status === "success" ? (versionRes.result as string) : null;
    const isErc165Module =
      supports.status === "success" && supports.result === true;

    let status: ModuleCheckStatus;
    if (isErc165Module) {
      status = "verified";
    } else if (name !== null && version !== null) {
      status = "probable";
    } else if (
      name === null &&
      version === null &&
      supports.status !== "success"
    ) {
      // All three reverted → likely no code (or non-contract returning empty data)
      status = "no-code";
    } else {
      status = "invalid";
    }

    return { address: checksummed, status, name, version };
  })();

  return {
    data: result,
    isLoading: isLoading && !!checksummed,
    isError,
    error,
    isValidAddress: !!checksummed,
  };
}
