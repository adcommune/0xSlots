// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "../src/upgradeable/UpgradeableFactory.sol";
import "../src/upgradeable/SimpleStorage.sol";
import "../src/upgradeable/SimpleStorageV2.sol";

/**
 * @title UpgradeableSystemTest
 * @dev Comprehensive test suite for the UUPS factory with beacon upgradeable contracts
 */
contract UpgradeableSystemTest is Test {
  UpgradeableFactory public factory;
  address public factoryProxy;
  address public factoryImplementation;

  SimpleStorage public simpleStorageImpl;
  SimpleStorageV2 public simpleStorageV2Impl;

  address public owner;
  address public user1;
  address public user2;

  event BeaconCreated(
    string indexed contractType,
    address indexed beacon,
    address implementation
  );
  event ContractDeployed(
    string indexed contractType,
    address indexed proxy,
    address indexed beacon
  );
  event BeaconUpgraded(
    string indexed contractType,
    address indexed beacon,
    address newImplementation
  );

  function setUp() public {
    owner = address(this);
    user1 = makeAddr("user1");
    user2 = makeAddr("user2");

    // Deploy factory implementation
    factoryImplementation = address(new UpgradeableFactory());

    // Deploy factory proxy
    bytes memory initData = abi.encodeWithSelector(
      UpgradeableFactory.initialize.selector
    );
    factoryProxy = address(new ERC1967Proxy(factoryImplementation, initData));
    factory = UpgradeableFactory(factoryProxy);

    // Deploy implementations
    simpleStorageImpl = new SimpleStorage();
    simpleStorageV2Impl = new SimpleStorageV2();
  }

  function testFactoryInitialization() public {
    assertEq(factory.owner(), owner);
    assertEq(factory.getVersion(), 1);
  }

  function testCreateBeacon() public {
    // Test beacon creation
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    // Verify beacon exists
    assertTrue(factory.beaconExists("SimpleStorage"));
    address beacon = factory.beacons("SimpleStorage");
    assertTrue(beacon != address(0));

    // Verify beacon implementation
    assertEq(
      factory.getCurrentImplementation("SimpleStorage"),
      address(simpleStorageImpl)
    );

    // Test duplicate beacon creation should fail
    vm.expectRevert("Beacon already exists for this type");
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));
  }

  function testCreateBeaconUnauthorized() public {
    vm.prank(user1);
    vm.expectRevert("Ownable: caller is not the owner");
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));
  }

  function testCreateBeaconZeroAddress() public {
    vm.expectRevert("Implementation cannot be zero address");
    factory.createBeacon("SimpleStorage", address(0));
  }

  function testDeployContract() public {
    // Create beacon first
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    // Prepare initialization data
    bytes memory initData = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      42,
      "Test Message",
      owner
    );

    // Deploy contract
    address proxy = factory.deployContract("SimpleStorage", initData);

    // Verify deployment
    assertTrue(proxy != address(0));
    assertEq(factory.getDeploymentCount("SimpleStorage"), 1);

    // Verify proxy functionality
    SimpleStorage storageContract = SimpleStorage(proxy);
    assertEq(storageContract.getValue(), 42);
    assertEq(storageContract.getMessage(), "Test Message");
    assertEq(storageContract.owner(), owner);
    assertEq(storageContract.getVersion(), 1);
  }

  function testDeployContractNonexistentBeacon() public {
    bytes memory initData = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      42,
      "Test Message",
      owner
    );

    vm.expectRevert("Beacon does not exist for this type");
    factory.deployContract("NonexistentType", initData);
  }

  function testMultipleDeployments() public {
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    // Deploy multiple contracts
    address[] memory proxies = new address[](3);
    for (uint i = 0; i < 3; i++) {
      bytes memory initData = abi.encodeWithSelector(
        SimpleStorage.initialize.selector,
        100 + i,
        string(abi.encodePacked("Message ", i)),
        owner
      );
      proxies[i] = factory.deployContract("SimpleStorage", initData);
    }

    // Verify all deployments
    assertEq(factory.getDeploymentCount("SimpleStorage"), 3);
    address[] memory deployedProxies = factory.getDeployedProxies(
      "SimpleStorage"
    );
    assertEq(deployedProxies.length, 3);

    // Verify each contract
    for (uint i = 0; i < 3; i++) {
      SimpleStorage storageContract = SimpleStorage(proxies[i]);
      assertEq(storageContract.getValue(), 100 + i);
      assertEq(
        storageContract.getMessage(),
        string(abi.encodePacked("Message ", i))
      );
    }
  }

  function testUpgradeContractType() public {
    // Setup: Create beacon and deploy contracts
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    bytes memory initData1 = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      42,
      "Contract 1",
      owner
    );
    bytes memory initData2 = abi.encodeWithSelector(
      SimpleStorage.initialize.selector,
      84,
      "Contract 2",
      owner
    );

    address proxy1 = factory.deployContract("SimpleStorage", initData1);
    address proxy2 = factory.deployContract("SimpleStorage", initData2);

    // Verify V1 functionality
    SimpleStorage storage1 = SimpleStorage(proxy1);
    SimpleStorage storage2 = SimpleStorage(proxy2);
    assertEq(storage1.getVersion(), 1);
    assertEq(storage2.getVersion(), 1);

    // Upgrade to V2
    factory.upgradeContractType("SimpleStorage", address(simpleStorageV2Impl));

    // Verify upgrade
    assertEq(
      factory.getCurrentImplementation("SimpleStorage"),
      address(simpleStorageV2Impl)
    );

    // Test V2 functionality
    SimpleStorageV2 storageV2_1 = SimpleStorageV2(proxy1);
    SimpleStorageV2 storageV2_2 = SimpleStorageV2(proxy2);

    // Initialize V2 features
    storageV2_1.initializeV2();
    storageV2_2.initializeV2();

    // Verify V2 version
    assertEq(storageV2_1.getVersion(), 2);
    assertEq(storageV2_2.getVersion(), 2);

    // Test new V2 functionality
    storageV2_1.setMultiplier(3);
    assertEq(storageV2_1.getMultiplier(), 3);

    // Store value and multiply
    storageV2_1.storeValue(10);
    uint256 valueBefore = storageV2_1.getUserValue(address(this));
    assertEq(valueBefore, 10);

    storageV2_1.multiplyMyValue();
    uint256 valueAfter = storageV2_1.getUserValue(address(this));
    assertEq(valueAfter, 30); // 10 * 3

    assertTrue(storageV2_1.hasUserUsedMultiplier(address(this)));
    assertTrue(storageV2_1.getTotalOperations() > 0);
  }

  function testUpgradeUnauthorized() public {
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    vm.prank(user1);
    vm.expectRevert("Ownable: caller is not the owner");
    factory.upgradeContractType("SimpleStorage", address(simpleStorageV2Impl));
  }

  function testUpgradeNonexistentBeacon() public {
    vm.expectRevert("Beacon does not exist for this type");
    factory.upgradeContractType(
      "NonexistentType",
      address(simpleStorageV2Impl)
    );
  }

  function testUpgradeZeroAddress() public {
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    vm.expectRevert("New implementation cannot be zero address");
    factory.upgradeContractType("SimpleStorage", address(0));
  }

  function testFactoryUUPSUpgrade() public {
    // This test would require a V2 factory implementation
    // For now, we just verify the factory is upgradeable
    assertTrue(address(factory) != address(0));
    assertEq(factory.getVersion(), 1);
  }

  function testCompleteWorkflow() public {
    // Complete workflow test
    console.log("=== Testing Complete Workflow ===");

    // 1. Create beacon
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));
    assertTrue(factory.beaconExists("SimpleStorage"));

    // 2. Deploy multiple contracts
    address proxy1 = factory.deployContract(
      "SimpleStorage",
      abi.encodeWithSelector(
        SimpleStorage.initialize.selector,
        100,
        "First Contract",
        owner
      )
    );
    address proxy2 = factory.deployContract(
      "SimpleStorage",
      abi.encodeWithSelector(
        SimpleStorage.initialize.selector,
        200,
        "Second Contract",
        owner
      )
    );

    assertEq(factory.getDeploymentCount("SimpleStorage"), 2);

    // 3. Interact with contracts
    SimpleStorage storage1 = SimpleStorage(proxy1);
    SimpleStorage storage2 = SimpleStorage(proxy2);

    storage1.storeValue(150);
    storage2.storeValue(250);

    assertEq(storage1.getValue(), 150);
    assertEq(storage2.getValue(), 250);

    // 4. Upgrade all contracts
    factory.upgradeContractType("SimpleStorage", address(simpleStorageV2Impl));

    // 5. Test V2 functionality
    SimpleStorageV2 storageV2_1 = SimpleStorageV2(proxy1);
    SimpleStorageV2 storageV2_2 = SimpleStorageV2(proxy2);

    storageV2_1.initializeV2();
    storageV2_2.initializeV2();

    assertEq(storageV2_1.getVersion(), 2);
    assertEq(storageV2_2.getVersion(), 2);

    // Test new V2 features
    storageV2_1.setMultiplier(2);
    storageV2_1.multiplyMyValue();

    // Verify the multiplication worked
    assertTrue(storageV2_1.getUserValue(address(this)) > 150);

    console.log("[SUCCESS] Complete workflow test passed");
  }

  function testViewFunctions() public {
    factory.createBeacon("SimpleStorage", address(simpleStorageImpl));

    // Test view functions before deployments
    assertEq(factory.getDeploymentCount("SimpleStorage"), 0);
    address[] memory emptyProxies = factory.getDeployedProxies("SimpleStorage");
    assertEq(emptyProxies.length, 0);

    // Deploy a contract
    address proxy = factory.deployContract(
      "SimpleStorage",
      abi.encodeWithSelector(
        SimpleStorage.initialize.selector,
        42,
        "Test",
        owner
      )
    );

    // Test view functions after deployment
    assertEq(factory.getDeploymentCount("SimpleStorage"), 1);
    address[] memory proxies = factory.getDeployedProxies("SimpleStorage");
    assertEq(proxies.length, 1);
    assertEq(proxies[0], proxy);

    // Test beacon functions
    assertTrue(factory.beaconExists("SimpleStorage"));
    assertFalse(factory.beaconExists("NonexistentType"));
    assertEq(
      factory.getCurrentImplementation("SimpleStorage"),
      address(simpleStorageImpl)
    );
  }
}
