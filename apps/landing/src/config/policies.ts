/**
 * Re-export shim.
 *
 * Policy knowledge moved to `@0xslots/sdk` so every consumer — this app, a bot,
 * a second frontend — resolves an address the same way. Import from the SDK
 * directly in new code; this exists so the move did not have to touch every
 * call site at once.
 */
export {
  type PolicyImpact,
  type ResolvedPolicy,
  SLOT_QUEUE_ADDRESSES,
  VOUCHED_POLICIES,
  type VouchedPolicy,
  vouchedPoliciesForChain,
} from "@0xslots/sdk";
