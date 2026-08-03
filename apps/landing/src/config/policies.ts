/**
 * Re-export shim.
 *
 * Policy knowledge lives in `@0xslots/sdk` so every consumer — this app, a bot,
 * a second frontend — resolves an address the same way. Import from the SDK
 * directly in new code; this exists so the move did not have to touch every
 * call site at once.
 *
 * Note there is no `VOUCHED_POLICIES` here: the raw record is not exported.
 * Use `getVouchedPolicy` / `vouchedPoliciesForChain` / `searchVouchedPolicies`,
 * which handle case-insensitivity and the per-chain check for you.
 */
export {
  getVouchedPolicy,
  type PolicyImpact,
  type ResolvedPolicy,
  SLOT_QUEUE_ADDRESSES,
  searchVouchedPolicies,
  type VouchedPolicy,
  type VouchedPolicyEntry,
  vouchedPoliciesForChain,
} from "@0xslots/sdk";
