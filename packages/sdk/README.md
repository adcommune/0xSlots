# @0xslots/sdk

Unified SDK for the 0xSlots protocol — subgraph reads + on-chain writes with ERC-20 approval handling and EIP-5792 atomic batch support.

## Install

```bash
pnpm add @0xslots/sdk viem
```

## Usage

### Read-only (subgraph)

```ts
import { createSlotsClient, SlotsChain } from "@0xslots/sdk";

const client = createSlotsClient({ chainId: SlotsChain.BASE_SEPOLIA });

const { slots } = await client.getSlots({ first: 10 });
const { slot } = await client.getSlot({ id: "0x..." });
```

### Read + Write

```ts
import { createSlotsClient, SlotsChain } from "@0xslots/sdk";

const client = createSlotsClient({
  chainId: SlotsChain.BASE_SEPOLIA,
  factoryAddress: "0x...",
  publicClient, // viem PublicClient
  walletClient, // viem WalletClient
});

// Buy handles ERC-20 approval automatically
await client.buy({ slot: "0x...", depositAmount: 1000000n, selfAssessedPrice: 5000000n });

await client.topUp("0x...", 500000n);
await client.release("0x...");
await client.collect("0x...");
```

## API

### Subgraph Queries

`getSlots`, `getSlot`, `getSlotsByRecipient`, `getSlotsByOccupant`, `getFactory`, `getModules`, `getAccounts`, `getAccount`, `getSlotActivity`, `getRecentEvents`, `getBoughtEvents`, `getReleasedEvents`, `getLiquidatedEvents`, `getSettledEvents`, `getTaxCollectedEvents`, `getDepositedEvents`, `getWithdrawnEvents`, `getPriceUpdatedEvents`, `getMeta`

### On-chain Reads

`getSlotInfo(slot)` — full slot state via RPC

### Writes (require `walletClient` + `publicClient`)

| Method | Description |
|--------|-------------|
| `createSlot(params)` | Deploy a new slot via factory |
| `createSlots(params)` | Deploy multiple slots |
| `buy(params)` | Buy or force-buy a slot (auto-approves ERC-20) |
| `topUp(slot, amount)` | Add to deposit (auto-approves ERC-20) |
| `withdraw(slot, amount)` | Withdraw from deposit |
| `selfAssess(slot, price)` | Set self-assessed price |
| `release(slot)` | Release slot, reclaim deposit |
| `collect(slot)` | Flush accumulated tax to recipient |
| `liquidate(slot)` | Liquidate insolvent slot |
| `proposeTaxUpdate(slot, pct)` | Propose new tax rate (manager) |
| `proposeModuleUpdate(slot, module)` | Propose new module (manager) |
| `cancelPendingUpdates(slot)` | Cancel pending proposals (manager) |
| `setLiquidationBounty(slot, bps)` | Set liquidation bounty (manager) |
| `multicall(slot, calls)` | Batch multiple slot calls |

ERC-20 approvals are handled automatically for `buy` and `topUp`. If the wallet supports EIP-5792 atomic batching, approve + action are sent as a single atomic call.

## License

MIT
