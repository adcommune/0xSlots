# Bug Report: "Slot not found" for recently created slots on Base mainnet

**Date:** 2026-04-16
**Severity:** High — affected slots are permanently broken (cannot be viewed or interacted with via the frontend)
**Affected slots:**
- `0x98771e796f06bd781e18771a5d2bb3a29327c3cb`
- `0x10bae8b1458b86c68574ecf809d81a4972cbbdfa`

**Recipient address:** `0xf4baaf1d85753a857aa9c4aeba877d7864be48aa`
**Creation tx:** `0x9a87c2b38c4f04074fcdf07ab81d679184718887c6fa89b93cf17eb1bdf46b18`

---

## Symptom

Navigating to `/slots/0x98771e...` or `/slots/0x10bae8...` on the landing app displays **"Slot not found"**, even though both slots exist on-chain and are indexed by the subgraph.

A third slot created by the same recipient (`0x8487d8c479ce46c3ba71c441226de23236f94ed0`) works fine.

---

## Root cause

Both broken slots were created with `module` set to `0x17b663b7C779B64f339ab916aB734A6a4f0b075E` — the **Base Sepolia** FeedModule address. This address has **no deployed code on Base mainnet** (code size = 0).

| Address | Chain | Code size | Role |
|---------|-------|-----------|------|
| `0x17b663b7...` | Base Sepolia | 163 bytes | FeedModule (correct for Sepolia) |
| `0x17b663b7...` | **Base mainnet** | **0 bytes** | **Nothing — empty address** |
| `0xe92BE44E...` | Base mainnet | 163 bytes | FeedModule (correct for mainnet) |

This causes a chain of failures:

### 1. `Slot.getSlotInfo()` reverts on-chain

`getSlotInfo()` in `Slot.sol:439-473` tries to read module metadata when `module != address(0)`:

```solidity
if (module != address(0)) {
    ISlotsModule mod = ISlotsModule(module);
    try mod.name() returns (string memory n) { info.moduleName = n; } catch {}
    try mod.version() returns (string memory v) { info.moduleVersion = v; } catch {}
    // ...
}
```

The `try/catch` blocks are **supposed** to gracefully handle failures, but they don't when the target address has no code. Confirmed via `cast call --trace`:

```
[27625] 0x8D56...::getSlotInfo() [delegatecall]
  ├─ [0] 0x17b663b7...::name() [staticcall]
  │   └─ ← [Stop]                              // CALL succeeds, empty returndata
  └─ ← [Revert] call to non-contract address   // ABI decode fails, escapes catch
```

The EVM CALL to a codeless address returns success with empty bytes. Solidity then attempts to ABI-decode this empty returndata as `string memory`. The decode fails, and in the current compiler version (0.8.29), this failure **is not caught** by the `catch {}` clause — it propagates as an uncaught revert.

Individual storage reads (`recipient()`, `currency()`, `price()`, `taxOwed()`, etc.) all succeed. Only `getSlotInfo()` reverts.

### 2. Frontend shows "Slot not found"

In `slot-page-content.tsx:86-176`, the page relies entirely on `useSlotOnChain()` (which calls `getSlotInfo()`) to determine if a slot exists:

```tsx
const { data: slot, isLoading } = useSlotOnChain(slotAddress, selectedChainId);

if (isLoading) return <Loading />;
if (!slot) return <SlotNotFound />;  // <-- this fires
```

When `getSlotInfo()` reverts, wagmi's `useReadContract` returns `data: undefined`. The slot is `null`, so the page renders "Slot not found" — even though subgraph data (`subgraphSlot` at line 97) is already fetched and available.

### 3. No validation at slot creation time

`SlotFactory._validateConfig()` (`SlotFactory.sol:241-253`) only checks:
- Manager address consistency with mutability flags
- Tax percentage > 0

It does **not** validate the module address:
- No `extcodesize` check
- No `ISlotsModule` interface check
- No verified-module requirement

The module registry is explicitly `non-blocking` (comment on line 153). Any address — including EOAs, empty addresses, or contracts on other chains — can be set as a module.

---

## How the wrong address was used

The creation transaction used `createSlots()` (batch) with module `0x17b663b7...`. The subgraph on Base mainnet has this address registered as an **unverified** module (likely indexed from an on-chain event when someone interacted with it).

Since the landing app's module dropdown only shows verified modules (filtered at `step-parameters.tsx:238`), the user most likely entered the address manually via the "Custom address" option, accidentally using the Sepolia FeedModule address instead of the mainnet one.

---

## Impact

- **Affected slots are broken permanently** — `getSlotInfo()` will always revert as long as `module` points to a codeless address. These slots cannot be viewed, managed, or interacted with through the frontend.
- **On-chain state is intact** — all storage reads work individually. The slots could still be interacted with via direct contract calls (buy, release, collect, etc.), just not via `getSlotInfo()`.
- **Any future slot** created with a non-contract module address will have the same problem.

