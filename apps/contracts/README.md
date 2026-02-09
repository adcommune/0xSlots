# PCO Protocol — Contracts

Foundry-based Solidity contracts implementing Partial Common Ownership (Harberger tax) with Superfluid streaming.

## Setup

```bash
# Install submodule dependencies
forge install

# Build
forge build

# Test
forge test
```

## Architecture

- **Harberger.sol** — Core PCO primitive (ERC721 with self-assessed value + continuous tax)
- **HarbergerHub.sol** — Factory/registry for Harberger instances
- **HarbergerStreamSuperApp.sol** — Superfluid Super App for continuous tax streaming
- **IHarbergerModule.sol** — Module interface for Layer 2 extensions (e.g., AdLand metadata)

## Security

See [Audit/2026-02-08-k-security-audit.md](./Audit/2026-02-08-k-security-audit.md) for the security review.
