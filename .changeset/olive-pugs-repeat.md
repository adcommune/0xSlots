---
"@0xslots/contracts": minor
---

Publish the occupancy-policy ABIs.

**The one thing that breaks, and it breaks silently.** `createSlot` and `createSlots` keep their names and their arity — but two of their tuples changed shape:

- `SlotConfig` gained a third bool, `mutablePolicy`, before `manager`: `(bool,bool,address)` → `(bool,bool,bool,address)`
- `SlotInitParams` gained a trailing `occupancyPolicy` address: `(uint256,address,uint256,uint256)` → `(uint256,address,uint256,uint256,address)`

Same function name, different calldata. Nothing about this surfaces as a type error for a JS consumer holding an older ABI — the call encodes fine and the factory rejects it at runtime. This is the reason to upgrade deliberately rather than incidentally.

`mutablePolicy` is separate from `mutableModule` on purpose. Swapping what a slot *does* and swapping whether it can be *taken from you* are different promises, and a holder who accepted the first has not accepted the second.

**Additions.** `getSlotInfo` grows from 25 fields to 31, a pure superset — `mutablePolicy`, `lastSettled`, `occupancyPolicy`, `occupiedSince`, `hasPendingPolicy`, `pendingPolicy`. `lastSettled` is the one financial fact a caller could not previously derive: `taxOwed` alone does not say when the clock last stopped.

New on `Slot`: `occupancyPolicy`, `proposePolicyUpdate`, `pendingPolicyUpdate`, `occupiedSince`, `mutablePolicy`, `setOperator`, `isOperator`, `claim`, `withdrawableOf`. New events: `PolicyUpdateProposed`, `PolicyUpdateApplied`, `OperatorSet`, `TaxPaid`, `RefundCredited`, `RefundClaimed`.

New on `SlotFactory`: `setPolicyVerified`, `verifiedPolicies`, `upgradeBeacon`, plus `PolicyVerified` and `BeaconUpgraded`. A new `policyFactory` ABI covers the `IPolicyFactory` interface (`policyKind()` / `verify()`).

**Removals.** `Slot.initializeV2` and `SlotFactory.migrateSlots` — both completed migrations. Versioning now lives in `reinitializer(n)` and nowhere else, not in function names.

Also adds the Base Sepolia addresses for both term-policy factories and the starter policies they deployed.
