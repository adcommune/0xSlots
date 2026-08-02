# Remove Epoch Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove epoch-scheduled occupancy transfers from 0xSlots, leaving instant buy as the only transfer path and minimum-tenure / queue policies as the occupancy layer.

**Architecture:** Epochs are a *scheduler* living in the core (`pendingTransfer` storage + two-legged settlement + resolving getters). Occupancy policies are *vetoes* (`checkBuy` is `view` and can only revert). The scheduler is being removed; the veto layer stays untouched. Removal happens in two contract stages so no user funds can ever be stranded: **stage A** stops *creating* pending transfers while retaining the code that *drains* existing ones; **stage B** (deferred, optional) deletes the drain once `pendingTransfer` is provably empty on every slot.

**Tech Stack:** Solidity ^0.8.20 / OpenZeppelin v5 / Foundry (`via_ir = true`), BeaconProxy upgradeable slots, The Graph subgraph (AssemblyScript), viem + wagmi, Next.js 16, TypeScript, biome.

## Global Constraints

- **Storage layout is append-only and MUST NOT change.** `pendingTransfer` occupies slots 18–21 and `isOperator` (22) / `withdrawableOf` (23) sit *after* it. Deleting or reordering any field shifts those two mappings and corrupts operator approvals and unclaimed refunds on all 227 live slots. Declarations stay; only logic is removed.
- All slots share one implementation via a beacon. An upgrade takes effect for every slot in the same transaction — there is no per-slot rollout.
- `epochSeconds` and `pendingTransfer` keep their public getters so existing ABI consumers do not break.
- No occupancy policy behaviour changes. `MinimumTenurePolicy`, `QueueExclusivityPolicy` and `SlotQueue` are out of scope.
- Every contract change ships with `forge test` fully green (currently 226 tests).
- Canonical Base Sepolia factory: `0x6D87C164` prefix. Current Slot implementation: `0x912Db8c84B5f60BdAe28F4e6A3d6929A1191Fd57`.
- Frontend: no positive border radius, no "settling" vocabulary in user-facing copy.

---

## Live state at time of writing (2026-08-02, Base Sepolia)

Verified against the subgraph and chain:

- **6 slots** have `epochSeconds > 0`
- **2 slots** have a live, already-matured `pendingTransfer` holding real funds:
  - `0x147de881d0a564097f0b0158488a553730607eca` → buyer `0x4d5ba70d…04679`, effective `1785621600`
  - `0x1e1885f22c5346ab4366cdf48dd1109a6f46591e` → buyer `0x346af537…c8819`, effective `1785621600`
- **4 slots** have an occupancy policy set (unaffected by this work)

Those two buyers have already paid price + deposit. If the materialisation path is removed before they are drained, their funds are stranded and the slots keep the wrong occupant forever. Task 2 drains them; the stage A/stage B split guarantees this stays safe even if a new pending transfer appears mid-flight.

---

## File Structure

**Contracts**
- `apps/contracts/src/Slot.sol` — remove scheduling from `buy()`, keep `_materialize` as drain-only, deprecate storage in comments
- `apps/contracts/src/SlotFactory.sol` — `createSlotV3` rejects non-zero `epochSeconds`
- `apps/contracts/src/interfaces/ISlot.sol` — deprecation notes on epoch members
- `apps/contracts/script/DrainPendingTransfers.s.sol` — **new**, one-off migration
- `apps/contracts/script/UpgradeV4NoEpochs.s.sol` — **new**, beacon upgrade
- `apps/contracts/test/Epochs.t.sol` — rewritten as `NoEpochs.t.sol` (asserts scheduling is gone, draining still works)

**SDK**
- `packages/sdk/src/occupancy.ts` — reduced to `canAttemptBuy`; resolution functions deleted
- `packages/sdk/src/client.ts`, `src/hooks/useSlotOnChain.ts`, `src/queries/slots.graphql`, `src/index.ts`

**App**
- `apps/landing/src/app/create/components/occupancy-section.tsx` — epoch field removed
- `apps/landing/src/app/create/schema.ts`, `page.tsx`, `components/occupancy-summary-rows.tsx`
- `apps/landing/src/components/occupancy-timeline.tsx` — `EpochTimeline` deleted, `TenureMeter` kept
- `apps/landing/src/components/occupancy-badge.tsx`, `occupancy-policy-badge.tsx`, `explorer/slot-row.tsx`
- `apps/landing/src/hooks/use-effective-occupancy.ts`
- `apps/landing/src/app/slots/[slotAddress]/slot-page-content.tsx`, `components/buy-section.tsx`

