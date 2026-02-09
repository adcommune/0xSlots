// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UpgradeableFactory
 * @dev A UUPS upgradeable factory contract that deploys beacon upgradeable contracts
 *
 * This factory demonstrates:
 * - UUPS upgradeability for the factory itself
 * - Beacon proxy pattern for deployed contracts
 * - Centralized upgrade management through beacons
 */
contract UpgradeableFactory is
  Initializable,
  UUPSUpgradeable,
  OwnableUpgradeable
{
  // Events
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

  // Mapping from contract type to its beacon
  mapping(string => address) public beacons;

  // Mapping from contract type to deployed proxies
  mapping(string => address[]) public deployedProxies;

  // Total number of contracts deployed per type
  mapping(string => uint256) public deploymentCounts;

  // Version tracking
  uint256 public constant VERSION = 1;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initialize the factory
   */
  function initialize() public initializer {
    __Ownable_init();
    __UUPSUpgradeable_init();
  }

  /**
   * @dev Create a new beacon for a contract type
   * @param contractType String identifier for the contract type
   * @param implementation Address of the implementation contract
   */
  function createBeacon(
    string memory contractType,
    address implementation
  ) external onlyOwner {
    require(
      beacons[contractType] == address(0),
      "Beacon already exists for this type"
    );
    require(
      implementation != address(0),
      "Implementation cannot be zero address"
    );

    // Deploy the beacon with this factory as the owner
    UpgradeableBeacon beacon = new UpgradeableBeacon(implementation);
    // Keep factory as beacon owner so it can perform upgrades

    beacons[contractType] = address(beacon);

    emit BeaconCreated(contractType, address(beacon), implementation);
  }

  /**
   * @dev Deploy a new beacon proxy contract
   * @param contractType The type of contract to deploy
   * @param data Initialization data for the proxy
   * @return proxy Address of the deployed proxy
   */
  function deployContract(
    string memory contractType,
    bytes memory data
  ) external returns (address proxy) {
    address beacon = beacons[contractType];
    require(beacon != address(0), "Beacon does not exist for this type");

    // Deploy the beacon proxy
    proxy = address(new BeaconProxy(beacon, data));

    // Track the deployment
    deployedProxies[contractType].push(proxy);
    deploymentCounts[contractType]++;

    emit ContractDeployed(contractType, proxy, beacon);
  }

  /**
   * @dev Upgrade all contracts of a specific type by upgrading their beacon
   * @param contractType The type of contracts to upgrade
   * @param newImplementation Address of the new implementation
   */
  function upgradeContractType(
    string memory contractType,
    address newImplementation
  ) external onlyOwner {
    address beacon = beacons[contractType];
    require(beacon != address(0), "Beacon does not exist for this type");
    require(
      newImplementation != address(0),
      "New implementation cannot be zero address"
    );

    // Upgrade the beacon - this upgrades all proxies using this beacon
    UpgradeableBeacon(beacon).upgradeTo(newImplementation);

    emit BeaconUpgraded(contractType, beacon, newImplementation);
  }

  /**
   * @dev Get all deployed proxies for a contract type
   * @param contractType The contract type to query
   * @return Array of proxy addresses
   */
  function getDeployedProxies(
    string memory contractType
  ) external view returns (address[] memory) {
    return deployedProxies[contractType];
  }

  /**
   * @dev Get the current implementation for a contract type
   * @param contractType The contract type to query
   * @return implementation Address of the current implementation
   */
  function getCurrentImplementation(
    string memory contractType
  ) external view returns (address implementation) {
    address beacon = beacons[contractType];
    require(beacon != address(0), "Beacon does not exist for this type");
    return UpgradeableBeacon(beacon).implementation();
  }

  /**
   * @dev Get deployment count for a contract type
   * @param contractType The contract type to query
   * @return count Number of deployed contracts
   */
  function getDeploymentCount(
    string memory contractType
  ) external view returns (uint256 count) {
    return deploymentCounts[contractType];
  }

  /**
   * @dev Check if a beacon exists for a contract type
   * @param contractType The contract type to check
   * @return exists Whether the beacon exists
   */
  function beaconExists(
    string memory contractType
  ) external view returns (bool exists) {
    return beacons[contractType] != address(0);
  }

  /**
   * @dev Required by UUPSUpgradeable
   */
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  /**
   * @dev Get the version of this factory contract
   */
  function getVersion() external pure returns (uint256) {
    return VERSION;
  }
}
