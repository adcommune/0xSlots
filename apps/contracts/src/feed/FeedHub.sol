// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Feed} from "./Feed.sol";

/// @title FeedHub
/// @notice Factory + registry for beacon-upgradeable Feed contracts. Owns the
///         beacon (one upgrade updates every feed) and enumerates deployed feeds.
contract FeedHub is Ownable {
    UpgradeableBeacon public immutable beacon;
    /// @notice SlotFactory injected into every Feed for `addSlot` validation.
    address public immutable slotFactory;

    address[] public feeds;

    event FeedCreated(uint256 indexed index, address indexed feed, address indexed owner);

    constructor(address feedImplementation, address slotFactory_, address owner_) Ownable(owner_) {
        beacon = new UpgradeableBeacon(feedImplementation, address(this));
        slotFactory = slotFactory_;
    }

    /// @notice Deploy a new Feed (beacon proxy) and register it. Phase 1: owner-only.
    function createFeed(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_
    ) external onlyOwner returns (address feed, uint256 index) {
        bytes memory initData = abi.encodeCall(
            Feed.initialize,
            (owner_, name_, metadataURI_, recipient_, slotFactory)
        );
        feed = address(new BeaconProxy(address(beacon), initData));
        index = feeds.length;
        feeds.push(feed);
        emit FeedCreated(index, feed, owner_);
    }

    function feedCount() external view returns (uint256) {
        return feeds.length;
    }

    function implementation() external view returns (address) {
        return beacon.implementation();
    }

    /// @notice Upgrade the shared Feed implementation for ALL feeds at once.
    function upgradeFeedImplementation(address newImplementation) external onlyOwner {
        beacon.upgradeTo(newImplementation);
    }
}
