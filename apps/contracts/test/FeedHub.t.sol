// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";

contract MockSlotFactory2 {
    mapping(address => bool) public isSlot;
    function setSlot(address a, bool v) external { isSlot[a] = v; }
}

// Alternate implementation to prove beacon upgrades propagate to all proxies.
contract FeedV2 is Feed {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract FeedHubTest is Test {
    FeedHub hub;
    MockSlotFactory2 factory;
    Feed feedImpl;

    address hubOwner = makeAddr("hubOwner");
    address feedOwner = makeAddr("feedOwner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");

    function setUp() public {
        factory = new MockSlotFactory2();
        feedImpl = new Feed();
        hub = new FeedHub(address(feedImpl), address(factory), hubOwner);
    }

    function test_initialState() public view {
        assertEq(hub.owner(), hubOwner);
        assertEq(hub.slotFactory(), address(factory));
        assertEq(hub.feedCount(), 0);
        assertEq(hub.implementation(), address(feedImpl));
    }

    function test_createFeed_ownerOnly() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.createFeed(feedOwner, "F0", "", recipient);
    }

    function test_createFeed_registersAndInitializes() public {
        vm.prank(hubOwner);
        (address feedAddr, uint256 index) = hub.createFeed(feedOwner, "F0", "ipfs://x", recipient);

        assertEq(index, 0);
        assertEq(hub.feedCount(), 1);
        assertEq(hub.feeds(0), feedAddr);

        Feed feed = Feed(feedAddr);
        assertEq(feed.owner(), feedOwner);
        assertEq(feed.name(), "F0");
        assertEq(feed.metadataURI(), "ipfs://x");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotFactory(), address(factory)); // injected by the hub
    }

    function test_createFeed_multipleEnumerated() public {
        vm.startPrank(hubOwner);
        (, uint256 i0) = hub.createFeed(feedOwner, "F0", "", recipient);
        (, uint256 i1) = hub.createFeed(feedOwner, "F1", "", recipient);
        vm.stopPrank();
        assertEq(i0, 0);
        assertEq(i1, 1);
        assertEq(hub.feedCount(), 2);
        assertTrue(hub.feeds(0) != hub.feeds(1));
    }

    function test_upgrade_ownerOnly() public {
        FeedV2 v2 = new FeedV2();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.upgradeFeedImplementation(address(v2));
    }

    function test_upgrade_propagatesToAllProxies() public {
        vm.prank(hubOwner);
        (address feedAddr,) = hub.createFeed(feedOwner, "F0", "", recipient);

        FeedV2 v2 = new FeedV2();
        vm.prank(hubOwner);
        hub.upgradeFeedImplementation(address(v2));

        assertEq(hub.implementation(), address(v2));
        // existing proxy now runs V2 logic while preserving state
        assertEq(FeedV2(feedAddr).version(), 2);
        assertEq(FeedV2(feedAddr).name(), "F0");
    }
}
