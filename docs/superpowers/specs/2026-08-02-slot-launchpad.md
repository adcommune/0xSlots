# Slot Launchpad — design draft

**Status:** draft, not built. The protocol dependency (`onSettle` / `TaxPaid`) is
implemented and tested; everything below is design.

## What it is

A raise where **allocation is bought with rent, not with a single purchase**.

A project opens N slots. Participants take slots, self-assess a price, and pay
continuous Harberger tax. That tax *is* the raise — it flows to an escrow. When
the raise closes, token supply is distributed in proportion to tax paid, and the
escrowed funds seed liquidity.

The property that makes it different from every other launch mechanism: **you can
be displaced at any moment, so you have to keep your declared price honest for
the whole raise**, not just at the instant you commit.

|                  | price discovery | continuous | limited positions |
|------------------|-----------------|------------|-------------------|
| Fixed-price sale | no              | no         | no                |
| Dutch auction    | yes             | no         | no                |
| Bonding curve    | yes             | yes        | no                |
| **This**         | **yes**         | **yes**    | **yes**           |

## The one rule that must not be got wrong

**Allocation is proportional to tax PAID, never to time held.**

Tax is `price × rate × time` and price is self-assessed. Weighting by time alone
means the optimal play is to declare the lowest defensible price, sit still, and
collect a full allocation for almost nothing. The Harberger forced-sale defence
does not save you: when a slot's only value is its allocation, everyone lowballs
symmetrically and nobody has a reason to buy anyone out.

Weighting by tax paid collapses the exploit — your share of supply is your share
of the money — while keeping what makes the mechanism interesting: a bounded
number of contested seats.

### And "paid", not "owed"

`Slot._accrue` caps the charge at the remaining deposit:

```solidity
if (owed >= _deposit) { paid = _deposit; ... } else { paid = owed; ... }
```

So a huge self-assessed price with a tiny deposit accrues an enormous `owed`
while only ever paying the deposit. Any allocation computed from `price × time`
reconstructs `owed` and hands that address a large share of supply for almost no
money. This is the single most dangerous mistake available in this design, and it
is why `TaxPaid` carries both numbers — `taxPaid` is the accounting truth,
`taxOwed - taxPaid` is a distress signal.

Covered by `test_Insolvent_PaidIsCappedByDeposit_OwedIsNot`.

## Give the seats utility

As specified, a slot's only worth is the allocation it accrues, which makes the
self-assessed price circular: you are pricing a claim on a token whose value
depends on what everyone declared. That will not necessarily break, but the price
signal is weak and sophisticated participants will notice.

Attach something concrete to occupancy — a listed sponsor position, a role at
launch, a governance seat — so the declared price has a non-reflexive anchor.

## Architecture

```
ProjectFactory ──creates──> Project
                              │
                              ├── N × Slot (recipient = Escrow, module = Ledger)
                              ├── Escrow      (holds the raise, refunds, funds launch)
                              ├── Ledger      (ISlotsModule, reads onSettle)
                              └── Launcher    (Clanker adapter | custom)
```

### Slot configuration, fixed at creation

| Setting | Value | Why |
|---|---|---|
| `recipient` | the Escrow | tax flows straight into the raise |
| `module` | the Ledger | receives `onSettle` |
| `mutableTax` | **false** | a manager changing the rate mid-raise silently rescales everyone's accrual |
| `mutableModule` | **false** | swapping the ledger mid-raise breaks the accounting |
| `occupancyPolicy` | MinimumTenure | a participant sniped seconds after buying is a terrible experience |
| `minDepositSeconds` | > 0 | forces a real deposit, so declared prices are backed |

Tiers are just slots with different `taxPercentage`: a higher-tax seat accrues
allocation faster and costs more to defend.

### Ledger: authoritative source is the event, not the hook

`Slot._notifyModule` is gas-capped at 500k and swallows failures. A module that
reverts or runs out of gas **silently loses a contribution**, and the participant
gets no revert telling them.

So: the on-chain `Ledger` is a convenience mirror. The authoritative allocation is
computed off-chain by reducing `TaxPaid` events (which always emit, regardless of
module outcome) and committed as a **merkle root** at launch. This is also how
real launchpads do it, and it avoids introducing a module class that can brick a
slot.

```
allocation[addr] = supply × Σ TaxPaid(addr).taxPaid / Σ all TaxPaid.taxPaid
```

### Escrow state machine

```
        ┌──────────┐  deadline reached, soft cap met   ┌──────────┐
        │  OPEN    │ ────────────────────────────────> │  CLOSED  │
        └──────────┘                                   └──────────┘
             │                                              │
             │ deadline reached, soft cap MISSED            │ launch()
             v                                              v
        ┌──────────┐                                   ┌──────────┐
        │ REFUND   │                                   │ LAUNCHED │
        └──────────┘                                   └──────────┘
```

Non-negotiable properties, because this is where launchpads fail:

- Escrowed funds can **only** move to the Launcher or to refunds. There is no
  path to the project owner.
- Launch parameters (supply, LP split, vesting, launcher address) are **fixed at
  project creation**, not chosen after the money is in.
- If `launch()` is not called within a grace period after CLOSED, anyone can move
  the escrow to REFUND. The owner cannot sit on the funds.
- Refund is pull-based and permissionless per claimant.

## Known gaps to resolve before building

1. **Sweep before close.** Tax accrues into each slot's `collectedTax` and only
   reaches the Escrow on `collect()`. Every slot must be swept before the
   deadline or the funds are stranded mid-flight. There is a `BatchCollector`
   deployed already. The raise's final accounting must be a defined,
   permissionless settlement step — not "whoever called collect() last".

2. **Unspent deposit is not a contribution.** Deposits are refundable on release,
   so a participant's contribution is only what has been *consumed*. At close,
   occupants still hold unspent deposits. Correct, but it means participants need
   to understand that topping up is not the same as contributing.

3. **Module fee is gross/net.** `feeBps` is skimmed in `_distributeTax` at
   collect time, so `TaxPaid.taxPaid` is gross and the Escrow receives less. Set
   the Ledger's `feeBps` to 0, or the sum of allocations will not match the money
   actually raised.

4. **Currency.** 0xSlots is ERC-20 denominated. An "ETH raise" means WETH, or a
   wrap layer at the edges.

5. **`onSettle` fires mid-transaction.** Unlike the other module hooks, it is
   called from `_accrue` inside `_settle()` — the slot is in its pre-operation
   state. `nonReentrant` blocks reentry into the same slot, but the Ledger must
   not assume it can read settled state.

## The thing to be honest about

Contributors send money and receive tokens proportional to what they sent, at a
time chosen by a project owner. The Harberger wrapper is novel; the substance is
a token sale. Decide deliberately how to handle that rather than discovering it
later.
