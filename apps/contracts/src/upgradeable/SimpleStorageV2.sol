// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";

/**
 * @title SimpleStorageV2
 * @dev An upgraded version of SimpleStorage with additional functionality
 *
 * This contract demonstrates:
 * - Beacon upgrade compatibility
 * - Adding new functionality while maintaining existing state
 * - Proper storage layout preservation
 */
contract SimpleStorageV2 is Initializable, OwnableUpgradeable {
  // Events
  event ValueStored(
    address indexed setter,
    uint256 indexed value,
    string message
  );
  event MessageUpdated(address indexed updater, string newMessage);
  event MultiplierSet(address indexed setter, uint256 multiplier);
  event ValueMultiplied(
    address indexed user,
    uint256 originalValue,
    uint256 multipliedValue
  );

  // Original storage variables (MUST maintain same layout as V1)
  uint256 private storedValue;
  string private storedMessage;
  address[] private valueSetters;
  mapping(address => uint256) private userValues;

  // New storage variables added in V2
  uint256 private multiplier;
  mapping(address => bool) private hasUsedMultiplier;
  uint256 private totalOperations;

  // Version tracking
  uint256 public constant VERSION = 2;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initialize the contract (V1 initialization)
   * @param initialValue Initial value to store
   * @param initialMessage Initial message to store
   * @param owner Address that will own this contract
   */
  function initialize(
    uint256 initialValue,
    string memory initialMessage,
    address owner
  ) public initializer {
    __Ownable_init();

    storedValue = initialValue;
    storedMessage = initialMessage;
    multiplier = 1; // Default multiplier

    // Transfer ownership to the specified owner
    if (owner != address(0) && owner != msg.sender) {
      _transferOwnership(owner);
    }

    emit ValueStored(msg.sender, initialValue, initialMessage);
  }

  /**
   * @dev Initialize V2 specific features (called after upgrade)
   * This can be called by the owner after upgrading to V2
   */
  function initializeV2() external onlyOwner {
    require(multiplier == 0, "V2 already initialized");
    multiplier = 1;
    totalOperations = valueSetters.length; // Initialize with existing operations
  }

  /**
   * @dev Store a new value
   * @param value The value to store
   */
  function storeValue(uint256 value) external {
    storedValue = value;
    userValues[msg.sender] = value;
    totalOperations++;

    // Add to setters list if not already present
    bool alreadyAdded = false;
    for (uint256 i = 0; i < valueSetters.length; i++) {
      if (valueSetters[i] == msg.sender) {
        alreadyAdded = true;
        break;
      }
    }
    if (!alreadyAdded) {
      valueSetters.push(msg.sender);
    }

    emit ValueStored(msg.sender, value, storedMessage);
  }

  /**
   * @dev Update the stored message (only owner)
   * @param message The new message to store
   */
  function updateMessage(string memory message) external onlyOwner {
    storedMessage = message;
    totalOperations++;
    emit MessageUpdated(msg.sender, message);
  }

  /**
   * @dev Set the multiplier (only owner) - NEW in V2
   * @param newMultiplier The new multiplier value
   */
  function setMultiplier(uint256 newMultiplier) external onlyOwner {
    require(newMultiplier > 0, "Multiplier must be greater than 0");
    multiplier = newMultiplier;
    totalOperations++;
    emit MultiplierSet(msg.sender, newMultiplier);
  }

  /**
   * @dev Multiply user's stored value by the current multiplier - NEW in V2
   */
  function multiplyMyValue() external {
    require(userValues[msg.sender] > 0, "No value stored for user");
    require(!hasUsedMultiplier[msg.sender], "User has already used multiplier");

    uint256 originalValue = userValues[msg.sender];
    uint256 multipliedValue = originalValue * multiplier;

    userValues[msg.sender] = multipliedValue;
    hasUsedMultiplier[msg.sender] = true;
    totalOperations++;

    // Update global stored value if this user set it last
    if (storedValue == originalValue) {
      storedValue = multipliedValue;
    }

    emit ValueMultiplied(msg.sender, originalValue, multipliedValue);
  }

  /**
   * @dev Get the stored value
   * @return The current stored value
   */
  function getValue() external view returns (uint256) {
    return storedValue;
  }

  /**
   * @dev Get the stored message
   * @return The current stored message
   */
  function getMessage() external view returns (string memory) {
    return storedMessage;
  }

  /**
   * @dev Get value stored by a specific user
   * @param user The user address to query
   * @return The value stored by the user
   */
  function getUserValue(address user) external view returns (uint256) {
    return userValues[user];
  }

  /**
   * @dev Get all addresses that have set values
   * @return Array of addresses that have set values
   */
  function getValueSetters() external view returns (address[] memory) {
    return valueSetters;
  }

  /**
   * @dev Get the number of unique value setters
   * @return The count of unique addresses that have set values
   */
  function getValueSettersCount() external view returns (uint256) {
    return valueSetters.length;
  }

  /**
   * @dev Get the current multiplier - NEW in V2
   * @return The current multiplier value
   */
  function getMultiplier() external view returns (uint256) {
    return multiplier;
  }

  /**
   * @dev Check if user has used the multiplier - NEW in V2
   * @param user The user address to check
   * @return Whether the user has used the multiplier
   */
  function hasUserUsedMultiplier(address user) external view returns (bool) {
    return hasUsedMultiplier[user];
  }

  /**
   * @dev Get total number of operations performed - NEW in V2
   * @return The total number of operations
   */
  function getTotalOperations() external view returns (uint256) {
    return totalOperations;
  }

  /**
   * @dev Get contract version
   * @return The version of this contract
   */
  function getVersion() external pure returns (uint256) {
    return VERSION;
  }

  /**
   * @dev Get contract info with V2 features
   * @return value The stored value
   * @return message The stored message
   * @return settersCount Number of unique value setters
   * @return currentMultiplier The current multiplier
   * @return operations Total operations performed
   */
  function getContractInfo()
    external
    view
    returns (
      uint256 value,
      string memory message,
      uint256 settersCount,
      uint256 currentMultiplier,
      uint256 operations
    )
  {
    return (
      storedValue,
      storedMessage,
      valueSetters.length,
      multiplier,
      totalOperations
    );
  }
}
