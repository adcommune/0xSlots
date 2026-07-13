---
"@0xslots/contracts": patch
---

`FeedHub.createFeed` is now permissionless — anyone can deploy a Feed and becomes its owner (the hub owner still controls only beacon upgrades). Added `Feed.removeSlot(address)` (owner-only, order-preserving delist; the Slot contract itself is untouched). Repointed `feedHubAddress` (Base Sepolia) at the redeployed hub `0xf732cc00640BC7fC7802DDf969c76BcAEaF51Af1` (Feed #0 = 41 slots).
