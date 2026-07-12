// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";
import {SlotConfig, SlotInitParams, SlotInfo} from "../src/interfaces/ISlot.sol";

/// @notice Empty contract — just needs deployed code so its address can be
///         compared against `ISlotView(slot).getSlotInfo().module`.
contract MockFeedModule {}

/// @notice Minimal stand-in for a real Slot: stores the module it was
///         "created" with and returns it via getSlotInfo().
contract MockSlot {
    address public module;

    constructor(address module_) {
        module = module_;
    }

    function getSlotInfo() external view returns (SlotInfo memory info) {
        info.module = module;
    }
}

/// @notice Minimal stand-in for SlotFactoryV3.createSlots — deploys `count`
///         MockSlots wired to `initParams.module` and records the
///         recipient/currency/taxPercentage it was called with.
contract MockSlotFactory {
    address public lastRecipient;
    IERC20 public lastCurrency;
    uint256 public lastTaxPercentage;
    uint256 public callCount;

    function createSlots(
        address recipient,
        IERC20 currency,
        SlotConfig memory,
        SlotInitParams memory initParams,
        uint256 count
    ) external returns (address[] memory slots) {
        lastRecipient = recipient;
        lastCurrency = currency;
        lastTaxPercentage = initParams.taxPercentage;
        callCount++;
        slots = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            slots[i] = address(new MockSlot(initParams.module));
        }
    }
}

/// @notice Same shape as MockSlotFactory but always mints slots wired to a
///         module that is NOT the feed's module, to exercise ModuleMismatch.
contract BadSlotFactory {
    function createSlots(
        address,
        IERC20,
        SlotConfig memory,
        SlotInitParams memory,
        uint256 count
    ) external returns (address[] memory slots) {
        slots = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            slots[i] = address(new MockSlot(address(0xBAD)));
        }
    }
}

// Alternate implementation to prove beacon upgrades propagate to all proxies.
contract FeedV2 is Feed {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract FeedHubTest is Test {
    FeedHub hub;
    MockSlotFactory factory;
    MockFeedModule module;
    Feed feedImpl;
    IERC20 currency;

    address hubOwner = makeAddr("hubOwner");
    address feedOwner = makeAddr("feedOwner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");

    function setUp() public {
        factory = new MockSlotFactory();
        module = new MockFeedModule();
        currency = IERC20(makeAddr("currency"));
        feedImpl = new Feed();
        hub = new FeedHub(address(feedImpl), address(factory), address(module), address(currency), hubOwner);
    }

    function _oneTier(uint256 taxPercentage, uint256 count) internal pure returns (FeedHub.SlotTier[] memory tiers) {
        tiers = new FeedHub.SlotTier[](1);
        tiers[0] = FeedHub.SlotTier({taxPercentage: taxPercentage, count: count});
    }

    function test_initialState() public view {
        assertEq(hub.owner(), hubOwner);
        assertEq(hub.slotFactory(), address(factory));
        assertEq(hub.feedModule(), address(module));
        assertEq(hub.currency(), address(currency));
        assertEq(hub.feedCount(), 0);
        assertEq(hub.implementation(), address(feedImpl));
        assertTrue(address(hub.beacon()) != address(0));
    }

    function test_createFeed_ownerOnly() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.createFeed(feedOwner, "F0", "", recipient, _oneTier(100, 2));
    }

    function test_createFeed_emptyTiers_reverts() public {
        FeedHub.SlotTier[] memory tiers = new FeedHub.SlotTier[](0);
        vm.prank(hubOwner);
        vm.expectRevert(FeedHub.NoTiers.selector);
        hub.createFeed(feedOwner, "F0", "", recipient, tiers);
    }

    function test_createFeed_mintsTotalAcrossTiers_andRegisters() public {
        FeedHub.SlotTier[] memory tiers = new FeedHub.SlotTier[](3);
        tiers[0] = FeedHub.SlotTier({taxPercentage: 100, count: 2});
        tiers[1] = FeedHub.SlotTier({taxPercentage: 300, count: 3});
        tiers[2] = FeedHub.SlotTier({taxPercentage: 500, count: 1});

        vm.prank(hubOwner);
        (address feedAddr, uint256 index) = hub.createFeed(feedOwner, "F0", "ipfs://x", recipient, tiers);

        assertEq(index, 0);
        assertEq(hub.feedCount(), 1);
        assertEq(hub.feeds(0), feedAddr);

        Feed feed = Feed(feedAddr);
        assertEq(feed.owner(), feedOwner);
        assertEq(feed.name(), "F0");
        assertEq(feed.metadataURI(), "ipfs://x");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotCount(), 6); // 2 + 3 + 1
        assertEq(feed.getSlots().length, 6);
    }

    function test_createFeed_passesRecipientCurrencyTax_toFactory() public {
        vm.prank(hubOwner);
        hub.createFeed(feedOwner, "F0", "", recipient, _oneTier(777, 1));

        assertEq(factory.lastRecipient(), recipient);
        assertEq(address(factory.lastCurrency()), address(currency));
        assertEq(factory.lastTaxPercentage(), 777);
    }

    function test_createFeed_skipsZeroCountTiers() public {
        FeedHub.SlotTier[] memory tiers = new FeedHub.SlotTier[](2);
        tiers[0] = FeedHub.SlotTier({taxPercentage: 100, count: 0});
        tiers[1] = FeedHub.SlotTier({taxPercentage: 200, count: 2});

        vm.prank(hubOwner);
        (address feedAddr,) = hub.createFeed(feedOwner, "F0", "", recipient, tiers);
        assertEq(Feed(feedAddr).slotCount(), 2);
        // The zero-count tier must never have been sent to the factory.
        assertEq(factory.callCount(), 1);
    }

    function test_createFeed_moduleMismatch_reverts() public {
        BadSlotFactory bad = new BadSlotFactory();
        FeedHub badHub = new FeedHub(address(feedImpl), address(bad), address(module), address(currency), hubOwner);

        vm.prank(hubOwner);
        // Assert the specific error fired; partial-revert matches the selector
        // and ignores the dynamic (slot, got, expected) args.
        vm.expectPartialRevert(FeedHub.ModuleMismatch.selector);
        badHub.createFeed(feedOwner, "F0", "", recipient, _oneTier(100, 1));
    }

    function test_createFeed_multipleEnumerated() public {
        vm.startPrank(hubOwner);
        (, uint256 i0) = hub.createFeed(feedOwner, "F0", "", recipient, _oneTier(100, 1));
        (, uint256 i1) = hub.createFeed(feedOwner, "F1", "", recipient, _oneTier(100, 1));
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
        (address feedAddr,) = hub.createFeed(feedOwner, "F0", "", recipient, _oneTier(100, 1));

        FeedV2 v2 = new FeedV2();
        vm.prank(hubOwner);
        hub.upgradeFeedImplementation(address(v2));

        assertEq(hub.implementation(), address(v2));
        // existing proxy now runs V2 logic while preserving state
        assertEq(FeedV2(feedAddr).version(), 2);
        assertEq(FeedV2(feedAddr).name(), "F0");
    }
}
