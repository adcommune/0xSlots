// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Feed} from "../src/feed/Feed.sol";
import {IFeed} from "../src/interfaces/IFeed.sol";

contract FeedTest is Test {
    UpgradeableBeacon beacon;
    Feed feed;

    address owner = makeAddr("owner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");
    address slotA = makeAddr("slotA");
    address slotB = makeAddr("slotB");
    address slotC = makeAddr("slotC");

    function setUp() public {
        Feed impl = new Feed();
        beacon = new UpgradeableBeacon(address(impl), address(this));

        address[] memory slots = new address[](3);
        slots[0] = slotA;
        slots[1] = slotB;
        slots[2] = slotC;

        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "The Testnet Feed", "", recipient, slots)
        );
        feed = Feed(address(new BeaconProxy(address(beacon), init)));
    }

    function test_initialState() public view {
        assertEq(feed.owner(), owner);
        assertEq(feed.name(), "The Testnet Feed");
        assertEq(feed.metadataURI(), "");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotCount(), 3);

        address[] memory s = feed.getSlots();
        assertEq(s.length, 3);
        assertEq(s[0], slotA);
        assertEq(s[1], slotB);
        assertEq(s[2], slotC);
    }

    function test_cannotInitializeTwice() public {
        address[] memory slots = new address[](0);
        vm.expectRevert();
        feed.initialize(owner, "x", "", recipient, slots);
    }

    function test_ownerCanSetNameAndUri() public {
        vm.startPrank(owner);
        feed.setName("Renamed");
        feed.setMetadataURI("ipfs://abc");
        vm.stopPrank();
        assertEq(feed.name(), "Renamed");
        assertEq(feed.metadataURI(), "ipfs://abc");
    }

    function test_strangerCannotSetName() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.setName("nope");
    }

    function test_strangerCannotSetMetadataURI() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.setMetadataURI("nope");
    }

    function test_strangerCannotSetRecipient() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.setFeedRecipient(stranger);
    }

    function test_ownerCanSetRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        vm.prank(owner);
        feed.setFeedRecipient(newRecipient);
        assertEq(feed.feedRecipient(), newRecipient);
    }

    function test_setRecipient_rejectsZero() public {
        vm.prank(owner);
        vm.expectRevert(Feed.ZeroRecipient.selector);
        feed.setFeedRecipient(address(0));
    }

    function test_initialize_rejectsZeroRecipient() public {
        Feed impl = new Feed();
        UpgradeableBeacon b = new UpgradeableBeacon(address(impl), address(this));
        address[] memory slots = new address[](0);
        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "x", "", address(0), slots)
        );
        vm.expectRevert(Feed.ZeroRecipient.selector);
        new BeaconProxy(address(b), init);
    }

    function test_getSlots_and_slotCount() public view {
        assertEq(feed.slotCount(), 3);
        assertEq(feed.getSlots().length, 3);
    }
}
