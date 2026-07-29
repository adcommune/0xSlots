# Composable occupancy policies — design

**Date:** 2026-07-29
**Status:** Draft, pending review
**Scope:** `apps/contracts` (`Slot.sol`, `SlotFactory.sol`, new `src/policies/`)
**Builds on:** [V3_SPEC.md](../../V3_SPEC.md)

## Goal

Decouple the rules that govern *who occupies a slot and when* from the Harberger
core, so occupancy behaviour becomes a composable, swappable layer — the same way
utility behaviour is already composable via `ISlotsModule`.

The motivating use case is **humans and AI agents sharing the same market**.
Continuous-time Harberger with instant buy is, in practice, a latency auction:
the winner is whoever's infrastructure lands the transaction first. A reasoning
agent takes seconds; a mempool bot takes milliseconds. In continuous time the bot
wins every contest and the agent never gets to demonstrate the thing it is good
at. Discretising occupancy transitions removes the speed advantage and makes the
competition about valuation instead.

Secondarily, discrete transitions make the slot *legible*: "the thing on screen
changes on the hour" is a far better product than "it can flip mid-scroll", and
it gives clients a schedule to hang notifications off.

## The three layers

| Layer | What it governs | Where it lives |
| --- | --- | --- |
| **Economic policy** | Tax rate, deposit minimums, liquidation bounty | Inlined in `Slot.sol` (`taxPercentage`, `minDepositSeconds`, `liquidationBountyBps`) |
| **Occupancy policy** | Who may take the slot, and when | **New** — `IOccupancyPolicy` + `epochSeconds` in core |
| **Utility module** | What the slot *does* (ads, naming, content, commerce) | Existing `ISlotsModule` |

The economic layer stays inlined in this pass. It is named here so it has a
defined extraction path, but `taxPercentage` as a plain `uint256` is *legible* —
every UI, the subgraph, Ponder, and `useSlotOnChain` read it directly. Behind an
interface it becomes "go ask this contract", and every consumer gets harder for
demand that does not exist yet. Extract it the day someone wants a non-flat rate.

## Guiding principle

Harberger is three coupled rules: (1) you self-assess a price, (2) you pay
continuously in proportion to it, (3) anyone can take it at that price. The
coupling is what makes the self-assessment honest.

The rule that decides whether a module is acceptable:

> **Timing is modular. Price-setting is not.**

Epoch delay, minimum tenure, grace periods, and queues all change *when* a
transition takes effect. They are dials on rule 3, not switches. Minimum tenure
does not let a liar escape — it delays the punishment. Declare a dishonestly low
price with a 30-day tenure and someone still takes it at that low price on day
31; you merely enjoyed 30 days first.

An **auction** replaces self-assessment with third-party price discovery. That is
rule 1, which never leaves the core. Auctions are out of scope and out of bounds
for this interface.

## Invariants enforced in `Slot.sol`

Safety is binary; purity is a spectrum. The core enforces safety and refuses to
let any policy break it. Purity is *labelled*, not enforced.

1. **`liquidate()` is never vetoable.** A policy that can block liquidation makes
   an insolvent occupant unevictable and bricks the slot permanently. Insolvency
   always ends occupancy, under every policy.
2. **Policies never touch slot funds.** A policy is asked yes/no and nothing else.
   It cannot move `deposit`, change `price`, or redirect the buyer. Worst case a
   bad policy freezes its own slot; it can never drain one. Peripheral contracts
   (e.g. a queue) hold *their own* escrow, never the slot's.
3. **A policy can never make the slot permanently unclaimable.** Concretely, the
   queue-exclusivity policy must grant exclusivity only *while the queue is
   non-empty*. A flat "only the queue may buy" freezes the slot forever.
4. **`release()` is never vetoable.** Blocking voluntary exit does not trap an
   occupant — they simply stop topping up and leave via insolvency instead. It
   only forces the ugliest exit path, where the recipient loses the clean deposit
   flush and the slot sits dead until someone bothers to liquidate.