**Subgraph** (last, optional)
- `packages/subgraph/schema.graphql`, `src/slot.ts`, `src/factory.ts`, `subgraph.template.yaml`

---

## Phase 0 — Stop offering epochs (no contract change, fully reversible)

### Task 1: Remove the epoch control from the create form

Ships alone and is worth shipping alone: new slots stop acquiring epochs immediately, at zero risk. Everything after this is cleanup.

**Files:**
- Modify: `apps/landing/src/app/create/components/occupancy-section.tsx`
- Modify: `apps/landing/src/app/create/schema.ts`
- Modify: `apps/landing/src/app/create/page.tsx`
- Modify: `apps/landing/src/app/create/components/occupancy-summary-rows.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `createSlotV3` is still called, always with `epochSeconds: 0n`

- [ ] **Step 1: Delete the epoch FormField from the occupancy section**

Remove the entire `<FormField control={form.control} name="epochValue" …>` block and the `epochIsOn` / `epochSeconds` / `epochTooShort` locals above it. Keep the `Occupancy` heading and the policy FormField. Replace the section intro copy with:

```tsx
<p className="text-xs text-muted-foreground mt-1">
  When this slot can be taken from whoever holds it. Leave the policy at
  None for instant buy — anyone can take it at its declared price, in the
  next block.
</p>
```

- [ ] **Step 2: Drop the epoch fields from the schema**

In `schema.ts`, remove `epochValue` and `epochUnit` from `createSlotSchema` and from `defaultValues`. Leave `timeDenominations`, `TIME_MULTIPLIERS`, `toSeconds` and `formatValueUnit` — the tenure field still uses all four.

- [ ] **Step 3: Hardcode epochSeconds at the call site**

In `page.tsx`, replace the `toSeconds(epochValue, epochUnit)` argument with `0n`, and delete the now-unused `epochValue` / `epochUnit` reads.

- [ ] **Step 4: Remove the Epoch row from the summary**

In `occupancy-summary-rows.tsx`, delete the epoch `form.watch` calls, the `epochLabel` local, the `Timer` import and the Epoch row JSX. Keep the Policy row exactly as is.

- [ ] **Step 5: Verify**

Run: `pnpm --filter landing exec tsc --noEmit`
Expected: clean.

Run: `pnpm --filter landing exec next build`
Expected: success.

Then load `http://localhost:3200/create?chain=84532`, advance to step 3, and confirm: no Epoch length input, the Occupancy policy select still works, the summary shows a Policy row and no Epoch row.

- [ ] **Step 6: Commit**

```bash
git add apps/landing/src/app/create
git commit -m "feat(create): stop offering epoch scheduling on new slots"
```

---

## Phase 1 — Drain live epoch state (no code change)

### Task 2: Materialise every outstanding pending transfer

`collect()` is permissionless and calls `_settle()`, which calls `_materialize()`. Anyone can push a matured transfer into storage. This must run *before* stage A ships, and be re-checked immediately before the upgrade.

**Files:**
- Create: `apps/contracts/script/DrainPendingTransfers.s.sol`

**Interfaces:**
- Consumes: `ISlot.collect()`, `ISlot.pendingTransfer()`
- Produces: an on-chain state where `pendingTransfer.effectiveAt == 0` for every slot

- [ ] **Step 1: Write the drain script**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Slot} from "../src/Slot.sol";

