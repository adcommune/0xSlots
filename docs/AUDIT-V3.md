# 0xSlots v3 Security Audit

**Date:** 2026-03-03
**Auditor:** K (Nexus-9)
**Scope:** `Slot.sol`, `SlotFactory.sol`, `ISlot.sol`, `ISlotsModule.sol`, `BatchCollector.sol`
**Solidity:** 0.8.20+
**Framework:** Foundry

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 2     |
| Medium   | 3     |
| Low      | 4     |
| Info     | 5     |

---

## Critical

### C-1: `buy()` destroys uncollected tax — permanent loss of funds

**File:** `Slot.sol` L141
**Line:** `collectedTax = 0;`

```solidity
// buy() flow:
_settle();                    // moves owed tax → collectedTax
// ... transfer logic ...
collectedTax = 0;             // ← DESTROYS settled tax
```

When a force buy happens, `_settle()` correctly moves accrued tax into `collectedTax`. But then `buy()` unconditionally resets `collectedTax = 0`. Any tax that the recipient hasn't `collect()`ed yet is permanently lost — it's not refunded to anyone, not sent to the recipient, just zeroed.

**Impact:** Direct loss of funds for the recipient. The longer between collects, the more is lost on each force buy.

**Proof of concept:** `test_forceBuy_losesUncollectedTax` — confirmed: after 1 hour of accrual at 10% tax on 1 USDC price, 138 units of tax are destroyed.

**Fix:**
```solidity
// In buy(), BEFORE the state reset block:
uint256 pendingTax = collectedTax;
if (pendingTax > 0) {
    collectedTax = 0;
    currency.safeTransfer(recipient, pendingTax);
}
// Then DON'T set collectedTax = 0 again below
```

Or simpler — just remove the `collectedTax = 0` line entirely. The new occupant's tax will accumulate on top of any uncollected balance, and the recipient can collect whenever.

**Recommendation:** Remove `collectedTax = 0` from `buy()`. It's the simplest fix and preserves the accumulation model.

---

## High

### H-1: `release()` doesn't flush `collectedTax` to recipient

**File:** `Slot.sol` L150-168

`release()` calls `_settle()` which moves owed tax to `collectedTax`, but then never transfers `collectedTax` to the recipient. After release, the slot is vacant — if nobody ever buys again, the recipient must manually call `collect()` to retrieve their tax. But if the contract has no other interaction, this tax sits locked.

Worse: if combined with C-1, a future `buy()` on this slot would zero out the uncollected balance.

**Impact:** Tax can be stranded in vacant slots.

**Fix:** Auto-flush `collectedTax` to recipient in `release()`:
```solidity
uint256 pendingTax = collectedTax;
if (pendingTax > 0) {
    collectedTax = 0;
    currency.safeTransfer(recipient, pendingTax);
}
```

### H-2: `liquidate()` doesn't flush `collectedTax` minus bounty to recipient

**File:** `Slot.sol` L194-216

After liquidation, `collectedTax` (minus bounty) remains in the contract. Same stranding risk as H-1. The recipient must manually call `collect()` after liquidation.

**Impact:** Tax stranded in liquidated slots.

**Fix:** Same pattern — auto-flush remaining `collectedTax` to recipient after bounty deduction.

---

## Medium

### M-1: `selfAssess()` missing `nonReentrant`

**File:** `Slot.sol` L170-182

`selfAssess()` calls `_settle()` and `_notifyModule()` but lacks `nonReentrant`. While the module callback has a 500k gas limit, a malicious module could potentially re-enter `selfAssess` (or other state-changing functions) during the callback.

The `_notifyModule` call happens after state changes, so the risk is mitigated by checks-effects-interactions ordering, but adding `nonReentrant` is cheap insurance.

**Fix:** Add `nonReentrant` modifier to `selfAssess()`.

### M-2: Module callback can grief state transitions

**File:** `Slot.sol` L302-306

```solidity
function _notifyModule(string memory name, bytes memory data) internal {
    if (module == address(0)) return;
    (bool ok,) = module.call{gas: 500_000}(data);
    if (!ok) emit ModuleCallFailed(name);
}
```

A malicious module that consumes exactly 500k gas on every call will succeed but burn significant gas for every `buy`/`release`/`selfAssess`. At ~500k gas per callback, this adds ~$0.50-2.00 per transaction on L1s. On L2s it's cheaper but still griefing.

The module is set at creation or via pending update, so the manager controls this. But if a module is compromised after deployment, there's no circuit breaker.

**Impact:** Gas griefing. Mitigated by manager control and L2 deployment.

**Fix (optional):** Consider a `moduleEnabled` toggle the manager can flip immediately (no pending period needed since disabling a module is always safe for the occupant).

### M-3: `initialize()` has no access control — front-running risk on raw deploys

**File:** `Slot.sol` L75-93

`initialize()` can be called by anyone, guarded only by `_initialized`. When the factory deploys via `clone()` + `initialize()` in the same tx, this is safe. But if anyone deploys a Slot implementation directly (not via factory), the `initialize()` call could be front-run.

