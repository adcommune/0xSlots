---
"@0xslots/sdk": minor
---

Offer native ETH as a slot currency, and pay for native slots by value rather than by approval.

`NATIVE_CURRENCY`, `NATIVE_CURRENCY_ADDRESS` and `isNativeCurrency` are new exports. The sentinel is `address(0)`, which is sound rather than arbitrary: `Slot.initialize` rejected it outright before native support existed, so no slot predating that change can be holding it. `isNativeCurrency` accepts `undefined` deliberately — every call site in an app holds a possibly-unloaded address, and making each one guard separately is how one gets missed.

ETH is appended last on both Base chains rather than inserted first, the same rule already applied to WETH: `getDefaultToken` returns index 0, so USDC stays the default and an untouched create form still produces exactly the slot it did before.

Writes are the substantive change. `buy` and `topUp` both routed through a single private helper that read the slot's currency and approved it — which reverts against `address(0)`, so every native write failed. That helper now branches: native attaches `value` and never reads or grants an allowance, while the ERC-20 arm is unchanged, post-approval polling for node lag included. `buy` needed no new arithmetic, since the price-plus-deposit figure it already computed for the approval is exactly the `msg.value` the contract requires. The helper is renamed `withPayment`, having stopped being about allowances; it is private, so nothing downstream moves.

`VouchedPolicy` gains `superseded`. Redeploying the price policy factory left the two mainnet USDC floors derivable no longer — the current factory predicts different addresses, so the provenance check correctly refuses them — while the slots using them still need a label. Marking them keeps `getVouchedPolicy` naming them and drops them from `vouchedPoliciesForChain` and `searchVouchedPolicies`, so a picker is not offered the same floor twice at two addresses.

The package also gains its first tests. They cover only the payment branch, which is the one place a silent mistake sends real funds the wrong way and the one place neither the type checker nor any other check in the repo can see.
