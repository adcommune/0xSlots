# v3 Occupancy Policies — implementation & security review

**Date:** 2026-07-29
**Branch:** `feat/occupancy-policies` (30 commits, base `095be3e`)
**Status:** Complete and reviewed. **One residual requires a decision before deploying** — see [Open decision](#open-decision).
**Spec:** [2026-07-29-occupancy-policies-design.md](../../../docs/superpowers/specs/2026-07-29-occupancy-policies-design.md)
**Plan:** [2026-07-29-occupancy-policies.md](../../../docs/superpowers/plans/2026-07-29-occupancy-policies.md)

**Tests:** 210 passing, 0 failing (was 141 at branch point).

---

## What was built

Occupancy rules are decoupled from the Harberger core so they become composable, in three layers:

| Layer | Governs | Where |
| --- | --- | --- |
| **Economic policy** | Tax rate, deposit minimums, liquidation bounty | Still inlined in `Slot.sol` — named, not extracted |
| **Occupancy policy** | Who may take the slot, and when | **New:** `IOccupancyPolicy` + `epochSeconds` in core |
| **Utility module** | What the slot does (ads, naming, content) | Existing `ISlotsModule` |

### Motivation

Continuous-time Harberger with instant buy is, in practice, a **latency auction** — whoever's infrastructure lands the transaction first wins every contest. That is an accident of continuous time, not a design goal, and it is bad for AI agents specifically: a reasoning agent takes seconds, a mempool bot takes milliseconds, so the bot wins every time and the agent never gets to demonstrate what it is good at.

Epochs invert that. With a one-hour boundary, a 200ms speed edge is worth nothing and "actually evaluated whether this slot is worth holding" is worth everything. Same thesis as batch settlement, applied to occupancy.

### Guiding rule

> **Timing is modular. Price-setting is not.**

Epoch delay, minimum tenure, grace periods, and queues all change *when* a transition takes effect — dials on forced sale, not switches. Minimum tenure does not let a liar escape; it delays the punishment. Declare a dishonestly low price with a 30-day tenure and someone still takes it at that low price on day 31 — you merely enjoyed 30 days first.

An **auction** replaces self-assessment with third-party price discovery. That is the one rule that never leaves the core, and it is out of bounds for this interface.

### Invariants enforced in `Slot.sol`

Safety is binary; purity is a spectrum. The core enforces safety; purity is *labelled* via the factory registry.

1. `liquidate()` is never vetoable — insolvency always ends occupancy, under every policy.
2. `release()` is never vetoable — you can always leave.
3. Policies never touch slot funds. `IOccupancyPolicy` declares both hooks `view`, so they compile to `STATICCALL` — enforced at the EVM level, not by convention.
4. No policy can make a slot permanently unclaimable.

---

## Components

### Core (`Slot.sol`)

- **`epochSeconds`** — occupancy transfers land on clock boundaries. `0` means instant buy (unchanged behaviour). A buy *commits* (funds escrowed, `PendingTransfer` stored) and applies **lazily** on the next interaction — nothing runs on a timer.
- **Two-legged `_settle()`** — `_materialize()` charges the outgoing occupant up to the boundary, hands over, refunds; `_accrue()` then charges the incoming occupant from the boundary. Fuzzed for conservation: total tax across a boundary equals one continuous stream, modulo integer rounding.
- **Resolving getters** — `occupant()`, `price()`, `deposit()`, `taxOwed()`, `getSlotInfo()` report post-boundary state before it is written. Without this, `MetadataModule` (which authenticates via `staticcall occupant()`) would let the outgoing occupant write metadata for a slot the incoming one is already paying tax on.
- **Operator approval** — an occupant may delegate `selfAssess`/`topUp` to an agent, never `withdraw`/`release`. Bounded authority is the point.
- **First-commit-wins**, non-cancellable commits, `selfAssess` blocked while a transfer is pending.

### Policies

- **`MinimumTenurePolicy`** — stateless singleton, immutable tenure. Two conditions keep it sound: protection is **pre-paid** (buyer escrows the full window's tax) and the price **cannot be cut** while protected. Without the second, an occupant declares high, drops to dust on day 1 knowing nobody can take it, and pays almost nothing.
- **`QueueExclusivityPolicy`** — grants the queue priority **only while the slot is vacant**.

### Periphery

- **`SlotQueue`** — FIFO funded bids, own escrow (never the slot's), permissionless tipped `fill()`. Filling is a separate transaction rather than a hook because `release()`/`liquidate()` are `nonReentrant`. Bidders self-assess their own price, so this is a queue, not an auction. Turns a `release()` into a sale — the departing occupant's alternative was releasing for nothing.

---

## Review process

Fourteen tasks, each implemented by a fresh agent and gated by an independent spec-compliance + code-quality review, followed by a whole-branch review that wrote proof-of-concept tests for every finding.

Every finding below was a **defect in the plan**, not implementer error, and none would have been visible from a passing test suite.

### Caught and fixed

| Severity | Finding |
| --- | --- |
| **Critical** | **`initializeV3` unauthenticated.** `reinitializer(3)` only requires version < 3, and every slot from `createSlot` sits at version 2. Anyone could install a vetoing policy plus an absurd `epochSeconds`, permanently freezing the slot and the next buyer's escrow — for gas. Now factory-gated, with `SlotFactory.migrateSlotsV3` for legacy slots. |
| **Critical** | **`SlotQueue` pooled-escrow drain.** One shared token balance across all slots with `currency()` re-read from an attacker-supplied `slot`. A fake slot returning a worthless token at bid time and the real token at cancel time drained other bidders. Fixed by gating on `factory.isSlot` and caching the currency per bid. |
| **Critical** | **Permanent head-of-line block.** A bid whose `buy()` always reverts sat at the head forever. Fixed with join-time validation plus `try/catch` skip-and-refund. |
| **Critical** | **Unbounded loops.** `isEmpty` scanned the whole queue and is called *on-chain* by the exclusivity policy, so a stuffed queue bricked the slot. Fixed with an O(1) `liveBidCount` and a bounded sweep. |
| **Important** | **Stale-occupant theft.** After a boundary but before materialisation, `onlyOccupant` read raw storage — the outgoing occupant passed, `_settle()` swapped in the incoming occupant's escrow, and `withdraw()` paid the old occupant out of the new one's deposit. Deterministic, no race. |
| **Important** | **Blocklisted refund bricked every entry point.** Moving the refund inside `_settle()` meant one blocked address froze `buy`, `release`, `withdraw`, `liquidate` and `collect` permanently. Reachable with USDC. Refunds now degrade to a claimable credit. |
| **Important** | **Queue exclusivity suspended forced sale on occupied slots.** An occupant placing a 1-wei bid on their own slot became permanently unbuyable at any price — third parties vetoed, queue blocked by the vacancy check. Exclusivity now applies only while vacant. |
| **Important** | **Unliquidatable occupancy.** `liquidate()`/`topUp()` gated on raw `_occupant`, so a zero-deposit buy into a vacant epoch slot produced an occupant who was insolvent yet unremovable — breaking invariant 1. Now gated on `occupant()`. *(Deferred twice as "not exploitable" on two reviewers' assessment; the final review disproved that with a PoC.)* |
| **Important** | **FIFO position was stealable.** The `try/catch` skip turned a *transient* buy failure into permanent eviction, so a later bidder could evict the head and jump the queue. Transient cases are now pre-checked and revert instead. |
| **Important** | **Test proved nothing.** `test_Tenure_LiquidationWorksInsideWindow` sized the deposit to exactly the tenure, making insolvency unreachable before the boundary, then warped to day 400 of a 365-day tenure. Rewritten to raise the price mid-window so insolvency lands inside protection. |

Also fixed: `getSlotInfo()` pairing the new occupant with the old occupant's tenure start; a policy-verification registry that no policy could satisfy; two pre-existing documentation claims that were false (`CREATE2` address determinism — the factory uses plain `CREATE` — and a `minDepositSeconds` "protocol min: 1 day" that no code enforces).

---

## Open decision

**`initializeV2` is unauthenticated, and this branch escalated the consequence.**

On a slot that never ran it, an attacker calls `initializeV2(attackerAddress)` to set `factory = attacker`, then passes the *new* `initializeV3` gate — reaching the same capture the Critical fix was meant to prevent.

Before this branch, winning that race bought only the `_emitProtocolEvent` hook, which is wrapped in `try/catch` — cosmetic. After it, the one-shot reinitializer permanently fixes `epochSeconds` and `occupancyPolicy`, and **no admin repair exists**: `proposePolicyUpdate` is `onlyManager` and applies on the next ownership transition, which an absurd `epochSeconds` prevents from ever occurring.

Every self-attested guard here is forgeable — a caller can always pass its own address. The only unforgeable anchor is the proxy's ERC-1967 beacon slot, whose `UpgradeableBeacon.owner()` is the admin. Gating `initializeV2` on it would break `_deploySlot` (the caller there is the factory, not the admin), so the proposed shape is a **beacon-owner-authenticated repair path** — a `setFactory`, plus making the v3 config resettable rather than one-shot.

**This is a design decision, not a bug fix.** [`V3_SPEC.md`](../../../docs/V3_SPEC.md) states the owner role is *"Gone… No god-mode admin"*, and an admin-resettable occupancy config cuts directly against that. It trades immutability for recoverability. The current beacon upgrade is the only window where adding it is free.

### Deployment precondition (independent of the above)

`MigrateV2` was broadcast on **chain 8453 only**. Deployments also exist for **84532, 11155111, 11155420, and 42161**. Slots on those chains are likely still `factory == address(0)` and become capturable the moment the v3 beacon lands.

**Verify `factory != address(0)` on-chain for every slot before upgrading anywhere. Do not infer it from broadcast records.**

There is also **no v3 migration script**, while a code comment prescribes running the beacon upgrade and migration "in the same admin transaction". Either write it or drop the claim.

---

## Parked

| Item | Ruling |
| --- | --- |
| `_payOrCredit` hand-rolls SafeERC20's success check — unbounded returndata (return-bomb) and no gas cap | Real and cheap to fix. Non-blocking for a standard ERC-20; a hook-bearing currency could grief. Bound the call with a 32-byte return buffer and a gas cap. |
| `_distributeTax` still hard-transfers to `recipient` / module `feeRecipient`, so a blocklisted recipient can brick `liquidate()` | Pre-existing, predates this branch, out of scope. Worth a follow-up given the USDC exposure. |
| `migrateSlotsV3` reverts the whole batch if any slot is already at v3 | Operational only — admin pre-filters. |
| A slot with `epochSeconds > MAX_BID_DURATION` (30d) makes its queue non-functional | Now rejected at `joinQueue` with a named error. |
| `collectedTax` lags leg-1 tax until the next materialising call; `SlotFactory.collectAll` therefore skips such slots | Design property. `collect()` called directly is correct; this is a keeper-liveness wrinkle. |
| `PolicyNotMutable` error declared but unused — policy updates gate on `mutableModule` | Cosmetic. Drop it, or introduce a real `mutablePolicy` flag. |
| `SlotQueue` hard-depends on the v3 `pendingTransfer()` ABI | A legacy address admin-registered via `registerSlots` would make `fill()` revert. Pair with the migration work above. |

---

## Verification

- **210 tests passing.** All 141 pre-existing tests pass **unmodified** — that is the contract for "works as it does now without an occupancy module."
- **Storage append-only**, verified with `forge inspect Slot storageLayout` after every task and cross-checked against the pre-branch base in a throwaway worktree. Slots 0–13 unchanged; 14 = `_legacyInitialized` + `factory` packed; 15 = `occupancyPolicy` + `epochSeconds`; 16 = `occupiedSince`; 17 = `pendingPolicyUpdate`; 18–21 = `pendingTransfer`; 22 = `isOperator`; 23 = `withdrawableOf`.
- **Beacon upgrade regression test** — occupies a slot, upgrades the beacon to a fresh implementation, asserts state *and* accrual survive, then exercises the slot post-upgrade.
- **Tax conservation fuzzed** across epoch boundaries (256 runs default, stress-tested at 5000).
- **ABIs regenerated** for `Slot` and `SlotFactory` and verified byte-for-byte against the compiled artifacts. `SlotQueue`, `MinimumTenurePolicy`, and `QueueExclusivityPolicy` have no ABI files — no consumer exists yet.

### Deployment order

Stages were built to land as separate beacon upgrades: (1) veto layer + min tenure, (2) epochs — the settlement rewrite, deserving its own audit pass, (3) operator delegation + queue. They are merged here as one branch; splitting the rollout is still available and recommended.

Existing slots need no migration for behaviour: `occupancyPolicy == address(0)` and `epochSeconds == 0` reproduce current behaviour exactly. They **do** need `factory != address(0)` — see the precondition above.
