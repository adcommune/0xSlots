# @0xslots/contracts

Contract ABIs and addresses for the 0xSlots protocol.

## Installation

```bash
npm install @0xslots/contracts viem
# or
pnpm add @0xslots/contracts viem
# or
yarn add @0xslots/contracts viem
```

## Usage

### Import everything

```typescript
import {
  slotsAbi,
  slotsHubAbi,
  slotsHubAddress,
  getSlotsHubAddress,
} from "@0xslots/contracts";
```

### Import specific modules

```typescript
import { slotsAbi, slotsHubAbi } from "@0xslots/contracts/abis";
import { slotsHubAddress, getSlotsHubAddress } from "@0xslots/contracts/addresses";
```

### Use with viem

```typescript
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { slotsHubAbi, getSlotsHubAddress } from "@0xslots/contracts";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const hubAddress = getSlotsHubAddress(baseSepolia.id);

if (hubAddress) {
  const data = await client.readContract({
    address: hubAddress,
    abi: slotsHubAbi,
    functionName: "...",
  });
}
```

### Check if deployed on a chain

```typescript
import { isSlotsHubDeployed, getSupportedChainIds } from "@0xslots/contracts";

if (isSlotsHubDeployed(84532)) {
  console.log("SlotsHub is deployed on Base Sepolia");
}

const supportedChains = getSupportedChainIds();
console.log("Supported chains:", supportedChains);
```

## Exports

### ABIs

- `slotsAbi` - ABI for individual Slots contracts
- `slotsHubAbi` - ABI for the SlotsHub contract

### Addresses

- `slotsHubAddress` - Object mapping chain IDs to SlotsHub addresses
- `getSlotsHubAddress(chainId)` - Get SlotsHub address for a chain
- `isSlotsHubDeployed(chainId)` - Check if SlotsHub is deployed on a chain
- `getSupportedChainIds()` - Get all supported chain IDs

### Types

- `SupportedChainId` - Union type of supported chain IDs

## Supported Networks

- Base Sepolia (84532): `0x268cfaB9ddDdF6A326458Ae79d55592516f382eF`

## License

MIT
