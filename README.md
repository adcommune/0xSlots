# 0xSlots

![0xSlots Banner](banner.png)

**Perpetual Onchain Slots** — Harberger tax mechanics on Ethereum with Superfluid streaming.

Every slot has a price. Holders self-assess and pay continuous tax. Anyone can buy any slot at the posted price. Resources flow to whoever values them most.

## How it works

1. **Self-assessment** — Slot holders set their own price
2. **Continuous tax** — Pay tax proportional to your price via [Superfluid](https://superfluid.finance) streams
3. **Always for sale** — Anyone can buy at the posted price, instantly
4. **No squatting** — Holding costs money, so only active users hold slots

## NPM Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@0xslots/contracts](https://www.npmjs.com/package/@0xslots/contracts) | [![npm version](https://img.shields.io/npm/v/@0xslots/contracts.svg)](https://www.npmjs.com/package/@0xslots/contracts) | Contract ABIs and addresses for use with viem |
| [@0xslots/sdk](https://www.npmjs.com/package/@0xslots/sdk) | [![npm version](https://img.shields.io/npm/v/@0xslots/sdk.svg)](https://www.npmjs.com/package/@0xslots/sdk) | Type-safe SDK for querying subgraph data |

## Deployments

### Arbitrum (42161)

| Contract | Address | Note |
|---|---|---|
| SlotsHub (proxy) | `0x774776d0f693eB7718b67f7938541D5bbB5f92D0` | Main entry point |
| MetadataModule | `0xe96e9105994A8691338eaf0fDc50c02277949521` | Slot metadata |
| Default Currency | [USND](https://www.nerite.org/) | Native Superfluid stablecoin |

### Base Sepolia (84532) — Testnet

| Contract | Address | Note |
|---|---|---|
| SlotsHub (proxy) | `0x268cfaB9ddDdF6A326458Ae79d55592516f382eF` | Main entry point |
| Slots (beacon impl) | Cloned per Land | Created by SlotsHub |
| SlotsStreamSuperApp (beacon impl) | Cloned per Land | Tax distributor |

### Subgraphs

| Network | Endpoint |
|---|---|
| Arbitrum | `https://api.studio.thegraph.com/query/958/0-x-slots-arb/version/latest` |
| Base Sepolia | `https://api.studio.thegraph.com/query/958/0-x-slots-base-sepolia/version/latest` |

## Built with

Superfluid · ERC-721 · Foundry · Solidity · OpenZeppelin · The Graph

## Links

- [Website](https://0xslots.vercel.app)
- [GitHub](https://github.com/adcommune/0xSlots)

---

*by [adcommune](https://github.com/adcommune)*
