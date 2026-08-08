---
"@0xslots/contracts": minor
---

Mark `buy` and `topUp` payable in the slot ABI, and point the price policy factory at its redeployment.

A slot can now denominate its market in native ETH by taking `address(0)` as its currency. That is a contract change, but it reaches consumers here first: viem validates `stateMutability` before it sends, so with `buy` and `topUp` reading `nonpayable` it refuses to attach `value` at all, and every native write fails no matter what the caller does. The two entries are now `payable`.

`InvalidValue` and `TransferFailed` join the error list so a reverted native call decodes to a name rather than a bare selector. `InvalidValue` covers both directions of the same rule — a native slot wants `msg.value` to equal the amount exactly, and an ERC-20 slot wants none, which is what stops ETH being stranded in a token-denominated slot.

These ABIs are hand-maintained rather than generated, so the edit was verified against `forge inspect Slot abi`: the payable function sets match exactly, which is what proves no neighbouring entry was caught by it.

`MINIMUM_PRICE_POLICY_FACTORY` moves to `0x6a1F9D1F78CD63cd969d500994CB333027A22844` on Base Sepolia and `0xe218F2e710D2B686fD4524236F3B79EC06E92091` on Base. The factory is not upgradeable, so teaching it to accept `address(0)` meant new bytecode at a new address — and because a factory is the CREATE2 deployer for everything it makes, every floor it predicts moved with it. Floors from the previous factories still work on the slots using them; they simply no longer verify against the current one, and are named from the SDK's vouched list instead.
