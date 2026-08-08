# Native ETH slots — design

**Date:** 2026-08-08
**Status:** Draft, pending review
**Scope:** `apps/contracts` (`Slot.sol`, `MinimumPricePolicyFactory.sol`; deletes `SlotsRouter.sol` + `IPermit2.sol`)
**Builds on:** [V3_SPEC.md](../../V3_SPEC.md), [occupancy policies design](2026-07-29-occupancy-policies-design.md)

## Goal

Let a slot denominate its market in native ETH instead of an ERC-20, selected at
creation time via `currency == address(0)`.

The motivation is onboarding friction. Every value movement in a Harberger slot
market — buy, top-up, eviction refund — currently requires an ERC-20 allowance.
Deposits are topped up continuously and refunds fire on every eviction, so the
approval tax is paid over and over rather than once. On Base, ETH is also simply
what people hold. Native support removes `approve()` from the funnel entirely.

It also removes a reason for periphery to exist: `SlotsRouter` was built to paper
over approval friction with Permit2, and `msg.value` is already single-transaction.

## Preconditions that make this cheap

Four properties of the current codebase, each verified, keep this change small:

1. **Only five value-moving sites exist in `Slot.sol`** — lines 245 and 379
   (inbound `safeTransferFrom`), 395 and 466 (outbound `safeTransfer`), and
   `_payOrCredit` at 784–800.
2. **Nothing anywhere introspects token balance or decimals.** No `balanceOf`,
   no `decimals()` in `Slot.sol`, `SlotFactory.sol` or `src/policies/`. So no
   code path assumes a token contract exists.
3. **`address(0)` is already a rejected value.** `Slot.sol:157` reverts
   `InvalidCurrency` on it, so no deployed slot can be holding it. That is what
   makes it a sound sentinel rather than an ambiguous one.
4. **Neither factory validates currency** — `SlotFactory` passes it straight
   through to `initialize`.

There is no live TVL and there are no users, so the beacon upgrade carries no
migration risk.

## Non-goals

- `ERC721Slots` is not in scope. It passes `currency` through unvalidated
  (`ERC721Slots.sol:91`) and moves no value itself, so it is not *blocked* by
  this change — it simply will not be tested or documented as ETH-capable.
- No WETH wrapper, no swap helper, no periphery replacement for `SlotsRouter`.
- No change to tax, occupancy, policy or utility semantics. This is a currency
  change only.
- The ETH-denominated minting utility discussed alongside this work is a
  separate spec that depends on this one landing first.

## Design

### 1. The sentinel

`currency == IERC20(address(0))` means native ETH. **No new storage field.**
Slots are `BeaconProxy` (`SlotFactory.sol:329-331`), so a layout-neutral change
is what keeps the upgrade safe: every existing slot takes a branch provably
identical to today's code.

An internal helper carries the branch so it reads the same at every site:

```solidity
function _isNative() internal view returns (bool) {
    return address(currency) == address(0);
}
```

`Slot.sol:157` is replaced rather than deleted. Today a *codeless non-zero*
address passes validation, which is a latent bug; the replacement closes it
while opening the sentinel:

```solidity
if (address(_currency) != address(0) && address(_currency).code.length == 0)
    revert InvalidCurrency();
```

### 2. Inbound — `buy` and `topUp` become payable

These are the only two entry points that receive value. Every other external
function stays non-payable and therefore auto-reverts on stray ETH; no explicit
guard is needed on them.

Both enforce exact value in both directions, via a new `InvalidValue()` error:

- **native**: `msg.value` must equal the expected amount
- **ERC-20**: `msg.value` must be `0`

The ERC-20 direction is not decoration — it is what stops ETH being stranded in
a token-denominated slot.

The ERC-20 guard fails fast at function entry, since it needs no computed
amount:

```solidity
if (!_isNative() && msg.value != 0) revert InvalidValue();
```

