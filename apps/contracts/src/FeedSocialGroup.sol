// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin-upgradeable/contracts/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IFeedPostModule {
    function updateMetadataFor(
        address account,
        address slot,
        string calldata uri
    ) external;
}

/// @title FeedSocialGroup
/// @notice UUPS-upgradeable signing relay for group-owned slots.
///         The contract holds slot occupancy. Anyone can submit a post
///         by providing an EIP-712 signature from the owner.
contract FeedSocialGroup is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    EIP712Upgradeable
{
    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error InvalidSignature();
    error NonceAlreadyUsed();

    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════

    IFeedPostModule public feedModule;

    /// @notice Replay protection for signature-based posts
    mapping(bytes32 => bool) public usedNonces;

    // ═══════════════════════════════════════════════════════════
    // EIP-712
    // ═══════════════════════════════════════════════════════════

    bytes32 public constant POST_TYPEHASH =
        keccak256("Post(address slot,string uri,bytes32 nonce)");

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _feedModule
    ) external initializer {
        __Ownable_init(initialOwner);
        __EIP712_init("FeedSocialGroup", "1");
        feedModule = IFeedPostModule(_feedModule);
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════

    function setFeedModule(address _feedModule) external onlyOwner {
        feedModule = IFeedPostModule(_feedModule);
    }

    // ═══════════════════════════════════════════════════════════
    // POSTING
    // ═══════════════════════════════════════════════════════════

    /// @notice Post metadata via EIP-712 signature from the owner.
    ///         Anyone can submit the tx — only the owner can sign.
    /// @param slot The slot this group occupies
    /// @param uri The metadata URI
    /// @param nonce Unique nonce for replay protection
    /// @param signature EIP-712 signature from the owner
    function post(
        address slot,
        string calldata uri,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        usedNonces[nonce] = true;

        bytes32 structHash = keccak256(
            abi.encode(POST_TYPEHASH, slot, keccak256(bytes(uri)), nonce)
        );
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), signature);

        if (signer != owner()) revert InvalidSignature();

        feedModule.updateMetadataFor(signer, slot, uri);
    }

    // ═══════════════════════════════════════════════════════════
    // UUPS
    // ═══════════════════════════════════════════════════════════

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
