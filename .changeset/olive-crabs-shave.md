---
"@0xslots/contracts": patch
"@0xslots/sdk": patch
---

Wire up the Base mainnet policy factories.

`MinimumTenurePolicyFactory` at `0xE322cDADB8fd511788F0fA25BffD794b7A946125` and `MinimumPricePolicyFactory` at `0xF1cA0Fe72269AaEf1E5e34bfF484269f18e1b777`, added to the per-chain maps and to `POLICY_FACTORIES` so `resolvePolicy` can verify against them.

Without these the SDK could not even address a policy factory on mainnet, so choosing a minimum tenure on the create form threw before building a transaction.

The five starter policies they deployed — 1h/1d/7d tenures and $1/$10 USDC floors — are listed as vouched so the "Verified policy" picker has something to offer on mainnet. All five are derivable on-chain and do not need the entries to be named; this is the editorial list, not a naming fallback.

`VouchedPolicy` gains optional `minPrice` and `currency`, and `resolvePolicy` forwards them. It checks the vouched list first and returns without touching the network, so a listed policy previously came back thinner than the same policy derived — losing exactly the fields a price floor is made of.