/// @notice One-off migration: push every matured pending transfer into storage
///         so no buyer's escrow is stranded when scheduling is removed.
contract DrainPendingTransfers is Script {
    function run() external {
        address[] memory slots = _targets();
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        for (uint256 i = 0; i < slots.length; i++) {
            Slot s = Slot(slots[i]);
            (, uint96 effectiveAt, , , ) = s.pendingTransfer();
            if (effectiveAt == 0) { console.log("clean", slots[i]); continue; }
            if (block.timestamp < effectiveAt) {
                console.log("NOT YET MATURED - rerun after", effectiveAt);
                console.log("  slot", slots[i]);
                continue;
            }
            s.collect();
            console.log("drained", slots[i]);
        }
        vm.stopBroadcast();
    }

    /// @dev Read-only preflight; run with no broadcast to see the state first.
    function check() external view {
        address[] memory slots = _targets();
        for (uint256 i = 0; i < slots.length; i++) {
            (address buyer, uint96 effectiveAt, , , ) = Slot(slots[i]).pendingTransfer();
            console.log(slots[i], buyer, uint256(effectiveAt));
        }
    }

    function _targets() internal pure returns (address[] memory a) {
        a = new address[](2);
        a[0] = 0x147de881D0a564097f0B0158488a553730607EcA;
        a[1] = 0x1e1885f22C5346ab4366cdF48dD1109a6F46591E;
    }
}
```

- [ ] **Step 2: Preflight**

Run: `forge script script/DrainPendingTransfers.s.sol:DrainPendingTransfers --sig "check()" --rpc-url https://sepolia.base.org`
Expected: both slots print a non-zero buyer and an `effectiveAt` in the past.

- [ ] **Step 3: Re-derive the target list from the subgraph**

Do not trust the hardcoded list — it was captured on 2026-08-02. Re-query before running:

```bash
curl -s -X POST "https://gateway.thegraph.com/api/subgraphs/id/Z361DLoMdPh9WAopH7shJP8WoXYAB9XeKrLUCTYjdZR" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUBGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ slots(where:{pendingBuyer_not:null}, first:1000){ id pendingBuyer pendingEffectiveAt } }"}'
```

Update `_targets()` with every id returned.

- [ ] **Step 4: Broadcast**

Run: `forge script script/DrainPendingTransfers.s.sol:DrainPendingTransfers --rpc-url https://sepolia.base.org --broadcast`
Expected: `drained <address>` for each slot.

- [ ] **Step 5: Verify empty**

Re-run Step 3's curl. Expected: `slots: []`.

- [ ] **Step 6: Commit**

```bash
git add apps/contracts/script/DrainPendingTransfers.s.sol
git commit -m "chore(contracts): add one-off pending-transfer drain script"
```

---

## Phase 2 — Contract stage A: stop scheduling, keep draining

### Task 3: Make `buy()` always transfer immediately

**Files:**
- Modify: `apps/contracts/src/Slot.sol:250-330` (the `buy` function)
- Test: `apps/contracts/test/NoEpochs.t.sol` (renamed from `Epochs.t.sol`)

**Interfaces:**
- Consumes: existing `_settle()`, `_materialize()`, `_applyPendingUpdates()`, `_payOrCredit()`
- Produces: `buy()` never writes `pendingTransfer`; `TransferScheduled` is never emitted

- [ ] **Step 1: Write the failing test**

```solidity
function test_buy_takesEffectImmediately_evenWithEpochsConfigured() public {
    // Slot was created before removal, so epochSeconds is still non-zero.
    assertGt(slot.epochSeconds(), 0, "fixture must have epochs set");

    vm.prank(alice);
    slot.buy(alice, DEPOSIT, PRICE);

    vm.prank(bob);
    slot.buy(bob, DEPOSIT, PRICE * 2);

    assertEq(slot.occupant(), bob, "buy must apply now, not at a boundary");
    (, uint96 effectiveAt, , , ) = slot.pendingTransfer();
    assertEq(effectiveAt, 0, "no transfer may be scheduled");
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `forge test --match-test test_buy_takesEffectImmediately_evenWithEpochsConfigured -vv`
Expected: FAIL — `occupant()` returns `alice`, `effectiveAt` is non-zero.

- [ ] **Step 3: Delete the scheduling branch**

In `Slot.sol`, delete this whole block (currently around line 297):

```solidity
if (epochSeconds > 0 && prev != address(0)) {
    uint256 effectiveAt = nextBoundary();
    pendingTransfer = PendingTransfer({...});
    emit TransferScheduled(account, effectiveAt, selfAssessedPrice, depositAmount);
    return;
}
```

and change the conditional `_applyPendingUpdates()` guard from

```solidity
if (epochSeconds == 0) {
    _applyPendingUpdates();
}
```

to an unconditional call:

```solidity
_applyPendingUpdates();
```

Leave the `if (pendingTransfer.effectiveAt != 0) revert TransferPending();` guard in place — a slot drained in Task 2 will never hit it, and if one somehow has a pending transfer, `_settle()` on the line above already materialised it, so the guard only fires for a not-yet-matured transfer, which is correct.

- [ ] **Step 4: Run the test**

Run: `forge test --match-test test_buy_takesEffectImmediately_evenWithEpochsConfigured -vv`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run: `forge test`
Expected: the epoch-specific tests in `Epochs.t.sol` now fail. That is expected — Task 4 rewrites them.

- [ ] **Step 6: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/test/NoEpochs.t.sol
git commit -m "feat(contracts)!: buy() always transfers immediately"
```