Purity labelling reuses the existing `verifiedModules` registry on the factory:
instant buy is pure, epoch is near-pure, a long tenure is soft. Informational,
non-blocking, consistent with how module verification already works.

## Core changes

### 1. `epochSeconds` — scheduled transitions

Epochs are **core, not a module**. A veto hook cannot express them: they change
settlement maths and the resolution of who is effectively the occupant. Those are
exactly the invariants nobody should be able to get wrong from outside.

- `epochSeconds == 0` → today's behaviour, byte for byte. Buy executes inline.
- `epochSeconds == 3600` → buy at 14:14 *commits*; occupancy and tax liability
  both begin at 15:00 UTC.

Boundary is `((block.timestamp / epochSeconds) + 1) * epochSeconds`. A buy landing
exactly on a boundary schedules a full epoch out — deterministic, no zero-length
window.

Set at creation, immutable thereafter. It is a fundamental property of the slot,
like `currency`.

**Commit semantics**

- Buyer's funds (`price + deposit`) transfer to the slot at commit time.
- The outgoing occupant keeps occupying and keeps paying tax until the boundary.
- Their refund (remaining deposit + the price paid) is settled at materialisation.
- **First commit wins.** A second `buy()` while a transfer is pending reverts with
  `TransferPending()`. Ranking same-epoch commits by price would be an auction.
- **Commits are non-cancellable.** If they were, the slot could be locked every
  epoch by a committer who cancels before the boundary, and nobody could ever buy.
- **`selfAssess()` is blocked while a transfer is pending.** Otherwise the outgoing
  occupant raises the price after seeing the commit and dodges the sale. This is a
  core rule when epochs are on, not a policy concern.
- If the occupant is **liquidated or releases** before the boundary, the slot goes
  vacant and the pending transfer still lands at its boundary. Dead time is bounded
  by one epoch, and the epoch invariant stays simple.

**Two-legged settlement**

`_settle()` gains one branch. When a pending transfer has matured:

```
if (pending.effectiveAt != 0 && block.timestamp >= pending.effectiveAt) {
    // leg 1 — outgoing occupant, lastSettled → effectiveAt
    _accrue(price, pending.effectiveAt - lastSettled);
    _refund(occupant, deposit + pending.pricePaid);

    // materialise
    occupant       = pending.buyer;
    price          = pending.newPrice;
    deposit        = pending.deposit;
    occupiedSince  = pending.effectiveAt;
    lastSettled    = pending.effectiveAt;
    delete pending;
    // fire onTransfer + Bought here
}
// leg 2 — current occupant, lastSettled → now
_accrue(price, block.timestamp - lastSettled);
```

Materialisation is **passive**: nothing runs on a timer, the state catches up on
the next interaction. Same pattern `_settle()` already uses for tax accrual.

Invariant to fuzz: total tax charged across a boundary must equal what a single
occupant would have paid over the same span. No gap, no double-charge.

### 2. Stale-getter fix (required, not optional)

`occupant`, `price`, and `deposit` are public auto-getters returning raw storage.
Once transfers can mature lazily, those getters are **wrong** between `effectiveAt`
and the next state-changing call — a window that can be hours long.

This is a live security bug, not cosmetic: `MetadataModule` authenticates via
`staticcall occupant()`. A stale getter lets the *outgoing* occupant write metadata
after they have effectively lost the slot. Anything reading `occupant()` inherits it.

**Fix:** make `occupant`, `price`, and `deposit` `private` and hand-write view
getters that resolve a matured-but-unmaterialised transfer. Storage slots are
unchanged (3, 4, 9) and the external ABI is identical — only the getter bodies
change. `taxOwed()`, `isInsolvent()`, `secondsUntilLiquidation()`, and
`getSlotInfo()` resolve the same way.

### 3. `IOccupancyPolicy` — the veto hook

Two call sites, four lines total:

```solidity
function buy(...) external nonReentrant {
    if (occupancyPolicy != address(0))
        IOccupancyPolicy(occupancyPolicy).checkBuy(_ctx(...));   // reverts = blocked
    // ... existing body, unchanged
}
```

