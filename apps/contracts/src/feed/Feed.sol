// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IFeed} from "../interfaces/IFeed.sol";

interface ISlotFactoryLike {
    function isSlot(address) external view returns (bool);
}

/// @title Feed
/// @notice Owner-curated, beacon-upgradeable feed: name, updateable metadata
///         URI, a declared (non-custodial) recipient, and an ordered slot list.
contract Feed is Initializable, OwnableUpgradeable, IFeed {
    string private _name;
    string private _metadataURI;
    address private _feedRecipient;

    /// @notice SlotFactory used to validate `addSlot` membership (0 disables).
    address public slotFactory;

    address[] private _slots;
    mapping(address => uint256) private _slotIndex1; // 1-based; 0 == absent

    event NameUpdated(string name);
    event MetadataURIUpdated(string uri);
    event RecipientUpdated(address indexed recipient);
    event SlotAdded(address indexed slot);
    event SlotRemoved(address indexed slot);

    error NotASlot(address slot);
    error SlotAlreadyAdded(address slot);
    error SlotNotInFeed(address slot);
    error ZeroRecipient();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_,
        address slotFactory_
    ) external initializer {
        __Ownable_init(owner_);
        if (recipient_ == address(0)) revert ZeroRecipient();
        _name = name_;
        _metadataURI = metadataURI_;
        _feedRecipient = recipient_;
        slotFactory = slotFactory_;
    }

    // ---- IFeed views ----
    function name() external view returns (string memory) {
        return _name;
    }

    function metadataURI() external view returns (string memory) {
        return _metadataURI;
    }

    function feedRecipient() external view returns (address) {
        return _feedRecipient;
    }

    function getSlots() external view returns (address[] memory) {
        return _slots;
    }

    function slotCount() external view returns (uint256) {
        return _slots.length;
    }

    function containsSlot(address slot) external view returns (bool) {
        return _slotIndex1[slot] != 0;
    }

    // ---- owner mutators ----
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

    function addSlot(address slot) public onlyOwner {
        _addSlot(slot);
    }

    function addSlots(address[] calldata slots_) external onlyOwner {
        for (uint256 i = 0; i < slots_.length; i++) {
            _addSlot(slots_[i]);
        }
    }

    /// @dev Swap-and-pop: O(1) but does not preserve order of remaining slots.
    function removeSlot(address slot) external onlyOwner {
        uint256 idx1 = _slotIndex1[slot];
        if (idx1 == 0) revert SlotNotInFeed(slot);
        uint256 i = idx1 - 1;
        uint256 lastIdx = _slots.length - 1;
        if (i != lastIdx) {
            address last = _slots[lastIdx];
            _slots[i] = last;
            _slotIndex1[last] = i + 1;
        }
        _slots.pop();
        delete _slotIndex1[slot];
        emit SlotRemoved(slot);
    }

    function _addSlot(address slot) internal {
        if (slotFactory != address(0) && !ISlotFactoryLike(slotFactory).isSlot(slot)) {
            revert NotASlot(slot);
        }
        if (_slotIndex1[slot] != 0) revert SlotAlreadyAdded(slot);
        _slots.push(slot);
        _slotIndex1[slot] = _slots.length; // 1-based
        emit SlotAdded(slot);
    }
}
