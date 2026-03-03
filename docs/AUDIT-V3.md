# 0xSlots v3 Security Audit

**Date:** 2026-03-03
**Auditors:** K (Nexus-9) + External reviewer
**Scope:** `Slot.sol`, `SlotFactory.sol`, `ISlot.sol`, `ISlotsModule.sol`, `BatchCollector.sol`
**Solidity:** 0.8.20+
**Framework:** Foundry

**Assumptions:** Currency is a well-behaved ERC-20 (no fee-on-transfer, no rebasing, no ERC-777 hooks). If not, accounting/refunds can break (see M-4).

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| High     | 4     |
| Medium   | 5     |
| Low      | 5     |
| Info     | 7     |

---

## Critical

### C-1: `buy()` destroys uncollected tax — permanent loss of funds

**File:** `Slot.sol`, `buy()`
**Line:** `collectedTax = 0;`

```solidity
// buy() flow:
_settle();                    // moves owed tax -> collectedTax
// ... transfer logic ...
collectedTax = 0;             // DESTROYS settled tax
```

When a force buy happens, `_settle()` correctly moves accrued tax into `collectedTax`. But then `buy()` unconditionally resets `collectedTax = 0`. Taxes are held as tokens in the contract balance. Zeroing the variable doesn't move tokens -- it breaks accounting and makes previously accrued taxes uncollectable forever (`collect()` will revert with `NothingToCollect()`), effectively bricking revenue.

**Impact:** Direct loss of funds for the recipient. The longer between collects, the more is lost on each force buy. Tokens are permanently locked in the contract.

**Proof of concept:** `test_forceBuy_losesUncollectedTax` -- confirmed: after 1 hour of accrual at 10% tax on 1 USDC price, 138 units of tax are destroyed.

**Fix:** Remove `collectedTax = 0` from `buy()`. The new occupant's tax will accumulate on top of any uncollected balance, and the recipient can collect whenever. If per-occupant tax bookkeeping is desired, introduce a separate variable.

### C-2: `initialize()` is permissionless — can be hijacked

**File:** `Slot.sol`, `initialize()`

`initialize()` can be called by anyone, guarded only by `_initialized`. When the factory deploys via `clone()` + `initialize()` in the same tx, this is safe (no mempool race between deploy and init). But:

1. The raw implementation contract deployed by the factory constructor is never initialized -- an attacker can call `initialize()` on it with arbitrary parameters.
2. If the factory ever changes to deploy-then-initialize in separate transactions, or if uninitialized slot addresses are exposed, an attacker can front-run with arbitrary `recipient`/`currency`/`manager`/`module`.

**Impact:** Low in current factory (atomic deploy+init), but a common footgun for future refactors or alternative deployment paths.

**Fix options (pick one):**
1. **Best:** Add a constructor that disables initialization on the implementation:
```solidity
constructor() {
    _initialized = true;
}
```
2. Gate `initialize()` to the deploying factory:
```solidity
address public immutable FACTORY;
constructor(address _factory) { FACTORY = _factory; }
// then: require(msg.sender == FACTORY) in initialize()
```
3. Ensure factory always initializes atomically and document this invariant.

---

## High

### H-1: `release()` doesn't flush `collectedTax` to recipient

**File:** `Slot.sol`, `release()`

`release()` calls `_settle()` which moves owed tax to `collectedTax`, but then never transfers it to the recipient. After release, the slot is vacant -- if nobody ever buys again, the recipient must manually call `collect()` to retrieve their tax.

Worse: combined with C-1, a future `buy()` on this slot would zero out the uncollected balance, permanently locking the tokens.

**Impact:** Tax can be stranded in vacant slots. Combined with C-1, funds are lost.

**Fix:** Auto-flush `collectedTax` to recipient in `release()`:
```solidity
uint256 pendingTax = collectedTax;
if (pendingTax > 0) {
    collectedTax = 0;
    currency.safeTransfer(recipient, pendingTax);
}
```