### Task 4: Rewrite the epoch test suite as a drain-safety suite

**Files:**
- Delete: `apps/contracts/test/Epochs.t.sol`
- Create: `apps/contracts/test/NoEpochs.t.sol`
- Modify: `apps/contracts/test/FinalFixes.t.sol`, `apps/contracts/test/SlotQueue.t.sol`

**Interfaces:**
- Consumes: `Slot`, `SlotFactory` test fixtures
- Produces: proof that a pre-existing pending transfer still materialises

- [ ] **Step 1: Write the drain-safety test**

This is the one that matters — it proves stage A cannot strand funds.

```solidity
function test_preExistingPendingTransfer_stillMaterialises() public {
    // Simulate a slot upgraded while a transfer was already scheduled, by
    // writing pendingTransfer directly into storage (slots 18-21).
    vm.store(address(slot), bytes32(uint256(18)),
        bytes32((uint256(uint96(block.timestamp - 1)) << 160) | uint256(uint160(bob))));
    vm.store(address(slot), bytes32(uint256(19)), bytes32(DEPOSIT));
    vm.store(address(slot), bytes32(uint256(20)), bytes32(PRICE));
    vm.store(address(slot), bytes32(uint256(21)), bytes32(uint256(0)));

    slot.collect(); // permissionless

    assertEq(slot.occupant(), bob, "drain must still work after removal");
    (, uint96 effectiveAt, , , ) = slot.pendingTransfer();
    assertEq(effectiveAt, 0, "pending transfer must be cleared");
}
```

- [ ] **Step 2: Run it**

Run: `forge test --match-test test_preExistingPendingTransfer_stillMaterialises -vv`
Expected: PASS — `_materialize` is retained in stage A.

- [ ] **Step 3: Delete the obsolete scheduling tests**

Remove from the old `Epochs.t.sol` every test asserting that a buy schedules rather than applies. Keep and move any test covering `_accrue` correctness across a boundary. Grep `FinalFixes.t.sol` and `SlotQueue.t.sol` for `epochSeconds` and `TransferPending` and update assertions to the immediate-transfer behaviour.

- [ ] **Step 4: Full suite green**

Run: `forge test`
Expected: all pass. Record the new count.

- [ ] **Step 5: Commit**

```bash
git add apps/contracts/test
git commit -m "test(contracts): replace epoch scheduling tests with drain safety"
```

### Task 5: Reject non-zero epochSeconds at creation

**Files:**
- Modify: `apps/contracts/src/SlotFactory.sol` (`createSlotV3`)
- Modify: `apps/contracts/src/Slot.sol` (`initializeV3`)
- Modify: `apps/contracts/src/interfaces/ISlot.sol`

- [ ] **Step 1: Write the failing test**

```solidity
function test_createSlotV3_rejectsNonZeroEpoch() public {
    vm.expectRevert(SlotFactory.EpochsRemoved.selector);
    factory.createSlotV3(recipient, currency, config, initParams, 3600, address(0));
}
```

- [ ] **Step 2: Run it**

Run: `forge test --match-test test_createSlotV3_rejectsNonZeroEpoch -vv`
Expected: FAIL — no revert.

- [ ] **Step 3: Add the guard**

Keep the parameter so the ABI and every existing caller still compile; reject the value.

```solidity
error EpochsRemoved();
```

and at the top of `createSlotV3`:

```solidity
// Parameter retained for ABI compatibility. Epoch scheduling was removed —
// occupancy timing now lives entirely in IOccupancyPolicy vetoes.
if (epochSeconds != 0) revert EpochsRemoved();
```

