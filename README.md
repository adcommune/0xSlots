# 0xSlots

![0xSlots Banner](apps/landing/public/banner.png)

**Perpetual Onchain Slots** — Harberger tax mechanics on Ethereum with Superfluid streaming.

Every slot has a price. Holders self-assess and pay continuous tax. Anyone can buy any slot at the posted price. Resources flow to whoever values them most.

## How it works

1. **Self-assessment** — Slot holders set their own price
2. **Continuous tax** — Pay tax proportional to your price via [Superfluid](https://superfluid.finance) streams
3. **Always for sale** — Anyone can buy at the posted price, instantly
4. **No squatting** — Holding costs money, so only active users hold slots

## Architecture

```
Layer 1: Slot Primitive
├── Harberger.sol          — ERC-721 slots with self-assessed pricing
├── HarbergerHub.sol       — Factory & governance (UUPS upgradeable)
└── HarbergerStreamSuperApp.sol — Superfluid tax streaming

Layer 2: Modules
├── IHarbergerModule       — Interface for pluggable modules
├── MetadataModule          — Content/metadata for slots
└── Your Module             — Build anything on top
```

## Use cases

- **Onchain ads** — Ad slots priced by the market, not ad networks
- **AI agent resources** — Compute, API access, bandwidth allocation
- **Domain names** — Prevent squatting through continuous cost
- **Protocol positions** — Validator slots, oracle seats, governance
- **Digital real estate** — Virtual land, metaverse plots
- **Spectrum & bandwidth** — Scarce network resource allocation

## Monorepo

```
apps/
  landing/    — Website (Next.js 15)
  contracts/  — Solidity contracts (Foundry)
```

## Development

```bash
pnpm install

# Landing page
pnpm --filter landing dev

# Contracts
cd apps/contracts
forge install
forge build
forge test
```

## Deployment

Deploy to Arbitrum, Base, and Optimism mainnets:

```bash
cd apps/contracts

# Set environment variables
export PK=<your-private-key>
export ALCHEMY_KEY=<your-alchemy-key>

# Deploy to all chains
./script/deploy-multichain.sh

# Or deploy to a specific chain
./script/deploy-multichain.sh arbitrum
./script/deploy-multichain.sh base
./script/deploy-multichain.sh optimism
```

## Security

- [Security Audit (2026-02-08)](apps/contracts/Audit/2026-02-08-k-security-audit.md)

## Built with

Superfluid · ERC-721 · Foundry · Solidity · OpenZeppelin

## Links

- [Website](https://0xslots.vercel.app)
- [GitHub](https://github.com/adcommune/0xSlots)

---

*by [adcommune](https://github.com/adcommune)*
