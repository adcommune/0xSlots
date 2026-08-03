---
"@0xslots/contracts": minor
---

Publish the occupancy-policy ABIs. Breaking for anyone encoding calldata against the previous release.

**Struct shapes changed — this is the part that breaks silently.** `SlotConfig` gained a third `bool`, `mutablePolicy`, so a caller still encoding two bools produces a tuple the factory rejects. `SlotInitParams` gained a trailing `occupancyPolicy` address. Both are ABI-level changes with no compile-time signal for JS consumers, so pin deliberately.

`getSlotInfo` returns 31 fields, up from 25, and the set is not a superset: it gained `mutablePolicy` (whether a manager can swap the occupancy policy — previously only knowable from the subgraph) and `lastSettled` (when the tax clock last stopped, which cannot be derived from `taxOwed`), and dropped `epochSeconds`. Epoch scheduling was removed; six slots still carry a value in storage that nothing reads, and reporting a delay that is never applied would mislead.

Factory surface: `createSlotV3` and its siblings collapse into `createSlot`/`createSlots`, which always call the stable current initializer. Versioning now lives in `reinitializer(n)` and nowhere else — not in function names. `migrateSlots` is gone (a completed migration). Added `setPolicyVerified`, `verifiedPolicies`, `upgradeBeacon`, and a `policyFactory` ABI for the new `IPolicyFactory` interface.

Also adds the deployed Base Sepolia addresses for both term-policy factories and the starter policies they made.