### H-2: `liquidate()` doesn't flush remaining `collectedTax` to recipient

**File:** `Slot.sol`, `liquidate()`

After liquidation, `collectedTax` (minus bounty) remains in the contract. Same stranding risk as H-1. The recipient must manually call `collect()` after liquidation.

**Impact:** Tax stranded in liquidated slots.

**Fix:** Auto-flush remaining `collectedTax` to recipient after bounty deduction.

### H-3: `liquidationBountyBps` unbounded — can DOS liquidation

**File:** `Slot.sol`, `liquidate()` and `setLiquidationBounty()`

```solidity
bounty = (collectedTax * liquidationBountyBps) / BASIS_POINTS;
collectedTax -= bounty; // reverts if bounty > collectedTax
```

If `liquidationBountyBps > 10_000`, bounty exceeds `collectedTax` and the subtraction reverts (Solidity 0.8+ underflow), blocking liquidation entirely. A manager (malicious or careless) could make slots permanently unliquidatable.

**Impact:** Permanent DoS on liquidation. Insolvent occupants can never be removed.

**Fix:** Enforce `liquidationBountyBps <= BASIS_POINTS` in both `initialize()` and `setLiquidationBounty()`.

### H-4: `selfAssess()` missing `nonReentrant` — module can reenter

**File:** `Slot.sol`, `selfAssess()`

`selfAssess()` calls `_notifyModule()` but lacks `nonReentrant`. Because the reentrancy guard is not engaged, the module can call back into other `nonReentrant` functions (e.g., `buy`, `collect`, `liquidate`) and they will succeed.

Even though many paths are blocked by `onlyOccupant`, `buy()` only checks `msg.sender != occupant`, so the module can opportunistically force-buy the slot during a price update (assuming it has funds/allowance), producing inconsistent state and event ordering.

**Impact:** Untrusted module can exploit reentrancy to buy the slot at a manipulated price during `selfAssess`.

**Fix:** Add `nonReentrant` to `selfAssess()`. More generally, decide whether module callbacks should have side effects and enforce with reentrancy protection.

---

## Medium

### M-1: Module callback can grief state transitions (gas burning)

**File:** `Slot.sol`, `_notifyModule()`

```solidity
function _notifyModule(string memory name, bytes memory data) internal {
    if (module == address(0)) return;
    (bool ok,) = module.call{gas: 500_000}(data);
    if (!ok) emit ModuleCallFailed(name);
}
```

A malicious module that consumes exactly 500k gas on every call will succeed but burn significant gas. At ~500k gas per callback, this adds cost per transaction. The module is set at creation or via pending update, so the manager controls this. But if a module is compromised after deployment, there's no circuit breaker.

**Impact:** Gas griefing. Mitigated by manager control and L2 deployment.

**Fix (optional):** Consider a `moduleEnabled` toggle the manager can flip immediately (no pending period needed since disabling a module is always safe for the occupant).

### M-2: Missing parameter validation in `initialize()`

**File:** `Slot.sol`, `initialize()`

No validation on:
- `_recipient != address(0)` -- zero recipient means tax is sent to burn address
- `address(_currency) != address(0)` -- zero currency breaks all transfers
- `_init.taxPercentage` upper bound -- absurd values drain deposits instantly
- `_init.liquidationBountyBps <= BASIS_POINTS` -- see H-3
- `_config.manager` sanity checks

The factory validates `taxPercentage > 0` and manager/config consistency, but not the others. Direct `initialize()` calls (if C-2 is not fixed) bypass factory validation entirely.

**Fix:** Add validation in `initialize()`:
```solidity
require(_recipient != address(0), "zero recipient");
require(address(_currency) != address(0), "zero currency");
require(_init.taxPercentage > 0, "zero tax");
require(_init.liquidationBountyBps <= BASIS_POINTS, "bounty too high");
```

### M-3: `Settled()` event emits `owed` not `paid`

