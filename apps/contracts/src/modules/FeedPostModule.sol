// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISlotsModule} from "../interfaces/ISlotsModule.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

/// @title FeedPostModule
/// @notice UUPS-upgradeable module that stores a URI per slot for The Feed.
/// @dev Same pattern as MetadataModule but for feed post content.
contract FeedPostModule is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ISlotsModule
{
    /// @notice slot address => URI
    mapping(address => string) public tokenURI;

    event MetadataUpdated(address indexed slot, string uri);

    error NotOccupant();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
    }

    modifier onlyOccupant(address slot) {
        if (msg.sender != _slotOccupant(slot)) revert NotOccupant();
        _;
    }

    /// @notice Update the URI for a slot. Only callable by the current occupant.
    /// @param slot The slot contract address
    /// @param uri The new URI (e.g. ipfs://...)
    function updateMetadata(
        address slot,
        string calldata uri
    ) external onlyOccupant(slot) {
        tokenURI[slot] = uri;
        emit MetadataUpdated(slot, uri);
    }

    // ── Module hooks ──────────────────────────────────────────

    function onTransfer(uint256, address, address) external override {
        _clearMetadata(msg.sender);
    }

    function onPriceUpdate(uint256, uint256, uint256) external override {}

    function onRelease(uint256, address) external override {
        _clearMetadata(msg.sender);
    }

    /// @notice No fee for feed post module
    function feeBps() external pure override returns (uint256) {
        return 0;
    }

    /// @notice Fee recipient
    function feeRecipient() external pure override returns (address) {
        return 0x78a9e2891a47bAa6Ac9D541317b1278f9628dFf7;
    }

    /// @notice Module metadata URI
    function moduleURI() external pure override returns (string memory) {
        return "";
    }

    // ── ERC-165 ───────────────────────────────────────────────

    function name() external pure override returns (string memory) {
        return "FeedPostModule";
    }

    function version() external pure override returns (string memory) {
        return "1.0.0";
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(ISlotsModule).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    // ── INTERNALS ─────────────────────────────────────────────

    function _clearMetadata(address slot) internal {
        delete tokenURI[slot];
        emit MetadataUpdated(slot, "");
    }

    function _slotOccupant(address slot) internal view returns (address) {
        (bool ok, bytes memory data) = slot.staticcall(
            abi.encodeWithSignature("occupant()")
        );
        require(ok, "occupant() call failed");
        return abi.decode(data, (address));
    }

    // ── UUPS ──────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
