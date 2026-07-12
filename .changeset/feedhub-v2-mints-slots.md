---
"@0xslots/contracts": patch
---

Point `feedHubAddress` (Base Sepolia) at the redeployed FeedHub (`0x36a5aedd3256CA750c44D71A0aFB663453Bb62B7`). The v2 FeedHub mints each feed's slots via the SlotFactory with the FeedPostModule attached and verifies the module on every slot, instead of accepting slot addresses. Feed #0 now has 10 module-verified slots across the tax-tier ladder.
