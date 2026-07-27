---
"@0xslots/contracts": minor
---

Point Base Sepolia at the canonical SlotFactoryV3.

`slotFactoryAddress[baseSepolia.id]` was `0xc44De86e2A5f0C47f1Ba87C36DaBf54275814DEb`, an address recorded in no deployment file and indexed by no subgraph datasource. It has been that value since v0.7.1 (2026-03-22).

The consequence was silent: creating a slot on Base Sepolia through the SDK succeeded on-chain and emitted a valid `SlotDeployed` event, but the subgraph never saw it, so the slot was invisible to every consumer — no error, no failed transaction, just a slot that never appeared. Base was unaffected, since its address already matched its deployment record.

It now points at `0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF`, matching `apps/contracts/deployments/84532/SlotFactoryV3.json` and the `factory2Address` datasource in `packages/subgraph/config/base-sepolia.json`.

**Slots created on Base Sepolia since 2026-03-22 remain unindexed** and will not appear after this change; they were created through the orphaned factory. Recreate them to have them indexed.
