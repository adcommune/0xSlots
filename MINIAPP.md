# 0xSlots Miniapp — Ad Slot + Coin + Tax Distribution

## Concept

A Farcaster miniapp showcasing a single Harberger-taxed ad slot. The slot currency is a miniapp-specific coin launched alongside the frame. Tax revenue is redistributed to people who view/share the frame, making distribution itself profitable.

## Components

### 1. Miniapp Coin
- Launch via Clanker on Farcaster, same moment the frame goes live
- Used as the slot currency (buy, deposit, tax all denominated in the coin)
- No protocol utility beyond this miniapp — pure attention play

### 2. The Frame
- Single ad slot displayed in a Farcaster miniapp
- Anyone can buy the slot (pays current price + deposit in miniapp coin)
- Occupant controls the ad content (image, title, link)
- Tax accrues continuously based on self-assessed price

### 3. Tax Distribution
- Slot recipient = a 0xSplits Split contract
- Tax collected → flows to the split → distributed to participants
- Split weights updated periodically based on frame engagement

## Tax Distribution System

### Architecture

```
Frame interaction → API logs viewer (fid, address, timestamp)
                          ↓
                  Cron job (hourly or daily)
                          ↓
              computeWeights() → [{address, weight}]
                          ↓
              updateSplit(recipients, weights)
                          ↓
          Tax flows to split → distributed to participants
```

### Tracking

Every miniapp interaction provides the viewer's FID for free (Farcaster context). The API logs:

- `fid` — Farcaster user ID
- `address` — connected wallet
- `timestamp` — when
- `action` — view, share, referral, etc.

### Weight Computation

Single function that returns a list of addresses with weights that add up to 100:

```ts
type Recipient = { address: string; weight: number };

function computeWeights(
  interactions: { address: string; count: number }[]
): Recipient[] {
  const total = interactions.reduce((s, i) => s + i.count, 0);
  return interactions
    .map(i => ({
      address: i.address,
      weight: Math.floor((i.count / total) * 100)
    }))
    .filter(r => r.weight > 0);
}
```

Weight formula can evolve:
- **v0:** Equal weight per unique viewer
- **v1:** Weighted by number of views
- **v2:** Weighted by referral attribution (buys from your share)
- **v3:** Decay over time (recent engagement > stale)

### On-chain

Only one on-chain action: `split.updateSplit(addresses, percentages)` called by the cron. Everything else is off-chain.

## Flywheel

```
Coin launches → people buy coin
        ↓
Someone buys the ad slot (pays in coin)
        ↓
Tax accrues → flows to split
        ↓
Split distributes to frame viewers/sharers
        ↓
More people share frame (to earn tax share)
        ↓
More eyeballs → slot worth more → higher price → more tax
        ↓
More tax → more rewards → more sharing → repeat
```

## Launch Sequence

1. Deploy slot with split as recipient (coin TBD as currency)
2. Launch coin via Clanker
3. Set slot currency to the coin
4. Ship miniapp frame
5. Start distribution cron

## Open Questions

- Weight formula: what behavior do we reward most?
- Cron frequency: hourly vs daily split updates (gas cost vs freshness)
- Anti-gaming: sybil resistance for frame views?
- Split size limit: 0xSplits has a max recipients cap — need a cutoff strategy
- Should there be a minimum weight threshold to be in the split?