The native check cannot happen that early in `buy`, because the expected amount
is `owedByBuyer`, computed at `Slot.sol:241-243` only after `_settle()`, the
policy check and `_applyPendingUpdates()` (it is `depositAmount` on a vacant
slot, `currentPrice + depositAmount` otherwise). So it sits at that point,
replacing the `safeTransferFrom` at 245:

```solidity
if (_isNative()) {
    if (msg.value != owedByBuyer) revert InvalidValue();   // value already held
} else if (owedByBuyer > 0) {
    currency.safeTransferFrom(msg.sender, address(this), owedByBuyer);
}
```

`topUp` takes the same shape, and can do both checks at entry since its expected
amount is the `amount` parameter.

New errors are declared in `Slot.sol` alongside the existing ones at lines 34–52;
note that *events* live in `ISlot.sol` instead, so no event changes are needed.

Strict equality; excess is rejected rather than refunded. Frontends compute the
exact figure from `price()` and the deposit anyway, and a refund leg would be one
more outbound push handing control to a caller.

**`Slot` gets no `receive()` function, deliberately.** ETH may only enter through
paths that account for it. A bare `receive()` would create contract balance that
no field tracks and would break the invariant in §5.

### 3. Outbound — capped push, uncapped claim

Two tiers, and the layering between them is the point.

**Tier 1 — `_payOrCredit`, gas-capped.** Used for eviction refunds
(`Slot.sol:276`), tax distribution, and the liquidation bounty. These fire inside
someone *else's* transaction, so the recipient must never be able to interfere
with it:

```solidity
function _payOrCredit(address to, uint256 amount) internal {
    if (amount == 0) return;
    bool paid;

    if (_isNative()) {
        // 30k: an EOA needs 2300, a Safe ~20k. Anything greedier
        // falls through to credit rather than burning the caller's gas.
        (paid, ) = to.call{value: amount, gas: 30_000}("");
    } else {
        address token = address(currency);
        if (token.code.length > 0) {
            (bool ok, bytes memory data) = token.call(
                abi.encodeCall(IERC20.transfer, (to, amount))
            );
            paid = ok && (data.length == 0 || abi.decode(data, (bool)));
        }
    }

    if (!paid) {
        withdrawableOf[to] += amount;
        emit RefundCredited(to, amount);
    }
}
```

The ERC-20 branch is byte-identical to today. Note the `token.code.length` guard
must stay *inside* the ERC-20 branch — left in the shared path it would route
every native payment to credit.

Why the cap is required: with an ERC-20, a push cannot run recipient code. With
ETH it can. An outgoing occupant whose `receive()` burns all forwarded gas would
otherwise make eviction expensive and unreliable — the 63/64 rule means a buyer
sending enough gas can usually still complete, so this is griefing rather than a
permanent brick, but it is a real attack on the protocol's core mechanic and the
cap removes it outright. The same cap closes the reentrancy widening, since 30k
buys no meaningful reentrant work.

**Tier 2 — `withdraw()` and `claim()`, full gas, revert on failure.** These are
pull-based and caller-initiated, so a revert affects only the caller. The
recipient is `msg.sender` in `withdraw()` and `account` in `claim()`; both
become:

```solidity
// withdraw() at :395 (recipient msg.sender), claim() at :466 (recipient account)
if (_isNative()) {
    (bool ok, ) = recipient_.call{value: amount}("");
    if (!ok) revert TransferFailed();
} else {
    currency.safeTransfer(recipient_, amount);
}
```

Both already have correct CEI ordering and `nonReentrant`.

**The layering guarantee:** a contract needing 100k gas to receive gets *credited*
during someone else's `buy()` (the 30k cap fails), then claims successfully later
at full gas. The cap degrades delivery; it never destroys it. No recipient can
have funds made permanently unreachable.

### 4. Surrounding contracts

