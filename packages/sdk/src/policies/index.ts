/**
 * Occupancy policies — one place that knows what a policy address means.
 *
 * Everything derivable is derived (`resolvePolicy`); the only hand-maintained
 * pieces are the factory addresses in @0xslots/contracts and the editorial
 * `VOUCHED_POLICIES` list. Adding a policy KIND means adding a resolver in
 * resolve.ts — nothing in the app, and nothing in the subgraph, which stores
 * only the address.
 */
export { formatDuration } from "./format";
export { resolvePolicy } from "./resolve";
export type {
  PolicyImpact,
  PolicyKindId,
  ResolvedPolicy,
  VouchedPolicy,
} from "./types";
export {
  getVouchedPolicy,
  searchVouchedPolicies,
  type VouchedPolicyEntry,
  vouchedPoliciesForChain,
} from "./vouched";
