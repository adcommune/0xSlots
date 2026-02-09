// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/upgradeable/UpgradeableFactory.sol";
import "../src/upgradeable/SimpleStorage.sol";
import "../src/upgradeable/SimpleStorageV2.sol";

/**
 * @title DeployUpgradeableSystem
 * @dev Script to deploy and demonstrate the UUPS factory with beacon upgradeable contracts
 */
contract DeployUpgradeableSystem is Script {
  // Deployment addresses
  address public factoryProxy;
  address public factoryImplementation;
  address public simpleStorageImplementation;
  address public simpleStorageV2Implementation;

  // Deployed contract instances
  address public storageContract1;
  address public storageContract2;

  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address deployer = vm.addr(deployerPrivateKey);

    console.log("Deployer address:", deployer);
    console.log("Deployer balance:", deployer.balance);

    vm.startBroadcast(deployerPrivateKey);

    // Step 1: Deploy the UUPS Factory
    deployFactory();

    // Step 2: Deploy SimpleStorage implementation
    deploySimpleStorageImplementation();

    // Step 3: Create beacon for SimpleStorage
    createSimpleStorageBeacon();

    // Step 4: Deploy SimpleStorage contracts via factory
    deploySimpleStorageContracts();

    // Step 5: Interact with deployed contracts
    interactWithContracts();

    // Step 6: Deploy V2 implementation and upgrade
    upgradeToV2();

    // Step 7: Test V2 functionality
    testV2Functionality();

    vm.stopBroadcast();

    // Print deployment summary
    printDeploymentSummary();
  }

  function deployFactory() internal {
    console.log("\n=== Deploying UUPS Factory ===");

    // Deploy implementation
    factoryImplementation = address(new UpgradeableFactory());
    console.log("Factory implementation deployed at:", factoryImplementation);

    // Deploy proxy with initialization
    bytes memory initData = abi.encodeWithSelector(
      UpgradeableFactory.initialize.selector
    );

    factoryProxy = address(new ERC1967Proxy(factoryImplementation, initData));
    console.log("Factory proxy deployed at:", factoryProxy);

    // Verify initialization
    UpgradeableFactory factory = UpgradeableFactory(factoryProxy);
    console.log("Factory version:", factory.getVersion());
    console.log("Factory owner:", factory.owner());
  }

  function deploySimpleStorageImplementation() internal {
    console.log("\n=== Deploying SimpleStorage Implementation ===");

    simpleStorageImplementation = address(new SimpleStorage());
    console.log(
      "SimpleStorage implementation deployed at:",
      simpleStorageImplementation
    );
  }

  function createSimpleStorageBeacon() internal {
    console.log("\n=== Creating SimpleStorage Beacon ===");

    UpgradeableFactory factory = UpgradeableFactory(factoryProxy);
    factory.createBeacon("SimpleStorage", simpleStorageImplementation);

    address beacon = factory.beacons("SimpleStorage");
    console.log("SimpleStorage beacon created at:", beacon);

    address implementation = factory.getCurrentImplementation("SimpleStorage");
    console.log("Current implementation:", implementation);
  }

  function deploySimpleStorageContracts() internal {
    console.log("\n=== Deploying SimpleStorage Contracts via Factory ===");

    UpgradeableFactory factory = UpgradeableFactory(factoryProxy);

    // Deploy first contract
    bytes memory initData1 = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      42,
      "Hello from Contract 1",
      msg.sender
    );

    storageContract1 = factory.deployContract("SimpleStorage", initData1);
    console.log("Storage Contract 1 deployed at:", storageContract1);

    // Deploy second contract
    bytes memory initData2 = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      100,
      "Hello from Contract 2",
      msg.sender
    );

    storageContract2 = factory.deployContract("SimpleStorage", initData2);
    console.log("Storage Contract 2 deployed at:", storageContract2);

    console.log(
      "Total deployments:",
      factory.getDeploymentCount("SimpleStorage")
    );
  }

  function interactWithContracts() internal {
    console.log("\n=== Interacting with Deployed Contracts ===");

    SimpleStorage storage1 = SimpleStorage(storageContract1);
    SimpleStorage storage2 = SimpleStorage(storageContract2);

    // Test contract 1
    console.log("Contract 1 - Value:", storage1.getValue());
    console.log("Contract 1 - Message:", storage1.getMessage());
    console.log("Contract 1 - Version:", storage1.getVersion());

    // Test contract 2
    console.log("Contract 2 - Value:", storage2.getValue());
    console.log("Contract 2 - Message:", storage2.getMessage());
    console.log("Contract 2 - Version:", storage2.getVersion());

    // Store new values
    storage1.storeValue(123);
    storage2.storeValue(456);

    console.log("After storing new values:");
    console.log("Contract 1 - Value:", storage1.getValue());
    console.log("Contract 2 - Value:", storage2.getValue());
  }

  function upgradeToV2() internal {
    console.log("\n=== Upgrading to SimpleStorageV2 ===");

    // Deploy V2 implementation
    simpleStorageV2Implementation = address(new SimpleStorageV2());
    console.log(
      "SimpleStorageV2 implementation deployed at:",
      simpleStorageV2Implementation
    );

    // Upgrade all SimpleStorage contracts via beacon
    UpgradeableFactory factory = UpgradeableFactory(factoryProxy);
    factory.upgradeContractType("SimpleStorage", simpleStorageV2Implementation);

    address newImplementation = factory.getCurrentImplementation(
      "SimpleStorage"
    );
    console.log("Upgraded to implementation:", newImplementation);

    // Initialize V2 features for both contracts
    SimpleStorageV2(storageContract1).initializeV2();
    SimpleStorageV2(storageContract2).initializeV2();

    console.log("V2 initialization completed");
  }

  function testV2Functionality() internal {
    console.log("\n=== Testing V2 Functionality ===");

    SimpleStorageV2 storageV2_1 = SimpleStorageV2(storageContract1);
    SimpleStorageV2 storageV2_2 = SimpleStorageV2(storageContract2);

    // Verify upgrade
    console.log("Contract 1 - Version:", storageV2_1.getVersion());
    console.log("Contract 2 - Version:", storageV2_2.getVersion());

    // Test new V2 functionality
    console.log("Setting multiplier to 3...");
    storageV2_1.setMultiplier(3);
    storageV2_2.setMultiplier(3);

    console.log("Current multipliers:");
    console.log("Contract 1 - Multiplier:", storageV2_1.getMultiplier());
    console.log("Contract 2 - Multiplier:", storageV2_2.getMultiplier());

    // Test multiplication
    uint256 valueBefore1 = storageV2_1.getUserValue(msg.sender);
    uint256 valueBefore2 = storageV2_2.getUserValue(msg.sender);

    console.log("Values before multiplication:");
    console.log("Contract 1 - User value:", valueBefore1);
    console.log("Contract 2 - User value:", valueBefore2);

    // Multiply values
    storageV2_1.multiplyMyValue();
    storageV2_2.multiplyMyValue();

    console.log("Values after multiplication:");
    console.log(
      "Contract 1 - User value:",
      storageV2_1.getUserValue(msg.sender)
    );
    console.log(
      "Contract 2 - User value:",
      storageV2_2.getUserValue(msg.sender)
    );

    // Test operations counter
    console.log("Total operations:");
    console.log("Contract 1 - Operations:", storageV2_1.getTotalOperations());
    console.log("Contract 2 - Operations:", storageV2_2.getTotalOperations());
  }

  function printDeploymentSummary() internal view {
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Factory Proxy:", factoryProxy);
    console.log("Factory Implementation:", factoryImplementation);
    console.log("SimpleStorage Implementation:", simpleStorageImplementation);
    console.log(
      "SimpleStorageV2 Implementation:",
      simpleStorageV2Implementation
    );
    console.log("Storage Contract 1:", storageContract1);
    console.log("Storage Contract 2:", storageContract2);

    UpgradeableFactory factory = UpgradeableFactory(factoryProxy);
    console.log("SimpleStorage Beacon:", factory.beacons("SimpleStorage"));
    console.log(
      "Total SimpleStorage Deployments:",
      factory.getDeploymentCount("SimpleStorage")
    );

    console.log("\n=== UPGRADE PATTERN DEMONSTRATION COMPLETE ===");
    console.log("[SUCCESS] UUPS Factory deployed and operational");
    console.log("[SUCCESS] Beacon upgradeable contracts deployed");
    console.log("[SUCCESS] All contracts upgraded simultaneously via beacon");
    console.log("[SUCCESS] V2 functionality tested successfully");
  }
}