```solidity
struct OccupancyContext {
    address slot;
    address caller;          // msg.sender on the slot
    address account;         // incoming occupant (buy) / current occupant (price update)
    address occupant;        // current occupant, address(0) if vacant
    uint256 occupiedSince;
    uint256 taxPercentage;
    uint256 currentPrice;
    uint256 newPrice;
    uint256 depositAmount;
}

interface IOccupancyPolicy is IERC165 {
    function checkBuy(OccupancyContext calldata ctx) external view;
    function checkPriceUpdate(OccupancyContext calldata ctx) external view;

    function name() external view returns (string memory);
    function version() external view returns (string memory);
    function policyURI() external view returns (string memory);
}
```

Both hooks are `view` and revert with their own custom errors, which bubble
naturally for good client-side messages.

**Fail-closed, unlike `ISlotsModule`.** `_notifyModule` deliberately uses a
gas-capped `.call` and swallows failures — a broken ad module must not break the
slot. A policy is the opposite: if it cannot be evaluated, the buy must not
proceed, or "minimum tenure" means nothing. Policies are called directly and their
reverts propagate.

**Why `buy` and `selfAssess` are sufficient.** Only `buy()` assigns occupancy;
`release()` and `liquidate()` merely produce *vacancy*. Guarding `buy()` therefore
guards every path into the slot, regardless of how it became free. Combined with
invariants 1 and 4 above, the veto surface settles at exactly two methods.

`occupancyPolicy` follows the existing `mutableModule` flag and pending-update
semantics — proposed by `manager`, applied on the next ownership transition.

### 4. Operator approval

`buy(account, deposit, price)` already lets `msg.sender` pay while `account`
occupies — "buy for someone else" needs no new method, and it is why a queue can
work as a plain peripheral contract. `topUp()` is already open to anyone, so
sponsoring tax also already works.

The gap is the other direction: `selfAssess`, `withdraw`, and `release` are all
`onlyOccupant`, so an agent can put someone in a slot and keep it funded but cannot
reprice it for them. Add ERC-721-style approval:

```solidity
mapping(address occupant => mapping(address operator => bool)) public isOperator;
function setOperator(address operator, bool approved) external;
```

- Operator **may**: `selfAssess`, `topUp`.
- Operator **may not**: `withdraw`, `release`. Those move the position's principal
  and stay occupant-only. Bounded authority is the point — you delegate management
  to an agent without handing it your money.

Approvals are keyed by occupant, so they persist across leaving and re-entering,
matching `setApprovalForAll` intuitions.

### 5. Storage layout

Slots are `BeaconProxy` instances sharing one implementation, so layout is
strictly append-only. Verified via `forge inspect Slot storageLayout`:

> **Note:** the slot-number comments in `Slot.sol` are wrong from `factory`
> onwards. `factory` is packed at **slot 14 offset 1** (alongside
> `_legacyInitialized`), not slot 15. First free slot is **15**. Fix the comments
> as part of this work.

`PendingUpdate` occupies slots 12–13 and **cannot be extended** — an added field
would collide with slot 14. New pending state goes in a separate appended struct.

| Slot | Field |
| --- | --- |
| 15 | `address occupancyPolicy` (offset 0) + `uint64 epochSeconds` (offset 20) |
| 16 | `uint256 occupiedSince` |
| 17 | `PendingTransfer.buyer` (address, offset 0) + `.effectiveAt` (uint96, offset 20) |
| 18 | `PendingTransfer.deposit` |
| 19 | `PendingTransfer.newPrice` |
| 20 | `PendingTransfer.pricePaid` |
| 21 | `PendingPolicyUpdate { address newPolicy; bool hasPolicyUpdate; }` |
| 22 | `mapping(address => mapping(address => bool)) isOperator` |

`pricePaid` is stored explicitly rather than re-read from `price` at
materialisation. It is redundant today (`selfAssess` is blocked while a transfer
is pending, so `price` cannot move), but recording what the buyer actually paid
keeps the refund correct if that ordering is ever changed.

