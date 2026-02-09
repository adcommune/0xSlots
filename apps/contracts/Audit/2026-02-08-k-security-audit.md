# Security Audit - Harberger PCO Contracts

**Auditor:** K (AI Assistant)  
**Date:** 2026-02-08  
**Commit:** Manual review  
**Scope:** Harberger.sol, HarbergerHub.sol, HarbergerStreamSuperApp.sol

---

## Executive Summary

The Harberger PCO (Partial Common Ownership) contracts implement a streaming-based tax system using Superfluid. The core design is sound and well-architected. The main concerns are around cross-currency flow management and user control during auto-liquidation scenarios.

**Overall Risk:** Medium

| Severity | Count |
|----------|-------|
| High | 2 |
| Medium | 4 |
| Low | 3 |

---

## High Severity

### H-1: Cross-Currency Flow Bug in SuperApp

**Location:** `HarbergerStreamSuperApp.sol` - `onFlowUpdated()`

**Description:**  
When a user reduces their flow for a specific SuperToken, the `_calculateOwedFlow()` function calculates the total owed flow across ALL slots regardless of currency. This means reducing a USDCx flow could trigger release of ETHx-denominated slots.

```solidity
function _calculateOwedFlow(address account) internal view returns (int96) {
    int96 owedFlow = 0;
    for (uint256 i = 0; i < ownedSlots[account].length; i++) {
        uint256 slotId = ownedSlots[account][i];
        int96 slotFlow = harberger.calculateFlowRate(slotId);
        owedFlow += slotFlow;  // Mixes currencies!
    }
    return owedFlow;
}
```

**Impact:** Users could lose slots in currency A when reducing flow in currency B.

**Recommendation:**  
Filter slots by currency in `_calculateOwedFlow()` and `_calculateSlotsToRelease()`:

```solidity
function _calculateOwedFlow(address account, ISuperToken currency) internal view returns (int96) {
    int96 owedFlow = 0;
    for (uint256 i = 0; i < ownedSlots[account].length; i++) {
        uint256 slotId = ownedSlots[account][i];
        Slot memory slot = harberger.getSlot(slotId);
        if (address(slot.currency) == address(currency)) {
            owedFlow += harberger.calculateFlowRate(slotId);
        }
    }
    return owedFlow;
}
```

---

### H-2: Auto-Release Order Not User-Controllable

**Location:** `HarbergerStreamSuperApp.sol` - `_calculateSlotsToRelease()`

**Description:**  
When a user's flow is insufficient, slots are auto-released in LIFO order (last acquired first). Users have no control over which slots get released, potentially losing high-value slots while keeping low-value ones.

```solidity
for (uint256 i = 0; i < slotsToReleaseCount; i++) {
    uint256 slotIndex = totalSlots - 1 - i;  // LIFO order
    slotsToRelease[i] = ownedSlotsArray[slotIndex];
}
```

**Impact:** User could lose a $10,000 slot instead of a $10 slot during liquidation.

**Recommendation:**  
Consider one of:
1. Release slots by ascending price (cheapest first)
2. Allow users to set priority order
3. Release slots by ascending flow rate (lowest tax first)

```solidity
// Option 1: Sort by price ascending before release
function _calculateSlotsToRelease(...) internal view returns (uint256[] memory) {
    // Sort ownedSlotsArray by slot.price ascending
    // Release from lowest price first
}
```

---

## Medium Severity

### M-1: No Buy Slippage Protection

**Location:** `Harberger.sol` - `buy()`

**Description:**  
The `buy()` function has no `maxPrice` parameter. If the slot price changes between transaction submission and execution, the buyer pays a different amount than expected.

```solidity
function buy(uint256 slotId) external nonReentrant {
    _buy(slotId);  // No maxPrice check
}
```

**Impact:** Buyer could pay significantly more than intended due to front-running or legitimate price updates.

**Recommendation:**  
Add a `maxPrice` parameter:

```solidity
function buy(uint256 slotId, uint256 maxPrice) external nonReentrant {
    Slot storage slot = slots[slotId];
    if (slot.price > maxPrice) revert PriceExceedsMax(slot.price, maxPrice);
    _buy(slotId);
}
```

---

### M-2: Tax Update Inheritance by New Owner

**Location:** `Harberger.sol` - `proposeTaxRateUpdate()` / `confirmTaxRateUpdate()`

**Description:**  
When a slot changes ownership, any pending tax rate update is inherited by the new owner. The original owner can confirm the tax update after selling, affecting the new owner who never agreed to the change.

