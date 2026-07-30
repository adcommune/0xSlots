// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "./Slot.sol";
import {SlotConfig, SlotInitParams, ISlotEvents} from "./interfaces/ISlot.sol";
import {ISlotsModule} from "./interfaces/ISlotsModule.sol";
import {IOccupancyPolicy} from "./interfaces/IOccupancyPolicy.sol";

/// @title SlotFactory — Deploy Harberger-taxed slots via Beacon Proxy
/// @notice UUPS-upgradeable factory. All slots delegate to a shared beacon.
///         Upgrading the beacon upgrades all slots. Upgrading the factory upgrades deployment logic.
contract SlotFactory is UUPSUpgradeable {
    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error InvalidConfig_ManagerRequired();
    error InvalidConfig_ManagerMustBeZero();
    error InvalidTaxPercentage();
    error InvalidCount();
    error NotAdmin();
    error AlreadyInitialized();
    error InvalidModule_NoCode();

    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════

    event SlotDeployed(
        address indexed slot,
        address indexed recipient,
        address indexed currency,
        SlotConfig config,
        SlotInitParams initParams
    );

    event ModuleVerified(
        address indexed module,
        bool verified,
        string name,
        string version,
        uint256 feeBps,
        string moduleURI
    );
    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );
    event SlotEvent(address indexed slot, uint8 indexed eventType, bytes data);
    event BeaconUpgraded(address indexed newImplementation);

    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice The UpgradeableBeacon that all slot proxies point to
    UpgradeableBeacon public beacon;

    /// @notice Verified modules registry (informational, non-blocking)
    mapping(address => bool) public verifiedModules;

    /// @notice Factory admin (can upgrade factory, upgrade beacon, verify modules)
    address public admin;

    bool private _initialized;

    /// @notice Tracks deployed slots for emitEvent authorization
    mapping(address => bool) public isSlot;

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _initialized = true; // Disable init on implementation
    }

    /// @notice Initialize the factory (called once via proxy)
    /// @param _admin Admin address (owns beacon + can upgrade factory + verify modules)
    /// @param _slotImplementation Address of the Slot implementation contract
    function initialize(address _admin, address _slotImplementation) external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;

        admin = _admin;
        beacon = new UpgradeableBeacon(_slotImplementation, _admin);
    }

    // ═══════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════

    /// @notice Transfer admin role
    function transferAdmin(address newAdmin) external onlyAdmin {
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // ═══════════════════════════════════════════════════════════
    // DEPLOYMENT
    // ═══════════════════════════════════════════════════════════

    /// @notice Deploy a new Slot as a BeaconProxy
    function createSlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) external returns (address slot) {
        _validateConfig(config, initParams);
        slot = _deploySlot(recipient, currency, config, initParams);
    }

    /// @notice Deploy multiple Slot BeaconProxies with the same params
    function createSlots(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams,
        uint256 count
    ) external returns (address[] memory slots) {
        if (count == 0) revert InvalidCount();
        _validateConfig(config, initParams);

        slots = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            slots[i] = _deploySlot(recipient, currency, config, initParams);
        }
    }

    /// @notice Deploy a Slot with v3 params (epoch length + occupancy policy).
    /// @dev `createSlot` is retained unchanged — extending SlotInitParams would
    ///      change the tuple signature and therefore the selector, breaking
    ///      every published ABI.
    function createSlotV3(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams,
        uint64 epochSeconds,
        address occupancyPolicy
    ) external returns (address slot) {
        _validateConfig(config, initParams);
        if (occupancyPolicy != address(0) && occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        slot = _deploySlot(recipient, currency, config, initParams);
        Slot(slot).initializeV3(epochSeconds, occupancyPolicy);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEWS
    // ═══════════════════════════════════════════════════════════

    /// @notice Current Slot implementation address (from beacon)
    function implementation() external view returns (address) {
        return beacon.implementation();
    }

    // ═══════════════════════════════════════════════════════════
    // MODULE REGISTRY (informational, non-blocking)
    // ═══════════════════════════════════════════════════════════

    /// @notice Mark a module as verified/unverified (admin only)
    function setModuleVerified(
        address _module,
        bool verified
    ) external onlyAdmin {
        ISlotsModule mod = ISlotsModule(_module);
        // Verify it implements the interface
        require(
            mod.supportsInterface(type(ISlotsModule).interfaceId),
            "not ISlotsModule"
        );
        verifiedModules[_module] = verified;
        emit ModuleVerified(
            _module,
            verified,
            mod.name(),
            mod.version(),
            mod.feeBps(),
            mod.moduleURI()
        );
    }

    /// @notice Check if a module is verified
    function isModuleVerified(address module) external view returns (bool) {
        return verifiedModules[module];
    }

    // ═══════════════════════════════════════════════════════════
    // OCCUPANCY POLICY REGISTRY (informational, non-blocking)
    // ═══════════════════════════════════════════════════════════

    /// @notice Verified occupancy policies (informational, non-blocking)
    mapping(address => bool) public verifiedPolicies;

    event PolicyVerified(
        address indexed policy,
        bool verified,
        string name,
        string version,
        string policyURI
    );

    /// @notice Mark an occupancy policy verified/unverified (admin only)
    function setPolicyVerified(address _policy, bool verified) external onlyAdmin {
        IOccupancyPolicy p = IOccupancyPolicy(_policy);
        require(
            p.supportsInterface(type(IOccupancyPolicy).interfaceId),
            "not IOccupancyPolicy"
        );
        verifiedPolicies[_policy] = verified;
        emit PolicyVerified(_policy, verified, p.name(), p.version(), p.policyURI());
    }

    // ═══════════════════════════════════════════════════════════
    // BATCH OPERATIONS
    // ═══════════════════════════════════════════════════════════

    /// @notice Collect tax from multiple slots in a single transaction
    /// @param slots Array of slot addresses to collect from
    /// @return collected Amount collected from each slot (0 if skipped or nothing to collect)
    function collectAll(
        address[] calldata slots
    ) external returns (uint256[] memory collected) {
        collected = new uint256[](slots.length);
        for (uint256 i = 0; i < slots.length; i++) {
            if (!isSlot[slots[i]]) continue;
            Slot s = Slot(slots[i]);
            uint256 tax = s.collectedTax() + s.taxOwed();
            if (tax == 0) continue;
            try s.collect() {
                collected[i] = tax;
            } catch {}
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PROTOCOL EVENT HUB
    // ═══════════════════════════════════════════════════════════

    /// @notice Emit a protocol-wide event (called by slots)
    function emitEvent(uint8 eventType, bytes calldata data) external {
        require(isSlot[msg.sender], "not a slot");
        emit SlotEvent(msg.sender, eventType, data);
    }

    /// @notice Register pre-existing slots deployed before this upgrade (admin only)
    function registerSlots(address[] calldata slots) external onlyAdmin {
        for (uint256 i = 0; i < slots.length; i++) {
            isSlot[slots[i]] = true;
        }
    }

    /// @notice Migrate pre-existing slots: register + initializeV2 in one call (admin only)
    function migrateSlots(address[] calldata slots) external onlyAdmin {
        for (uint256 i = 0; i < slots.length; i++) {
            isSlot[slots[i]] = true;
            Slot(slots[i]).initializeV2(address(this));
        }
    }

    /// @notice Migrate pre-existing slots to v3: register, ensure `factory` is
    ///         set, then set epoch length + occupancy policy (admin only).
    /// @dev `Slot.initializeV3` is authenticated on `msg.sender == factory`, so
    ///      this is the ONLY way a legacy slot can reach v3. The `initializeV2`
    ///      call is wrapped in try/catch because a slot already migrated to v2
    ///      reverts there (`reinitializer(2)`), while one still at v1 needs it
    ///      so that `factory` is populated before the v3 gate reads it.
    function migrateSlotsV3(
        address[] calldata slots,
        uint64 epochSeconds,
        address occupancyPolicy
    ) external onlyAdmin {
        if (occupancyPolicy != address(0) && occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        for (uint256 i = 0; i < slots.length; i++) {
            isSlot[slots[i]] = true;
            try Slot(slots[i]).initializeV2(address(this)) {} catch {}
            Slot(slots[i]).initializeV3(epochSeconds, occupancyPolicy);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BEACON UPGRADES
    // ═══════════════════════════════════════════════════════════

    /// @notice Upgrade the beacon (admin only). Requires the factory to own it.
    /// @dev Beacon ownership starts with `admin` (see `initialize`). Transfer it
    ///      to this factory with `UpgradeableBeacon.transferOwnership` to enable
    ///      this and `upgradeBeaconAndMigrateV3`. Authority is unchanged either
    ///      way — `onlyAdmin` here is the same address that owned the beacon.
    function upgradeBeacon(address newImplementation) external onlyAdmin {
        beacon.upgradeTo(newImplementation);
        emit BeaconUpgraded(newImplementation);
    }

    /// @notice Upgrade the beacon AND migrate legacy slots to v3 atomically.
    /// @dev THIS ATOMICITY IS A SECURITY REQUIREMENT, not a convenience.
    ///
    ///      `Slot.initializeV2` is unauthenticated (a v1 slot has no unforgeable
    ///      notion of its factory). So the instant the beacon serves v3 code, any
    ///      slot still at v1 can be captured by an attacker calling
    ///      `initializeV2(self)` — which sets `factory` to them — and then
    ///      `initializeV3(absurdEpoch, denyAllPolicy)`, which passes the
    ///      `msg.sender == factory` gate. That permanently ends forced sale on
    ///      the slot and strands the next buyer's escrow, with no admin repair
    ///      path (`initializeV3` is a one-shot reinitializer).
    ///
    ///      Doing the upgrade and the migration in two transactions leaves that
    ///      window open in the mempool. Doing them here leaves no window at all.
    ///
    ///      Pass every not-yet-v2 slot on the chain. Slots already at v3 must be
    ///      excluded — `initializeV3` reverts on them and would revert the batch.
    function upgradeBeaconAndMigrateV3(
        address newImplementation,
        address[] calldata slots,
        uint64 epochSeconds,
        address occupancyPolicy
    ) external onlyAdmin {
        if (occupancyPolicy != address(0) && occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();

        beacon.upgradeTo(newImplementation);
        emit BeaconUpgraded(newImplementation);

        for (uint256 i = 0; i < slots.length; i++) {
            isSlot[slots[i]] = true;
            try Slot(slots[i]).initializeV2(address(this)) {} catch {}
            Slot(slots[i]).initializeV3(epochSeconds, occupancyPolicy);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // UUPS
    // ═══════════════════════════════════════════════════════════

    /// @dev Only admin can authorize factory upgrades
    function _authorizeUpgrade(address) internal override onlyAdmin {}

    // ═══════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════

    function _validateConfig(
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) internal view {
        if (config.mutableTax || config.mutableModule) {
            if (config.manager == address(0))
                revert InvalidConfig_ManagerRequired();
        } else {
            if (config.manager != address(0))
                revert InvalidConfig_ManagerMustBeZero();
        }
        if (initParams.taxPercentage == 0) revert InvalidTaxPercentage();

        // Reject non-contract module addresses (e.g. EOA, wrong-chain address).
        // Without this check, getSlotInfo() will revert on the resulting slot.
        if (initParams.module != address(0) && initParams.module.code.length == 0)
            revert InvalidModule_NoCode();
    }

    function _deploySlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) internal returns (address slot) {
        bytes memory initData = abi.encodeCall(
            Slot.initialize,
            (recipient, currency, config, initParams)
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        slot = address(proxy);
        isSlot[slot] = true;
        Slot(slot).initializeV2(address(this));
        emit SlotDeployed(
            slot,
            recipient,
            address(currency),
            config,
            initParams
        );
    }
}
