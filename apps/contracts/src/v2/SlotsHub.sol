// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Slots} from "./Slots.sol";
import {HubSettings, SlotParams, IHubEvents} from "./ISlots.sol";

/// @title SlotsHub (v2) - No Superfluid, escrow-based
/// @notice Factory for creating Lands (Slots contracts). Manages protocol settings.
contract SlotsHub is IHubEvents, UUPSUpgradeable, AccessControlUpgradeable {
  error InvalidFeeRecipient();
  error UnauthorizedLandExpansion();
  error InsufficientPayment();
  error LandAlreadyExists();
  error InvalidSlotCount();

  HubSettings internal _hubSettings;
  UpgradeableBeacon public beacon;

  mapping(address => address) public lands; // account => land address
  mapping(address => bool) internal _allowedModules;

  function initialize(
    address _slotsImpl,
    HubSettings memory settings
  ) public initializer {
    __UUPSUpgradeable_init();
    __AccessControl_init();
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

    beacon = new UpgradeableBeacon(_slotsImpl);

    if (settings.protocolFeeRecipient == address(0)) revert InvalidFeeRecipient();
    _hubSettings = settings;

    emit HubSettingsUpdated(settings);
  }

  function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

  // ══════════════════════════════════════════════════════════════
  // LAND MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  /// @notice Create a new land with uniform slot params
  /// @param account The owner of the new land
  /// @param param Slot configuration applied to all slots
  /// @param count Number of slots to create (must be > 0)
  function openLand(address account, SlotParams memory param, uint256 count) external payable returns (address land) {
    if (lands[account] != address(0)) revert LandAlreadyExists();
    if (count == 0) revert InvalidSlotCount();

    HubSettings memory s = _hubSettings;
    if (s.landCreationFee > 0) {
      if (msg.value < s.landCreationFee) revert InsufficientPayment();
    }

    SlotParams[] memory params = new SlotParams[](count);
    for (uint256 i = 0; i < count; i++) {
      params[i] = param;
    }

    land = address(new BeaconProxy(
      address(beacon),
      abi.encodeCall(Slots.initialize, (payable(address(this)), account, params))
    ));
    lands[account] = land;

    emit LandOpened(land, account);
  }

  /// @notice Expand an existing land with more slots (owner only)
  function expandLand(address account, SlotParams[] memory params) external payable {
    address land = lands[account];
    if (Slots(land).owner() != msg.sender) revert UnauthorizedLandExpansion();

    uint256 expected = params.length * _hubSettings.slotExpansionFee;
    if (msg.value < expected) revert InsufficientPayment();

    uint256[] memory ids = Slots(land).open(params);

    emit LandExpanded(land, ids.length);
  }

  // ══════════════════════════════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════════════════════════════

  /// @notice Upgrade Slots implementation for all lands
  function upgradeSlotsImplementation(address newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
    beacon.upgradeTo(newImpl);
  }

  function updateHubSettings(HubSettings memory newSettings) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newSettings.protocolFeeRecipient == address(0)) revert InvalidFeeRecipient();
    _hubSettings = newSettings;
    emit HubSettingsUpdated(newSettings);
  }

  function hubSettings() public view returns (HubSettings memory) {
    return _hubSettings;
  }

  // ══════════════════════════════════════════════════════════════
  // ALLOWLISTS
  // ══════════════════════════════════════════════════════════════

  function isModuleAllowed(address module) public view returns (bool) {
    if (module == address(0)) return true;
    return _allowedModules[module];
  }

  function allowModule(address module, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _allowedModules[module] = allowed;
    emit ModuleAllowedStatusUpdated(module, allowed, "", "");
  }

  // ══════════════════════════════════════════════════════════════
  // ADMIN
  // ══════════════════════════════════════════════════════════════

  /// @notice Withdraw collected ETH (from land creation fees)
  function withdrawETH(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
    (bool ok,) = to.call{value: address(this).balance}("");
    require(ok);
  }

  receive() external payable {}
}
