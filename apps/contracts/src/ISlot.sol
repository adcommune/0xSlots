// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ═══════════════════════════════════════════════════════════
// STRUCTS
// ═══════════════════════════════════════════════════════════

/// @notice Immutable identity config — determines CREATE2 address
struct SlotConfig {
    bool mutableTax;
    bool mutableModule;
    address manager; // address(0) if both flags are false
}

/// @notice Initial values set at creation
struct SlotInitParams {
    uint256 taxPercentage;       // basis points (100 = 1%)
    address module;              // hook contract, address(0) for none
    uint256 liquidationBountyBps; // basis points, default 0
    uint256 minDepositSeconds;   // minimum deposit to cover N seconds of tax
}

/// @notice Pending update for tax or module (applied on next ownership transition)
struct PendingUpdate {
    uint256 newTaxPercentage;
    address newModule;
    bool hasTaxUpdate;
    bool hasModuleUpdate;
}

// ═══════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════

interface ISlotEvents {
    event SlotCreated(
        address indexed slot,
        address indexed recipient,
        address indexed currency,
        SlotConfig config,
        SlotInitParams initParams
    );

    event Bought(
        address indexed buyer,
        address indexed previousOccupant,
        uint256 price,
        uint256 deposit,
        uint256 selfAssessedPrice
    );

    event Released(address indexed occupant, uint256 refund);

    event Liquidated(
        address indexed liquidator,
        address indexed occupant,
        uint256 bounty
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    event Deposited(address indexed depositor, uint256 amount);

    event Withdrawn(address indexed occupant, uint256 amount);

    event TaxCollected(address indexed recipient, uint256 amount);

    event Settled(uint256 taxOwed, uint256 depositRemaining);

    event TaxUpdateProposed(uint256 newPercentage);

    event ModuleUpdateProposed(address newModule);

    event PendingUpdateCancelled();

    event PendingUpdateApplied(uint256 newTaxPercentage, address newModule);

    event LiquidationBountyUpdated(uint256 newBps);

    event ModuleCallFailed(string callbackName);
}
