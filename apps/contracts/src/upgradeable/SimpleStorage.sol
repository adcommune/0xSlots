// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";

/**
 * @title SimpleStorage
 * @dev A simple storage contract that can be deployed via beacon proxy
 *
 * This contract demonstrates:
 * - Beacon upgradeability pattern
 * - Proper initialization for proxy contracts
 * - State management in upgradeable contracts
 */
contract SimpleStorage is Initializable, OwnableUpgradeable {
  // Events
  event ValueStored(
    address indexed setter,
    uint256 indexed value,
    string message
  );
  event MessageUpdated(address indexed updater, string newMessage);

  // Storage variables
  uint256 private storedValue;
  string private storedMessage;
  address[] private valueSetters;
  mapping(address => uint256) private userValues;

  // Version tracking
  uint256 public constant VERSION = 1;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initialize the contract
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

    // Transfer ownership to the specified owner
    if (owner != address(0) && owner != msg.sender) {
      _transferOwnership(owner);
    }

    emit ValueStored(msg.sender, initialValue, initialMessage);
  }

  /**
   * @dev Store a new value
   * @param value The value to store
   */
  function storeValue(uint256 value) external {
    storedValue = value;
    userValues[msg.sender] = value;

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
    emit MessageUpdated(msg.sender, message);
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
   * @dev Get contract version
   * @return The version of this contract
   */
  function getVersion() external pure returns (uint256) {
    return VERSION;
  }

  /**
   * @dev Get contract info
   * @return value The stored value
   * @return message The stored message
   * @return settersCount Number of unique value setters
   */
  function getContractInfo()
    external
    view
    returns (uint256 value, string memory message, uint256 settersCount)
  {
    return (storedValue, storedMessage, valueSetters.length);
  }
}
