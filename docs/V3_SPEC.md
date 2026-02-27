# 0xSlots v3 — Immutable & Modular Collectively Owned Slots

**Status:** Draft  
**Date:** 2026-02-27

---

## Core Concept

One slot = one contract. Deployed deterministically via a Hub/Factory. Minimal, immutable at the core, with opt-in mutability for specific parameters.

---

## Factory / Hub

```solidity
struct SlotConfig {
    bool mutableTax;
    bool mutableModule;
    address manager; // address(0) if both flags are false
}

createSlot(address recipient, IERC20 currency, SlotConfig config, uint256 taxPercentage, address module)
```

Deterministic address via CREATE2. Salt: `keccak256(abi.encode(recipient, currency, config))`.

Only the identity params (recipient, currency, config) determine the address. Initial values (taxPercentage, module) don't affect the address — two slots with same identity but different starting tax are the same slot.

Validation:
- If `mutableTax == false && mutableModule == false` → `manager` must be `address(0)`
- If either is `true` → `manager` must be non-zero

Same params = same address. Can't deploy twice with identical config.

### Factory Responsibilities
- Deploy Slot contracts (CREATE2)
- Registry of all deployed slots (event log)
- Protocol fee settings (optional — see Open Questions)

### Factory Does NOT
- Own or admin the slots
- Store slot state
- Gate who can deploy

---

## Slot Contract

### Immutable Parameters (set at creation, never change)

| Parameter | Type | Description |
|---|---|---|
| `recipient` | `address` | Receives tax revenue. Can be EOA, Splits, DAO, anything. Pure revenue address — no admin role. |
| `currency` | `IERC20` | Token used for pricing, deposits, and tax. Set forever. |
| `mutableTax` | `bool` | Whether `taxPercentage` can be changed. |
| `mutableModule` | `bool` | Whether `module` can be changed. |
| `manager` | `address` | **Required if either `mutableTax` or `mutableModule` is true.** The address allowed to propose tax/module updates. `address(0)` if both are immutable. |

### Initial Parameters (set at creation, mutability depends on flags)

| Parameter | Type | Mutable? | Description |
|---|---|---|---|
| `taxPercentage` | `uint256` | Only if `mutableTax == true` (by `manager`) | Basis points (100 = 1%). Tax rate per month. |
| `module` | `address` | Only if `mutableModule == true` (by `manager`) | Hook contract called on buy/release/liquidate. |

### Separation of Concerns

- **`recipient`** — receives money. No admin powers.
- **`manager`** — proposes updates. No revenue.
- These can be the same address, but they don't have to be. A DAO treasury receives revenue while a multisig manages settings. Or a protocol sets up slots where revenue flows to Splits and a governance contract manages parameters.

### Mutable State (changes during lifecycle)

| Field | Description |
|---|---|
| `occupant` | Current holder. Defaults to `recipient` (vacant). |
| `price` | Self-assessed price by occupant. |
| `deposit` | Escrowed tax deposit. |
| `lastSettled` | Last tax settlement timestamp. |
| `collectedTax` | Accumulated uncollected tax. |
| `pendingTaxUpdate` | Queued new tax rate (if `mutableTax`). |
| `pendingModuleUpdate` | Queued new module (if `mutableModule`). |

---

## Removed from v2

| Feature | Why |
|---|---|
| **Land contracts** | Unnecessary grouping. One slot = one contract. |
| **basePrice / initialPrice** | Gone entirely. Vacant slot has price 0. First buyer claims and self-assesses. |
| **Owner role** | Gone. Replaced by `recipient` (revenue) + `manager` (updates). No god-mode admin. |
| **activate/deactivate** | Gone. Deploy or don't. |
| **Beacon proxy** | Gone. Each slot is standalone. |
| **maxTaxPercentage** | Gone. Tax is either immutable (trusted by design) or mutable with pending model (transparent). |
| **updateSlotSettings** | Gone. Replaced by pending model for mutable params via `manager`. |
| **Batch slot operations** | Gone. One contract = one slot. |

---

## Pending Update Model

For mutable parameters (`taxPercentage`, `module`), changes follow a **queue-and-apply** pattern:

### Flow
1. Owner calls `proposeTaxUpdate(newRate)` or `proposeModuleUpdate(newModule)`
2. Update is stored as pending — does NOT take effect immediately
3. Update applies automatically on the next **ownership transition**:
   - `buy()` — new buyer enters with new settings
   - `release()` — slot returns to owner, settings applied
   - `liquidate()` — slot returns to owner, settings applied
4. Owner can cancel pending update anytime before it applies

### Why This Works
- Current occupant's terms are **never changed under them**
- New buyer/occupant sees the pending update **before** buying (transparent)
- No timers, no confirmation periods — just natural transitions

---

## Core Functions

### `buy(depositAmount, selfAssessedPrice)`
1. Settle outstanding tax
2. Refund previous occupant (remaining deposit + purchase price)
3. Apply any pending updates (tax, module)
4. Transfer price from buyer to previous occupant (or `recipient` if vacant)
5. Store buyer's deposit
6. Set buyer's self-assessed price
7. Notify module

If vacant (price = 0): buyer just provides deposit + their self-assessed price. No payment to anyone.

### `release()`
1. Settle outstanding tax
2. Refund occupant's remaining deposit
3. Slot becomes vacant (price = 0)
4. Apply any pending updates
5. Notify module