| Contract | Change |
|---|---|
| `Slot.sol` | Five value sites, two payable entry points, `_isNative()`, revised `initialize` validation, `InvalidValue()` + `TransferFailed()` errors |
| `SlotFactory.sol` | None. Passes currency through; `SlotDeployed` takes `address(0)` fine |
| `MinimumPricePolicyFactory.sol` | Relax the `address(0)` rejection at line 51 |
| `MinimumPricePolicy.sol` | None. `_assertCurrency` is pure equality against `Slot.currency()` |
| `SlotsRouter.sol`, `interfaces/IPermit2.sol` | **Delete** |
| `ERC721Slots.sol` | Untouched |

On the policy factory: `MinimumPricePolicy` binds a currency because a bare
integer floor is meaningless without decimals (`100e6` is 100 USDC but a
ten-billionth of an 18-decimal token). `address(0)` denotes 18-decimal ETH
unambiguously, so that rationale is satisfied, not bypassed.

On deleting `SlotsRouter`: nothing in the repository references it or `IPermit2`
except the Foundry build cache — no tests, no deploy scripts, no frontend
imports.

### 5. Invariant

For a native slot, at rest between transactions:

```
address(this).balance == _deposit + collectedTax + Σ withdrawableOf
```

This holds precisely because there is no `receive()`: every wei that enters is
attributed on entry, and every wei that leaves decrements one of the three terms.

## Testing

**Regression is the primary evidence.** The existing suite (~190 test functions,
40 in `Slot.t.sol`) must pass **unchanged**. That is what demonstrates the ERC-20
branch did not drift, and it matters more than any new test here.

New `test/NativeEth.t.sol`:

- **Lifecycle in ETH mode** — `buy`, `topUp`, `withdraw`, `selfAssess`,
  `release`, `liquidate`, `collect`, `claim`, mirroring the ERC-20 cases in
  `Slot.t.sol`.
- **`GasBurner` receiver** (consumes all gas in `receive()`) as the outgoing
  occupant — assert `buy()` **still succeeds**, the refund lands in
  `withdrawableOf`, and `claim()` subsequently delivers at full gas. This is the
  test that justifies the cap.
- **`RevertingReceiver`** — same credit path.
- **Value guards** — ETH sent to an ERC-20 slot reverts; `msg.value` mismatched
  against `owedByBuyer` reverts; `topUp` with wrong value reverts.
- **No stray-ETH path** — a plain `call` with value to a slot reverts (no
  `receive()`).
- **Balance invariant** from §5 asserted after each lifecycle step.
- **Tax attribution in ETH mode** — mirror `TaxAttribution.t.sol` to confirm the
  outgoing occupant is charged for their own tenure, unchanged by currency.
- **`MinimumPricePolicy` on a native slot** — floor enforced, `WrongCurrency`
  still fires when a policy bound to a token is installed on an ETH slot.

## Deployment

Beacon upgrade through the existing `script/UpgradeSlotImplementation.s.sol`.
No storage migration and no data fix-up: the layout is unchanged and live
ERC-20 slots take a branch identical to today's.

`MinimumPricePolicyFactory` is a fresh deploy (it is not proxied); existing
policy instances are unaffected.

## Sequencing

1. Delete `SlotsRouter.sol` + `IPermit2.sol`, confirm the suite still builds and passes.
2. `Slot.sol`: `_isNative()`, `initialize` validation, `InvalidValue()`/`TransferFailed()` errors.
3. `Slot.sol`: outbound tiers (`_payOrCredit`, `withdraw`, `claim`).
4. `Slot.sol`: inbound payable `buy`/`topUp`.
5. `test/NativeEth.t.sol`, including the adversarial receivers.
6. `MinimumPricePolicyFactory` relaxation + its test.
7. Full suite green, then beacon upgrade.

Steps 2–4 are ordered so the contract never sits in a state where ETH can enter
but cannot leave.

## Open question deferred to the utility spec

Once tax is paid in ETH, a utility named as `feeRecipient()` receives a real
`receive()` callback — but with only the 30k from §3, which is far short of a
mint. The consequence (attribution in `onSettle`, balance-driven minting in a
separate call) belongs to that spec, not this one.
