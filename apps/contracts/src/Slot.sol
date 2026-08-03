// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISlotsModule} from "./interfaces/ISlotsModule.sol";
import {IOccupancyPolicy, OccupancyContext} from "./interfaces/IOccupancyPolicy.sol";
import {SlotConfig, SlotInitParams, PendingUpdate, SlotInfo, ISlotEvents, EVT_BOUGHT, EVT_RELEASED, EVT_LIQUIDATED, EVT_PRICE_UPDATED, EVT_DEPOSITED, EVT_WITHDRAWN, EVT_TAX_COLLECTED, EVT_SETTLED} from "./interfaces/ISlot.sol";
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
    error InvalidModule_NoCode();
    error PolicyNotMutable();
    error NotFactory();
    error NothingToClaim();
    /// @dev Epoch scheduling was removed in v4; `epochSeconds` must be zero.
    error EpochsRemoved();

    // ═══════════════════════════════════════════════════════════
    // STORAGE — KEEP ORDER, APPEND ONLY
    // ═══════════════════════════════════════════════════════════

    // --- Slot 0-2: identity (set in initialize, never changed) ---
    address public recipient; // slot 0
    IERC20 public currency; // slot 1, offset 0
    bool public mutableTax; // slot 1, offset 20
    bool public mutableModule; // slot 1, offset 21
    address public manager; // slot 2

    // --- Slot 3+: mutable state ---
    address private _occupant; // slot 3
    uint256 private _price; // slot 4
    uint256 public taxPercentage; // slot 5
    address public module; // slot 6
    uint256 public liquidationBountyBps; // slot 7
    uint256 public minDepositSeconds; // slot 8

    uint256 private _deposit; // slot 9
    uint256 public lastSettled; // slot 10
    uint256 public collectedTax; // slot 11

    PendingUpdate public pendingUpdate; // slots 12-13

    /// @dev Legacy manual init flag — DO NOT REMOVE (preserves storage layout)
    bool private _legacyInitialized; // slot 14, offset 0

    // --- v2 storage (appended after beacon upgrade) ---
    address public factory; // slot 14, offset 1

    /// @dev NOTE: `_legacyInitialized` (slot 14 offset 0) and `factory`
    ///      (slot 14 offset 1) are PACKED into one slot. First free slot is 15.

    // --- v3 storage (appended after beacon upgrade) ---
    address public occupancyPolicy; // slot 15, offset 0
    uint64 public epochSeconds;     // slot 15, offset 20 — vestigial, see below
    uint256 public occupiedSince;   // slot 16

    struct PendingPolicyUpdate {
        address newPolicy;
        bool hasPolicyUpdate;
    }
    PendingPolicyUpdate public pendingPolicyUpdate; // slot 17

    /// @notice DEAD STORAGE — never read, never written, never removable.
    /// @dev Held a committed-but-not-yet-effective transfer under epoch
    ///      scheduling. That was removed in v4 and every outstanding transfer
    ///      was drained first, so these four slots are permanently zero.
    ///
    ///      They cannot be deleted: `isOperator` (22) and `withdrawableOf` (23)
    ///      sit AFTER them, and removing the struct would shift both mappings
    ///      on every live slot — silently voiding operator approvals and
    ///      unclaimed refunds. Guarded by
    ///      `test_StorageLayout_SurvivesDrainRemoval`.
    struct PendingTransfer {
        address buyer;       // slot 18, offset 0
        uint96 effectiveAt;  // slot 18, offset 20
        uint256 deposit;     // slot 19
        uint256 newPrice;    // slot 20
        uint256 pricePaid;   // slot 21
    }
    PendingTransfer public pendingTransfer;

    /// @notice occupant => operator => approved. Keyed by occupant so approvals
    ///         survive leaving and re-entering, matching setApprovalForAll.
    mapping(address => mapping(address => bool)) public isOperator; // slot 22

    /// @notice Refunds that could not be pushed, claimable with `claim()`.
    /// @dev Escape hatch for a refund recipient the currency refuses to pay —
    ///      a USDC-style blocklist, a contract that reverts on receipt, a token
    ///      returning false. A refund that reverts would otherwise brick the
    ///      entry point that owes it — locking the outgoing occupant's deposit
    ///      and the price paid. Crediting instead keeps the slot fully
    ///      functional and the blocked party whole once they can receive again.
    mapping(address => uint256) public withdrawableOf; // slot 23

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
        if (_init.liquidationBountyBps > BASIS_POINTS)
            revert InvalidLiquidationBounty();

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
    /// @dev DELIBERATELY LEFT UNAUTHENTICATED. A slot still at version 1 holds
    ///      no root of trust that identifies the legitimate factory: the only
    ///      unforgeable datum inside a BeaconProxy is its beacon address, and
    ///      the beacon's owner is the protocol admin, not the factory — while
    ///      `_deploySlot`/`migrateSlots` both call in AS the factory. Every
    ///      candidate guard is therefore self-attested and forgeable:
    ///      `msg.sender == _factory` is satisfied by any EOA passing its own
    ///      address, and any "ask the caller about itself" check
    ///      (`beacon()`, `admin()`, `isSlot()`) is trivially faked by a
    ///      contract. Adding one would be theatre, not a control.
    ///
    ///      The residual exposure is confined to slots deployed BEFORE the v2
    ///      beacon upgrade that were never migrated, and it predates this
    ///      branch. `initializeV3` refuses to run while `factory` is
    ///      address(0), so the mitigation is operational: run
    ///      `migrateSlots`/`migrateSlotsV3` in the same admin transaction as
    ///      the beacon upgrade, leaving no front-run window.
    function initializeV2(address _factory) external reinitializer(2) {
        factory = _factory;
    }

    /// @notice v3 upgrade — sets the occupancy policy.
    /// @dev `_epochSeconds` is retained for ABI compatibility and MUST be zero:
    ///      epoch scheduling was removed in v4 and `buy()` no longer reads it.
    ///      Accepting a non-zero value would write storage nothing honours,
    ///      leaving the slot advertising a delay it does not apply.
    /// @dev The policy defaults to zero, which is exactly pre-v3 behaviour.
    /// @dev AUTHENTICATED. `reinitializer(3)` alone only checks the version is
    ///      below 3 — every slot created by `createSlot`/`createSlots` (and
    ///      every already-deployed slot after the v2 beacon upgrade) sits at
    ///      version 2, so without this gate anyone could install a deny-all
    ///      policy and/or an absurd `epochSeconds`, permanently ending forced
    ///      sale and stranding the next buyer's escrow. `factory == address(0)`
    ///      (a slot that never ran `initializeV2`) is rejected outright rather
    ///      than left open — use `SlotFactory.migrateSlotsV3`.
    function initializeV3(
        uint64 _epochSeconds,
        address _occupancyPolicy
    ) external reinitializer(3) {
        address f = factory;
        if (f == address(0) || msg.sender != f) revert NotFactory();
        if (_epochSeconds != 0) revert EpochsRemoved();
        if (_occupancyPolicy != address(0) && _occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        occupancyPolicy = _occupancyPolicy;

        // Indexers cannot learn these any other way: `createSlotV3` emits the
        // pre-v3 `SlotDeployed` (SlotInitParams was deliberately not extended,
        // to preserve the factory's ABI and selector), so without this event a
        // slot's epoch length and policy are invisible off-chain.
        emit SlotConfiguredV3(_epochSeconds, _occupancyPolicy);
    }

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyManager() {
        if (msg.sender != manager) revert NotManager();
        _;
    }

    modifier onlyOccupant() {
        if (msg.sender != occupant()) revert NotOccupant();
        _;
    }

    /// @dev Uses occupant(), not raw _occupant, so an epoch boundary that has
    ///      passed but not yet been materialised still resolves approvals
    ///      against the correct (incoming) occupant.
    modifier onlyOccupantOrOperator() {
        address occ = occupant();
        if (msg.sender != occ && !isOperator[occ][msg.sender]) revert NotOccupant();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // CORE
    // ═══════════════════════════════════════════════════════════

    /// @notice Buy the slot. `account` becomes the new occupant, `msg.sender` pays.
    /// @param account The address that will occupy the slot
    /// @param depositAmount Deposit to fund the tax escrow
    /// @param selfAssessedPrice The new self-assessed price
    function buy(
        address account,
        uint256 depositAmount,
        uint256 selfAssessedPrice
    ) external nonReentrant {
        if (selfAssessedPrice == 0) revert InvalidPrice();
        if (account == address(0)) revert InvalidRecipient();

        // Settle first so the policy is asked about current, not stale, state.
        // Stage 2 relies on this ordering too — see Task 6.
        _settle();

        if (account == _occupant) revert CannotBuyFromYourself();

        if (occupancyPolicy != address(0)) {
            IOccupancyPolicy(occupancyPolicy).checkBuy(
                _occupancyCtx(account, selfAssessedPrice, depositAmount)
            );
        }

        uint256 currentPrice = _price;
        address prev = _occupant;

        _applyPendingUpdates();

        _enforceMinDeposit(depositAmount, selfAssessedPrice);

        // Pull what the buyer owes. Vacant slots cost only the deposit.
        uint256 owedByBuyer = prev == address(0)
            ? depositAmount
            : currentPrice + depositAmount;
        if (owedByBuyer > 0) {
            currency.safeTransferFrom(msg.sender, address(this), owedByBuyer);
        }

        // Epoch scheduling was removed here. A buy used to be deferred to the
        // next clock boundary when `epochSeconds > 0`, on the theory that it
        // stopped an occupant being sniped by whoever's infrastructure was
        // fastest. It did not: the first commit after a boundary locked
        // everyone else out until the next one, so a two-second latency edge
        // bought a full epoch of exclusivity at a price fixed before that
        // epoch's news — a worse dynamic than the one it replaced.
        //
        // Occupancy timing now lives entirely in IOccupancyPolicy vetoes, which
        // is where it can be expressed without a second phase — MinimumTenure
        // for "not yet", MinimumPrice for "not below this".
        //
        // `epochSeconds` is ignored. `initializeV3` rejects a non-zero value
        // outright, and the storage below it may never be reclaimed — see the
        // note on `pendingTransfer`.

        // Refund the outgoing occupant. Computed here, paid
        // after the state writes, and never allowed to revert: an outgoing
        // occupant the currency refuses to pay must not be able to veto their
        // own forced sale.
        uint256 refund = prev == address(0) ? 0 : _deposit + currentPrice;

        _occupant = account;
        _price = selfAssessedPrice;
        _deposit = depositAmount;
        occupiedSince = block.timestamp;
        lastSettled = block.timestamp;

        if (refund > 0) _payOrCredit(prev, refund);

        _notifyModule(
            "onTransfer",
            abi.encodeCall(ISlotsModule.onTransfer, (0, prev, account))
        );

        emit Bought(account, prev, currentPrice, depositAmount, selfAssessedPrice);
        _emitProtocolEvent(
            EVT_BOUGHT,
            abi.encode(account, prev, currentPrice, depositAmount, selfAssessedPrice)
        );
    }

    /// @notice Occupant releases the slot (voluntary exit)
    function release() external nonReentrant onlyOccupant {
        _settle();

        address prev = _occupant;
        uint256 refund = _deposit;

        // Flush collected tax to recipient
        uint256 pendingTax = collectedTax;
        if (pendingTax > 0) {
            collectedTax = 0;
            currency.safeTransfer(recipient, pendingTax);
        }

        // Clear slot
        _occupant = address(0);
        _price = 0;
        occupiedSince = 0;
        _deposit = 0;
        lastSettled = block.timestamp;

        // Apply pending updates (slot is now vacant)
        _applyPendingUpdates();

        if (refund > 0) {
            currency.safeTransfer(prev, refund);
        }

        _notifyModule(
            "onRelease",
            abi.encodeCall(ISlotsModule.onRelease, (0, prev))
        );

        emit Released(prev, refund);
        _emitProtocolEvent(EVT_RELEASED, abi.encode(prev, refund));
    }

    /// @notice Delegate slot management to an operator (e.g. an agent).
    /// @dev Operators may selfAssess and topUp. They may NOT withdraw or
    ///      release — those move the position's principal and stay
    ///      occupant-only. Bounded authority is the point.
    function setOperator(address operator, bool approved) external {
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
    }

    /// @notice Occupant (or an approved operator) self-assesses a new price
    function selfAssess(uint256 newPrice) external nonReentrant onlyOccupantOrOperator {
        if (newPrice == 0) revert InvalidPrice();

        // Settle first: materialises any matured transfer, so the guard below
        // only rejects a genuinely still-pending one and the policy sees
        // current state.
        _settle();

        if (occupancyPolicy != address(0)) {
            IOccupancyPolicy(occupancyPolicy).checkPriceUpdate(
                _occupancyCtx(occupant(), newPrice, deposit())
            );
        }

        uint256 oldPrice = _price;
        _price = newPrice;

        // Ensure remaining deposit still meets minimum after price change
        _enforceMinDepositExisting(newPrice);

        _notifyModule(
            "onPriceUpdate",
            abi.encodeCall(ISlotsModule.onPriceUpdate, (0, oldPrice, newPrice))
        );

        emit PriceUpdated(oldPrice, newPrice);
        _emitProtocolEvent(EVT_PRICE_UPDATED, abi.encode(oldPrice, newPrice));
    }

    // ═══════════════════════════════════════════════════════════
    // ESCROW
    // ═══════════════════════════════════════════════════════════

    /// @notice Top up the occupant's deposit. Anyone can pay.
    /// @dev Gates on the RESOLVING `occupant()`, not raw `_occupant`. On an
    ///      epoch slot a matured-but-unmaterialised transfer leaves
    ///      `_occupant` stale (possibly address(0), when the slot was bought
    ///      out of vacancy), so a raw read would refuse to fund an occupancy
    ///      that every getter already reports as live.
    function topUp(uint256 amount) external nonReentrant {
        if (occupant() == address(0)) revert NotOccupant();
        _settle();
        currency.safeTransferFrom(msg.sender, address(this), amount);
        _deposit += amount;
        emit Deposited(msg.sender, amount);
        _emitProtocolEvent(EVT_DEPOSITED, abi.encode(msg.sender, amount));
    }

    /// @notice Occupant withdraws excess deposit
    function withdraw(uint256 amount) external nonReentrant onlyOccupant {
        _settle();
        if (amount > _deposit) revert InsufficientDeposit();

        uint256 remaining = _deposit - amount;
        uint256 minDep = _minDepositFor(_price);
        if (remaining < minDep) revert InsufficientDeposit();

        _deposit = remaining;
        currency.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
        _emitProtocolEvent(EVT_WITHDRAWN, abi.encode(msg.sender, amount));
    }

    /// @notice Liquidate an insolvent occupant
    /// @dev Gates on the RESOLVING `occupant()`. Reading raw `_occupant` here
    ///      made a whole class of occupancy unliquidatable: buying a VACANT
    ///      epoch slot with `minDepositSeconds == 0` and a zero deposit leaves
    ///      `_occupant == address(0)` behind a pending transfer, so past the
    ///      boundary `isInsolvent()` was true while `liquidate()` still
    ///      reverted NotInsolvent — a free, unremovable occupancy. The spec's
    ///      first invariant is that liquidation is never vetoable: insolvency
    ///      always ends occupancy.
    function liquidate() external nonReentrant {
        if (occupant() == address(0)) revert NotInsolvent();
        _settle();
        if (_deposit > 0) revert NotInsolvent();

        // Read AFTER _settle(): materialisation has by now written the
        // incoming buyer into `_occupant`, which is who is being liquidated.
        address prev = _occupant;

        // Calculate bounty from collected tax
        uint256 bounty = 0;
        if (liquidationBountyBps > 0 && collectedTax > 0) {
            bounty = (collectedTax * liquidationBountyBps) / BASIS_POINTS;
            collectedTax -= bounty;
        }

        // Flush remaining collected tax to recipient (minus module fee if any)
        uint256 remainingTax = collectedTax;
        if (remainingTax > 0) {
            collectedTax = 0;
            _distributeTax(remainingTax);
        }

        // Clear slot
        _occupant = address(0);
        _price = 0;
        occupiedSince = 0;
        lastSettled = block.timestamp;

        // Apply pending updates
        _applyPendingUpdates();

        // Pay bounty
        if (bounty > 0) {
            currency.safeTransfer(msg.sender, bounty);
        }

        _notifyModule(
            "onRelease",
            abi.encodeCall(ISlotsModule.onRelease, (0, prev))
        );

        emit Liquidated(msg.sender, prev, bounty);
        _emitProtocolEvent(
            EVT_LIQUIDATED,
            abi.encode(msg.sender, prev, bounty)
        );
    }

    /// @notice Withdraw a refund that could not be pushed at the time.
    /// @dev Permissionless in who may CALL it, but the funds always go to
    ///      `account` — a keeper or the account itself can trigger it, nobody
    ///      can redirect it.
    function claim(address account) external nonReentrant {
        uint256 amount = withdrawableOf[account];
        if (amount == 0) revert NothingToClaim();
        withdrawableOf[account] = 0;
        currency.safeTransfer(account, amount);
        emit RefundClaimed(account, amount);
    }

    /// @notice Flush accumulated tax to recipient (minus module fee if any)
    function collect() external nonReentrant {
        _settle();
        uint256 amount = collectedTax;
        if (amount == 0) revert NothingToCollect();
        collectedTax = 0;
        _distributeTax(amount);
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
        if (newModule != address(0) && newModule.code.length == 0)
            revert InvalidModule_NoCode();

        pendingUpdate.newModule = newModule;
        pendingUpdate.hasModuleUpdate = true;

        emit ModuleUpdateProposed(newModule);
    }

    /// @notice Propose a new occupancy policy (applied on next ownership transition)
    function proposePolicyUpdate(address newPolicy) external onlyManager {
        if (!mutableModule) revert ModuleNotMutable();
        if (newPolicy != address(0) && newPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        pendingPolicyUpdate.newPolicy = newPolicy;
        pendingPolicyUpdate.hasPolicyUpdate = true;
        emit PolicyUpdateProposed(newPolicy);
    }

    /// @notice Cancel all pending updates
    function cancelPendingUpdates() external onlyManager {
        if (
            !pendingUpdate.hasTaxUpdate &&
            !pendingUpdate.hasModuleUpdate &&
            !pendingPolicyUpdate.hasPolicyUpdate
        ) revert NoPendingUpdate();
        delete pendingUpdate;
        delete pendingPolicyUpdate;
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

    /// @notice Current occupant. Hand-written rather than an auto-getter
    ///         because `_occupant` is internal.
    function occupant() public view returns (address) {
        return _occupant;
    }

    function price() public view returns (uint256) {
        return _price;
    }

    function deposit() public view returns (uint256) {
        return _deposit;
    }

    function taxOwed() public view returns (uint256) {
        address occ = occupant();
        if (occ == address(0)) return 0;
        uint256 elapsed = block.timestamp - lastSettled;
        return (price() * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);
    }

    function secondsUntilLiquidation() public view returns (uint256) {
        if (occupant() == address(0)) return type(uint256).max;
        uint256 owed = taxOwed();
        uint256 dep = deposit();
        uint256 remaining = dep > owed ? dep - owed : 0;
        uint256 taxNumerator = price() * taxPercentage;
        if (taxNumerator == 0) return type(uint256).max;
        return (remaining * MONTH * BASIS_POINTS) / taxNumerator;
    }

    function isInsolvent() public view returns (bool) {
        if (occupant() == address(0)) return false;
        return taxOwed() >= deposit();
    }

    function isVacant() public view returns (bool) {
        return occupant() == address(0);
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

        info.occupant = occupant();
        info.price = price();
        info.taxPercentage = taxPercentage;
        info.module = module;
        info.liquidationBountyBps = liquidationBountyBps;
        info.minDepositSeconds = minDepositSeconds;

        info.deposit = deposit();
        info.collectedTax = collectedTax;
        info.taxOwed = taxOwed();
        info.secondsUntilLiquidation = secondsUntilLiquidation();
        info.insolvent = isInsolvent();

        // Module info — guard with code-size check to avoid reverts when
        // module address has no deployed code (try/catch does not catch
        // ABI-decode failures from empty returndata).
        if (module != address(0) && module.code.length > 0) {
            ISlotsModule mod = ISlotsModule(module);
            try mod.name() returns (string memory n) { info.moduleName = n; } catch {}
            try mod.version() returns (string memory v) { info.moduleVersion = v; } catch {}
            try mod.feeBps() returns (uint256 f) { info.moduleFeeBps = f; } catch {}
            try mod.feeRecipient() returns (address r) { info.moduleFeeRecipient = r; } catch {}
            try mod.moduleURI() returns (string memory u) { info.moduleURI = u; } catch {}
        }

        info.hasPendingTax = pendingUpdate.hasTaxUpdate;
        info.pendingTaxPercentage = pendingUpdate.newTaxPercentage;
        info.hasPendingModule = pendingUpdate.hasModuleUpdate;
        info.pendingModule = pendingUpdate.newModule;

        info.occupancyPolicy = occupancyPolicy;
        info.epochSeconds = epochSeconds;
        info.occupiedSince = occupiedSince;
        info.hasPendingPolicy = pendingPolicyUpdate.hasPolicyUpdate;
        info.pendingPolicy = pendingPolicyUpdate.newPolicy;
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════

    function _occupancyCtx(
        address account,
        uint256 newPrice,
        uint256 depositAmount
    ) internal view returns (OccupancyContext memory) {
        return OccupancyContext({
            slot: address(this),
            caller: msg.sender,
            account: account,
            occupant: occupant(),
            occupiedSince: occupiedSince,
            taxPercentage: taxPercentage,
            currentPrice: price(),
            newPrice: newPrice,
            depositAmount: depositAmount
        });
    }

    /// @dev Accrue tax for the current occupant up to `upTo`.
    function _accrue(uint256 upTo) internal {
        if (upTo <= lastSettled) return;

        if (_occupant == address(0)) {
            lastSettled = upTo;
            return;
        }

        uint256 elapsed = upTo - lastSettled;
        uint256 owed = (_price * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);

        uint256 paid;
        if (owed >= _deposit) {
            paid = _deposit;
            collectedTax += _deposit;
            _deposit = 0;
        } else {
            paid = owed;
            _deposit -= owed;
            collectedTax += owed;
        }
        lastSettled = upTo;

        emit Settled(owed, paid, _deposit);
    }

    function _settle() internal {
        _accrue(block.timestamp);
    }

    function _applyPendingUpdates() internal {
        if (pendingPolicyUpdate.hasPolicyUpdate) {
            occupancyPolicy = pendingPolicyUpdate.newPolicy;
            emit PolicyUpdateApplied(pendingPolicyUpdate.newPolicy);
            delete pendingPolicyUpdate;
        }

        if (!pendingUpdate.hasTaxUpdate && !pendingUpdate.hasModuleUpdate)
            return;

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

    function _minDepositFor(uint256 price_) internal view returns (uint256) {
        if (minDepositSeconds == 0) return 0;
        return
            (price_ * taxPercentage * minDepositSeconds) /
            (MONTH * BASIS_POINTS);
    }

    function _enforceMinDeposit(
        uint256 depositAmount,
        uint256 price_
    ) internal view {
        uint256 minDep = _minDepositFor(price_);
        if (depositAmount < minDep) revert InsufficientDeposit();
    }

    function _enforceMinDepositExisting(uint256 price_) internal view {
        uint256 minDep = _minDepositFor(price_);
        if (_deposit < minDep) revert InsufficientDeposit();
    }

    /// @dev Pay `to`, and if the currency refuses, credit them instead so the
    ///      slot itself never becomes unusable.
    ///
    ///      This is a try-push-then-credit, not a bare pull payment: the happy
    ///      path (any well-behaved token, any unblocked recipient) still
    ///      settles atomically, which is what every caller and integrator
    ///      already expects, while a blocklisting token or a reverting
    ///      recipient degrades to a claimable credit instead of bricking every
    ///      entry point through `_settle()`.
    ///
    ///      Deliberately a raw `call` rather than `safeTransfer`: SafeERC20
    ///      reverts internally and an internal library call cannot be
    ///      try/caught. The success condition mirrors SafeERC20's — the call
    ///      must succeed AND either return nothing or return true — with the
    ///      extra requirement that the currency actually has code, so a
    ///      codeless address can never be mistaken for a successful payment.
    function _payOrCredit(address to, uint256 amount) internal {
        if (amount == 0) return;

        address token = address(currency);
        bool paid;
        if (token.code.length > 0) {
            (bool ok, bytes memory data) = token.call(
                abi.encodeCall(IERC20.transfer, (to, amount))
            );
            paid = ok && (data.length == 0 || abi.decode(data, (bool)));
        }

        if (!paid) {
            withdrawableOf[to] += amount;
            emit RefundCredited(to, amount);
        }
    }

    /// @dev Query module fee and split tax between module and recipient
    function _distributeTax(uint256 amount) internal {
        uint256 moduleFee = 0;
        uint256 feeBps_ = 0;
        if (module != address(0)) {
            (bool ok, bytes memory data) = module.staticcall(
                abi.encodeWithSignature("feeBps()")
            );
            if (ok && data.length >= 32) {
                uint256 bps = abi.decode(data, (uint256));
                if (bps > 0 && bps <= BASIS_POINTS) {
                    feeBps_ = bps;
                    moduleFee = (amount * bps) / BASIS_POINTS;
                }
            }
        }
        if (moduleFee > 0) {
            // Send fee to module's designated recipient
            address feeTarget = address(0);
            (bool recipientOk, bytes memory recipientData) = module.staticcall(
                abi.encodeWithSignature("feeRecipient()")
            );
            if (recipientOk && recipientData.length >= 32) {
                feeTarget = abi.decode(recipientData, (address));
            }
            if (feeTarget == address(0)) {
                // No valid recipient — skip fee, send all to recipient
                moduleFee = 0;
            } else {
                currency.safeTransfer(feeTarget, moduleFee);
                emit ModuleFeePaid(module, moduleFee, feeBps_);
            }
        }
        currency.safeTransfer(recipient, amount - moduleFee);
    }

    function _notifyModule(string memory name, bytes memory data) internal {
        if (module == address(0)) return;
        (bool ok, ) = module.call{gas: 500_000}(data);
        if (!ok) emit ModuleCallFailed(name);
    }

    function _emitProtocolEvent(uint8 eventType, bytes memory data) internal {
        if (factory == address(0)) return;
        try SlotFactory(factory).emitEvent(eventType, data) {} catch {}
    }
}