**File:** `Slot.sol`, `_settle()`

When insolvent, `owed` can be greater than `deposit` (the amount actually collected). The event emits `owed` which can mislead offchain indexers into thinking more tax was collected than actually was.

```solidity
emit Settled(owed, deposit);  // owed may exceed what was actually taken
```

**Fix:** Emit both `owed` and `paid` (capped amount), or emit `paid` only:
```solidity
uint256 paid = owed >= deposit ? deposit : owed;
emit Settled(owed, paid, deposit);
```

### M-4: Fee-on-transfer / rebasing tokens break accounting

**File:** `Slot.sol` (all transfer flows)

The contract assumes `transferFrom(sender, this, amount)` results in exactly `amount` tokens received.

- **Fee-on-transfer:** Contract receives less than credited `deposit`/`price` -- refunds in `buy()` or `release()` can revert or overpay.
- **Rebasing:** `deposit`/`collectedTax` variables drift from actual balance over time.

**Impact:** Broken accounting, potential fund lock or drain with exotic ERC-20s.

**Fix options:**
1. Document that only standard ERC-20s are supported (acceptable for v3).
2. Implement balance-delta accounting: `uint256 before = currency.balanceOf(this); transfer; uint256 received = currency.balanceOf(this) - before;`
3. Enforce currency allowlist in factory.

### M-5: Pending module update applied before release/transfer callbacks

**File:** `Slot.sol`, `release()`, `buy()`, `liquidate()`

In `release()` and `liquidate()`, `_applyPendingUpdates()` is called before `_notifyModule()`. This means the **new** module receives the release/transfer event for the **old** occupant's departure. Same in `buy()` -- updates apply before `onTransfer`.

**Impact:** The old module never gets a "goodbye" callback. The new module sees a transition it didn't witness the setup for. This is a sharp edge for hook semantics.

**Fix:** Document the intended semantics explicitly. If old-module finalization is desired:
1. Call old module first (`onRelease`/`onTransfer`)
2. Apply pending updates
3. Optionally call new module (`onNewOccupant` or similar)

---

## Low

### L-1: No upper bound on `taxPercentage`

**File:** `Slot.sol`, `SlotFactory.sol`

`taxPercentage` is validated as `> 0` but has no upper bound. A value of `1_000_000` (10,000%) would drain any deposit in minutes. While this is the creator's choice, an accidental misconfiguration could trap occupant funds.

**Fix:** Consider a reasonable cap (e.g., `10_000` = 100% monthly) at factory validation level.

### L-2: `withdraw()` error message misleading

**File:** `Slot.sol`, `withdraw()`

```solidity
if (amount > deposit) revert NothingToWithdraw();
```

If `amount > deposit`, the error should be `ExcessiveWithdraw` or `InsufficientBalance`. `NothingToWithdraw` implies the deposit is empty, but the user is trying to withdraw more than available.

### L-3: `secondsUntilLiquidation()` rounding can return infinity for micro-priced slots

**File:** `Slot.sol`, `secondsUntilLiquidation()`

```solidity
uint256 ratePerSec = (price * taxPercentage) / (MONTH * BASIS_POINTS);
```

Integer division truncates to 0 when `price * taxPercentage < MONTH * BASIS_POINTS`. Example: price=100, tax=100 bps -> `10000 / 25920000000 = 0` -> returns `type(uint256).max` even though `taxOwed()` will eventually become positive.

**Impact:** Misleading view for micro-priced slots. No fund risk.

**Fix:** Compute using higher precision or derive from `taxOwed()` over a horizon.

### L-4: Unused error declarations

**File:** `Slot.sol`

`CannotBuyWhenNotOccupied` and `ModuleCallFailed_Error(string)` are declared but never used. Dead code.

**Fix:** Remove unused errors.

### L-5: `MONTH = 30 days` is not calendar months

**File:** `Slot.sol`

