# 0xSlots Token Launcher

> Harberger-priced token launches. Fair, continuous, bot-proof.

## The Problem

Token launches are broken:
- **Bots snipe** the first blocks, retail never gets fair entry
- **Whitelists** concentrate allocation among insiders
- **Bonding curves** (pump.fun) are first-come-first-serve — speed wins, not conviction
- **Dev allocations** are free — zero cost to hold, zero accountability
- Dead wallets hog early positions forever

## The Idea

Replace first-come-first-serve with **Harberger-priced positions**.

A token launch is a **Land**. Each **Slot** in that land represents a position on the launch curve — an allocation of tokens at a given price tier.

To hold a slot, you:
1. **Self-assess its value** — what you think that launch position is worth
2. **Pay continuous tax** on that value via Superfluid streams
3. **Accept that anyone can take it** by paying your self-assessed price

If you underprice your position (trying to pay less tax), someone buys it from under you. If you overprice it (to make it untakeable), you bleed tax. The market finds the honest price.

## How It Works

### Pre-Launch Phase

```
Land: $MEME Token Launch
├── Slot 0: Tier 1 allocation (earliest, cheapest entry)
├── Slot 1: Tier 2 allocation
├── Slot 2: Tier 3 allocation
├── Slot 3: Tier 4 allocation
├── Slot 4: Tier 5 allocation
└── Slot 5: Tier 6 allocation (latest, most expensive entry)
```

1. **Creator opens a Land** — defines the token, number of slots, allocation per slot
2. **Participants claim slots** — set their self-assessed value, tax stream begins
3. **Market churns** — people outbid each other for better positions. Every takeover pays the previous holder their self-assessed price.
4. **Tax accumulates** — streaming tax from all slot holders flows to the token treasury

During this phase, there is no token yet. The slots ARE the presale. The market is pricing hype, conviction, and expected value — in real time, continuously.

### Launch Phase

When the creator triggers launch:
1. Token is deployed (or an existing token is distributed)
2. Each slot holder receives their allocation proportional to their tier
3. Slots can optionally remain active (for ongoing LP positions, governance weight, etc.)
4. Treasury (accumulated tax) funds initial liquidity or development

### Post-Launch (Optional)

Slots can persist as ongoing positions:
- **LP range slots** — hold a Uniswap V3-style range, pay tax to keep it
- **Governance weight** — slot value = voting power, taxed continuously
- **Revenue share** — slot holders receive protocol fees proportional to their tier

## Architecture

### Contracts

Built on existing 0xSlots primitives — no new contracts needed for the core flow:

```
SlotsHub (existing)
├── openLand() → creates a new token launch
│   └── Land contract (Slots.sol)
│       ├── Slot 0..N with Harberger pricing
│       ├── Tax streams via Superfluid
│       └── Module: TokenLauncherModule (new)
│
TokenLauncherModule.sol (new)
├── setTokenConfig(land, tokenName, symbol, totalSupply, allocationPerSlot[])
├── launch(land) → deploys token, distributes to slot holders
├── claimAllocation(land, slotId) → slot holder claims their tokens
└── withdrawTreasury(land) → creator withdraws accumulated tax
```

### TokenLauncherModule

A new **module** (0xSlots is module-based) that attaches token launch logic to any land:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IModule} from "../interfaces/IModule.sol";

struct LaunchConfig {
    string name;
    string symbol;
    uint256 totalSupply;
    uint256[] allocationPerSlot;  // tokens per slot tier
    uint256 launchTimestamp;       // 0 = manual trigger
    address creator;
}

struct LaunchState {
    address token;                 // deployed token address (set at launch)
    bool launched;
    uint256 treasuryAccumulated;
    mapping(uint256 => bool) claimed; // slotId => claimed
}
```

### Flow

```
Creator                    Participant               Contract
   │                           │                        │
   ├── openLand(6 slots) ─────┼───────────────────────>│
   ├── setTokenConfig() ──────┼───────────────────────>│
   │                           │                        │
   │                           ├── claimSlot(0, 100$) ─>│ ← tax stream starts
   │                           ├── claimSlot(2, 50$) ──>│ ← tax stream starts
   │                           │                        │
   │                     [someone outbids slot 0]       │
   │                           │                        │
   │                           ├── buySlot(0, 200$) ───>│ ← pays 100$ to prev holder
   │                           │                        │   new tax stream at 200$
   │                           │                        │
   ├── launch() ──────────────┼───────────────────────>│ ← deploys token
   │                           │                        │   snapshots slot holders
   │                           │                        │
   │                           ├── claimAllocation() ──>│ ← receives tokens
   │                           │                        │
   ├── withdrawTreasury() ────┼───────────────────────>│ ← gets accumulated tax
