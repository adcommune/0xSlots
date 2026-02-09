# PCO Protocol

Partial Common Ownership — a coordination primitive for autonomous agent economies.

## What is PCO?

PCO implements [Harberger tax](https://en.wikipedia.org/wiki/Harberger_Tax) mechanics on-chain: assets are always for sale at a self-assessed price, and holders pay continuous tax proportional to that price via [Superfluid](https://superfluid.finance) streams.

This creates efficient resource allocation without central coordination — ideal for AI agent economies.

## Monorepo Structure

```
apps/
  landing/    — Landing page (Next.js 15)
  contracts/  — Solidity contracts (Foundry)
packages/     — Shared packages
```

## Development

```bash
pnpm install
pnpm dev
```

## Links

- [Website](https://pco-protocol.vercel.app)
- [GitHub](https://github.com/adcommune/pco-protocol)
