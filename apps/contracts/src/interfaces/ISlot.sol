// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ═══════════════════════════════════════════════════════════
// PROTOCOL EVENT TYPES (used by SlotFactory.emitEvent)
// ═══════════════════════════════════════════════════════════

uint8 constant EVT_BOUGHT = 1;
uint8 constant EVT_RELEASED = 2;
uint8 constant EVT_LIQUIDATED = 3;
uint8 constant EVT_PRICE_UPDATED = 4;
uint8 constant EVT_DEPOSITED = 5;
uint8 constant EVT_WITHDRAWN = 6;
uint8 constant EVT_TAX_COLLECTED = 7;
uint8 constant EVT_SETTLED = 8;

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

/// @notice Complete slot state returned by getSlotInfo()
struct SlotInfo {
    // Identity (immutable)
    address recipient;
    address currency;
    address manager;
    bool mutableTax;
    bool mutableModule;
    // State
    address occupant;
    uint256 price;
    uint256 taxPercentage;
    address module;
    uint256 liquidationBountyBps;
    uint256 minDepositSeconds;
    // Financials (live-computed)
    uint256 deposit;
    uint256 collectedTax;
    uint256 taxOwed;
    uint256 secondsUntilLiquidation;
    bool insolvent;
    // Module info (populated if module != address(0))
    string moduleName;
    string moduleVersion;
    uint256 moduleFeeBps;
    address moduleFeeRecipient;
    string moduleURI;
    // Pending updates
    bool hasPendingTax;
    uint256 pendingTaxPercentage;
    bool hasPendingModule;
    address pendingModule;
    // v3
    address occupancyPolicy;
    uint256 epochSeconds;
    uint256 occupiedSince;
    bool hasPendingPolicy;
    address pendingPolicy;
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

    event ModuleFeePaid(address indexed module, uint256 amount, uint256 feeBps);

    event Settled(uint256 taxOwed, uint256 taxPaid, uint256 depositRemaining);

    /// @notice Tax actually taken from an occupant's deposit, attributed to them.
    /// @dev `Settled` carries the same amounts but not WHO paid, so it cannot be
    ///      reduced into a per-address ledger. This can.
    ///
    ///      Emitted as a NEW event rather than by extending `Settled`, because
    ///      changing an existing event's signature changes its topic0 and would
    ///      split historical indexing across two shapes.
    ///
    ///      `taxPaid` is the number that matters for accounting: it is capped by
    ///      the remaining deposit, so it can be far less than `taxOwed` when an
    ///      occupant is going insolvent. Anything reconstructing contributions
    ///      from `price x time` computes `taxOwed` and will over-credit.
    ///
    ///      Gross of the module fee, which is skimmed later in `_distributeTax`.
    event TaxPaid(
        address indexed occupant,
        uint256 taxOwed,
        uint256 taxPaid
    );

    event TaxUpdateProposed(uint256 newPercentage);

    event ModuleUpdateProposed(address newModule);

    event PendingUpdateCancelled();

    event PendingUpdateApplied(uint256 newTaxPercentage, address newModule);

    event LiquidationBountyUpdated(uint256 newBps);

    event ModuleCallFailed(string callbackName);

    /// @notice Emitted by `initializeV3`. The only on-chain signal carrying a
    ///         slot's epoch length and occupancy policy — `SlotDeployed` predates
    ///         both and was intentionally left unchanged to preserve the
    ///         factory's ABI.
    event SlotConfiguredV3(uint64 epochSeconds, address occupancyPolicy);

    event PolicyUpdateProposed(address newPolicy);

    event PolicyUpdateApplied(address newPolicy);

    event TransferScheduled(
        address indexed buyer,
        uint256 effectiveAt,
        uint256 price,
        uint256 deposit
    );

    event OperatorSet(address indexed occupant, address indexed operator, bool approved);

    /// @notice A refund could not be pushed and was credited for later `claim()`.
    event RefundCredited(address indexed account, uint256 amount);

    /// @notice A previously credited refund was claimed.
    event RefundClaimed(address indexed account, uint256 amount);
}
