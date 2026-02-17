// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Slots} from "./Slots.sol";
import {HubSettings, SlotParams, IHubEvents} from "./ISlots.sol";

/// @title SlotsHub (v2) — No Superfluid, escrow-based
/// @notice Factory for creating Lands (Slots contracts). Manages protocol settings.
contract SlotsHub is IHubEvents, UUPSUpgradeable, AccessControlUpgradeable {
  error InvalidFeeRecipient();
  error UnauthorizedLandExpansion();
  error InsufficientPayment();
  error LandAlreadyExists();

  HubSettings internal _hubSettings;
  address public slotsImplementation;

  mapping(address => address) public lands; // account => land address
  mapping(address => bool) internal _allowedModules;
  mapping(address => bool) internal _allowedCurrencies;

  function initialize(
    address _slotsImpl,
    HubSettings memory settings
  ) public initializer {
    __UUPSUpgradeable_init();
    __AccessControl_init();
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

    slotsImplementation = _slotsImpl;

    if (settings.protocolFeeRecipient == address(0)) revert InvalidFeeRecipient();
    _hubSettings = settings;

    emit HubSettingsUpdated(settings);
  }

  function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

  // ══════════════════════════════════════════════════════════════
  // LAND MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  /// @notice Create a new land for an account with default slots
  function openLand(address account) external payable returns (address land) {
    if (lands[account] != address(0)) revert LandAlreadyExists();

    HubSettings memory s = _hubSettings;

    if (s.landCreationFee > 0) {
      if (msg.value < s.landCreationFee) revert InsufficientPayment();
    }

    SlotParams[] memory params = new SlotParams[](s.newLandInitialAmount);
    SlotParams memory defaultParam = SlotParams({
      currency: IERC20(s.newLandInitialCurrency),
      basePrice: s.newLandInitialPrice,
      taxPercentage: s.newLandInitialTaxPercentage,
      maxTaxPercentage: s.newLandInitialMaxTaxPercentage,
      minTaxUpdatePeriod: s.newLandInitialMinTaxUpdatePeriod,
      module: s.newLandInitialModule
    });

    for (uint256 i = 0; i < s.newLandInitialAmount; i++) {
      params[i] = defaultParam;
    }

    land = Clones.clone(slotsImplementation);
    Slots(land).initialize(payable(address(this)), account, params);
    lands[account] = land;

    emit LandOpened(land, account);
  }

  /// @notice Expand an existing land with more slots
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

  function isCurrencyAllowed(address currency) public view returns (bool) {
    return _allowedCurrencies[currency];
  }

  function allowCurrency(address currency, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _allowedCurrencies[currency] = allowed;
    emit CurrencyAllowedStatusUpdated(currency, allowed);
  }

  function isModuleAllowed(address module) public view returns (bool) {
    if (module == address(0)) return true; // No module is always allowed
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
