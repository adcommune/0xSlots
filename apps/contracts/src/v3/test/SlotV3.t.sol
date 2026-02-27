// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Slot} from "../Slot.sol";
import {SlotFactory} from "../SlotFactory.sol";
import {SlotConfig, SlotInitParams, PendingUpdate} from "../ISlot.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 ether);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SlotV3Test is Test {
    SlotFactory factory;
    MockERC20 token;

    address recipient = makeAddr("recipient");
    address manager = makeAddr("manager");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address liquidator = makeAddr("liquidator");

    function setUp() public {
        factory = new SlotFactory(address(this));
        token = new MockERC20();

        // Fund users
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    function _defaultConfig() internal view returns (SlotConfig memory) {
        return SlotConfig({
            mutableTax: true,
            mutableModule: false,
            manager: manager
        });
    }

    function _immutableConfig() internal pure returns (SlotConfig memory) {
        return SlotConfig({
            mutableTax: false,
            mutableModule: false,
            manager: address(0)
        });
    }

    function _defaultInit() internal pure returns (SlotInitParams memory) {
        return SlotInitParams({
            taxPercentage: 100, // 1%
            module: address(0),
            liquidationBountyBps: 500, // 5%
            minDepositSeconds: 86400  // 1 day
        });
    }

    function _createSlot(SlotConfig memory config) internal returns (Slot) {
        address addr = factory.createSlot(recipient, IERC20(address(token)), config, _defaultInit());
        return Slot(addr);
    }

    function _createDefaultSlot() internal returns (Slot) {
        return _createSlot(_defaultConfig());
    }

    function _buySlot(Slot slot, address buyer, uint256 depositAmt, uint256 selfPrice) internal {
        vm.startPrank(buyer);
        token.approve(address(slot), depositAmt + slot.price());
        slot.buy(depositAmt, selfPrice);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════
    // FACTORY TESTS
    // ═══════════════════════════════════════════════════════════

    function test_createSlot() public {
        Slot slot = _createDefaultSlot();

        assertEq(slot.recipient(), recipient);
        assertEq(address(slot.currency()), address(token));
        assertEq(slot.mutableTax(), true);
        assertEq(slot.mutableModule(), false);
        assertEq(slot.manager(), manager);
        assertEq(slot.taxPercentage(), 100);
        assertEq(slot.occupant(), address(0));
        assertEq(slot.price(), 0);
        assertTrue(slot.isVacant());
    }

    function test_deterministicAddress() public {
        SlotInitParams memory init = _defaultInit();
        address predicted = factory.predictSlotAddress(
            recipient, IERC20(address(token)), init.taxPercentage, init.module, _defaultConfig()
        );
        Slot slot = _createDefaultSlot();
        assertEq(address(slot), predicted);
    }

    function test_cannotDeployDuplicate() public {
        _createDefaultSlot();
        vm.expectRevert();
        _createDefaultSlot();
    }

    function test_immutableConfig_managerMustBeZero() public {
        SlotConfig memory config = SlotConfig({
            mutableTax: false,
            mutableModule: false,
            manager: manager // should fail
        });
        vm.expectRevert(SlotFactory.InvalidConfig_ManagerMustBeZero.selector);
        factory.createSlot(recipient, IERC20(address(token)), config, _defaultInit());
    }

    function test_mutableConfig_managerRequired() public {
        SlotConfig memory config = SlotConfig({
            mutableTax: true,
            mutableModule: false,
            manager: address(0) // should fail
        });
        vm.expectRevert(SlotFactory.InvalidConfig_ManagerRequired.selector);
        factory.createSlot(recipient, IERC20(address(token)), config, _defaultInit());
    }

    // ═══════════════════════════════════════════════════════════
    // BUY TESTS
    // ═══════════════════════════════════════════════════════════

    function test_buyVacant() public {
        Slot slot = _createDefaultSlot();

        _buySlot(slot, alice, 10 ether, 100 ether);

        assertEq(slot.occupant(), alice);
        assertEq(slot.price(), 100 ether);
        assertEq(slot.deposit(), 10 ether);
        assertFalse(slot.isVacant());
    }

    function test_buyOccupied() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        uint256 aliceBefore = token.balanceOf(alice);

        _buySlot(slot, bob, 15 ether, 200 ether);

        assertEq(slot.occupant(), bob);
        assertEq(slot.price(), 200 ether);

        // Alice should have received refund (deposit remainder + price)
        uint256 aliceAfter = token.balanceOf(alice);
        assertTrue(aliceAfter > aliceBefore);
    }

    function test_cannotBuyFromYourself() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.startPrank(alice);
        token.approve(address(slot), 200 ether);
        vm.expectRevert(Slot.CannotBuyFromYourself.selector);
        slot.buy(10 ether, 100 ether);
        vm.stopPrank();
    }

    function test_buyEnforcesMinDeposit() public {
        Slot slot = _createDefaultSlot();

        vm.startPrank(alice);
        token.approve(address(slot), 1 ether);
        vm.expectRevert(Slot.InsufficientDeposit.selector);
        slot.buy(1, 100 ether); // 1 wei deposit for 100 ETH price = way below min
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════
    // RELEASE TESTS
    // ═══════════════════════════════════════════════════════════

    function test_release() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        uint256 aliceBefore = token.balanceOf(alice);

        vm.prank(alice);
        slot.release();

        assertTrue(slot.isVacant());
        assertEq(slot.price(), 0);

        // Alice gets deposit back (minus accrued tax)
        assertTrue(token.balanceOf(alice) > aliceBefore);
    }

    function test_releaseOnlyOccupant() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(bob);
        vm.expectRevert(Slot.NotOccupant.selector);
        slot.release();
    }

    // ═══════════════════════════════════════════════════════════
    // SELF-ASSESS TESTS
    // ═══════════════════════════════════════════════════════════

    function test_selfAssess() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(alice);
        slot.selfAssess(50 ether);

        assertEq(slot.price(), 50 ether);
    }

    function test_selfAssessRejectsZero() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(alice);
        vm.expectRevert(Slot.InvalidPrice.selector);
        slot.selfAssess(0);
    }

    // ═══════════════════════════════════════════════════════════
    // TAX TESTS
    // ═══════════════════════════════════════════════════════════

    function test_taxAccrues() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        // Fast forward 30 days (1 month)
        vm.warp(block.timestamp + 30 days);

        // Tax owed = 100 * 100 / 10000 = 1% of 100 = 1 ether per month
        uint256 owed = slot.taxOwed();
        assertEq(owed, 1 ether);
    }

    function test_collect() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.warp(block.timestamp + 30 days);

        uint256 recipientBefore = token.balanceOf(recipient);
        slot.collect();
        uint256 recipientAfter = token.balanceOf(recipient);

        assertEq(recipientAfter - recipientBefore, 1 ether);
    }

    // ═══════════════════════════════════════════════════════════
    // LIQUIDATION TESTS
    // ═══════════════════════════════════════════════════════════

    function test_liquidation() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 1 ether, 100 ether);

        // 1% of 100 = 1 ether/month. With 1 ether deposit, insolvent after 30 days.
        vm.warp(block.timestamp + 31 days);

        assertTrue(slot.isInsolvent());

        uint256 liquidatorBefore = token.balanceOf(liquidator);

        vm.prank(liquidator);
        slot.liquidate();

        assertTrue(slot.isVacant());

        // Liquidator should get 5% bounty
        uint256 bounty = token.balanceOf(liquidator) - liquidatorBefore;
        assertTrue(bounty > 0);
    }

    function test_cannotLiquidateSolvent() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(liquidator);
        vm.expectRevert(Slot.NotInsolvent.selector);
        slot.liquidate();
    }

    // ═══════════════════════════════════════════════════════════
    // DEPOSIT / WITHDRAW TESTS
    // ═══════════════════════════════════════════════════════════

    function test_topUp() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.startPrank(alice);
        token.approve(address(slot), 5 ether);
        slot.topUp(5 ether);
        vm.stopPrank();

        assertEq(slot.deposit(), 15 ether);
    }

    function test_withdraw() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        uint256 before = token.balanceOf(alice);

        vm.prank(alice);
        slot.withdraw(5 ether);

        assertEq(slot.deposit(), 5 ether);
        assertEq(token.balanceOf(alice) - before, 5 ether);
    }

    function test_withdrawRejectsBelowMinimum() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(alice);
        vm.expectRevert(Slot.InsufficientDeposit.selector);
        slot.withdraw(10 ether); // Would leave 0, below minimum
    }

    // ═══════════════════════════════════════════════════════════
    // PENDING UPDATE TESTS
    // ═══════════════════════════════════════════════════════════

    function test_proposeTaxUpdate() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(manager);
        slot.proposeTaxUpdate(200); // 2%

        PendingUpdate memory update = slot.getPendingUpdate();
        assertTrue(update.hasTaxUpdate);
        assertEq(update.newTaxPercentage, 200);

        // Tax rate hasn't changed yet
        assertEq(slot.taxPercentage(), 100);
    }

    function test_pendingTaxAppliedOnBuy() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(manager);
        slot.proposeTaxUpdate(200);

        // Bob buys — pending update applies
        _buySlot(slot, bob, 15 ether, 200 ether);

        assertEq(slot.taxPercentage(), 200); // Now 2%
        PendingUpdate memory update = slot.getPendingUpdate();
        assertFalse(update.hasTaxUpdate);
    }

    function test_pendingTaxAppliedOnRelease() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(manager);
        slot.proposeTaxUpdate(300);

        vm.prank(alice);
        slot.release();

        assertEq(slot.taxPercentage(), 300);
    }

    function test_pendingTaxAppliedOnLiquidation() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 1 ether, 100 ether);

        vm.prank(manager);
        slot.proposeTaxUpdate(500);

        vm.warp(block.timestamp + 31 days);

        vm.prank(liquidator);
        slot.liquidate();

        assertEq(slot.taxPercentage(), 500);
    }

    function test_cancelPendingUpdate() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        vm.prank(manager);
        slot.proposeTaxUpdate(200);

        vm.prank(manager);
        slot.cancelPendingUpdates();

        PendingUpdate memory update = slot.getPendingUpdate();
        assertFalse(update.hasTaxUpdate);
        assertEq(slot.taxPercentage(), 100); // Unchanged
    }

    function test_immutableSlotRejectsAnyProposal() public {
        Slot slot = _createSlot(_immutableConfig());

        // manager is address(0) on immutable slots, so any caller gets NotManager
        vm.prank(alice);
        vm.expectRevert(Slot.NotManager.selector);
        slot.proposeTaxUpdate(200);

        vm.prank(alice);
        vm.expectRevert(Slot.NotManager.selector);
        slot.proposeModuleUpdate(makeAddr("module"));
    }

    function test_onlyManagerCanPropose() public {
        Slot slot = _createDefaultSlot();

        vm.prank(alice);
        vm.expectRevert(Slot.NotManager.selector);
        slot.proposeTaxUpdate(200);
    }

    // ═══════════════════════════════════════════════════════════
    // LIQUIDATION BOUNTY UPDATE
    // ═══════════════════════════════════════════════════════════

    function test_setLiquidationBounty() public {
        Slot slot = _createDefaultSlot();

        vm.prank(manager);
        slot.setLiquidationBounty(1000); // 10%

        assertEq(slot.liquidationBountyBps(), 1000);
    }

    function test_setLiquidationBountyOnlyManager() public {
        Slot slot = _createDefaultSlot();

        vm.prank(alice);
        vm.expectRevert(Slot.NotManager.selector);
        slot.setLiquidationBounty(1000);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW TESTS
    // ═══════════════════════════════════════════════════════════

    function test_secondsUntilLiquidation() public {
        Slot slot = _createDefaultSlot();
        _buySlot(slot, alice, 10 ether, 100 ether);

        uint256 secs = slot.secondsUntilLiquidation();
        // 10 ether deposit / (100 * 100 / 10000 / 30 days) per second
        // = 10 / (1 / 2592000) = 10 * 2592000 = 25920000 seconds ≈ 300 days
        assertTrue(secs > 250 days && secs < 310 days);
    }

    function test_vacantSlotMaxLiquidationTime() public {
        Slot slot = _createDefaultSlot();
        assertEq(slot.secondsUntilLiquidation(), type(uint256).max);
    }
}