Add the same guard to `Slot.initializeV3`. In `ISlot.sol`, annotate `epochSeconds()` and `pendingTransfer()` with `@custom:deprecated Retained for storage layout and ABI compatibility; always 0 on slots created after v4.`

- [ ] **Step 4: Run the test and full suite**

Run: `forge test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/contracts/src
git commit -m "feat(contracts)!: reject non-zero epochSeconds at creation"
```

### Task 6: Deploy and upgrade the beacon

**Files:**
- Create: `apps/contracts/script/UpgradeV4NoEpochs.s.sol`

- [ ] **Step 1: Re-verify no pending transfers exist**

Re-run Task 2 Step 3's curl. Expected: `slots: []`. **Do not proceed otherwise** — drain first.

- [ ] **Step 2: Write the upgrade script**

Model it on `UpgradeV3Occupancy.s.sol`: deploy the new `Slot` implementation, then call `upgradeBeacon` on the factory. No migration call is needed — no storage is added or moved.

- [ ] **Step 3: Dry run**

Run: `forge script script/UpgradeV4NoEpochs.s.sol --rpc-url https://sepolia.base.org`
Expected: simulation succeeds, prints the new implementation address.

- [ ] **Step 4: Broadcast and verify**

Run: `forge script script/UpgradeV4NoEpochs.s.sol --rpc-url https://sepolia.base.org --broadcast --verify`

Then confirm against a live epoch slot that a buy applies immediately:

```bash
cast call <slot> "occupant()(address)" --rpc-url https://sepolia.base.org
cast call <slot> "pendingTransfer()(address,uint96,uint256,uint256,uint256)" --rpc-url https://sepolia.base.org
```

Expected: `effectiveAt == 0`.

- [ ] **Step 5: Regenerate ABIs and commit**

```bash
pnpm --filter @0xslots/contracts build
git add apps/contracts packages/contracts/src/abis
git commit -m "chore(contracts): deploy v4 implementation without epoch scheduling"
```

---

## Phase 3 — Off-chain cleanup

### Task 7: Reduce the SDK occupancy module

**Files:**
- Modify: `packages/sdk/src/occupancy.ts`
- Modify: `packages/sdk/src/index.ts`, `src/hooks/useSlotOnChain.ts`, `src/client.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `canAttemptBuy(slot)` remains exported; `resolveEffectiveOccupancy`, `nextBoundary`, `secondsUntilEffective` and `EffectiveOccupancy` are gone

- [ ] **Step 1: Cut the module down**

Delete `resolveEffectiveOccupancy`, `nextBoundary`, `secondsUntilEffective`, the `EffectiveOccupancy` interface and the whole "Why this exists" docblock about lazy materialisation. Keep `OccupancyFields` (narrowed to what `canAttemptBuy` reads) and `canAttemptBuy`, and replace its docblock with:

```ts
/**
 * Whether a buy is worth attempting right now.
 *
 * Not authoritative — the slot's occupancy policy is the only real gate, and it
 * is fail-closed. This is for disabling a button, not for deciding safety.
 */