---

## Recommendations

### Fix 1: `Slot.getSlotInfo()` — guard module calls with `extcodesize` (contract upgrade)

The `try/catch` pattern is insufficient for codeless addresses. Add an explicit code-existence check:

```solidity
if (module != address(0) && module.code.length > 0) {
    ISlotsModule mod = ISlotsModule(module);
    try mod.name() returns (string memory n) { info.moduleName = n; } catch {}
    try mod.version() returns (string memory v) { info.moduleVersion = v; } catch {}
    try mod.feeBps() returns (uint256 f) { info.moduleFeeBps = f; } catch {}
    try mod.feeRecipient() returns (address r) { info.moduleFeeRecipient = r; } catch {}
    try mod.moduleURI() returns (string memory u) { info.moduleURI = u; } catch {}
}
```

`module.code.length > 0` compiles to `EXTCODESIZE` — cheap (100 gas warm) and prevents the entire class of "call to non-contract" reverts. This fix would also retroactively fix the two broken slots since the beacon proxy pattern means all slots share the same implementation.

**Priority: High** — this is the most impactful fix because upgrading the implementation via the beacon automatically fixes all existing and future slots in one transaction.

### Fix 2: `SlotFactory._validateConfig()` — reject non-contract modules at creation (contract upgrade)

Prevent the problem at the source:

```solidity
function _validateConfig(
    SlotConfig memory config,
    SlotInitParams memory initParams
) internal view {  // note: view, not pure (needs extcodesize)
    if (config.mutableTax || config.mutableModule) {
        if (config.manager == address(0)) revert InvalidConfig_ManagerRequired();
    } else {
        if (config.manager != address(0)) revert InvalidConfig_ManagerMustBeZero();
    }
    if (initParams.taxPercentage == 0) revert InvalidTaxPercentage();

    // Validate module is a contract (if set)
    if (initParams.module != address(0)) {
        if (initParams.module.code.length == 0) revert InvalidModule_NoCode();
    }
}
```

Optionally, also check `ISlotsModule` interface support:

```solidity
if (initParams.module != address(0)) {
    if (initParams.module.code.length == 0) revert InvalidModule_NoCode();
    // Optional: check interface
    try ISlotsModule(initParams.module).supportsInterface(type(ISlotsModule).interfaceId)
        returns (bool ok) {
        if (!ok) revert InvalidModule_NotISlotsModule();
    } catch {
        revert InvalidModule_NotISlotsModule();
    }
}
```

**Priority: Medium** — prevents future occurrences but doesn't fix existing broken slots.

### Fix 3: Frontend fallback to subgraph data (no contract change needed)

In `slot-page-content.tsx`, use the already-fetched `subgraphSlot` as a fallback when `useSlotOnChain()` fails:

```tsx
const { data: slot, isLoading, isError } = useSlotOnChain(slotAddress, selectedChainId);
const { data: subgraphSlot } = useSuspenseQuery(slotQueryOptions(selectedChainId, slotAddress));

if (isLoading) return <Loading />;

if (!slot && !subgraphSlot) return <SlotNotFound />;

// If on-chain fails but subgraph has data, show degraded view
if (!slot && subgraphSlot) {
    return <SlotDegradedView slot={subgraphSlot} error="on-chain read failed" />;
}
```

This requires `useSlotOnChain` to expose `isError` (currently it doesn't — wagmi's `useReadContract` provides it but the hook swallows it).

**Priority: Low** — nice safety net, but Fix 1 (beacon upgrade) is the proper solution and retroactively fixes everything.

### Fix 4: Frontend validation in create form (no contract change needed)

In the create page, when a user enters a custom module address, check it has code before allowing submission. Add an `eth_getCode` check (via wagmi's `useReadContract` or a simple `publicClient.getCode()` call) in `step-parameters.tsx` alongside the existing ERC-20 validation pattern.

**Priority: Low** — defense in depth; Fix 2 handles this at the contract level.

---

## Recommended action order

1. **Fix 1** — Upgrade the Slot implementation via the beacon. Single tx, fixes all existing and future slots.
2. **Fix 2** — Upgrade the SlotFactory to validate modules. Prevents future bad deployments.
3. Fix 3 & 4 — Frontend hardening if desired.

---

## Verification

After deploying Fix 1, verify with:

```bash
# Should return full SlotInfo without reverting
cast call 0x98771e796f06bd781e18771a5d2bb3a29327c3cb "getSlotInfo()" --rpc-url https://mainnet.base.org

# Both broken slots should now load in the frontend
# https://0xslots.com/slots/0x98771e796f06bd781e18771a5d2bb3a29327c3cb
# https://0xslots.com/slots/0x10bae8b1458b86c68574ecf809d81a4972cbbdfa
```
