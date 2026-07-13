// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Feed} from "../src/feed/Feed.sol";
import {IFeed} from "../src/interfaces/IFeed.sol";
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
///         recipient/currency/taxPercentage/bounty/minDeposit it was called with.
contract MockSlotFactory {
    address public lastRecipient;
    IERC20 public lastCurrency;
    uint256 public lastTaxPercentage;
    uint256 public lastLiquidationBountyBps;
    uint256 public lastMinDepositSeconds;
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
        lastLiquidationBountyBps = initParams.liquidationBountyBps;
        lastMinDepositSeconds = initParams.minDepositSeconds;
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

contract FeedTest is Test {
    UpgradeableBeacon beacon;
    Feed feed;
    MockSlotFactory factory;
    MockFeedModule module;
    IERC20 currency;

    address owner = makeAddr("owner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");
    address hub = makeAddr("hub");

    function setUp() public {
        factory = new MockSlotFactory();
        module = new MockFeedModule();
        currency = IERC20(makeAddr("currency"));

        Feed impl = new Feed();
        beacon = new UpgradeableBeacon(address(impl), address(this));

        Feed.SlotTier[] memory noTiers = new Feed.SlotTier[](0);
        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (
                owner,
                "The Testnet Feed",
                "",
                recipient,
                address(factory),
                address(module),
                address(currency),
                hub,
                noTiers
            )
        );
        feed = Feed(address(new BeaconProxy(address(beacon), init)));
    }

    function _oneTier(uint256 taxPercentage, uint256 count) internal pure returns (Feed.SlotTier[] memory tiers) {
        tiers = new Feed.SlotTier[](1);
        tiers[0] = Feed.SlotTier({
            taxPercentage: taxPercentage,
            liquidationBountyBps: 200,
            minDepositSeconds: 86400,
            count: count
        });
    }

    function _deployFeedWithInitialTiers(Feed.SlotTier[] memory tiers, address hub_)
        internal
        returns (Feed f)
    {
        Feed impl = new Feed();
        UpgradeableBeacon b = new UpgradeableBeacon(address(impl), address(this));
        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "F0", "", recipient, address(factory), address(module), address(currency), hub_, tiers)
        );
        f = Feed(address(new BeaconProxy(address(b), init)));
    }

    // ─────────────────────────────────────────────────────────────
    // Identity
    // ─────────────────────────────────────────────────────────────

    function test_initialState() public view {
        assertEq(feed.owner(), owner);
        assertEq(feed.name(), "The Testnet Feed");
        assertEq(feed.metadataURI(), "");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotFactory(), address(factory));
        assertEq(feed.feedModule(), address(module));
        assertEq(feed.currency(), address(currency));
        assertEq(feed.hub(), hub);
        assertEq(feed.slotCount(), 0);
        assertEq(feed.getSlots().length, 0);
    }

    function test_cannotInitializeTwice() public {
        Feed.SlotTier[] memory noTiers = new Feed.SlotTier[](0);
        vm.expectRevert();
        feed.initialize(owner, "x", "", recipient, address(factory), address(module), address(currency), hub, noTiers);
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
        Feed.SlotTier[] memory noTiers = new Feed.SlotTier[](0);
        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "x", "", address(0), address(factory), address(module), address(currency), hub, noTiers)
        );
        vm.expectRevert(Feed.ZeroRecipient.selector);
        new BeaconProxy(address(b), init);
    }

    // ─────────────────────────────────────────────────────────────
    // init-time minting
    // ─────────────────────────────────────────────────────────────

    function test_initialize_mintsInitialTiers() public {
        Feed.SlotTier[] memory tiers = new Feed.SlotTier[](2);
        tiers[0] = Feed.SlotTier({taxPercentage: 100, liquidationBountyBps: 100, minDepositSeconds: 86400, count: 2});
        tiers[1] = Feed.SlotTier({taxPercentage: 300, liquidationBountyBps: 200, minDepositSeconds: 43200, count: 5});

        Feed f = _deployFeedWithInitialTiers(tiers, hub);

        assertEq(f.slotCount(), 7);
        assertEq(f.getSlots().length, 7);
        assertEq(f.hub(), hub);
    }

    function test_initialize_withNoTiers_mintsNothing() public view {
        // `feed` from setUp() was initialized with an empty tiers array.
        assertEq(feed.slotCount(), 0);
    }

    // ─────────────────────────────────────────────────────────────
    // mintSlots (hub-gated)
    // ─────────────────────────────────────────────────────────────

    function test_mintSlots_revertsForNonHub() public {
        vm.prank(owner);
        vm.expectRevert(Feed.NotHub.selector);
        feed.mintSlots(_oneTier(100, 2));
    }

    function test_mintSlots_revertsForStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Feed.NotHub.selector);
        feed.mintSlots(_oneTier(100, 2));
    }

    function test_mintSlots_worksForHub() public {
        vm.prank(hub);
        feed.mintSlots(_oneTier(100, 2));

        assertEq(feed.slotCount(), 2);
        assertEq(feed.getSlots().length, 2);
    }

    function test_mintSlots_emptyTiers_reverts() public {
        Feed.SlotTier[] memory tiers = new Feed.SlotTier[](0);
        vm.prank(hub);
        vm.expectRevert(Feed.NoTiers.selector);
        feed.mintSlots(tiers);
    }

    function test_mintSlots_mintsTotalAcrossTiers_andAppends() public {
        Feed.SlotTier[] memory tiers = new Feed.SlotTier[](3);
        tiers[0] = Feed.SlotTier({taxPercentage: 100, liquidationBountyBps: 100, minDepositSeconds: 86400, count: 2});
        tiers[1] = Feed.SlotTier({taxPercentage: 300, liquidationBountyBps: 200, minDepositSeconds: 43200, count: 3});
        tiers[2] = Feed.SlotTier({taxPercentage: 500, liquidationBountyBps: 500, minDepositSeconds: 21600, count: 1});

        vm.prank(hub);
        feed.mintSlots(tiers);

        assertEq(feed.slotCount(), 6); // 2 + 3 + 1
        assertEq(feed.getSlots().length, 6);
    }

    function test_mintSlots_appendsInOrder() public {
        vm.startPrank(hub);
        feed.mintSlots(_oneTier(100, 2));
        address[] memory afterFirst = feed.getSlots();

        feed.mintSlots(_oneTier(200, 1));
        vm.stopPrank();

        address[] memory afterSecond = feed.getSlots();
        assertEq(afterSecond.length, 3);
        assertEq(afterSecond[0], afterFirst[0]);
        assertEq(afterSecond[1], afterFirst[1]);
        assertTrue(afterSecond[2] != afterFirst[0] && afterSecond[2] != afterFirst[1]);
    }

    function test_mintSlots_passesRecipientCurrencyTaxBountyMinDeposit_toFactory() public {
        vm.prank(hub);
        feed.mintSlots(_oneTier(777, 1));

        assertEq(factory.lastRecipient(), recipient);
        assertEq(address(factory.lastCurrency()), address(currency));
        assertEq(factory.lastTaxPercentage(), 777);
        assertEq(factory.lastLiquidationBountyBps(), 200);
        assertEq(factory.lastMinDepositSeconds(), 86400);
    }

    function test_mintSlots_skipsZeroCountTiers() public {
        Feed.SlotTier[] memory tiers = new Feed.SlotTier[](2);
        tiers[0] = Feed.SlotTier({taxPercentage: 100, liquidationBountyBps: 100, minDepositSeconds: 86400, count: 0});
        tiers[1] = Feed.SlotTier({taxPercentage: 200, liquidationBountyBps: 200, minDepositSeconds: 43200, count: 2});

        vm.prank(hub);
        feed.mintSlots(tiers);

        assertEq(feed.slotCount(), 2);
        // The zero-count tier must never have been sent to the factory.
        assertEq(factory.callCount(), 1);
    }

    function test_mintSlots_moduleMismatch_reverts() public {
        BadSlotFactory bad = new BadSlotFactory();
        Feed impl = new Feed();
        UpgradeableBeacon b = new UpgradeableBeacon(address(impl), address(this));
        Feed.SlotTier[] memory noTiers = new Feed.SlotTier[](0);
        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "F0", "", recipient, address(bad), address(module), address(currency), hub, noTiers)
        );
        Feed badFeed = Feed(address(new BeaconProxy(address(b), init)));

        vm.prank(hub);
        // Assert the specific error fired; partial-revert matches the selector
        // and ignores the dynamic (slot, got, expected) args.
        vm.expectPartialRevert(Feed.ModuleMismatch.selector);
        badFeed.mintSlots(_oneTier(100, 1));
    }

    function test_mintSlots_multipleCallsAccumulate() public {
        vm.startPrank(hub);
        feed.mintSlots(_oneTier(100, 2));
        feed.mintSlots(_oneTier(200, 3));
        feed.mintSlots(_oneTier(300, 1));
        vm.stopPrank();

        assertEq(feed.slotCount(), 6);
        assertEq(feed.getSlots().length, 6);
    }

    function test_getSlots_and_slotCount() public {
        vm.prank(hub);
        feed.mintSlots(_oneTier(100, 3));
        assertEq(feed.slotCount(), 3);
        assertEq(feed.getSlots().length, 3);
    }

    // removeSlot

    function test_removeSlot_ownerOnly() public {
        vm.prank(hub);
        feed.mintSlots(_oneTier(100, 2));
        address[] memory s = feed.getSlots();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        feed.removeSlot(s[0]);
    }

    function test_removeSlot_revertsForHub() public {
        // Even the hub cannot call removeSlot — it's owner-only.
        vm.prank(hub);
        feed.mintSlots(_oneTier(100, 1));
        address[] memory s = feed.getSlots();
        vm.prank(hub);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, hub));
        feed.removeSlot(s[0]);
    }

    function test_removeSlot_preservesOrder() public {
        vm.startPrank(hub);
        feed.mintSlots(_oneTier(100, 3));
        vm.stopPrank();
        address[] memory before = feed.getSlots();

        vm.prank(owner);
        feed.removeSlot(before[1]); // remove the middle element

        address[] memory remaining = feed.getSlots();
        assertEq(remaining.length, 2);
        assertEq(feed.slotCount(), 2);
        assertEq(remaining[0], before[0]);
        assertEq(remaining[1], before[2]); // order preserved (not swap-pop)
    }

    function test_removeSlot_revertsIfAbsent() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(Feed.SlotNotInFeed.selector, address(0xdead))
        );
        feed.removeSlot(address(0xdead));
    }
}