**Impact:** New owner could face unexpected tax rate increase.

**Recommendation:**  
Cancel pending tax updates on ownership transfer:

```solidity
function _buy(uint256 slotId) internal {
    // ... existing logic ...
    
    // Cancel any pending tax update
    if (slot.pendingTaxUpdate.status == TaxUpdateStatus.Pending) {
        slot.pendingTaxUpdate.status = TaxUpdateStatus.None;
        slot.pendingTaxUpdate.newRate = 0;
        slot.pendingTaxUpdate.proposedAt = 0;
    }
    
    // ... rest of function ...
}
```

---

### M-3: Module Callback Failure Silently Continues

**Location:** `Harberger.sol` - multiple functions

**Description:**  
Module callbacks use try/catch with gas limits. If a module call fails, the main operation succeeds but module state becomes inconsistent.

```solidity
try IHarbergerModule(slot.module).onTransfer{gas: MODULE_CALL_GAS_LIMIT}(...) 
{} catch {
    emit ModuleCallFailed(slotId, "onTransfer");
}
```

**Impact:** Module state drift from actual slot state.

**Recommendation:**  
Consider adding a flag to make module calls mandatory:

```solidity
struct SlotParams {
    // ... existing fields ...
    bool moduleCallRequired;  // If true, revert on module failure
}
```

---

### M-4: expandLand Requires Exact Payment

**Location:** `HarbergerHub.sol` - `expandLand()`

**Description:**  
The function requires exactly the right payment amount. Sending even 1 wei extra causes the transaction to fail.

```solidity
if (msg.value != expected) {
    revert InvalidPayment(expected, msg.value);
}
```

**Impact:** Poor UX, failed transactions.

**Recommendation:**  
Accept overpayment and refund:

```solidity
if (msg.value < expected) {
    revert InvalidPayment(expected, msg.value);
}
if (msg.value > expected) {
    (bool success, ) = msg.sender.call{value: msg.value - expected}("");
    require(success, "Refund failed");
}
```

---

## Low Severity

### L-1: Hub Admin Centralization

**Location:** `HarbergerHub.sol`

**Description:**  
Hub admin has significant power: update protocol fees, upgrade contracts, allow/disallow currencies and modules. This is standard for upgradeable systems but creates centralization.

**Recommendation:**  
Consider timelock for admin actions or multi-sig requirement.

---

### L-2: No Stuck Token Recovery

**Location:** All contracts

**Description:**  
If tokens are accidentally sent directly to contract addresses, there's no recovery mechanism.

**Recommendation:**  
Add admin rescue function for non-protocol tokens:

```solidity
function rescueTokens(address token, uint256 amount) external onlyOwner {
    // Ensure it's not a protocol token
    IERC20(token).transfer(owner(), amount);
}
```

---

### L-3: Linear Search in _removeSlot

**Location:** `HarbergerStreamSuperApp.sol` - `_removeSlot()`

**Description:**  
O(n) linear search to find and remove a slot. With MAX_SLOTS_PER_USER = 100, this is acceptable but not optimal.

```solidity
for (uint256 i = 0; i < slots.length; i++) {
    if (slots[i] == slotId) {
        // ...
    }
}
```

**Recommendation:**  
Consider using a mapping for O(1) lookup if gas optimization is needed:

```solidity
mapping(address => mapping(uint256 => uint256)) slotIndex; // owner => slotId => index
```

---

## Informational

### I-1: Ownership Transfer Permanently Disabled

`ownershipTransferabilityDisabled = true` is set in initialize and cannot be changed. This is intentional but worth noting for documentation.

### I-2: Superfluid Dependency

The system is tightly coupled to Superfluid protocol. Any Superfluid issues (bugs, upgrades, governance) affect this protocol.

### I-3: Chain Availability

Superfluid is only available on certain chains. This limits deployment options compared to a non-streaming implementation.

---

## Conclusion

The core Harberger mechanics are well-implemented with proper reentrancy protection, access control, and error handling. The Superfluid integration for streaming taxes is elegant and provides automatic solvency management.

**Priority fixes before going immutable:**
1. **H-1 (Cross-Currency)** - Must fix, causes incorrect behavior
2. **H-2 (Auto-Release Order)** - Should fix, poor UX during liquidation
3. **M-1 (Buy Slippage)** - Easy fix, good protection

The remaining issues are acceptable trade-offs or can be addressed through documentation and UI guardrails.