### `selfAssess(newPrice)`
- Occupant sets their own price
- No pending updates applied (same occupant, same terms)

### `deposit(amount)` / `withdraw(amount)`
- Occupant manages their escrow

### `liquidate()`
1. Verify occupant is insolvent (deposit depleted by tax)
2. Return slot to recipient
3. Apply any pending updates
4. Pay liquidation bounty to caller
5. Notify module

### `collect()`
- Permissionless — anyone can trigger
- Sends accumulated tax to `recipient`
- Protocol fee (if any) to factory fee recipient

### `proposeTaxUpdate(newRate)` / `proposeModuleUpdate(newModule)`
- `manager` only (reverts if respective flag is immutable)
- Queues update for next ownership transition

### `cancelTaxUpdate()` / `cancelModuleUpdate()`
- `manager` only

---

## Vacant Slot Behavior

When a slot is vacant (`occupant == address(0)` or unoccupied):
- **Price is 0.** First buyer calls `buy()` with just a deposit and self-assesses their price.
- No tax accrues.
- Pending updates apply immediately (no occupant to protect).
- No admin action needed to "list" the slot — it's always available.

---

## Open Questions

### Q1: Does mutable tax defeat the purpose?

> "Doesn't it defeat purpose to allow mutability over tax? Then you could have another contract implementing that exact rate."

**Arguments for keeping mutable tax:**
- A slot might live for years. Market conditions change. A 1% monthly tax might be too low or too high after 6 months.
- Deploying a new slot means the old one needs to die first (occupant leaves/liquidated). Mutable tax is smoother — occupant sees the pending change and can exit if they disagree.
- The pending model makes it transparent: you see the change coming, you're never surprised.

**Arguments against (just redeploy):**
- Simpler contract. Fewer state transitions. Smaller attack surface.
- "Immutable" is a stronger trust signal than "mutable with pending."
- If the slot is truly a primitive, redeployment IS the upgrade path. Like 0xSplits — want different split? Deploy a new one.

**Suggestion:** Keep the `mutableTax` flag. Creators choose their trust model at deployment. Fully immutable slots coexist with flexible ones. The market decides which gets more occupants. If nobody wants mutable-tax slots, they'll stay empty. Natural selection.

### Q2: What is deterministic deployment actually useful for?

> "I don't know what deterministic is useful for, beyond not deploying a contract with the same params twice."

**Concrete use cases:**

1. **Pre-computed addresses.** A module, DAO, or protocol can compute the slot's address before it exists. Useful for whitelisting, integrations, or setting up permissions in advance.

2. **Cross-chain consistency.** Same params on Base and Arbitrum = same address. Simplifies multi-chain UIs and indexing.

3. **Idempotent deployment.** CI/CD scripts can call `createSlot()` safely — if it exists, it reverts (or returns existing address). No accidental duplicates.

4. **Provable uniqueness.** "There is exactly one slot with these params" is a verifiable on-chain fact. Useful for modules that reference specific slot configurations.

5. **Composability.** Other contracts can `CREATE2`-predict the address and interact with it before deployment. Example: a module that distributes rewards to a set of slots can be configured with predicted addresses, then the slots get deployed later.

**Honest take:** For most users, the practical value is #1 (pre-computed addresses) and #3 (idempotent deploy). The others are nice-to-haves for advanced composability. It's cheap to include (CREATE2 vs CREATE is trivial) and unlocks optionality.

### Q3: Should the factory charge a creation fee?

Current v2 has `landCreationFee` and `slotExpansionFee`. With one-slot-per-contract, do we keep a creation fee?

**Options:**
- No fee. Let the protocol fee on tax collection be the only revenue.
- Small flat fee. Prevents spam deployments.
- Both.

### Q4: Should `manager` be transferable?

Manager is immutable in the current spec. But what if the manager key gets compromised or an org changes governance?

**Options:**
- Immutable (current spec). Want a new manager? Occupant exits, deploy new slot.
- Transferable by current manager. Simple, but breaks deterministic address model.
- Use a smart contract (multisig, DAO) as manager from the start.

**Suggestion:** Keep immutable. Use a smart contract as manager if you need governance flexibility. Same reasoning as recipient.

### Q5: Protocol fee — on what?

v2 takes protocol fee on tax collection. Options for v3:
- Tax collection only (current)
- Purchase only
- Both (v2 was criticized for double-dipping)
- None (fully free protocol, monetize elsewhere)

### Q6: Module allowlist?

v2 has a hub-level module allowlist. With independent slots:
- Keep allowlist on factory? (Paternalistic but safe)
- No allowlist — anyone can set any module? (Permissionless but risky)
- Optional allowlist — factory can flag "verified" modules but doesn't block others?

---

## Gas Considerations

One contract per slot means more deployments. Estimated deploy cost per slot: ~300k-500k gas (minimal proxy or full contract).

Options to optimize:
- **ERC-1167 Clones** — minimal proxy pointing to a Slot implementation. Cheapest deploy (~45k gas). But not truly deterministic on params (salt-based).
- **Full contract per slot** — most gas but purest model.
- **ERC-1167 + CREATE2** — clone proxy with deterministic address. Best of both worlds.

**Suggestion:** ERC-1167 clones with CREATE2. Cheap deployment, deterministic addresses, immutable params stored in the clone's initializer.
