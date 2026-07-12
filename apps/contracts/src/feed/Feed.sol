// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IFeed} from "../interfaces/IFeed.sol";

/// @title Feed
/// @notice Holds a feed's identity (name, updateable metadataURI, declared
///         non-custodial recipient) and the slot set minted for it by the
///         FeedHub. Slots are created with the FeedPostModule and module-verified
///         by the hub before being passed here; this contract never creates or
///         accepts slots by address.
contract Feed is Initializable, OwnableUpgradeable, IFeed {
    string private _name;
    string private _metadataURI;
    address private _feedRecipient;
    address[] private _slots;

    event NameUpdated(string name);
    event MetadataURIUpdated(string uri);
    event RecipientUpdated(address indexed recipient);

    error ZeroRecipient();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_,
        address[] calldata slots_
    ) external initializer {
        __Ownable_init(owner_);
        if (recipient_ == address(0)) revert ZeroRecipient();
        _name = name_;
        _metadataURI = metadataURI_;
        _feedRecipient = recipient_;
        _slots = slots_;
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
