---
"@0xslots/sdk": patch
---

Report pre-flight failures in the policy create flows instead of failing silently.

`createSlotWithTenure` and `createSlotWithPriceFloor` read the policy factory before offering any transaction — to predict the CREATE2 address and check whether that policy already exists. Those reads sat outside `exec`, the only place with a `catch` and an `onError`, and the call site does not await the returned promise. So on a chain with no policy factory deployed the read threw into an unhandled rejection: the Create button stayed enabled, clicking it did nothing, and no error appeared anywhere.

Both now route through a `preflight` helper that reports through `onError` exactly as a failed transaction does. A chain without a policy factory is a configuration fact worth stating, not a mystery.
