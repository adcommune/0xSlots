# 0xSlots v2 Security Audit — 2026-02-17

**Auditor:** K (AI Security Review)
**Scope:** `src/v2/ISlots.sol`, `src/v2/Slots.sol`, `src/v2/SlotsHub.sol`, `ISlotsModule.sol`
**Commit:** Post-Superfluid removal rewrite — escrow-based Harberger tax

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 3     |
| Medium   | 4     |
| Low      | 4     |
| Info     | 3     |

---

## Critical

### C-1: `buy()` first-sale fee charged via `safeTransferFrom` twice — buyer needs double approval

**Location:** `Slots.sol` → `buy()`, lines handling `prev == owner()`

```solidity
currency.safeTransferFrom(msg.sender, owner(), price - fee);
if (fee > 0) currency.safeTransferFrom(msg.sender, hub.hubSettings().protocolFeeRecipient, fee);
// ...
if (depositAmount > 0) {
    currency.safeTransferFrom(msg.sender, address(this), depositAmount);
}
```

The buyer pays `price + depositAmount` total, split across 3 separate `safeTransferFrom` calls. This works, but there's a **critical economic bug**: on a secondary sale (buying from an occupant), the buyer pays `price` to the previous occupant + `depositAmount` to escrow. But the **previous occupant also gets their full deposit refunded** — meaning the buyer pays `price + deposit`, while the seller receives `price + theirOriginalDeposit`. There is **no tax deduction from the refund** even though tax may have been owed between the last settle and this block.

Wait — `_settle(slotId)` is called before the refund. So `esc.deposit` is already reduced by accrued tax. This is correct. **Downgrading to Info** — the logic is sound, but the 3 separate `transferFrom` calls are gas-inefficient. Consider batching into a single transfer to the contract, then distributing internally.

**Revised severity: Info (I-1)**

---

## High

### H-1: `collectAll()` unbounded loop — DoS at scale

**Location:** `Slots.sol` → `collectAll()`

```solidity
function collectAll() external nonReentrant {
    for (uint256 i = 1; i < nextSlotId; i++) {
        _settle(i);
        // ...
    }
}
```

Iterates every slot ever created. A land with 100+ slots will hit block gas limits. Each iteration does: storage reads (slot + escrow), settlement math, potential token transfers.

**Impact:** `collectAll()` becomes permanently unusable after enough slots are created. Not a fund-loss risk (individual `collect(id)` still works), but breaks expected functionality.

**Recommendation:** Remove `collectAll()` or add pagination (`collectRange(uint256 from, uint256 to)`).

---

### H-2: No liquidation incentive — liquidation may never happen

**Location:** `Slots.sol` → `liquidate()`

Anyone can call `liquidate()` but gets nothing for it. The occupant's escrow is already at 0 (settled), so there's nothing to distribute. The slot just returns to the owner at base price.

**Impact:** Insolvent slots sit indefinitely because no one is economically motivated to call `liquidate()`. The land owner must self-police or build external infrastructure.

**Recommendation:** Add a liquidation bounty — either a fixed amount from the hub, or give the liquidator a small window to claim the slot at a discount, or let the land owner configure a bounty per slot.

---

### H-3: Occupant can drain escrow via `withdraw()` right before liquidation check

**Location:** `Slots.sol` → `withdraw()`

```solidity
function withdraw(uint256 slotId, uint256 amount) external nonReentrant {
    // ...
    _settle(slotId);
    if (amount > esc.deposit) revert NothingToWithdraw();
    esc.deposit -= amount;
    // ...
}
```

After `_settle()`, the occupant can withdraw their entire remaining deposit down to 0, becoming instantly insolvent. This is **by design** (it's their money), but combined with H-2 (no liquidation incentive), an occupant can:

1. Self-assess a very high price (increasing their visibility/value in the module)
2. Withdraw all escrow
3. Sit at 0 deposit indefinitely since no one liquidates them
4. Effectively hold the slot for free at a high advertised price

**Recommendation:** Either require a minimum deposit (e.g., enough for N days of tax), or make liquidation profitable (H-2 fix).

---

## Medium

### M-1: `MODULE_CALL_GAS_LIMIT = 100_000` — Superfluid ghost, too restrictive

**Location:** `Slots.sol`, line 17

This was copied from v1 where Superfluid SuperApp callbacks had strict gas budgets. In v2, module calls happen in normal transactions with no callback constraints.

100k gas is too low for any module that:
- Writes to storage (20k+ per SSTORE)
- Transfers tokens
- Emits events with indexed data
- Calls external contracts

A metadata module writing to IPFS pointers or an NFT module minting would fail silently (the call reverts, `ModuleCallFailed` emits, but the core operation succeeds).

**Recommendation:** Either remove the gas limit entirely, make it configurable per-slot or at the hub level, or raise to 500k+ minimum.

---

### M-2: `hub.hubSettings()` called in hot path — external call on every `buy()` and `collect()`

**Location:** `Slots.sol` → `buy()`, `collect()`, `collectAll()`

```solidity
uint256 fee = (price * hub.hubSettings().protocolFeeBps) / BASIS_POINTS;
```

`hubSettings()` is a cross-contract call returning a full `HubSettings` struct from storage. In `buy()` this happens twice (fee calc + fee recipient). In `collectAll()`, it happens per slot.

**Impact:** Gas inefficiency. More importantly, if the hub admin changes `protocolFeeBps` between `_settle()` and `collect()` in the same slot lifecycle, tax was accrued at the old rate but the protocol fee is taken at the new rate.

**Recommendation:** Cache `hub.hubSettings()` once per function call. Consider snapshotting the fee rate at settlement time in `SlotEscrow`.

---

### M-3: `openLand()` — one land per account, no override protection

**Location:** `SlotsHub.sol` → `openLand()`

```solidity
lands[account] = land;
```

If `openLand(account)` is called twice for the same account, the first land is orphaned — still exists on-chain but unreachable via `lands[account]`. The old Slots contract's `owner()` is still the account, so funds aren't lost, but the hub loses track.

**Recommendation:** Add `if (lands[account] != address(0)) revert LandAlreadyExists();`

---

### M-4: `expandLand()` — fee calculation doesn't match `openLand()`

**Location:** `SlotsHub.sol` → `expandLand()`

```solidity
uint256 expected = params.length * _hubSettings.landCreationFee;
```

`openLand()` charges `landCreationFee` once for the whole land (regardless of initial slot count). `expandLand()` charges `landCreationFee * newSlots`. Inconsistent pricing — creating 10 slots via `openLand` costs 1x fee, but adding 10 slots via `expandLand` costs 10x fee.

**Recommendation:** Clarify if `landCreationFee` is per-land or per-slot. If per-slot, fix `openLand` to charge `fee * initialAmount`. If per-land, fix `expandLand` to charge a flat fee or a separate `slotExpansionFee`.

---

## Low

### L-1: `deposit()` allows anyone to top up any slot

**Location:** `Slots.sol` → `deposit()`

No check that `msg.sender == slot.occupant`. Anyone can deposit tokens into anyone's escrow. Not a vulnerability (it's additive), but unexpected — a griefing vector where someone deposits dust to prevent liquidation.

