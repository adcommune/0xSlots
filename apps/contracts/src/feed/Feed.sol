// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SlotConfig, SlotInitParams, SlotInfo} from "../interfaces/ISlot.sol";
import {IFeed} from "../interfaces/IFeed.sol";

interface ISlotFactory {
    function createSlots(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams,
        uint256 count
    ) external returns (address[] memory);
}

interface ISlotView {
    function getSlotInfo() external view returns (SlotInfo memory);
}

/// @title Feed
/// @notice Feed identity (name, updateable metadataURI, declared non-custodial
///         recipient) plus its slot set. The owner mints slots incrementally via
///         `createSlots` — each minted slot carries the feed module (injected by
///         the hub, immutable) and is module-verified; arbitrary addresses can
///         never be added. Batching keeps each tx under RPC gas caps.
contract Feed is Initializable, OwnableUpgradeable, IFeed {
    struct SlotTier {
        uint256 taxPercentage;
        uint256 liquidationBountyBps;
        uint256 minDepositSeconds;
        uint256 count;
    }

    string private _name;
    string private _metadataURI;
    address private _feedRecipient;
    address public slotFactory;
    address public feedModule;
    address public currency;
    address[] private _slots;

    event NameUpdated(string name);
    event MetadataURIUpdated(string uri);
    event RecipientUpdated(address indexed recipient);
    event SlotAdded(address indexed slot);

    error ZeroRecipient();
    error NoTiers();
    error ModuleMismatch(address slot, address got, address expected);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_,
        address slotFactory_,
        address feedModule_,
        address currency_
    ) external initializer {
        __Ownable_init(owner_);
        if (recipient_ == address(0)) revert ZeroRecipient();
        _name = name_;
        _metadataURI = metadataURI_;
        _feedRecipient = recipient_;
        slotFactory = slotFactory_;
        feedModule = feedModule_;
        currency = currency_;
    }

    /// @notice Mint slots (with the feed module) and append them. Owner may call
    ///         repeatedly to grow the feed in gas-bounded batches.
    function createSlots(SlotTier[] calldata tiers) external onlyOwner {
        if (tiers.length == 0) revert NoTiers();
        for (uint256 t = 0; t < tiers.length; t++) {
            if (tiers[t].count == 0) continue;
            address[] memory created = ISlotFactory(slotFactory).createSlots(
                _feedRecipient,
                IERC20(currency),
                SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
                SlotInitParams({
                    taxPercentage: tiers[t].taxPercentage,
                    module: feedModule,
                    liquidationBountyBps: tiers[t].liquidationBountyBps,
                    minDepositSeconds: tiers[t].minDepositSeconds
                }),
                tiers[t].count
            );
            for (uint256 j = 0; j < created.length; j++) {
                address got = ISlotView(created[j]).getSlotInfo().module;
                if (got != feedModule) revert ModuleMismatch(created[j], got, feedModule);
                _slots.push(created[j]);
                emit SlotAdded(created[j]);
            }
        }
    }

    function name() external view returns (string memory) { return _name; }
    function metadataURI() external view returns (string memory) { return _metadataURI; }
    function feedRecipient() external view returns (address) { return _feedRecipient; }
    function getSlots() external view returns (address[] memory) { return _slots; }
    function slotCount() external view returns (uint256) { return _slots.length; }

    function setName(string calldata name_) external onlyOwner {
        _name = name_;
        emit NameUpdated(name_);
    }

    function setMetadataURI(string calldata uri_) external onlyOwner {
        _metadataURI = uri_;
        emit MetadataURIUpdated(uri_);
    }

    function setFeedRecipient(address recipient_) external onlyOwner {
        if (recipient_ == address(0)) revert ZeroRecipient();
        _feedRecipient = recipient_;
        emit RecipientUpdated(recipient_);
    }
}