`MONTH = 30 days` (2,592,000 seconds) is a fixed approximation. Real months vary 28-31 days. This is a design choice, not a bug, but should be documented explicitly to avoid confusion.

---

## Informational

### I-1: `ISlotsModule.onTransfer` always passes `slotId = 0`

All module callbacks pass `0` as `slotId` since v3 has one slot per contract. The `slotId` parameter is vestigial from v2. Consider removing it from the interface or documenting it's always 0.

### I-2: Factory `admin` has no transfer mechanism

`SlotFactory.admin` is set in constructor with no way to change it. If the admin key is lost, module verification is permanently unavailable. Consider adding a `transferAdmin(address)` function.

### I-3: No event emitted in `selfAssess()` for deposit enforcement

If `_enforceMinDepositExisting` reverts, there's no way to distinguish this from other reverts in transaction traces. Not a bug, just debugging friction.

### I-4: `_applyPendingUpdates()` ordering in `release()`

In `release()`, pending updates are applied after the slot is vacated. The new tax/module takes effect for the *next* occupant. This is correct behavior but worth documenting explicitly -- the releasing occupant never experiences the pending update.

### I-5: Clone implementation is not self-destructible

The raw `Slot` implementation deployed by the factory constructor can be initialized (see C-2) and used directly. While this doesn't affect clones, it's bad hygiene. See C-2 fix.

### I-6: Hook gas cap (500k) is hardcoded

The 500k gas cap for module callbacks is reasonable for safety but could cause silent feature loss for complex modules. Consider exposing a configurable gas cap (manager-only) or documenting the limit.

### I-7: No `receive()` or `fallback()` — ETH permanently locked if sent

No way to recover native ETH accidentally sent to the contract. This is good design (ERC-20 only), but worth noting.

---

## Architecture Notes

**Strengths:**
- Clean separation: one slot = one contract. No shared state to corrupt.
- Pending update model protects occupants from rug-pull parameter changes.
- Module system is well-contained with gas limits and failure isolation.
- `nonReentrant` on all fund-moving functions (except `selfAssess` -- see H-4).
- No `receive()` or `fallback()` -- can't accept native ETH. Good.
- No `selfdestruct` -- contract is permanent. Good for immutability guarantees.
- ERC-20 only, no native ETH support. Intentional and clean.
- Factory creates implementation in constructor -- deterministic across chains if deployed with same nonce.

---

## Recommended Invariant Tests (Foundry fuzzing)

These should be added to the test suite:

1. **Balance invariant:** `currency.balanceOf(slot) == deposit + collectedTax` (for standard ERC-20, no stray transfers)
2. **Tax monotonicity:** After `_settle()`, `lastSettled` increases and `deposit` never increases
3. **No tax loss on transfers:** Accrued tax before a `buy`/`release`/`liquidate` remains collectable after
4. **Liquidation safety:** If `isInsolvent()` and time advances, `liquidate()` eventually succeeds for some caller
5. **Hook reentrancy:** Malicious module attempting reentrant `buy`/`collect`/`liquidate` during callbacks cannot create inconsistent state

---

## Recommended Fix Priority

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 1 | C-1: Remove `collectedTax = 0` in `buy()` | 1 line | Active fund loss |
| 2 | H-3: Cap `liquidationBountyBps <= BASIS_POINTS` | 2 lines | Liquidation DoS |
| 3 | H-4: Add `nonReentrant` to `selfAssess()` | 1 word | Reentrancy attack |
| 4 | H-1 + H-2: Auto-flush tax on release/liquidate | ~10 lines | Stranded funds |
| 5 | C-2: Constructor `_initialized = true` | 3 lines | Implementation hijack |
| 6 | M-2: Parameter validation in `initialize()` | ~5 lines | Bad config |
| 7 | M-3: Fix `Settled` event semantics | 2 lines | Indexer accuracy |
| 8 | L-4: Remove unused errors | Delete 2 lines | Code hygiene |
