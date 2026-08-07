---
"@0xslots/sdk": minor
---

Offer WETH as a slot currency on Base and Base Sepolia, and name each token's logo.

`WETH` is the OP-stack predeploy at `0x4200000000000000000000000000000000000006` — the same address on both chains. It is appended last on each chain rather than inserted first, so `getDefaultToken` keeps returning USDC (and Feed USDC on testnet) and an untouched create form still produces exactly the slot it did before.

It is also the first 18-decimal currency the protocol has offered. Nothing needed changing for that — a price floor already converts with the selected token's own decimals, and `MinimumPricePolicy` reverts `WrongCurrency` on a mismatched pairing — but the path now actually gets exercised rather than only ever seeing 6-decimal USDC.

`TokenInfo` gains an optional `logo` holding a slug (`"usdc"`, `"weth"`) rather than a URL or a path. This package is published and has more than one consumer: a path would encode one app's asset layout into shared data, and a URL would put a third-party host into every consumer's render path.
