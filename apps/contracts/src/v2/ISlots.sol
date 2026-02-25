// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Tax update status
enum TaxUpdateStatus {
  None,
  Pending
}

struct TaxUpdate {
  uint256 newRate;
  uint256 proposedAt;
  TaxUpdateStatus status;
}

struct SlotParams {
  IERC20 currency;
  uint256 basePrice;
  uint256 taxPercentage; // basis points (100 = 1%)
  uint256 maxTaxPercentage;
  uint256 minTaxUpdatePeriod; // seconds
  address module;
}

struct Slot {
  IERC20 currency;
  address occupant;
  uint256 basePrice;
  uint256 price;
  bool active;
  uint256 taxPercentage; // basis points (100 = 1%)
  uint256 maxTaxPercentage;
  uint256 minTaxUpdatePeriod;
  address module;
}

struct SlotEscrow {
  uint256 deposit;
  uint256 lastSettled;
  uint256 collectedTax;
  TaxUpdate pendingTaxUpdate;
}

struct HubSettings {
  uint256 protocolFeeBps;
  address protocolFeeRecipient;
  uint256 landCreationFee;
  uint256 slotExpansionFee;
  address newLandInitialCurrency;
  uint256 newLandInitialAmount;
  uint256 newLandInitialPrice;
  uint256 newLandInitialTaxPercentage;
  uint256 newLandInitialMaxTaxPercentage;
  uint256 newLandInitialMinTaxUpdatePeriod;
  address newLandInitialModule;
  uint256 moduleCallGasLimit;
  uint256 liquidationBountyBps; // e.g. 500 = 5% of remaining deposit goes to liquidator
  uint256 minDepositSeconds; // minimum deposit to cover N seconds of tax
}

interface ISlotsEvents {
  event SlotCreated(address landOwner, uint256 indexed slotId, address indexed account, SlotParams params);
  event SlotPurchased(address landOwner, uint256 indexed slotId, address indexed newOccupant, uint256 price);
  event SlotReleased(address landOwner, uint256 indexed slotId);
  event SlotLiquidated(address landOwner, uint256 indexed slotId, address indexed liquidator, address indexed occupant, uint256 bounty);
  event PriceUpdated(address landOwner, uint256 indexed slotId, uint256 oldPrice, uint256 newPrice);
  event TaxRateUpdateProposed(address landOwner, uint256 indexed slotId, uint256 newPercentage, uint256 confirmableAt);
  event TaxRateUpdateConfirmed(address landOwner, uint256 indexed slotId, uint256 oldPercentage, uint256 newPercentage);
  event TaxRateUpdateCancelled(address landOwner, uint256 indexed slotId);
  event SlotSettingsUpdated(address landOwner, uint256 indexed slotId, uint256 basePrice, address currency, uint256 maxTaxPercentage, address module);
  event SlotDeactivated(address landOwner, uint256 indexed slotId);
  event SlotActivated(address landOwner, uint256 indexed slotId);
  event Deposited(uint256 indexed slotId, address indexed depositor, uint256 amount);
  event Withdrawn(uint256 indexed slotId, address indexed occupant, uint256 amount);
  event TaxCollected(uint256 indexed slotId, address indexed owner, uint256 amount);
  event Settled(uint256 indexed slotId, uint256 taxOwed, uint256 depositRemaining);
}

interface IHubEvents {
  event HubSettingsUpdated(HubSettings newHubSettings);
  event LandOpened(address indexed land, address indexed account);
  event LandExpanded(address indexed land, uint256 newSlotCount);
  event ModuleAllowedStatusUpdated(address indexed module, bool allowed, string name, string version);
}
