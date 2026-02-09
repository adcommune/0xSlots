# PCO Protocol — Contracts

Foundry-based smart contracts for the Partial Common Ownership protocol.

## Architecture

- **Harberger.sol** — Core PCO primitive. Manages slots with self-assessed pricing and continuous Superfluid tax streams.
- **HarbergerHub.sol** — Factory and registry. Deploys Harberger instances, manages allowed modules and currencies.
- **HarbergerStreamSuperApp.sol** — Superfluid Super App that handles tax stream routing and automatic slot release on insufficient flow.

## Key Concepts

- **Slots** — Individual PCO positions within a Harberger instance
- **Self-assessment** — Occupants set their own price, pay tax proportional to it
- **Continuous tax** — Streamed per-second via Superfluid CFA
- **Modules** — Pluggable Layer 2 logic (e.g., AdLand for ad metadata)
- **Anyone can buy** — At the self-assessed price, ownership transfers instantly

## Setup

```bash
forge install
forge build
forge test
```
