# 0xSlots UX — The Seat Mental Model

## The Problem

"Self-assessed tax" is an economics paper, not a product. Nobody wakes up wanting to "self-assess." People understand: renting, holding, competing, losing.

---

## Reframe: Slots as "Seats"

Don't call them slots. Call them **seats**. A seat at a table, a seat in a venue, a parking spot. Physical metaphor everyone gets.

> "You hold a seat. You set the price. You pay monthly rent based on that price. Anyone can take your seat by paying your price. When your prepaid balance runs out, you lose it."

That's it. That's the whole thing.

---

## Vocabulary

| Protocol Term | Human Term |
|---|---|
| Slot | Seat |
| Self-assessed price | Your asking price / your price |
| Tax rate / bps | Monthly rent / holding cost |
| Deposit | Prepaid balance / time remaining |
| Liquidation | Seat expires / time's up |
| Insolvent | Expired (red badge) |
| Force buy | Take this seat |
| Occupant | Holder |
| Recipient | Creator / owner |
| Release | Leave seat |

---

## The 3 Screens

### 1. Browse Seats

A grid or list. Each seat shows:

- Who's sitting (avatar or address)
- Their **asking price**
- The **monthly rent** (computed, not raw bps)
- A module badge if it does something (Metadata, Ad, etc.)

Empty seats: **"Free — claim it"**

No deposit amounts. No liquidation timers. No bps. Just: who, how much, what it costs to hold.

### 2. Claim / Take a Seat

Two flows, one screen:

**Empty seat:**

> "This seat is free. Set your asking price and prepay rent."
>
> - **Your price:** [input] — "If someone wants this seat, they pay you this"
> - **Prepay:** [slider] — "How long do you want to hold it?" Shows "~3 months" / "~1 year" instead of raw token amounts
> - Monthly rent auto-calculated: "0.50 USDC/mo"
> - **[Claim Seat]**

**Occupied seat:**

> "This seat belongs to [avatar]. Their asking price is 10 USDC."
>
> - **[Take it for 10 USDC]** — single button, one concept
> - Expands: "Set your new price and prepay rent"
> - Same price + prepay slider

The key: **"Take it for X"** is one concept. Not "force buy." Not "purchase at self-assessed price."

### 3. Your Seat (when you hold one)

Dashboard feel:

> **Your asking price:** 10 USDC [Change]
> **Monthly rent:** 0.50 USDC
> **Prepaid until:** Aug 2026 (~5 months)
> **Balance:** 2.50 USDC remaining
>
> [Add more time] — not "deposit"
> [Leave seat] — not "release"

The "change price" interaction shows the tradeoff:

> "Raise your price → harder to take, but rent goes up"
> "Lower your price → cheaper to hold, but easier to take"

Visual balance — seesaw or slider bar. Left: "Protection." Right: "Cost." Moving the price moves both.

---

## Multicall UX

Current: multiple transactions for basic actions. With multicall on the Slot contract:

- **Claim** = approve + buy → 1 tx
- **Top up** = approve + deposit → 1 tx
- **Adjust** = selfAssess + withdraw/deposit → 1 tx

The "adjust" combo is the big win. Changing your price and rebalancing your deposit should be one gesture:

> "I want to hold this seat at a new price for X more months" → one tx

---

## Notifications

The scariest part is surprise loss. Someone takes your seat while you sleep.

- "Your seat expires in 7 days — add more time"
- "Your seat was taken by [address] — you received 10 USDC"

Being bought out should feel like **getting paid**, not losing something. The UX should celebrate: "You just earned 10 USDC 🎉"

---

## The Manage Tab (for creators)

Creators setting up seats understand what they're doing. Keep it more technical, but still:

- "Tax rate" → "Monthly cost: X% of asking price"
- Show a concrete example: "If holder sets price to 100 USDC, they pay X USDC/month"
- Module picker stays as-is

---

## Summary

**Before:** "You own a Harberger-taxed slot with a self-assessed price, continuous tax accrual, deposit-based escrow, and permissionless liquidation."

**After:** "You hold a seat. You set the price. You pay rent. Anyone can take it by paying your price. When your balance runs out, you lose it."

Same mechanism. Human words.
