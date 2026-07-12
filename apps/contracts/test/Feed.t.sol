// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Feed} from "../src/feed/Feed.sol";
import {IFeed} from "../src/interfaces/IFeed.sol";

// Minimal stand-in for SlotFactory's `isSlot` membership check.
contract MockSlotFactory {
    mapping(address => bool) public isSlot;
    function setSlot(address a, bool v) external { isSlot[a] = v; }
}

contract FeedTest is Test {
    UpgradeableBeacon beacon;
    Feed feed;
    MockSlotFactory factory;

    address owner = makeAddr("owner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");
    address slotA = makeAddr("slotA");
    address slotB = makeAddr("slotB");
    address slotC = makeAddr("slotC");

    function setUp() public {
        factory = new MockSlotFactory();
        factory.setSlot(slotA, true);
        factory.setSlot(slotB, true);
        factory.setSlot(slotC, true);

        Feed impl = new Feed();
        beacon = new UpgradeableBeacon(address(impl), address(this));

        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "The Testnet Feed", "", recipient, address(factory))
        );
        feed = Feed(address(new BeaconProxy(address(beacon), init)));
    }

    function test_initialState() public view {
        assertEq(feed.owner(), owner);
        assertEq(feed.name(), "The Testnet Feed");
        assertEq(feed.metadataURI(), "");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotCount(), 0);
    }

    function test_cannotInitializeTwice() public {
        vm.expectRevert();
        feed.initialize(owner, "x", "", recipient, address(factory));
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

    function test_setRecipient_rejectsZero() public {
        vm.prank(owner);
        vm.expectRevert(Feed.ZeroRecipient.selector);
        feed.setFeedRecipient(address(0));
    }

    function test_addSlot_appendsInOrder() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        feed.addSlot(slotB);
        vm.stopPrank();

        address[] memory s = feed.getSlots();
        assertEq(s.length, 2);
        assertEq(s[0], slotA);
        assertEq(s[1], slotB);
        assertTrue(feed.containsSlot(slotA));
        assertTrue(feed.containsSlot(slotB));
        assertFalse(feed.containsSlot(slotC));
    }

    function test_addSlots_batch() public {
        address[] memory batch = new address[](3);
        batch[0] = slotA;
        batch[1] = slotB;
        batch[2] = slotC;
        vm.prank(owner);
        feed.addSlots(batch);
        assertEq(feed.slotCount(), 3);
        assertEq(feed.getSlots()[2], slotC);
    }

    function test_addSlot_rejectsNonSlot() public {
        address notASlot = makeAddr("notASlot"); // factory.isSlot == false
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Feed.NotASlot.selector, notASlot));
        feed.addSlot(notASlot);
    }

    function test_addSlot_rejectsDuplicate() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        vm.expectRevert(abi.encodeWithSelector(Feed.SlotAlreadyAdded.selector, slotA));
        feed.addSlot(slotA);
        vm.stopPrank();
    }

    function test_addSlot_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.addSlot(slotA);
    }

    function test_removeSlot_swapPop() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        feed.addSlot(slotB);
        feed.addSlot(slotC);
        feed.removeSlot(slotB); // middle: last (slotC) swaps into its place
        vm.stopPrank();

        address[] memory s = feed.getSlots();
        assertEq(s.length, 2);
        assertEq(s[0], slotA);
        assertEq(s[1], slotC);
        assertFalse(feed.containsSlot(slotB));
        assertTrue(feed.containsSlot(slotC));
    }

    function test_removeSlot_revertsIfAbsent() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Feed.SlotNotInFeed.selector, slotA));
        feed.removeSlot(slotA);
    }
}