**Recommendation:** Either restrict to occupant-only, or document as intentional (gift deposits / keep-alive mechanism).

---

### L-2: `selfAssess()` — no upper bound on price

An occupant can set price to `type(uint256).max`, making the slot effectively unbuyable (no one will pay that). Combined with a large deposit, they can lock a slot permanently.

This is a known Harberger trade-off (high price = high tax), but at extreme values, the tax per second rounds to amounts that never deplete a reasonable deposit in practice.

**Recommendation:** Consider a max price ceiling per slot (e.g., `100x basePrice`), or accept this as a protocol design choice.

---

### L-3: No event for `expandLand()`

**Location:** `SlotsHub.sol` → `expandLand()`

Individual `SlotCreated` events fire from the Slots contract, but there's no hub-level event indicating a land was expanded. Subgraph indexing would miss the connection.

**Recommendation:** Add `event LandExpanded(address indexed land, uint256 newSlotCount);`

---

### L-4: `_settle()` rounding — dust accumulation over long periods

```solidity
uint256 owed = (slot.price * slot.taxPercentage * elapsed) / (YEAR * BASIS_POINTS);
```

Integer division truncates. Over many small settle intervals, the total tax collected will be slightly less than the continuous integral. For a 1 ETH slot at 1% over 365 days settled every block (~12s), the rounding loss is negligible (~wei), but worth noting.

**Impact:** Dust-level, no practical concern.

---

## Informational

### I-1: Three separate `transferFrom` in `buy()` — gas optimization opportunity

The buyer's payment in first-sale mode does 2-3 separate `safeTransferFrom` calls. Could transfer everything to the contract first, then distribute internally with `safeTransfer`.

### I-2: `SlotParams.price` vs `SlotParams.basePrice` — redundant on creation

When creating a slot, both `basePrice` and `price` are set from params. If `price != basePrice`, the initial state is a self-assessed price with no occupant (the owner). This is confusing — on creation, price should equal basePrice.

**Recommendation:** Only accept `basePrice` in `SlotParams`, set `price = basePrice` in `_createSlot`.

### I-3: No `Initializable` import on Slots

`Slots.sol` uses `initializer` modifier via `ReentrancyGuardUpgradeable` and `OwnableUpgradeable` parent initializers, but doesn't explicitly inherit `Initializable`. Works because it's inherited transitively, but explicit is better.

---

## Test Coverage Assessment

13 tests covering: land creation, buying, refunds, self-assess, tax accrual, settlement, liquidation (solvent + insolvent), collect, deposit, withdraw, release, seconds-until-liquidation.

**Missing test scenarios:**
- `collectAll()` with multiple occupied slots
- `expandLand()` flow
- Tax rate proposal → confirm → effect on settlement
- Module callback success + failure
- Double `openLand` for same account (M-3)
- `withdraw()` → immediate insolvency → liquidation chain (H-3)
- Price self-assessment to extreme values (L-2)
- Anyone depositing into another's slot (L-1)
- Hub settings change mid-lifecycle (M-2)

---

## Conclusion

The v2 rewrite is **dramatically cleaner** than v1. Removing Superfluid eliminated an entire class of callback/whitelisting/wrapping complexity. The escrow math is correct and the `_settle()` pattern is sound.

**Priority fixes:**
1. **H-1 + H-3**: Add liquidation incentive + minimum deposit requirement — these combine into a "free slot" exploit
2. **M-3**: Prevent double `openLand` — easy one-liner
3. **M-1**: Raise or remove `MODULE_CALL_GAS_LIMIT`
4. **M-4**: Align fee logic between `openLand` and `expandLand`

Everything else is optimization or design choice. Ship it. 🔺
