# @0xslots/sdk

Type-safe SDK for querying 0xSlots subgraph data with full TypeScript support.

## Features

- 🔒 **Fully typed** - Generated from GraphQL schema with complete type safety
- 🚀 **Chain support** - Easy chain selection (Base Sepolia, more coming)
- 📦 **Tree-shakeable** - ESM exports with optimized bundle size
- 🎯 **Easy to use** - Simple, intuitive API

## Installation

```bash
npm install @0xslots/sdk
# or
pnpm add @0xslots/sdk
# or
yarn add @0xslots/sdk
```

## Quick Start

```typescript
import { createSlotsClient, SlotsChain } from '@0xslots/sdk';

// Create a client for Base Sepolia
const client = createSlotsClient({
  chainId: SlotsChain.BASE_SEPOLIA,
});

// Query the hub
const hub = await client.getHub({
  id: '0x268cfaB9ddDdF6A326458Ae79d55592516f382eF',
});

console.log('Hub slot price:', hub.hub?.slotPrice);
```

## Usage Examples

### Query Lands

```typescript
// Get all lands
const { lands } = await client.getLands({
  first: 10,
  orderBy: 'createdAt',
  orderDirection: 'desc',
});

// Get lands by owner
const { lands: myLands } = await client.getLandsByOwner({
  owner: '0x...',
  first: 100,
});

// Get a specific land with slots
const { land } = await client.getLand({
  id: '0x...',
});
```

### Query Slots

```typescript
// Get all active slots
const { slots } = await client.getSlots({
  where: { active: true },
  first: 50,
  orderBy: 'price',
  orderDirection: 'asc',
});

// Get available (vacant) slots
const { slots: available } = await client.getAvailableSlots({
  first: 20,
});

// Get slots owned by an address
const { slots: mySlots } = await client.getSlotsByOccupant({
  occupant: '0x...',
});

// Get slot details with history
const { slot } = await client.getSlot({
  id: '0x...-0',
});

console.log('Price history:', slot?.priceHistory);
console.log('Tax updates:', slot?.taxUpdates);
```

### Query Events

```typescript
// Get recent slot purchases
const { slotPurchases } = await client.getSlotPurchases({
  first: 50,
  orderBy: 'timestamp',
  orderDirection: 'desc',
});

// Get land creation events
const { landOpenedEvents } = await client.getLandOpenedEvents({
  first: 10,
  orderBy: 'timestamp',
  orderDirection: 'desc',
});

// Get flow changes (Superfluid streams)
const { flowChanges } = await client.getFlowChanges({
  where: { from: '0x...' },
  first: 100,
});
```

### Advanced Usage

```typescript
// Use custom subgraph URL
const client = createSlotsClient({
  chainId: SlotsChain.BASE_SEPOLIA,
  subgraphUrl: 'https://your-custom-endpoint.com/graphql',
});

// Access the underlying SDK for more control
const sdk = client.getSdk();

// Access the GraphQL client directly
const graphqlClient = client.getClient();
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Base Sepolia | 84532 | ✅ Live |

More chains coming soon!

## Type Safety

All queries return fully typed responses:

```typescript
import type { GetSlotQuery, Slot } from '@0xslots/sdk';

// Response types are automatically inferred
const response: GetSlotQuery = await client.getSlot({ id: '0x...' });

// Extract specific types
const slot: Slot | null = response.slot;
```

## API Reference

### SlotsClient

#### Hub Queries
- `getHub(params)` - Get hub configuration
- `getAllowedModules(params)` - Get allowed modules
- `getAllowedCurrencies(params)` - Get allowed currencies

#### Land Queries
- `getLands(params)` - Get all lands with pagination
- `getLand(params)` - Get a specific land by ID
- `getLandsByOwner(params)` - Get lands owned by an address

#### Slot Queries
- `getSlots(params)` - Get all slots with filters
- `getSlot(params)` - Get a specific slot with history
- `getSlotsByOccupant(params)` - Get slots held by an address
- `getAvailableSlots(params)` - Get vacant slots

#### Event Queries
- `getSlotPurchases(params)` - Get slot purchase events
- `getLandOpenedEvents(params)` - Get land creation events
- `getSlotCreatedEvents(params)` - Get slot creation events
- `getFlowChanges(params)` - Get Superfluid flow changes

## Development

```bash
# Install dependencies
pnpm install

# Generate types from GraphQL schema
pnpm codegen

# Build the SDK
pnpm build

# Watch mode for development
pnpm dev
```

## License

MIT