`occupiedSince` is written in both paths: at materialisation when
`epochSeconds > 0`, and inline in `buy()` when `epochSeconds == 0`.

`occupancyPolicy` and `epochSeconds` share a slot because both are read on the
`buy()` hot path.

### 6. Initialisation and factory

- `initializeV3(uint64 epochSeconds, address occupancyPolicy)` as `reinitializer(3)`.
- `SlotInitParams` is **not** extended — adding a field changes the tuple signature
  and therefore the `createSlot` selector, breaking every published ABI. Instead:
  `createSlotV3(...)` takes the extra params and calls `initialize` +
  `initializeV2` + `initializeV3`. Existing `createSlot` keeps working and defaults
  both new values to zero.
- Existing slots: `occupancyPolicy = 0`, `epochSeconds = 0`, `occupiedSince = 0`.
  Behaviour is unchanged without any migration. A manager may attach a policy later
  via the pending-update path.
- `occupiedSince == 0` on a legacy occupied slot means "unknown". Policies must
  treat it as *unprotected* (fail-open) rather than infinitely protected.

## Reference modules

### `MinimumTenurePolicy`

"You cannot be bought out for N seconds after acquiring the slot."

Stateless singleton with an immutable `tenureSeconds`. Deploy
`MinimumTenurePolicy(7 days)` once; any number of slots point at it. Configuration
lives in the address itself — no per-slot storage, no trust surface.

```solidity
function checkBuy(OccupancyContext calldata ctx) external view {
    if (ctx.occupant == address(0)) return;      // vacant — always claimable
    if (ctx.occupiedSince == 0) return;          // legacy slot — unprotected
    uint256 availableAt = ctx.occupiedSince + tenureSeconds;
    if (block.timestamp < availableAt) revert TenureNotElapsed(availableAt);
}
```

Two conditions, or the tenure leaks value:

1. **Pre-pay the protection.** `checkBuy` requires `ctx.depositAmount` to cover the
   full tenure at the declared price:
   `depositAmount >= newPrice * taxPercentage * tenureSeconds / (MONTH * BASIS_POINTS)`.
   You buy your safety; you are not given it.
2. **No price cuts while protected.** `checkPriceUpdate` rejects
   `newPrice < currentPrice` inside the window. Without this, the occupant declares
   high, then drops to dust on day 1 knowing nobody can take it, and pays almost
   nothing for the whole window. This is the hole that makes minimum tenure unsound
   if you only gate `buy`.

Liquidation still works throughout — insolvency ends tenure.

### `QueueExclusivityPolicy` + `SlotQueue`

Alice occupies at $100. Bob's agent queues a bid at $80. When Alice leaves or is
liquidated, Bob takes over at his own self-assessed $80.

This is not an auction: Bob declares *his own* valuation for *his own* future
occupancy. Nobody bids against Alice at Alice's price. It also strictly improves
Alice's options — her alternative was `release()` for **zero**, so $80 is better.
**The queue turns a release into a sale.**

Split into two contracts:

- **`SlotQueue`** (peripheral) — holds Bob's escrowed `price + deposit` in its own
  balance. Exposes `joinQueue`, `cancel` (before fill), and a **permissionless
  `fill()`** that calls `slot.buy(bob, deposit, price)` once the slot is vacant.
  Bids carry an expiry. `fill()` pays a small tip from Bob's escrow so a keeper has
  a reason to call it — the same incentive shape `liquidationBountyBps` already
  uses for liquidation.
- **`QueueExclusivityPolicy`** (veto) — one rule: while the queue is non-empty,
  only the queue contract may call `buy()`. Without it, anyone front-runs the
  instant the slot frees and Bob's position is worthless. **Empty queue must fall
  through to open access** (invariant 3).

**Ordering is FIFO.** Price-ranked ordering would make it an auction.

