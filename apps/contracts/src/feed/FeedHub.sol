// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Feed} from "./Feed.sol";

/// @title FeedHub
/// @notice Beacon factory + registry for Feeds. Deploys + initializes empty
///         Feeds (injecting the chain's slotFactory/feedModule/currency); the
///         feed owner mints slots afterward via Feed.createSlots(...).
contract FeedHub is Ownable {
    UpgradeableBeacon public immutable beacon;
    address public immutable slotFactory;
    address public immutable feedModule;
    address public immutable currency;

    address[] public feeds;

    event FeedCreated(uint256 indexed index, address indexed feed, address indexed owner);

    constructor(
        address feedImplementation,
        address slotFactory_,
        address feedModule_,
        address currency_,
        address owner_
    ) Ownable(owner_) {
        beacon = new UpgradeableBeacon(feedImplementation, address(this));
        slotFactory = slotFactory_;
        feedModule = feedModule_;
        currency = currency_;
    }

    function createFeed(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_
    ) external onlyOwner returns (address feed, uint256 index) {
        bytes memory initData = abi.encodeCall(
            Feed.initialize,
            (owner_, name_, metadataURI_, recipient_, slotFactory, feedModule, currency)
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

    function upgradeFeedImplementation(address newImplementation) external onlyOwner {
        beacon.upgradeTo(newImplementation);
    }
}
