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
    ) internal pure {
        if (config.mutableTax || config.mutableModule) {
            if (config.manager == address(0))
                revert InvalidConfig_ManagerRequired();
        } else {
            if (config.manager != address(0))
                revert InvalidConfig_ManagerMustBeZero();
        }
        if (initParams.taxPercentage == 0) revert InvalidTaxPercentage();
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
