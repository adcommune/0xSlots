// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct HubSettings {
  uint256 protocolFeeBps;
  address protocolFeeRecipient;
  uint256 slotPrice;
  address newLandInitialCurrency;
  uint256 newLandInitialAmount;
  uint256 newLandInitialPrice;
  uint256 newLandInitialTaxPercentage;
  uint256 newLandInitialMaxTaxPercentage;
  uint256 newLandInitialMinTaxUpdatePeriod;
  address newLandInitialModule;
}

interface ISlotsHub {
  event HubSettingsUpdated(HubSettings newHubSettings);
  event LandOpened(address indexed land, address indexed account);
  event ModuleAllowedStatusUpdated(
    address indexed module,
    bool allowed,
    string name,
    string version
  );
  event ModuleDisabled(address indexed module);
  event CurrencyAllowedStatusUpdated(address indexed currency, bool allowed);
}
