// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {FeedPostModule} from "../src/modules/FeedPostModule.sol";
import {FeedSocialGroup} from "../src/FeedSocialGroup.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract FeedSocialGroupTest is Test {
    SlotFactory factory;
    FeedPostModule feedModule;
    FeedSocialGroup group;
    MockERC20 token;
    Slot slot;

    address admin = makeAddr("admin");
    address slotManager = makeAddr("slotManager");
    address postingManager = makeAddr("postingManager");
    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address treasury = makeAddr("treasury");

    bytes32 constant SLOT_MANAGER_ROLE = keccak256("SLOT_MANAGER");
    bytes32 constant POSTING_MANAGER_ROLE = keccak256("POSTING_MANAGER");
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;

    function setUp() public {
        // ── Slot factory + beacon ──
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy factoryProxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(factoryProxy));

        // ── FeedPostModule (UUPS) ──
        FeedPostModule moduleImpl = new FeedPostModule();
        ERC1967Proxy moduleProxy = new ERC1967Proxy(
            address(moduleImpl),
            abi.encodeCall(FeedPostModule.initialize, (admin))
        );
        feedModule = FeedPostModule(address(moduleProxy));

        // ── FeedSocialGroup (UUPS) ──
        FeedSocialGroup groupImpl = new FeedSocialGroup();
        ERC1967Proxy groupProxy = new ERC1967Proxy(
            address(groupImpl),
            abi.encodeCall(FeedSocialGroup.initialize, (admin, address(feedModule)))
        );
        group = FeedSocialGroup(address(groupProxy));

        vm.startPrank(admin);
        group.grantRole(SLOT_MANAGER_ROLE, slotManager);
        group.grantRole(POSTING_MANAGER_ROLE, postingManager);
        vm.stopPrank();

        // ── Currency + funded users ──
        token = new MockERC20();
        token.mint(alice, 1_000 ether);
        token.mint(bob, 1_000 ether);

        // ── Slot using FeedPostModule ──
        SlotConfig memory cfg = SlotConfig({
            mutableTax: false,
            mutableModule: false,
            manager: address(0)
        });
        SlotInitParams memory init = SlotInitParams({
            taxPercentage: 100,         // 1%/month
            module: address(feedModule),
            liquidationBountyBps: 0,
            minDepositSeconds: 0
        });
        slot = Slot(factory.createSlot(recipient, IERC20(address(token)), cfg, init));

        // Alice pays, group becomes occupant
        vm.startPrank(alice);
        token.approve(address(slot), type(uint256).max);
        slot.buy(address(group), 100 ether, 50 ether);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════
    // releaseSlot
    // ═══════════════════════════════════════════════════════════

    function test_releaseSlot_clearsOccupancyAndRefundsToGroup() public {
        assertEq(slot.occupant(), address(group));
        uint256 depositBefore = slot.deposit();
        assertGt(depositBefore, 0);

        vm.prank(slotManager);
        group.releaseSlot(address(slot));

        assertEq(slot.occupant(), address(0));
        assertEq(slot.deposit(), 0);
        // Refund (deposit minus settled tax — at t0 settled tax = 0) lands on the group
        assertEq(token.balanceOf(address(group)), depositBefore);
    }

    function test_releaseSlot_revertsForNonManager() public {
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                bob,
                SLOT_MANAGER_ROLE
            )
        );
        group.releaseSlot(address(slot));
    }

    function test_releaseSlot_revertsForAdmin() public {
        // Admin holds DEFAULT_ADMIN_ROLE but not SLOT_MANAGER — must explicitly grant.
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                admin,
                SLOT_MANAGER_ROLE
            )
        );
        group.releaseSlot(address(slot));
    }

    // ═══════════════════════════════════════════════════════════
    // withdrawFromSlot
    // ═══════════════════════════════════════════════════════════

    function test_withdrawFromSlot_reducesDepositAndForwardsToGroup() public {
        uint256 depositBefore = slot.deposit();
        uint256 withdrawAmount = 30 ether;

        vm.prank(slotManager);
        group.withdrawFromSlot(address(slot), withdrawAmount);

        assertEq(slot.deposit(), depositBefore - withdrawAmount);
        assertEq(token.balanceOf(address(group)), withdrawAmount);
        assertEq(slot.occupant(), address(group));
    }

    function test_withdrawFromSlot_revertsForNonManager() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                alice,
                SLOT_MANAGER_ROLE
            )
        );
        group.withdrawFromSlot(address(slot), 1 ether);
    }

    // ═══════════════════════════════════════════════════════════
    // selfAssessSlot
    // ═══════════════════════════════════════════════════════════

    function test_selfAssessSlot_updatesPrice() public {
        assertEq(slot.price(), 50 ether);

        vm.prank(slotManager);
        group.selfAssessSlot(address(slot), 75 ether);

        assertEq(slot.price(), 75 ether);
    }

    function test_selfAssessSlot_revertsForNonManager() public {
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                bob,
                SLOT_MANAGER_ROLE
            )
        );
        group.selfAssessSlot(address(slot), 75 ether);
    }

    // ═══════════════════════════════════════════════════════════
    // sweep
    // ═══════════════════════════════════════════════════════════

    function test_sweep_movesTokensFromGroupToRecipient() public {
        // Park some tokens on the group (e.g. simulating a refund landing here)
        token.mint(address(group), 42 ether);
        assertEq(token.balanceOf(address(group)), 42 ether);

        vm.prank(admin);
        group.sweep(IERC20(address(token)), treasury, 42 ether);

        assertEq(token.balanceOf(address(group)), 0);
        assertEq(token.balanceOf(treasury), 42 ether);
    }

    function test_sweep_revertsForNonAdmin() public {
        token.mint(address(group), 1 ether);

        vm.prank(slotManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                slotManager,
                DEFAULT_ADMIN_ROLE
            )
        );
        group.sweep(IERC20(address(token)), treasury, 1 ether);
    }

    // ═══════════════════════════════════════════════════════════
    // End-to-end: release → sweep
    // ═══════════════════════════════════════════════════════════

    function test_releaseThenSweep_extractsRefund() public {
        uint256 depositBefore = slot.deposit();

        vm.prank(slotManager);
        group.releaseSlot(address(slot));

        vm.prank(admin);
        group.sweep(IERC20(address(token)), treasury, depositBefore);

        assertEq(token.balanceOf(treasury), depositBefore);
        assertEq(token.balanceOf(address(group)), 0);
    }

    // ═══════════════════════════════════════════════════════════
    // Posting still works after upgrade
    // ═══════════════════════════════════════════════════════════

    function test_post_stillAttributesToSender() public {
        vm.prank(alice);
        group.post(address(slot), "ipfs://hello");

        assertEq(feedModule.tokenURI(address(slot)), "ipfs://hello");
    }
}
