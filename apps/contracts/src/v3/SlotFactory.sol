// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Slot} from "./Slot.sol";
import {SlotConfig, SlotInitParams, ISlotEvents} from "./ISlot.sol";

/// @title SlotFactory — Deterministic deployment of Harberger-taxed slots
/// @notice Creates Slot contracts via ERC-1167 clones with CREATE2
contract SlotFactory {
    using Clones for address;

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error InvalidConfig_ManagerRequired();
    error InvalidConfig_ManagerMustBeZero();
    error InvalidTaxPercentage();
    error SlotAlreadyExists();

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

    /// @notice Deploy a new Slot contract deterministically
    /// @param recipient Revenue recipient (immutable)
    /// @param currency Payment token (immutable)
    /// @param config Mutability flags + manager
    /// @param initParams Initial tax, module, bounty, minDeposit
    /// @return slot The deployed Slot address
    function createSlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) external returns (address slot) {
        // Validate config
        if (config.mutableTax || config.mutableModule) {
            if (config.manager == address(0)) revert InvalidConfig_ManagerRequired();
        } else {
            if (config.manager != address(0)) revert InvalidConfig_ManagerMustBeZero();
        }

        if (initParams.taxPercentage == 0) revert InvalidTaxPercentage();

        // Compute deterministic salt from identity params
        bytes32 salt = _computeSalt(recipient, currency, initParams.taxPercentage, initParams.module, config);

        // Deploy clone
        slot = implementation.cloneDeterministic(salt);

        // Initialize
        Slot(slot).initialize(recipient, currency, config, initParams);

        emit SlotDeployed(slot, recipient, address(currency), config, initParams);
    }

    /// @notice Predict the address of a slot before deployment
    function predictSlotAddress(
        address recipient,
        IERC20 currency,
        uint256 taxPercentage,
        address module,
        SlotConfig memory config
    ) external view returns (address) {
        bytes32 salt = _computeSalt(recipient, currency, taxPercentage, module, config);
        return implementation.predictDeterministicAddress(salt);
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

    function _computeSalt(
        address recipient,
        IERC20 currency,
        uint256 taxPercentage,
        address module,
        SlotConfig memory config
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(recipient, currency, taxPercentage, module, config.mutableTax, config.mutableModule));
    }
}
