# UUPS Factory with Beacon Upgradeable Contracts

This example demonstrates a comprehensive upgradeable contract system that combines two OpenZeppelin upgrade patterns:

1. **UUPS (Universal Upgradeable Proxy Standard)** for the factory contract
2. **Beacon Proxy Pattern** for the contracts deployed by the factory

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UUPS Factory System                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │  Factory Proxy  │    │     Factory Implementation       │ │
│  │   (ERC1967)     │────│      (UpgradeableFactory)        │ │
│  │                 │    │                                  │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    │ creates & manages
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                 Beacon Proxy System                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │ UpgradeableBeacon│────│    Implementation Contract       │ │
│  │                 │    │     (SimpleStorage/V2)           │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
│           │                                                 │
│           │ points to                                       │
│           ▼                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  BeaconProxy 1  │    │  BeaconProxy 2  │    ┌─────────┐ │
│  │                 │    │                 │    │   ...   │ │
│  └─────────────────┘    └─────────────────┘    └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

### 1. **Dual Upgrade Patterns**
- **Factory (UUPS)**: The factory itself can be upgraded to add new features, change deployment logic, or fix bugs
- **Deployed Contracts (Beacon)**: All contracts of the same type can be upgraded simultaneously through their shared beacon

### 2. **Centralized Management**
- Single factory manages multiple contract types
- Each contract type has its own beacon for independent upgrades
- Batch upgrades for all contracts of the same type

### 3. **Gas Efficiency**
- Beacon proxies are lighter than individual UUPS proxies
- Shared implementation reduces deployment costs
- Bulk operations through the factory

### 4. **Security**
- Owner-controlled upgrades with proper access control
- Immutable proxy addresses for deployed contracts
- Transparent upgrade mechanism

## Contract Structure

### Core Contracts

#### 1. `UpgradeableFactory.sol`
- **Pattern**: UUPS Upgradeable
- **Purpose**: Deploy and manage beacon upgradeable contracts
- **Key Features**:
  - Create beacons for different contract types
  - Deploy beacon proxy contracts
  - Upgrade all contracts of a type simultaneously
  - Track deployments and manage beacons

#### 2. `SimpleStorage.sol`
- **Pattern**: Beacon Upgradeable (V1)
- **Purpose**: Example implementation contract
- **Features**:
  - Basic storage functionality
  - Owner management
  - Value tracking per user

#### 3. `SimpleStorageV2.sol`
- **Pattern**: Beacon Upgradeable (V2)
- **Purpose**: Upgraded implementation with new features
- **New Features**:
  - Multiplier functionality
  - Operation counting
  - Enhanced user interactions
  - Backward compatibility with V1

## Usage Examples

### Deployment

```solidity
// 1. Deploy factory
UpgradeableFactory factory = new UpgradeableFactory();
ERC1967Proxy factoryProxy = new ERC1967Proxy(
    address(factory), 
    abi.encodeWithSelector(factory.initialize.selector)
);

// 2. Create beacon for contract type
SimpleStorage implementation = new SimpleStorage();
UpgradeableFactory(factoryProxy).createBeacon("SimpleStorage", address(implementation));

// 3. Deploy contracts via factory
bytes memory initData = abi.encodeWithSelector(
    SimpleStorage.initialize.selector,
    42,
    "Hello World",
    msg.sender
);
address deployedContract = UpgradeableFactory(factoryProxy).deployContract("SimpleStorage", initData);
```

### Upgrading Contracts

```solidity
// Deploy new implementation
SimpleStorageV2 newImplementation = new SimpleStorageV2();

// Upgrade ALL contracts of this type
factory.upgradeContractType("SimpleStorage", address(newImplementation));

// All existing contracts now use V2 implementation
SimpleStorageV2 upgradedContract = SimpleStorageV2(deployedContract);
upgradedContract.initializeV2(); // Initialize new features
```

### Factory Management

```solidity
// Check deployments
uint256 count = factory.getDeploymentCount("SimpleStorage");
address[] memory deployed = factory.getDeployedProxies("SimpleStorage");

// Check beacon status
bool exists = factory.beaconExists("SimpleStorage");
address currentImpl = factory.getCurrentImplementation("SimpleStorage");
```

## Testing

Run the comprehensive test suite:

```bash
forge test --match-contract UpgradeableSystemTest -vv
```

## Deployment Script

Deploy the complete system:

```bash
forge script script/DeployUpgradeableSystem.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

## Security Considerations

### 1. **Access Control**
- Factory owner controls beacon creation and upgrades
- Individual contract owners manage their contract state
- Proper ownership transfer mechanisms

### 2. **Upgrade Safety**
- Storage layout compatibility between versions
- Initialization functions for new features
- Version tracking for upgrade verification

### 3. **Proxy Security**
- Uses OpenZeppelin's battle-tested proxy implementations
- Proper initialization to prevent implementation hijacking
- Beacon ownership protection

## Advanced Features

### 1. **Multi-Type Support**
The factory can manage multiple contract types simultaneously:

```solidity
factory.createBeacon("TokenContract", tokenImplementation);
factory.createBeacon("NFTContract", nftImplementation);
factory.createBeacon("VaultContract", vaultImplementation);
```

### 2. **Batch Operations**
Deploy multiple contracts in a single transaction:

```solidity
function batchDeploy(string memory contractType, bytes[] memory initDataArray) 
    external returns (address[] memory) {
    // Implementation for batch deployment
}
```

### 3. **Upgrade Governance**
Implement timelock or multisig for upgrade authorization:

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "Only governance");
    _;
}
```

## Gas Optimization Tips

1. **Beacon Reuse**: Use the same beacon for similar contract types
2. **Batch Deployments**: Deploy multiple contracts in single transactions
3. **Minimal Proxies**: Consider using minimal beacon proxies for simple contracts
4. **Storage Packing**: Optimize storage layout in implementation contracts

## Upgrade Checklist

When upgrading implementations:

- [ ] Verify storage layout compatibility
- [ ] Test upgrade on testnet first
- [ ] Implement proper initialization for new features
- [ ] Update version numbers
- [ ] Document breaking changes
- [ ] Notify users of new functionality

## Common Patterns

### Factory Upgrades
```solidity
// Deploy new factory implementation
UpgradeableFactoryV2 newFactoryImpl = new UpgradeableFactoryV2();

// Upgrade factory (only owner can do this)
UpgradeableFactory(factoryProxy).upgradeTo(address(newFactoryImpl));
```

### Emergency Pause
```solidity
// Add to factory implementation
bool public paused;
modifier whenNotPaused() {
    require(!paused, "Factory paused");
    _;
}
```

This system provides a robust, scalable, and secure foundation for managing upgradeable smart contracts with the flexibility of both UUPS and Beacon patterns.

