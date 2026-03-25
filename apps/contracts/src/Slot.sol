// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISlotsModule} from "./ISlotsModule.sol";
import {SlotConfig, SlotInitParams, PendingUpdate, SlotInfo, ISlotEvents, EVT_BOUGHT, EVT_RELEASED, EVT_LIQUIDATED, EVT_PRICE_UPDATED, EVT_DEPOSITED, EVT_WITHDRAWN, EVT_TAX_COLLECTED, EVT_SETTLED} from "./ISlot.sol";
import {SlotFactory} from "./SlotFactory.sol";

/// @title Slot (v3) — Immutable & modular Harberger-taxed slot
/// @notice One slot = one contract. Deployed deterministically via SlotFactory.
contract Slot is ISlotEvents, Initializable, ReentrancyGuard, Multicall {
    using SafeERC20 for IERC20;

    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MONTH = 30 days;

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error NotManager();
    error NotOccupant();
    error CannotBuyFromYourself();
    error InvalidPrice();
    error InvalidTaxPercentage();
    error InsufficientDeposit();
    error NotInsolvent();
    error NothingToCollect();

    error TaxNotMutable();
    error ModuleNotMutable();
    error NoPendingUpdate();
    error InvalidLiquidationBounty();
    error InvalidRecipient();
    error InvalidCurrency();

    // ═══════════════════════════════════════════════════════════
    // STORAGE — KEEP ORDER, APPEND ONLY
    // ═══════════════════════════════════════════════════════════

    // --- Slot 0-2: identity (set in initialize, never changed) ---
    address public recipient;           // slot 0
    IERC20 public currency;             // slot 1, offset 0
    bool public mutableTax;             // slot 1, offset 20
    bool public mutableModule;          // slot 1, offset 21
    address public manager;             // slot 2

    // --- Slot 3+: mutable state ---
    address public occupant;            // slot 3
    uint256 public price;               // slot 4
    uint256 public taxPercentage;       // slot 5
    address public module;              // slot 6
    uint256 public liquidationBountyBps; // slot 7
    uint256 public minDepositSeconds;   // slot 8

    uint256 public deposit;             // slot 9
    uint256 public lastSettled;         // slot 10
    uint256 public collectedTax;        // slot 11

    PendingUpdate public pendingUpdate; // slots 12-13

    /// @dev Legacy manual init flag — DO NOT REMOVE (preserves storage layout)
    bool private _legacyInitialized;    // slot 14

    // --- v2 storage (appended after beacon upgrade) ---
    address public factory;             // slot 15

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice v1 init — called by SlotFactory after beacon proxy deployment
    /// @dev For new slots deployed after the v2 upgrade, initialize + initializeV2
    ///      are both called atomically via multicall in the factory.
    /// @dev Uses both legacy flag (for pre-upgrade slots) and OZ initializer (for new slots)
    function initialize(
        address _recipient,
        IERC20 _currency,
        SlotConfig memory _config,
        SlotInitParams memory _init
    ) external initializer {
        // Guard against re-initialization on pre-upgrade slots where OZ version is 0
        require(!_legacyInitialized, "already initialized");
        _legacyInitialized = true;
        if (_recipient == address(0)) revert InvalidRecipient();
        if (address(_currency) == address(0)) revert InvalidCurrency();
        if (_init.taxPercentage == 0) revert InvalidTaxPercentage();
        if (_init.liquidationBountyBps > BASIS_POINTS) revert InvalidLiquidationBounty();

        recipient = _recipient;
        currency = _currency;
        mutableTax = _config.mutableTax;
        mutableModule = _config.mutableModule;
        manager = _config.manager;

        taxPercentage = _init.taxPercentage;
        module = _init.module;
        liquidationBountyBps = _init.liquidationBountyBps;
        minDepositSeconds = _init.minDepositSeconds;

        lastSettled = block.timestamp;
    }

    /// @notice v2 upgrade — sets factory for protocol event emission
    function initializeV2(address _factory) external reinitializer(2) {
        factory = _factory;
    }

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyManager() {
        if (msg.sender != manager) revert NotManager();
        _;
    }

    modifier onlyOccupant() {
        if (msg.sender != occupant) revert NotOccupant();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // CORE
    // ═══════════════════════════════════════════════════════════

    /// @notice Buy the slot. If vacant (price=0), just deposit and self-assess.
    function buy(uint256 depositAmount, uint256 selfAssessedPrice) external nonReentrant {
        if (selfAssessedPrice == 0) revert InvalidPrice();
        if (msg.sender == occupant) revert CannotBuyFromYourself();

        uint256 currentPrice = price;
        address prev = occupant;

        // Settle outstanding tax
        if (prev != address(0)) {
            _settle();
        }

        // Apply pending updates (ownership is transitioning)
        _applyPendingUpdates();

        // Enforce minimum deposit (using potentially updated tax rate)
        _enforceMinDeposit(depositAmount, selfAssessedPrice);

        if (prev == address(0)) {
            // Vacant: buyer just deposits, no payment to anyone
            if (depositAmount > 0) {
                currency.safeTransferFrom(msg.sender, address(this), depositAmount);
            }
        } else {
            // Occupied: buyer pays price + deposit in one transfer
            uint256 totalFromBuyer = currentPrice + depositAmount;
            if (totalFromBuyer > 0) {
                currency.safeTransferFrom(msg.sender, address(this), totalFromBuyer);
            }

            // Refund previous occupant: their remaining deposit + purchase price
            uint256 refund = deposit + currentPrice;
            deposit = 0;
            if (refund > 0) {
                currency.safeTransfer(prev, refund);
            }
        }

        // Update state
        occupant = msg.sender;
        price = selfAssessedPrice;
        deposit = depositAmount;
        lastSettled = block.timestamp;

        _notifyModule("onTransfer", abi.encodeCall(ISlotsModule.onTransfer, (0, prev, msg.sender)));

        emit Bought(msg.sender, prev, currentPrice, depositAmount, selfAssessedPrice);
        _emitProtocolEvent(EVT_BOUGHT, abi.encode(msg.sender, prev, currentPrice, depositAmount, selfAssessedPrice));
    }

    /// @notice Occupant releases the slot (voluntary exit)
    function release() external nonReentrant onlyOccupant {
        _settle();

        address prev = occupant;
        uint256 refund = deposit;

        // Flush collected tax to recipient
        uint256 pendingTax = collectedTax;
        if (pendingTax > 0) {
            collectedTax = 0;
            currency.safeTransfer(recipient, pendingTax);
        }

        // Clear slot
        occupant = address(0);
        price = 0;
        deposit = 0;
        lastSettled = block.timestamp;

        // Apply pending updates (slot is now vacant)
        _applyPendingUpdates();

        if (refund > 0) {
            currency.safeTransfer(prev, refund);
        }

        _notifyModule("onRelease", abi.encodeCall(ISlotsModule.onRelease, (0, prev)));

        emit Released(prev, refund);
        _emitProtocolEvent(EVT_RELEASED, abi.encode(prev, refund));
    }

    /// @notice Occupant self-assesses a new price
    function selfAssess(uint256 newPrice) external nonReentrant onlyOccupant {
        if (newPrice == 0) revert InvalidPrice();

        _settle();

        uint256 oldPrice = price;
        price = newPrice;

        // Ensure remaining deposit still meets minimum after price change
        _enforceMinDepositExisting(newPrice);

        _notifyModule("onPriceUpdate", abi.encodeCall(ISlotsModule.onPriceUpdate, (0, oldPrice, newPrice)));

        emit PriceUpdated(oldPrice, newPrice);
        _emitProtocolEvent(EVT_PRICE_UPDATED, abi.encode(oldPrice, newPrice));
    }

    // ═══════════════════════════════════════════════════════════
    // ESCROW
    // ═══════════════════════════════════════════════════════════

    /// @notice Occupant tops up their deposit
    function topUp(uint256 amount) external nonReentrant onlyOccupant {
        _settle();
        currency.safeTransferFrom(msg.sender, address(this), amount);
        deposit += amount;
        emit Deposited(msg.sender, amount);
        _emitProtocolEvent(EVT_DEPOSITED, abi.encode(msg.sender, amount));
    }

    /// @notice Occupant withdraws excess deposit
    function withdraw(uint256 amount) external nonReentrant onlyOccupant {
        _settle();
        if (amount > deposit) revert InsufficientDeposit();

        uint256 remaining = deposit - amount;
        uint256 minDep = _minDepositFor(price);
        if (remaining < minDep) revert InsufficientDeposit();

        deposit = remaining;
        currency.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
        _emitProtocolEvent(EVT_WITHDRAWN, abi.encode(msg.sender, amount));
    }

    /// @notice Liquidate an insolvent occupant
    function liquidate() external nonReentrant {
        if (occupant == address(0)) revert NotInsolvent();
        _settle();
        if (deposit > 0) revert NotInsolvent();

        address prev = occupant;

        // Calculate bounty from collected tax
        uint256 bounty = 0;
        if (liquidationBountyBps > 0 && collectedTax > 0) {
            bounty = (collectedTax * liquidationBountyBps) / BASIS_POINTS;
            collectedTax -= bounty;
        }

        // Flush remaining collected tax to recipient
        uint256 remainingTax = collectedTax;
        if (remainingTax > 0) {
            collectedTax = 0;
            currency.safeTransfer(recipient, remainingTax);
        }

        // Clear slot
        occupant = address(0);
        price = 0;
        lastSettled = block.timestamp;

        // Apply pending updates
        _applyPendingUpdates();

        // Pay bounty
        if (bounty > 0) {
            currency.safeTransfer(msg.sender, bounty);
        }

        _notifyModule("onRelease", abi.encodeCall(ISlotsModule.onRelease, (0, prev)));

        emit Liquidated(msg.sender, prev, bounty);
        _emitProtocolEvent(EVT_LIQUIDATED, abi.encode(msg.sender, prev, bounty));
    }

    /// @notice Flush accumulated tax to recipient
    function collect() external nonReentrant {
        _settle();
        uint256 amount = collectedTax;
        if (amount == 0) revert NothingToCollect();
        collectedTax = 0;
        currency.safeTransfer(recipient, amount);
        emit TaxCollected(recipient, amount);
        _emitProtocolEvent(EVT_TAX_COLLECTED, abi.encode(recipient, amount));
    }

    // ═══════════════════════════════════════════════════════════
    // MANAGER: PENDING UPDATES
    // ═══════════════════════════════════════════════════════════

    /// @notice Propose a new tax rate (applied on next ownership transition)
    function proposeTaxUpdate(uint256 newPct) external onlyManager {
        if (!mutableTax) revert TaxNotMutable();
        if (newPct == 0) revert InvalidTaxPercentage();

        pendingUpdate.newTaxPercentage = newPct;
        pendingUpdate.hasTaxUpdate = true;

        emit TaxUpdateProposed(newPct);
    }

    /// @notice Propose a new module (applied on next ownership transition)
    function proposeModuleUpdate(address newModule) external onlyManager {
        if (!mutableModule) revert ModuleNotMutable();

        pendingUpdate.newModule = newModule;
        pendingUpdate.hasModuleUpdate = true;

        emit ModuleUpdateProposed(newModule);
    }

    /// @notice Cancel all pending updates
    function cancelPendingUpdates() external onlyManager {
        if (!pendingUpdate.hasTaxUpdate && !pendingUpdate.hasModuleUpdate) revert NoPendingUpdate();
        delete pendingUpdate;
        emit PendingUpdateCancelled();
    }

    /// @notice Update liquidation bounty (immediate, doesn't affect current occupant terms)
    function setLiquidationBounty(uint256 newBps) external onlyManager {
        if (newBps > BASIS_POINTS) revert InvalidLiquidationBounty();
        liquidationBountyBps = newBps;
        emit LiquidationBountyUpdated(newBps);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW
    // ═══════════════════════════════════════════════════════════

    function taxOwed() public view returns (uint256) {
        if (occupant == address(0)) return 0;
        uint256 elapsed = block.timestamp - lastSettled;
        return (price * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);
    }

    function secondsUntilLiquidation() public view returns (uint256) {
        if (occupant == address(0)) return type(uint256).max;
        uint256 owed = taxOwed();
        uint256 remaining = deposit > owed ? deposit - owed : 0;
        uint256 taxNumerator = price * taxPercentage;
        if (taxNumerator == 0) return type(uint256).max;
        return (remaining * MONTH * BASIS_POINTS) / taxNumerator;
    }

    function isInsolvent() public view returns (bool) {
        if (occupant == address(0)) return false;
        return taxOwed() >= deposit;
    }

    function isVacant() public view returns (bool) {
        return occupant == address(0);
    }

    function getPendingUpdate() external view returns (PendingUpdate memory) {
        return pendingUpdate;
    }

    /// @notice Returns complete slot state in a single call
    function getSlotInfo() external view returns (SlotInfo memory info) {
        info.recipient = recipient;
        info.currency = address(currency);
        info.manager = manager;
        info.mutableTax = mutableTax;
        info.mutableModule = mutableModule;

        info.occupant = occupant;
        info.price = price;
        info.taxPercentage = taxPercentage;
        info.module = module;
        info.liquidationBountyBps = liquidationBountyBps;
        info.minDepositSeconds = minDepositSeconds;

        info.deposit = deposit;
        info.collectedTax = collectedTax;
        info.taxOwed = taxOwed();
        info.secondsUntilLiquidation = secondsUntilLiquidation();
        info.insolvent = isInsolvent();

        info.hasPendingTax = pendingUpdate.hasTaxUpdate;
        info.pendingTaxPercentage = pendingUpdate.newTaxPercentage;
        info.hasPendingModule = pendingUpdate.hasModuleUpdate;
        info.pendingModule = pendingUpdate.newModule;
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════

    function _settle() internal {
        if (occupant == address(0)) {
            lastSettled = block.timestamp;
            return;
        }
        uint256 elapsed = block.timestamp - lastSettled;
        if (elapsed == 0) return;

        uint256 owed = (price * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);

        uint256 paid;
        if (owed >= deposit) {
            paid = deposit;
            collectedTax += deposit;
            deposit = 0;
        } else {
            paid = owed;
            deposit -= owed;
            collectedTax += owed;
        }
        lastSettled = block.timestamp;

        emit Settled(owed, paid, deposit);
    }

    function _applyPendingUpdates() internal {
        if (!pendingUpdate.hasTaxUpdate && !pendingUpdate.hasModuleUpdate) return;

        uint256 newTax = taxPercentage;
        address newMod = module;

        if (pendingUpdate.hasTaxUpdate) {
            newTax = pendingUpdate.newTaxPercentage;
            taxPercentage = newTax;
        }
        if (pendingUpdate.hasModuleUpdate) {
            newMod = pendingUpdate.newModule;
            module = newMod;
        }

        delete pendingUpdate;

        emit PendingUpdateApplied(newTax, newMod);
    }

    function _minDepositFor(uint256 _price) internal view returns (uint256) {
        if (minDepositSeconds == 0) return 0;
        return (_price * taxPercentage * minDepositSeconds) / (MONTH * BASIS_POINTS);
    }

    function _enforceMinDeposit(uint256 depositAmount, uint256 _price) internal view {
        uint256 minDep = _minDepositFor(_price);
        if (depositAmount < minDep) revert InsufficientDeposit();
    }

    function _enforceMinDepositExisting(uint256 _price) internal view {
        uint256 minDep = _minDepositFor(_price);
        if (deposit < minDep) revert InsufficientDeposit();
    }

    function _notifyModule(string memory name, bytes memory data) internal {
        if (module == address(0)) return;
        (bool ok,) = module.call{gas: 500_000}(data);
        if (!ok) emit ModuleCallFailed(name);
    }

    function _emitProtocolEvent(uint8 eventType, bytes memory data) internal {
        if (factory == address(0)) return;
        try SlotFactory(factory).emitEvent(eventType, data) {} catch {}
    }
}
