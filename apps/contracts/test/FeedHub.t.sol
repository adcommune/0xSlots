// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
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
///         MockSlots wired to `initParams.module`.
contract MockSlotFactory {
    function createSlots(
        address,
        IERC20,
        SlotConfig memory,
        SlotInitParams memory initParams,
        uint256 count
    ) external returns (address[] memory slots) {
        slots = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            slots[i] = address(new MockSlot(initParams.module));
        }
    }
}

// Alternate implementation to prove beacon upgrades propagate to all proxies.
contract FeedV2 is Feed {
    function version() external pure returns (uint256) {
        return 2;
    }
}

// Alternate FeedHub implementation to prove UUPS upgrades preserve storage.
contract FeedHubV2 is FeedHub {
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
    address feeRecipient = makeAddr("feeRecipient");

    uint256 constant FEED_CREATION_PRICE = 0.01 ether;
    uint256 constant SLOT_PRICE = 0.001 ether;

    function setUp() public {
        factory = new MockSlotFactory();
        module = new MockFeedModule();
        currency = IERC20(makeAddr("currency"));
        feedImpl = new Feed();

        FeedHub hubImpl = new FeedHub();
        ERC1967Proxy hubProxy = new ERC1967Proxy(
            address(hubImpl),
            abi.encodeCall(
                FeedHub.initialize,
                (
                    hubOwner,
                    address(feedImpl),
                    address(factory),
                    address(module),
                    address(currency),
                    feeRecipient,
                    FEED_CREATION_PRICE,
                    SLOT_PRICE
                )
            )
        );
        hub = FeedHub(address(hubProxy));

        vm.deal(feedOwner, 10 ether);
        vm.deal(stranger, 10 ether);
        vm.deal(hubOwner, 10 ether);
    }

    function _tiers(uint256 count) internal pure returns (Feed.SlotTier[] memory tiers) {
        tiers = new Feed.SlotTier[](1);
        tiers[0] = Feed.SlotTier({
            taxPercentage: 100,
            liquidationBountyBps: 200,
            minDepositSeconds: 86400,
            count: count
        });
    }

    function _noTiers() internal pure returns (Feed.SlotTier[] memory) {
        return new Feed.SlotTier[](0);
    }

    // ─────────────────────────────────────────────────────────────
    // initialize / initial state
    // ─────────────────────────────────────────────────────────────

    function test_initialState() public view {
        assertEq(hub.owner(), hubOwner);
        assertEq(hub.slotFactory(), address(factory));
        assertEq(hub.feedModule(), address(module));
        assertEq(hub.currency(), address(currency));
        assertEq(hub.feeRecipient(), feeRecipient);
        assertEq(hub.feedCreationPrice(), FEED_CREATION_PRICE);
        assertEq(hub.slotPrice(), SLOT_PRICE);
        assertEq(hub.feedCount(), 0);
        assertEq(hub.implementation(), address(feedImpl));
        assertTrue(address(hub.beacon()) != address(0));
    }

    function test_cannotInitializeTwice() public {
        vm.expectRevert();
        hub.initialize(
            hubOwner, address(feedImpl), address(factory), address(module), address(currency), feeRecipient, 0, 0
        );
    }

    function test_initialize_rejectsZeroFeeRecipient() public {
        FeedHub hubImpl = new FeedHub();
        vm.expectRevert(FeedHub.ZeroFeeRecipient.selector);
        new ERC1967Proxy(
            address(hubImpl),
            abi.encodeCall(
                FeedHub.initialize,
                (hubOwner, address(feedImpl), address(factory), address(module), address(currency), address(0), 0, 0)
            )
        );
    }

    // ─────────────────────────────────────────────────────────────
    // createFeed pricing
    // ─────────────────────────────────────────────────────────────

    function test_createFeed_revertsOnUnderpayment() public {
        vm.prank(feedOwner);
        vm.expectRevert(
            abi.encodeWithSelector(FeedHub.InsufficientPayment.selector, FEED_CREATION_PRICE, FEED_CREATION_PRICE - 1)
        );
        hub.createFeed{value: FEED_CREATION_PRICE - 1}(feedOwner, "F0", "", recipient, _noTiers());
    }

    function test_createFeed_succeedsAtExactlyRequired_noExtraSlots() public {
        vm.prank(feedOwner);
        (address feedAddr, uint256 index) = hub.createFeed{value: FEED_CREATION_PRICE}(
            feedOwner, "F0", "", recipient, _tiers(10) // exactly INCLUDED_SLOTS, no extra
        );
        assertEq(index, 0);
        assertEq(hub.feeds(0), feedAddr);
        assertEq(Feed(feedAddr).slotCount(), 10);
        assertEq(Feed(feedAddr).owner(), feedOwner);
        assertEq(Feed(feedAddr).hub(), address(hub));
    }

    function test_createFeed_chargesForExtraSlotsBeyondIncluded() public {
        // 12 slots, 10 included -> 2 extra * SLOT_PRICE
        uint256 extra = 2;
        uint256 required = FEED_CREATION_PRICE + SLOT_PRICE * extra;

        vm.prank(feedOwner);
        vm.expectRevert(abi.encodeWithSelector(FeedHub.InsufficientPayment.selector, required, required - 1));
        hub.createFeed{value: required - 1}(feedOwner, "F0", "", recipient, _tiers(12));

        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: required}(feedOwner, "F0", "", recipient, _tiers(12));
        assertEq(Feed(feedAddr).slotCount(), 12);
        assertEq(address(hub).balance, required);
    }

    function test_createFeed_deploysAndRegisters() public {
        vm.prank(feedOwner);
        (address feedAddr, uint256 index) = hub.createFeed{value: FEED_CREATION_PRICE}(
            feedOwner, "F0", "ipfs://x", recipient, _noTiers()
        );

        assertEq(index, 0);
        assertEq(hub.feedCount(), 1);
        assertEq(hub.feeds(0), feedAddr);

        Feed feed = Feed(feedAddr);
        assertEq(feed.owner(), feedOwner);
        assertEq(feed.name(), "F0");
        assertEq(feed.metadataURI(), "ipfs://x");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotFactory(), address(factory));
        assertEq(feed.feedModule(), address(module));
        assertEq(feed.currency(), address(currency));
        assertEq(feed.hub(), address(hub));
        assertEq(feed.slotCount(), 0);
    }

    function test_createFeed_multipleEnumerated() public {
        vm.startPrank(feedOwner);
        (, uint256 i0) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());
        (, uint256 i1) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F1", "", recipient, _noTiers());
        vm.stopPrank();
        assertEq(i0, 0);
        assertEq(i1, 1);
        assertEq(hub.feedCount(), 2);
        assertTrue(hub.feeds(0) != hub.feeds(1));
    }

    function test_createFeed_overpaymentAccepted() public {
        vm.prank(feedOwner);
        hub.createFeed{value: FEED_CREATION_PRICE + 1 ether}(feedOwner, "F0", "", recipient, _noTiers());
        assertEq(address(hub).balance, FEED_CREATION_PRICE + 1 ether);
    }

    // ─────────────────────────────────────────────────────────────
    // addSlots pricing + gating
    // ─────────────────────────────────────────────────────────────

    function test_addSlots_onlyFeedOwner() public {
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        vm.prank(stranger);
        vm.expectRevert(FeedHub.NotFeedOwner.selector);
        hub.addSlots{value: SLOT_PRICE * 3}(feedAddr, _tiers(3));
    }

    function test_addSlots_revertsOnUnderpayment() public {
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        uint256 required = SLOT_PRICE * 3;
        vm.prank(feedOwner);
        vm.expectRevert(abi.encodeWithSelector(FeedHub.InsufficientPayment.selector, required, required - 1));
        hub.addSlots{value: required - 1}(feedAddr, _tiers(3));
    }

    function test_addSlots_mintsViaFeedAndAccruesValue() public {
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        uint256 hubBalanceBefore = address(hub).balance;
        uint256 required = SLOT_PRICE * 3;

        vm.prank(feedOwner);
        hub.addSlots{value: required}(feedAddr, _tiers(3));

        assertEq(Feed(feedAddr).slotCount(), 3);
        assertEq(address(hub).balance, hubBalanceBefore + required);
    }

    function test_addSlots_overpaymentAccepted() public {
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        vm.prank(feedOwner);
        hub.addSlots{value: SLOT_PRICE * 3 + 1 ether}(feedAddr, _tiers(3));
        assertEq(Feed(feedAddr).slotCount(), 3);
    }

    // ─────────────────────────────────────────────────────────────
    // withdraw
    // ─────────────────────────────────────────────────────────────

    function test_withdraw_sendsBalanceToFeeRecipient() public {
        vm.prank(feedOwner);
        hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        uint256 hubBalance = address(hub).balance;
        assertGt(hubBalance, 0);
        uint256 recipientBalanceBefore = feeRecipient.balance;

        vm.prank(hubOwner);
        hub.withdraw();

        assertEq(address(hub).balance, 0);
        assertEq(feeRecipient.balance, recipientBalanceBefore + hubBalance);
    }

    function test_withdraw_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.withdraw();
    }

    // ─────────────────────────────────────────────────────────────
    // admin setters
    // ─────────────────────────────────────────────────────────────

    function test_setFeeRecipient_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.setFeeRecipient(stranger);
    }

    function test_setFeeRecipient_updates() public {
        address newRecipient = makeAddr("newRecipient");
        vm.prank(hubOwner);
        hub.setFeeRecipient(newRecipient);
        assertEq(hub.feeRecipient(), newRecipient);
    }

    function test_setFeeRecipient_rejectsZero() public {
        vm.prank(hubOwner);
        vm.expectRevert(FeedHub.ZeroFeeRecipient.selector);
        hub.setFeeRecipient(address(0));
    }

    function test_setFeedCreationPrice_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.setFeedCreationPrice(1 ether);
    }

    function test_setFeedCreationPrice_updates() public {
        vm.prank(hubOwner);
        hub.setFeedCreationPrice(1 ether);
        assertEq(hub.feedCreationPrice(), 1 ether);
    }

    function test_setSlotPrice_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.setSlotPrice(1 ether);
    }

    function test_setSlotPrice_updates() public {
        vm.prank(hubOwner);
        hub.setSlotPrice(0.5 ether);
        assertEq(hub.slotPrice(), 0.5 ether);
    }

    // ─────────────────────────────────────────────────────────────
    // beacon upgrade (Feed implementation)
    // ─────────────────────────────────────────────────────────────

    function test_upgradeFeedImplementation_onlyOwner() public {
        FeedV2 v2 = new FeedV2();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.upgradeFeedImplementation(address(v2));
    }

    function test_upgradeFeedImplementation_propagatesToAllProxies() public {
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        FeedV2 v2 = new FeedV2();
        vm.prank(hubOwner);
        hub.upgradeFeedImplementation(address(v2));

        assertEq(hub.implementation(), address(v2));
        // existing proxy now runs V2 logic while preserving state
        assertEq(FeedV2(feedAddr).version(), 2);
        assertEq(FeedV2(feedAddr).name(), "F0");
    }

    // ─────────────────────────────────────────────────────────────
    // UUPS upgrade of FeedHub itself
    // ─────────────────────────────────────────────────────────────

    function test_upgradeToAndCall_onlyOwner() public {
        FeedHubV2 v2Impl = new FeedHubV2();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.upgradeToAndCall(address(v2Impl), "");
    }

    function test_upgradeToAndCall_preservesStateAndAddsFunction() public {
        // Accrue some state before the upgrade.
        vm.prank(feedOwner);
        (address feedAddr, ) = hub.createFeed{value: FEED_CREATION_PRICE}(feedOwner, "F0", "", recipient, _noTiers());

        FeedHubV2 v2Impl = new FeedHubV2();
        vm.prank(hubOwner);
        hub.upgradeToAndCall(address(v2Impl), "");

        FeedHubV2 hubV2 = FeedHubV2(address(hub));
        assertEq(hubV2.version(), 2);
        // Storage preserved across the UUPS upgrade.
        assertEq(hubV2.owner(), hubOwner);
        assertEq(hubV2.feedCount(), 1);
        assertEq(hubV2.feeds(0), feedAddr);
        assertEq(hubV2.feeRecipient(), feeRecipient);
        assertEq(hubV2.feedCreationPrice(), FEED_CREATION_PRICE);
        assertEq(hubV2.slotPrice(), SLOT_PRICE);
        assertEq(address(hubV2.beacon()), address(hub.beacon()));
    }
}