**Impact:** Low in practice — factory deployment is atomic. But the implementation contract itself is uninitializable by design (it has no constructor that sets `_initialized = true`), meaning the raw implementation could be initialized by an attacker. This doesn't affect clones but is bad hygiene.

**Fix:** Add a constructor that sets `_initialized = true`:
```solidity
constructor() {
    _initialized = true;
}
```

---

## Low

### L-1: No upper bound on `taxPercentage`

**File:** `Slot.sol`, `SlotFactory.sol`

`taxPercentage` is validated as `> 0` but has no upper bound. A value of `1_000_000` (10,000%) would drain any deposit in minutes. While this is the manager's/creator's choice, an accidental misconfiguration could trap occupant funds.

**Fix:** Consider a reasonable cap (e.g., `10_000` = 100% monthly, or `50_000` = 500%) at factory validation level.

### L-2: No upper bound on `liquidationBountyBps`

**File:** `Slot.sol` L252

`setLiquidationBounty()` accepts any value. A bounty > 10_000 (100%) would underflow `collectedTax -= bounty` in `liquidate()`. Actually no — it's calculated as `(collectedTax * bps) / BASIS_POINTS`, so >10_000 would give bounty > collectedTax, causing underflow revert.

**Impact:** Manager could accidentally make slots unliquidatable by setting bounty > 10_000 bps.

**Fix:** Add `require(newBps <= BASIS_POINTS)` in `setLiquidationBounty()`.

### L-3: `withdraw()` error message misleading

**File:** `Slot.sol` L191

```solidity
if (amount > deposit) revert NothingToWithdraw();
```

If `amount > deposit`, the error should be something like `ExcessiveWithdraw`, not `NothingToWithdraw`. The current error implies there's nothing to withdraw, but actually the user is trying to withdraw more than available.

### L-4: `secondsUntilLiquidation()` doesn't account for already-owed tax

**File:** `Slot.sol` L262-269

```solidity
uint256 remaining = deposit > owed ? deposit - owed : 0;
uint256 ratePerSec = (price * taxPercentage) / (MONTH * BASIS_POINTS);
```

This is correct for the view, but `ratePerSec` can be 0 due to integer division when `price * taxPercentage < MONTH * BASIS_POINTS`. For example: price=1 USDC (1e6), tax=1000 bps → `1e6 * 1000 / (2592000 * 10000)` = 38. That works. But price=100 (0.0001 USDC), tax=100 → `100 * 100 / 25920000000` = 0 → returns `type(uint256).max` even though the occupant IS slowly accruing tax.

**Impact:** Misleading view for micro-priced slots. No fund risk.

---

## Informational

### I-1: `ISlotsModule.onTransfer` always passes `slotId = 0`

All module callbacks pass `0` as `slotId` since v3 has one slot per contract. The `slotId` parameter is vestigial from v2. Consider removing it from the interface or documenting it's always 0.

### I-2: Factory `admin` has no transfer mechanism

`SlotFactory.admin` is set in constructor with no way to change it. If the admin key is lost, module verification is permanently unavailable. Consider adding an `transferAdmin(address)` function.

### I-3: No event emitted in `selfAssess()` for deposit enforcement

If `_enforceMinDepositExisting` reverts, there's no way to distinguish this from other reverts in transaction traces. Not a bug, just debugging friction.

### I-4: `_applyPendingUpdates()` called in `release()` after state clear

In `release()`, pending updates are applied after the slot is vacated. This means the new tax/module takes effect for the *next* occupant. This is correct behavior but worth documenting explicitly — the releasing occupant never experiences the pending update.

### I-5: Clone implementation is not self-destructible

The raw `Slot` implementation deployed by the factory constructor can be initialized (see M-3) and used directly. While this doesn't affect clones, a good practice is to make the implementation unusable. See M-3 fix.

---

## Architecture Notes

**Strengths:**
- Clean separation: one slot = one contract. No shared state to corrupt.
- Pending update model protects occupants from rug-pull parameter changes.
- Module system is well-contained with gas limits and failure isolation.
- `nonReentrant` on all fund-moving functions (except `selfAssess` — see M-1).

**Design considerations:**
- No `receive()` or `fallback()` — contract can't accept native ETH. Good.
- No `selfdestruct` — contract is permanent. Good for immutability guarantees.
- ERC-20 only, no native ETH support. Intentional and clean.
- Factory creates implementation in constructor — deterministic across chains if deployed with same nonce.

---

## Recommended Priority

1. **C-1: Fix `collectedTax = 0` in `buy()`** — active fund loss
2. **H-1 + H-2: Auto-flush on release/liquidate** — prevents stranded funds
3. **M-3: Constructor `_initialized = true`** — 1 line, good hygiene
4. **M-1: Add `nonReentrant` to `selfAssess`** — cheap insurance
5. **L-2: Cap `liquidationBountyBps`** — prevents accidental DoS
