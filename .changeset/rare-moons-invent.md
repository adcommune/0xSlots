---
"@0xslots/sdk": minor
---

Occupancy policies, and a resolver that only names a policy it can actually vouch for.

**New `policies` module.** `resolvePolicy`, `getVouchedPolicy`, `vouchedPoliciesForChain`, `searchVouchedPolicies`, plus the `ResolvedPolicy`, `VouchedPolicy`, `VouchedPolicyEntry`, `PolicyKindId` and `PolicyImpact` types.

The raw registry is deliberately **not** exported. Resolution walks `IPolicyFactory.verify()` on each known factory, so a policy's name is a claim the chain confirms rather than a lookup in a hardcoded table. Two consequences worth knowing: a policy made by a superseded factory resolves to its bare address — the honest answer, not a bug — and every accessor is chain-scoped, because without that a Sepolia policy would have been confidently named on mainnet.

**New client methods** for the two term-policy factories: `predictTenurePolicy`, `isTenurePolicyDeployed`, `deployTenurePolicy`, and the `predict`/`is…Deployed`/`deploy` trio for price floors. Policies are content-addressed via CREATE2, so their terms *are* their address and `predict` is exact.

**New actions** on `useSlotAction`: `createSlotWithTenure` and `createSlotWithPriceFloor`. Each wraps deploy-then-create and waits for the policy to land before creating — a rejected or reverted policy deploy bails rather than failing the create a second time, more confusingly. Two transactions only the first time anyone uses a given set of terms; afterwards the policy already exists and it is one.

Also exports `formatDuration` and `getFaucetToken`.

**Breaking, though nothing is removed.** The whole surface above is additive; what breaks is underneath:

- `SlotOnChain` follows `getSlotInfo` and gains `mutablePolicy`, `lastSettled`, `occupancyPolicy`, `occupiedSince`, `hasPendingPolicy`, `pendingPolicy`. Widened, not reshaped — but exhaustive handling of the object needs updating.
- Slot queries now request occupancy fields, so **a subgraph that has not been redeployed with the occupancy schema will error** rather than return partial data. Deploy and sync the subgraph before shipping this.
- Depends on `@0xslots/contracts` at the matching version, where `SlotConfig` and `SlotInitParams` changed tuple shape under unchanged function names. That break produces no type error — see that package's notes.