**Filling cannot happen inside `release()` or `liquidate()`.** Both are
`nonReentrant`, so the queue cannot call `buy()` back into the slot from a hook.
This is deliberate and should not be worked around by allowlisting re-entrant
callers: that would work today only because of the current line ordering in
`release()`, resting on an invisible "all state final before the notify" rule that
will not survive a refactor — and an allowlist needs an owner, who then holds a rug
vector over every slot. Instead, sequence at the caller: Alice batches
`slot.release()` then `queue.fill()` in one transaction via a router or smart
wallet. `release()` completes fully before `fill()` begins, so no guard trips.

The general rule: **does it change money, auth, or time? → core. Is it just
sequencing existing calls? → router.** Reentrancy is not a composition tool.

## Impact on existing surface

| Area | Impact |
| --- | --- |
| `buy()` | +policy check; +schedule branch when `epochSeconds > 0` |
| `selfAssess()` | +policy check; +blocked while transfer pending; +operator allowed |
| `release()` / `liquidate()` | Unchanged semantics; inherit two-legged `_settle()` |
| `topUp()` | Unchanged (already permissionless) |
| `withdraw()` | Unchanged (occupant-only) |
| `_settle()` | **Materially changed** — two-legged. Highest-risk change in the spec |
| `occupant/price/deposit` getters | `public` → `private` + hand-written resolving views. ABI identical |
| `getSlotInfo()` | Append pending-transfer + policy + epoch fields |
| `SlotFactory` | +`createSlotV3`; purity labelling on the existing registry |
| ABIs / indexers | `packages/contracts`, `packages/ponder`, `packages/subgraph` regenerate + republish |
| `Bought` event | Now emitted at *materialisation*, so a different tx than the buyer's. Args are unchanged and contain no `msg.sender`, so indexers stay correct |
| New event | `TransferScheduled(buyer, effectiveAt, price, deposit)` |

## Testing

**Regression is the primary gate.** Every existing test in `Slot.t.sol`,
`MetadataModule.t.sol`, and `BatchCollect.t.sol` must pass **unmodified** with
`occupancyPolicy = 0` and `epochSeconds = 0`. That is the contract for "works as
it does now without an occupancy module".

New coverage:

- **Epoch** — transfer materialises lazily; two-legged tax equals continuous tax
  across a boundary (fuzz); second commit reverts; `selfAssess` blocked while
  pending; release/liquidate before the boundary leaves the slot vacant and the
  transfer still lands.
- **Stale getters** — after `effectiveAt` and before any write, `occupant()`
  returns the *new* occupant; `MetadataModule` rejects the outgoing occupant.
- **Minimum tenure** — buy blocked inside the window, allowed after; underfunded
  buy rejected; price cut rejected inside the window; `liquidate()` succeeds inside
  the window.
- **Queue** — fill after release and after liquidation; front-run blocked while
  non-empty; **empty queue does not freeze the slot**; expired bid cannot fill.
- **Operator** — operator may `selfAssess`/`topUp`, may not `withdraw`/`release`.
- **Upgrade** — deploy a slot on the current implementation, occupy it, upgrade the
  beacon, assert state is intact and behaviour unchanged.

## Suggested sequencing

This decomposes into three independently landable stages, each shippable on its
own beacon upgrade:

1. **Veto layer** — `IOccupancyPolicy`, the two hook call sites, `occupiedSince`,
   pending policy updates, and `MinimumTenurePolicy`. Small, self-contained, no
   settlement changes.
2. **Epochs** — `epochSeconds`, `PendingTransfer`, two-legged `_settle()`, and the
   stale-getter fix. Highest risk; deserves its own upgrade and its own audit pass.
3. **Delegation + queue** — operator approval, `SlotQueue`, `QueueExclusivityPolicy`.

Stage 2 is where the real risk lives. Stages 1 and 3 are additive; stage 2 rewrites
the accounting path every other feature depends on.

## Out of scope

- **Auction occupancy.** Crosses the price-setting line. Not expressible through
  this interface, by design.
- **Externalised economic policy.** Named as a layer, extraction deferred.
- **Lease with early-exit penalty.** A penalty means taking the occupant's funds,
  which violates invariant 2. Would need its own design.
- **Reentrancy allowlisting.** Rejected above; use caller-side batching.
