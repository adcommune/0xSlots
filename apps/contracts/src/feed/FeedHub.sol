// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SlotConfig, SlotInitParams, SlotInfo} from "../interfaces/ISlot.sol";
import {Feed} from "./Feed.sol";

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

/// @title FeedHub
/// @notice Beacon factory + registry for Feeds. Mints each feed's slots via the
///         SlotFactory with the FeedPostModule attached, verifies the module on
///         every minted slot, then registers the feed.
contract FeedHub is Ownable {
    /// @notice One tax tier: `count` slots minted at `taxPercentage` (bps).
    struct SlotTier {
        uint256 taxPercentage;
        uint256 count;
    }

    UpgradeableBeacon public immutable beacon;
    address public immutable slotFactory;
    address public immutable feedModule;
    address public immutable currency;

    // Fixed economics for every feed slot (per product spec).
    uint256 public constant LIQUIDATION_BOUNTY_BPS = 200; // 2%
    uint256 public constant MIN_DEPOSIT_SECONDS = 86400; // 1 day

    address[] public feeds;

    event FeedCreated(uint256 indexed index, address indexed feed, address indexed owner, uint256 slotCount);

    error NoTiers();
    error ModuleMismatch(address slot, address got, address expected);

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
        address recipient_,
        SlotTier[] calldata tiers
    ) external onlyOwner returns (address feed, uint256 index) {
        if (tiers.length == 0) revert NoTiers();

        uint256 total;
        for (uint256 t = 0; t < tiers.length; t++) {
            total += tiers[t].count;
        }

        address[] memory slots = new address[](total);
        uint256 w;
        for (uint256 t = 0; t < tiers.length; t++) {
            if (tiers[t].count == 0) continue;
            address[] memory created = ISlotFactory(slotFactory).createSlots(
                recipient_,
                IERC20(currency),
                SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
                SlotInitParams({
                    taxPercentage: tiers[t].taxPercentage,
                    module: feedModule,
                    liquidationBountyBps: LIQUIDATION_BOUNTY_BPS,
                    minDepositSeconds: MIN_DEPOSIT_SECONDS
                }),
                tiers[t].count
            );
            for (uint256 j = 0; j < created.length; j++) {
                address got = ISlotView(created[j]).getSlotInfo().module;
                if (got != feedModule) revert ModuleMismatch(created[j], got, feedModule);
                slots[w++] = created[j];
            }
        }

        bytes memory initData = abi.encodeCall(
            Feed.initialize,
            (owner_, name_, metadataURI_, recipient_, slots)
        );
        feed = address(new BeaconProxy(address(beacon), initData));
        index = feeds.length;
        feeds.push(feed);
        emit FeedCreated(index, feed, owner_, total);
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
