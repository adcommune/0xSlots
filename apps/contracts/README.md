# PCO Protocol — Contracts

Foundry-based smart contracts for the Partial Common Ownership protocol.

## Setup

```bash
# Install submodule dependencies (required after cloning)
cd apps/contracts
forge install

# Build
forge build

# Test
forge test
```

> **Note:** The `lib/` directory contains git submodules and is not checked in. You must run `forge install` after cloning to fetch dependencies.

## Architecture

- **Harberger.sol** — Core PCO primitive. Manages slots with self-assessed pricing and continuous Superfluid tax streams.
- **HarbergerHub.sol** — Factory and registry. Deploys Harberger instances, manages allowed modules and currencies.
- **HarbergerStreamSuperApp.sol** — Superfluid Super App that handles tax stream routing and automatic slot release on insufficient flow.

### Layer 1: PCO Primitive

The core protocol is unopinionated about what slots represent. It handles:

- Slot creation with configurable tax rates, currencies, and modules
- Self-assessment: occupants set their own price, pay proportional tax
- Continuous tax streaming via Superfluid CFA (per-second, no epochs)
- Atomic transfers: anyone can buy at the self-assessed price
- Automatic slot release when streams are insufficient

### Layer 2: Modules

Modules implement `IHarbergerModule` and receive callbacks:

- `onTransfer(slotId, from, to)` — when ownership changes
- `onRelease(slotId, previousOccupant)` — when a slot is released
- `onPriceUpdate(slotId, oldPrice, newPrice)` — when price is self-assessed

Example: **AdLand** module adds ad metadata/content management on top of PCO slots.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Slot** | A PCO position within a Harberger instance |
| **Self-assessment** | Occupant sets price; higher price = more tax but harder to buy |
| **Continuous tax** | Streamed per-second via Superfluid CFA |
| **Always for sale** | Anyone can buy at the self-assessed price + protocol fee |
| **Tax distributor** | Super App that routes tax streams to the beneficiary |

## Security

See [Audit/2026-02-08-k-security-audit.md](./Audit/2026-02-08-k-security-audit.md) for the security audit report.

## Dependencies

- [Superfluid Protocol](https://github.com/superfluid-finance/protocol-monorepo)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [OpenZeppelin Upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable)
- [Forge Std](https://github.com/foundry-rs/forge-std)
- [0xSplits](https://github.com/0xSplits/splits-contracts-monorepo)
- [Uniswap V3 Core](https://github.com/Uniswap/v3-core)
- [Solady](https://github.com/vectorized/solady)
