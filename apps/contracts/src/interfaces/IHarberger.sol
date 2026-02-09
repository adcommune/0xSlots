// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";

enum SlotDirective {
  GAIN_OWNERSHIP,
  LOSE_OWNERSHIP,
  SELF_ASSESSMENT
}

// Tax update status
enum TaxUpdateStatus {
  None,
  Pending,
  Confirmed
}

struct HarbergerArgs {
  address _host;
  address _cfa;
  address _hub;
  address _taxDistributorBeacon;
}

struct TaxUpdate {
  uint256 newRate;
  uint256 proposedAt;
  TaxUpdateStatus status;
}

struct SlotParams {
  ISuperToken currency;
  uint256 basePrice;
  uint256 price;
  uint256 taxPercentage; // in basis points (1 = 0.01%)
  uint256 maxTaxPercentage; // in basis points (1 = 0.01%)
  uint256 minTaxUpdatePeriod; // in seconds
  address module; // Address of the module contract
}

// Slot state
struct Slot {
  ISuperToken currency;
  address occupant;
  uint256 basePrice;
  uint256 price;
  bool active;
  uint256 taxPercentage; // in basis points (1 = 0.01%)
  uint256 maxTaxPercentage;
  uint256 minTaxUpdatePeriod;
  TaxUpdate pendingTaxUpdate;
  address module; // Address of the module contract
}

/// @title IHarberger
/// @notice Interface for the Harberger contract
interface IHarberger {
  // Events
  event SlotCreated(
    address landOwner,
    uint256 indexed slotId,
    address indexed account,
    SlotParams params
  );
  event SlotPurchased(
    address landOwner,
    uint256 indexed slotId,
    address indexed newOccupant
  );
  event SlotReleased(address landOwner, uint256 indexed slotId);
  event PriceUpdated(
    address landOwner,
    uint256 indexed slotId,
    uint256 oldPrice,
    uint256 newPrice
  );
  event TaxRateUpdateProposed(
    address landOwner,
    uint256 indexed slotId,
    uint256 newPercentage,
    uint256 confirmableAt
  );
  event TaxRateUpdateConfirmed(
    address landOwner,
    uint256 indexed slotId,
    uint256 oldPercentage,
    uint256 newPercentage
  );
  event TaxRateUpdateCancelled(address landOwner, uint256 indexed slotId);
  event SlotDeactivated(address landOwner, uint256 indexed slotId);
  event SlotActivated(address landOwner, uint256 indexed slotId);
  event FlowOperation(
    address indexed from,
    address indexed to,
    int96 oldRate,
    int96 newRate,
    string operation
  );
}
