// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISlotsModule} from "../ISlotsModule.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

/// @title MetadataModule
/// @notice UUPS-upgradeable module that stores a URI per slot. Only the slot's occupant can update.
/// @dev msg.sender in hooks = the slot contract calling the module.
contract MetadataModule is Initializable, UUPSUpgradeable, OwnableUpgradeable, ISlotsModule {
    /// @notice slot address => URI
    mapping(address => string) public tokenURI;

    event MetadataUpdated(address indexed slot, string uri);

    error NotOccupant();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /// @notice Update the URI for a slot. Only callable by the current occupant.
    /// @param slot The slot contract address
    /// @param uri The new URI (e.g. ipfs://...)
    function updateMetadata(address slot, string calldata uri) external {
        (bool ok, bytes memory data) = slot.staticcall(abi.encodeWithSignature("occupant()"));
        require(ok, "occupant() call failed");
        address occupant = abi.decode(data, (address));
        if (msg.sender != occupant) revert NotOccupant();

        tokenURI[slot] = uri;
        emit MetadataUpdated(slot, uri);
    }

    // ── Module hooks ──────────────────────────────────────────

    function onTransfer(uint256, address, address) external override {}

    function onPriceUpdate(uint256, uint256, uint256) external override {}

    function onRelease(uint256, address) external override {
        delete tokenURI[msg.sender];
        emit MetadataUpdated(msg.sender, "");
    }

    // ── ERC-165 ───────────────────────────────────────────────

    function name() external pure override returns (string memory) {
        return "MetadataModule";
    }

    function version() external pure override returns (string memory) {
        return "1.0.0";
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(ISlotsModule).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    // ── UUPS ──────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
