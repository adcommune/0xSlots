---
"@0xslots/contracts": patch
---

FeedHub is now a UUPS-upgradeable proxy with pricing: admin-set `feeRecipient` / `feedCreationPrice` / `slotPrice`, payable `createFeed` (first 10 slots included in the creation price, extras at slotPrice each), payable `addSlots` (feed owner, slotPrice/slot), and `withdraw()` to the fee recipient. `Feed` mints its initial tiers during `initialize`, and slot-minting is hub-gated. Repointed `feedHubAddress` (Base Sepolia) at the new UUPS proxy `0xE4c0c374E3233b5174a1600AF1321cDa9b6B5cF8`.
