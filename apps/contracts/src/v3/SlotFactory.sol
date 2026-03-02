// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Slot} from "./Slot.sol";
import {SlotConfig, SlotInitParams, ISlotEvents} from "./ISlot.sol";

/// @title SlotFactory — Deploy Harberger-taxed slots via ERC-1167 clones
contract SlotFactory {
    using Clones for address;

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error InvalidConfig_ManagerRequired();
    error InvalidConfig_ManagerMustBeZero();
    error InvalidTaxPercentage();
    error InvalidCount();

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

    event ModuleVerified(address indexed module, bool verified, string name, string version);

    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice Slot implementation (clone source)
    address public immutable implementation;

    /// @notice Verified modules registry (informational, non-blocking)
    mapping(address => bool) public verifiedModules;

    /// @notice Factory admin (can verify modules)
    address public admin;

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(address _admin) {
        implementation = address(new Slot());
        admin = _admin;
    }

    // ═══════════════════════════════════════════════════════════
    // DEPLOYMENT
    // ═══════════════════════════════════════════════════════════

    /// @notice Deploy a new Slot contract
    function createSlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) external returns (address slot) {
        _validateConfig(config, initParams);
        slot = _deploySlot(recipient, currency, config, initParams);
    }

    /// @notice Deploy multiple Slot contracts with the same params
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
    // MODULE REGISTRY (informational, non-blocking)
    // ═══════════════════════════════════════════════════════════

    /// @notice Mark a module as verified/unverified (admin only)
    function setModuleVerified(
        address module,
        bool verified,
        string memory name,
        string memory version
    ) external {
        require(msg.sender == admin, "Not admin");
        verifiedModules[module] = verified;
        emit ModuleVerified(module, verified, name, version);
    }

    /// @notice Check if a module is verified
    function isModuleVerified(address module) external view returns (bool) {
        return verifiedModules[module];
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════

    function _validateConfig(SlotConfig memory config, SlotInitParams memory initParams) internal pure {
        if (config.mutableTax || config.mutableModule) {
            if (config.manager == address(0)) revert InvalidConfig_ManagerRequired();
        } else {
            if (config.manager != address(0)) revert InvalidConfig_ManagerMustBeZero();
        }
        if (initParams.taxPercentage == 0) revert InvalidTaxPercentage();
    }

    function _deploySlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) internal returns (address slot) {
        slot = implementation.clone();
        Slot(slot).initialize(recipient, currency, config, initParams);
        emit SlotDeployed(slot, recipient, address(currency), config, initParams);
    }
}
