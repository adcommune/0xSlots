---
"@0xslots/contracts": patch
---

FeedHub now deploys Feeds whose owner mints slots incrementally via `Feed.createSlots(SlotTier[])` — each minted slot carries the FeedPostModule (injected, immutable) and is module-verified; arbitrary addresses can never be added. Batched minting keeps each tx under RPC gas caps, so feeds can hold many slots. Point `feedHubAddress` (Base Sepolia) at the redeployed hub `0xC3bE9AB91A57Dc8eb640Eb27B40833A1a4dB5bf9`; Feed #0 ("The Testnet Feed") has 41 module-verified slots across a 6-tier tax ladder with per-tier liquidation bounty and min-deposit.