```

## Why It's Better

| | pump.fun | Whitelists | 0xSlots Launcher |
|---|---|---|---|
| **Bot resistance** | ❌ Bots win | ✅ Manual | ✅ Harberger pricing |
| **Price discovery** | Post-launch only | None | Pre-launch, continuous |
| **Treasury funding** | Buy fees only | None | Streaming tax pre-launch |
| **Position fairness** | Speed wins | Connections win | Conviction wins |
| **Idle positions** | Dead wallets forever | N/A | Taken over if underpriced |
| **Dev accountability** | Zero | Zero | Dev pays tax on their allocation |

### The Dev Accountability Angle

The creator can reserve slots for themselves (dev allocation). But those slots follow the same rules:
- Self-assess the value of your own allocation
- Pay continuous tax on it
- If you think your own token is worthless (low assessment), anyone can buy your allocation cheap

**First memecoin where the dev literally can't hold a free allocation.** Their skin in the game is visible and continuous.

## Economics

### Tax Rate
- Configurable per land (default: 1% annual, max: 10%)
- Tax streams via Superfluid — per-second, no claiming/epochs
- Tax recipient: configurable (treasury, LP, burn, DAO)

### Takeover Mechanics
- Buyer pays seller's self-assessed price
- New tax stream begins at buyer's new assessment
- Old stream is cancelled atomically
- No front-running possible — price is always honest or costly

### Example Scenario

```
$FAIR token launch — 6 slots, 1M tokens total

Slot 0: 250,000 tokens (earliest tier)
Slot 1: 200,000 tokens
Slot 2: 175,000 tokens
Slot 3: 150,000 tokens
Slot 4: 125,000 tokens
Slot 5: 100,000 tokens

Tax rate: 5% annual
Currency: kUSDx (streaming stablecoin)

Pre-launch period: 7 days

Day 1: Alice claims Slot 0, self-assesses at $500
  → Pays ~$0.07/day in tax
  → Total cost to hold 7 days: ~$0.48

Day 3: Bob thinks $FAIR will moon. Buys Slot 0 for $500 (Alice's price).
  → Alice gets $500 back
  → Bob re-assesses at $2,000
  → Pays ~$0.27/day in tax

Day 5: Carol is a whale. Buys Slot 0 for $2,000.
  → Bob gets $2,000 (4x his purchase in 2 days)
  → Carol assesses at $5,000
  → Pays ~$0.68/day

Day 7: Launch triggers.
  → Carol holds Slot 0, receives 250,000 $FAIR tokens
  → Treasury accumulated ~$15 in tax across all slots
  → Treasury seeds initial liquidity

Result: The market priced Slot 0 at $5,000 for 250K tokens = $0.02/token
implied pre-launch valuation. That's real price discovery.
```

## Implementation Plan

### Phase 1: Core Module (MVP)
- [ ] `TokenLauncherModule.sol` — config, launch, claim
- [ ] Simple ERC-20 deployment on launch
- [ ] Fixed allocation per slot (set at creation)
- [ ] Manual launch trigger by creator
- [ ] Tax → creator wallet

### Phase 2: Enhanced Launch
- [ ] Timed launches (auto-trigger at timestamp)
- [ ] Custom token integration (existing tokens, not just new deploys)
- [ ] Allocation curves (exponential, linear, custom)
- [ ] Tax → LP seeding (auto-create Uniswap pool)

### Phase 3: Post-Launch Persistence
- [ ] Slots become LP positions after launch
- [ ] Ongoing tax → protocol revenue
- [ ] Governance weight from slot value
- [ ] Secondary market for launch positions

### Phase 4: Composability
- [ ] Integration with existing launchpads (as a fair allocation layer)
- [ ] Cross-chain launches
- [ ] DAO-governed launch parameters
- [ ] AI agent participation (autonomous launch bidding)

## Open Questions

1. **What currency for tax?** Stablecoin (kUSDx) makes pricing intuitive. Native token creates circular dynamics (interesting but complex).
2. **Minimum hold period?** Should there be a cooldown to prevent rapid flipping? Or let the market be fully liquid?
3. **Refund on launch?** If someone holds a slot at launch but doesn't want the tokens, can they exit? Or is holding = commitment?
4. **Multiple slots per address?** Allow or restrict? Allowing = whales can corner the launch. Restricting = sybil problem.
5. **What happens to unsold slots?** Tokens go to treasury? Burn? Remain claimable post-launch?
