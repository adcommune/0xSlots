// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {ISlotsHub, HubSettings} from "./interfaces/ISlotsHub.sol";
import {Slots} from "./Slots.sol";
import {SlotsArgs, SlotParams} from "./interfaces/ISlots.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ISlotsModule} from "./ISlotsModule.sol";

/**
 * TODO:
 * - Add whitelisting of: tokens
 * @title SlotsHub
 * @author nezzar.eth
 * @notice This contract is the main contract for the SlotsHub system. It is responsible for deploying and managing the Slots contracts for each account.
 */
contract SlotsHub is
  ISlotsHub,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  // Custom errors for gas efficiency
  error InvalidFeeRecipient();
  error UnauthorizedLandExpansion();
  error InvalidPayment(uint256 expected, uint256 received);
  error InvalidCurrencyAddress();
  error InvalidSuperTokenHost(address expected, address received);
  error NotValidSuperToken();
  error ModuleNotImplementInterface(address module);

  HubSettings private _hubSettings;

  address private cfa;
  address private host;
  address private slotsBeacon;
  address private taxDistributorBeacon;

  mapping(address => Slots) private lands;
  mapping(address => bool) private allowedModules;
  mapping(address => bool) private allowedCurrencies;

  /**
   * @dev This empty reserved space is put in place to allow future versions to add new
   * protocol level fields. Storage gap placed at the end for cleaner upgrade patterns.
   */
  uint256[20] private __gap;

  function initialize(
    address slotsInitialImplementation,
    address taxDistributorInitialImplementation,
    address _host,
    address _cfa,
    HubSettings memory settings
  ) public initializer {
    __AccessControl_init();
    __UUPSUpgradeable_init();
    slotsBeacon = _deployUpgradeableBeacon(slotsInitialImplementation);
    taxDistributorBeacon = _deployUpgradeableBeacon(
      taxDistributorInitialImplementation
    );

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

    // _hubSettings.protocolFeeBps = 200; // 2%
    // _hubSettings.protocolFeeRecipient = msg.sender;
    // _hubSettings.slotPrice = 0.001 ether; // 0.001 ETH
    _hubSettings = settings;

    emit HubSettingsUpdated(settings);

    cfa = _cfa;
    host = _host;
  }

  function hubSettings() public view returns (HubSettings memory) {
    return _hubSettings;
  }

  function updateHubSettings(
    HubSettings memory newHubSettings
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newHubSettings.protocolFeeRecipient == address(0)) {
      revert InvalidFeeRecipient();
    }

    _hubSettings = newHubSettings;

    emit HubSettingsUpdated(newHubSettings);
  }

  function expandLand(
    address account,
    SlotParams[] memory params
  ) external payable {
    if (Slots(lands[account]).owner() != msg.sender) {
      revert UnauthorizedLandExpansion();
    }
    uint256 expected = params.length * _hubSettings.slotPrice;
    if (msg.value != expected) {
      revert InvalidPayment(expected, msg.value);
    }

    Slots(lands[account]).open(params);
  }

  function openLand(address account) external returns (address land) {
    land = _openLand(account);

    emit LandOpened(land, account);
  }

  function _openLand(address account) internal returns (address land) {
    SlotParams[] memory params = new SlotParams[](
      hubSettings().newLandInitialAmount
    );
    HubSettings memory settings = hubSettings();
    SlotParams memory defaultSlotParams = SlotParams({
      currency: ISuperToken(settings.newLandInitialCurrency),
      basePrice: settings.newLandInitialPrice,
      price: settings.newLandInitialPrice,
      taxPercentage: settings.newLandInitialTaxPercentage,
      maxTaxPercentage: settings.newLandInitialMaxTaxPercentage,
      minTaxUpdatePeriod: settings.newLandInitialMinTaxUpdatePeriod,
      module: settings.newLandInitialModule
    });

    for (uint256 i = 0; i < params.length; i++) {
      params[i] = defaultSlotParams;
    }

    lands[account] = Slots(
      address(
        new BeaconProxy(
          slotsBeacon,
          abi.encodeWithSelector(
            Slots.initialize.selector,
            SlotsArgs({
              _host: host,
              _cfa: cfa,
              _hub: address(this),
              _taxDistributorBeacon: taxDistributorBeacon
            }),
            account,
            params
          )
        )
      )
    );

    return address(lands[account]);
  }

  function isModuleAllowed(address module) public view returns (bool) {
    return allowedModules[module];
  }

  function isCurrencyAllowed(address currency) public view returns (bool) {
    return allowedCurrencies[currency];
  }

  function allowCurrency(
    address currency,
    bool allowed
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    // Validate currency
    _validateCurrency(currency);

    allowedCurrencies[currency] = allowed;

    emit CurrencyAllowedStatusUpdated(currency, allowed);
  }

  function allowModule(
    address module,
    bool allowed
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (allowed) {
      _validateModule(module);
      allowedModules[module] = true;
      emit ModuleAllowedStatusUpdated(
        module,
        true,
        ISlotsModule(module).name(),
        ISlotsModule(module).version()
      );
    } else {
      allowedModules[module] = false;
      emit ModuleAllowedStatusUpdated(module, false, "", "");
    }
  }

  function getLand(address account) public view returns (address) {
    return address(lands[account]);
  }

  function _validateCurrency(address currency) internal view {
    if (currency == address(0)) revert InvalidCurrencyAddress();
    // Verify it's a SuperToken by checking host
    try ISuperToken(currency).getHost() returns (address host_) {
      if (host_ != host) revert InvalidSuperTokenHost(host, host_);
    } catch {
      revert NotValidSuperToken();
    }
  }

  function _validateModule(address module) internal view {
    if (!IERC165(module).supportsInterface(type(ISlotsModule).interfaceId)) {
      revert ModuleNotImplementInterface(module);
    }
  }

  /**
   * UPGRADEABILITY METHODS
   */

  function upgradeSlotsTo(
    address newImplementation
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    UpgradeableBeacon(slotsBeacon).upgradeTo(newImplementation);
  }

  function upgradeTaxDistributorTo(
    address newImplementation
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    UpgradeableBeacon(taxDistributorBeacon).upgradeTo(newImplementation);
  }

  function _deployUpgradeableBeacon(
    address initialImplementation
  ) internal returns (address) {
    return address(new UpgradeableBeacon(initialImplementation));
  }

  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
