---
"@0xslots/sdk": minor
---

Occupancy policies, and a resolver that only names a policy it can actually vouch for.

**New: `policies` module.** Policy knowledge used to be scattered across the consuming app, which read a raw registry directly and did its own filtering. It now lives here behind accessors — `resolvePolicy`, `getVouchedPolicy`, `vouchedPoliciesForChain`, `searchVouchedPolicies` — plus the `ResolvedPolicy`, `VouchedPolicy`, `PolicyKindId` and `PolicyImpact` types.

The raw record is deliberately **not** exported. Resolution walks the on-chain `IPolicyFactory.verify()` for each known factory, so a name is a claim the chain confirms rather than a lookup in a hardcoded table. Two consequences worth knowing: a policy made by a superseded factory resolves to its bare address, which is the honest answer rather than a bug; and every accessor is chain-scoped, because without that a Sepolia policy would have been confidently named on mainnet.

**Breaking:**

- `createSlotV3` is gone. Use `createSlot`, which always calls the stable current initializer. `createSlotWithTenure` and `createSlotWithPriceFloor` wrap the two-step deploy-then-create flow and wait for the policy to land before creating, so a rejected or reverted policy deploy bails instead of failing the create more confusingly.
- The `SlotOnChain` shape follows `getSlotInfo`: `epochSeconds` removed, `mutablePolicy` and `lastSettled` added. Anything reading `epochSeconds` off a slot needs updating — the field was inert.
- Slot queries request the occupancy fields, so a subgraph that has not been redeployed with the occupancy schema will error rather than return partial data. Deploy the subgraph before shipping this.

Depends on `@0xslots/contracts` at the matching version; the struct changes there are ABI-level and will not surface as type errors.