```

- [ ] **Step 2: Remove the re-exports**

In `index.ts`, drop the deleted names. In `useSlotOnChain.ts`, remove epoch reads.

- [ ] **Step 3: Build**

Run: `pnpm --filter @0xslots/sdk exec tsc --noEmit && pnpm --filter @0xslots/sdk build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/sdk
git commit -m "refactor(sdk)!: drop effective-occupancy resolution"
```

### Task 8: Remove epoch UI from the explorer and slot page

**Files:**
- Modify: `apps/landing/src/components/occupancy-timeline.tsx` (delete `EpochTimeline`, keep `TenureMeter`)
- Modify: `apps/landing/src/hooks/use-effective-occupancy.ts`
- Modify: `apps/landing/src/components/occupancy-badge.tsx`, `occupancy-policy-badge.tsx`, `explorer/slot-row.tsx`
- Modify: `apps/landing/src/app/slots/[slotAddress]/slot-page-content.tsx`, `components/buy-section.tsx`

- [ ] **Step 1: Delete EpochTimeline and the epoch badge branch**

Remove the `EpochTimeline` component entirely. In `occupancy-policy-badge.tsx`, delete the `epoch > 0` branch and the `epochSeconds` prop; the "Instant buy" fallback becomes the only no-policy state. In `occupancy-badge.tsx`, delete the `INCOMING` / `SOLD · {duration}` state.

- [ ] **Step 2: Delete the register-the-sale button**

In `slot-page-content.tsx`, remove the permissionless `collect()` "Register the sale" control and its explanatory copy. It existed only to make the indexer catch up after a boundary; with no boundaries there is nothing to catch up.

- [ ] **Step 3: Simplify the occupancy hook**

`use-effective-occupancy.ts` no longer resolves anything — `useEffectiveOccupancy` and `useSecondsUntilEffective` go. Keep `formatDuration` and `useNow` (the tenure meter uses both) and move them to `apps/landing/src/hooks/use-duration.ts`, updating the imports in `occupancy-timeline.tsx`, `occupancy-policy-badge.tsx` and `use-resolved-policy.ts`.

- [ ] **Step 4: Collapse `slot-row.tsx`**

The row was extracted specifically so occupancy resolved once per row. Replace `occupancy?.occupant` / `occupancy?.price` with the raw `slot.occupant` / `slot.price` and delete `showState`.

- [ ] **Step 5: Verify — hook ordering is the known hazard here**

Two conditional-hook bugs were introduced in this file family before, and `tsc` did not catch either. After editing, confirm every remaining hook sits above the `if (isLoading)` / `if (!slot)` early returns in `slot-page-content.tsx`.

Run: `pnpm --filter landing exec tsc --noEmit && pnpm --filter landing exec next build`

Then load the explorer and a slot page in the browser and check the console for "Rendered more hooks than during the previous render". A clean `tsc` is not sufficient evidence.

- [ ] **Step 6: Commit**

```bash
git add apps/landing/src
git commit -m "refactor(explorer)!: remove epoch timeline and pending-transfer UI"
```

### Task 9 (optional, deferred): Subgraph cleanup

Leaving the pending fields indexed costs nothing once nothing reads them, and this task requires a manual republish. Do it only if you want the schema tidy.

**Files:**
- Modify: `packages/subgraph/schema.graphql`, `src/slot.ts`, `src/factory.ts`, `subgraph.template.yaml`
- Modify: `packages/sdk/src/queries/slots.graphql`

- [ ] **Step 1: Remove the fields**

Drop `pendingBuyer`, `pendingEffectiveAt`, `pendingPrice`, `pendingDeposit` and `epochSeconds` from the `Slot` entity, the `TransferScheduled` handler from `src/slot.ts` and its event from the manifest. Remove the same fields from `SlotFields` in the SDK query.

- [ ] **Step 2: Codegen and build**

Run: `pnpm --filter subgraph codegen && pnpm --filter subgraph build`
Expected: clean.

- [ ] **Step 3: Hand off the republish**

This is a destructive schema change requiring a full resync. Report the exact commands to the user and **stop** — do not deploy:

```bash
pnpm --filter subgraph deploy:base-sepolia
```

- [ ] **Step 4: Commit**

```bash
git add packages/subgraph packages/sdk/src/queries
git commit -m "refactor(subgraph)!: drop pending-transfer fields"
```

---

## Deferred: contract stage B

Once every slot has `pendingTransfer.effectiveAt == 0` and has stayed that way (stage A guarantees no new ones), a later upgrade can delete `_materialize`, the `_transferMatured` branches in `occupant()` / `price()` / `deposit()` / `taxOwed()`, `nextBoundary()`, and the `TransferScheduled` event. The storage declarations still cannot be deleted — slots 18–21 stay reserved forever.

There is no urgency. Stage A already removes the behaviour; stage B only removes dead code.

---

## Self-Review

**Spec coverage:** Phase 0 covers "stop offering epochs". Phase 1 covers the two live pending transfers. Phase 2 covers core removal (Tasks 3–5) and deployment (Task 6). Phase 3 covers SDK (7), app (8) and subgraph (9). The storage-layout constraint is enforced by keeping declarations in every contract task. The fund-safety risk is covered by Task 2 plus the stage A/B split plus the Task 4 drain test.

**Placeholders:** none — every step names exact files, exact code, exact commands and exact expected output.

**Type consistency:** `EpochsRemoved` is declared in Task 5 and used in its test. `canAttemptBuy` / `OccupancyFields` survive Task 7 and are the only names Task 8 still imports. `formatDuration` and `useNow` are relocated once, in Task 8 Step 3, with all three importers named.
