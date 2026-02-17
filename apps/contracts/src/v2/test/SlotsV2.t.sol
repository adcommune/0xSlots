// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Slots} from "../Slots.sol";
import {SlotsHub} from "../SlotsHub.sol";
import {HubSettings, SlotParams, SlotEscrow} from "../ISlots.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
  constructor() ERC20("Mock USDC", "USDC") {
    _mint(msg.sender, 1_000_000e18);
  }
  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}

contract MockModule {
  event OnTransfer(uint256 slotId, address from, address to);
  event OnRelease(uint256 slotId, address occupant);
  event OnPriceUpdate(uint256 slotId, uint256 oldPrice, uint256 newPrice);

  function onTransfer(uint256 slotId, address from, address to) external {
    emit OnTransfer(slotId, from, to);
  }
  function onRelease(uint256 slotId, address occupant) external {
    emit OnRelease(slotId, occupant);
  }
  function onPriceUpdate(uint256 slotId, uint256 oldPrice, uint256 newPrice) external {
    emit OnPriceUpdate(slotId, oldPrice, newPrice);
  }
}

// Module that burns lots of gas (tests gas limit)
contract GasHogModule {
  uint256 public dummy;
  function onTransfer(uint256, address, address) external {
    // Burn gas with storage writes
    for (uint256 i = 0; i < 100; i++) {
      dummy = i;
    }
  }
  function onRelease(uint256, address) external {}
  function onPriceUpdate(uint256, uint256, uint256) external {}
}

contract SlotsV2Test is Test {
  MockToken token;
  SlotsHub hub;
  Slots slotsImpl;
  MockModule module;

  address admin = address(this);
  address alice = address(0xA11CE);
  address bob = address(0xB0B);
  address charlie = address(0xC);

  uint256 constant MIN_DEPOSIT_SECONDS = 7 days;

  function setUp() public {
    token = new MockToken();
    module = new MockModule();
    slotsImpl = new Slots();

    HubSettings memory settings = HubSettings({
      protocolFeeBps: 200, // 2%
      protocolFeeRecipient: admin,
      landCreationFee: 0,
      slotExpansionFee: 0,
      newLandInitialCurrency: address(token),
      newLandInitialAmount: 3,
      newLandInitialPrice: 1 ether,
      newLandInitialTaxPercentage: 100, // 1%
      newLandInitialMaxTaxPercentage: 1000, // 10%
      newLandInitialMinTaxUpdatePeriod: 7 days,
      newLandInitialModule: address(0),
      moduleCallGasLimit: 500_000,
      liquidationBountyBps: 500, // 5%
      minDepositSeconds: MIN_DEPOSIT_SECONDS
    });

    hub = new SlotsHub();
    hub.initialize(address(slotsImpl), settings);
    hub.allowCurrency(address(token), true);
    hub.allowModule(address(module), true);

    // Fund users
    token.mint(alice, 100_000e18);
    token.mint(bob, 100_000e18);
    token.mint(charlie, 100_000e18);
  }

  function _openLand(address account) internal returns (Slots) {
    address land = hub.openLand(account);
    return Slots(land);
  }

  /// @dev Calculate minimum deposit for a slot (1 ETH at 1% for MIN_DEPOSIT_SECONDS)
  function _minDeposit() internal pure returns (uint256) {
    return (1 ether * 100 * MIN_DEPOSIT_SECONDS) / (365 days * 10_000);
  }

  // ═══════════════════════════════════════════════════
  // LAND CREATION
  // ═══════════════════════════════════════════════════

  function test_openLand() public {
    Slots land = _openLand(alice);
    assertEq(land.owner(), alice);
    assertEq(land.nextSlotId(), 4); // 3 slots created
  }

  function test_cannotOpenLandTwice() public {
    _openLand(alice);
    vm.expectRevert(SlotsHub.LandAlreadyExists.selector);
    hub.openLand(alice);
  }

  // ═══════════════════════════════════════════════════
  // BUYING
  // ═══════════════════════════════════════════════════

  function test_buy() public {
    Slots land = _openLand(alice);
    uint256 depositAmount = 10e18;
    uint256 price = 1 ether;

    vm.startPrank(bob);
    token.approve(address(land), price + depositAmount);
    land.buy(1, depositAmount);
    vm.stopPrank();

    assertEq(land.getOccupant(1), bob);
  }

  function test_buy_refunds_previous_deposit() public {
    Slots land = _openLand(alice);
    uint256 minDep = _minDeposit();

    // Bob buys slot 1
    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    uint256 bobBalBefore = token.balanceOf(bob);

    // Charlie buys slot 1 from bob
    vm.startPrank(charlie);
    token.approve(address(land), 100e18);
    land.buy(1, 5e18);
    vm.stopPrank();

    // Bob should have received: price (1e18) + remaining deposit (~10e18)
    uint256 bobBalAfter = token.balanceOf(bob);
    assertTrue(bobBalAfter > bobBalBefore);
    assertEq(land.getOccupant(1), charlie);
  }

  function test_buy_rejects_insufficient_deposit() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    vm.expectRevert(Slots.InsufficientDeposit.selector);
    land.buy(1, 0); // zero deposit, minDepositSeconds > 0
    vm.stopPrank();
  }

  // ═══════════════════════════════════════════════════
  // SELF-ASSESS
  // ═══════════════════════════════════════════════════

  function test_selfAssess() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    land.selfAssess(1, 2 ether); // higher price but deposit still covers 7d minimum
    vm.stopPrank();

    (, , , uint256 price, , , , , ) = land.slots(1);
    assertEq(price, 2 ether);
  }

  function test_selfAssess_rejects_if_deposit_below_minimum() public {
    Slots land = _openLand(alice);

    // Buy with minimum deposit
    uint256 minDep = _minDeposit();
    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, minDep + 1); // just barely enough

    // Set price very high — minimum deposit will exceed current deposit
    vm.expectRevert(Slots.InsufficientDeposit.selector);
    land.selfAssess(1, 1000 ether);
    vm.stopPrank();
  }

  // ═══════════════════════════════════════════════════
  // TAX SETTLEMENT
  // ═══════════════════════════════════════════════════

  function test_taxAccrues() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    // Fast forward 30 days
    vm.warp(block.timestamp + 30 days);

    uint256 owed = land.taxOwed(1);
    // 1 ether * 100 bps * 30 days / (365 days * 10000) ≈ 0.00821e18
    assertTrue(owed > 0);
    console2.log("Tax owed after 30 days:", owed);
  }

  function test_settleOnSelfAssess() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    vm.warp(block.timestamp + 30 days);

    uint256 owedBefore = land.taxOwed(1);

    // Self-assess triggers _settle
    vm.prank(bob);
    land.selfAssess(1, 2 ether);

    uint256 owedAfter = land.taxOwed(1);
    assertEq(owedAfter, 0); // Just settled
    assertTrue(owedBefore > 0);
  }

  // ═══════════════════════════════════════════════════
  // LIQUIDATION
  // ═══════════════════════════════════════════════════

  function test_liquidation() public {
    Slots land = _openLand(alice);
    uint256 minDep = _minDeposit();

    // Bob buys with small deposit
    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, minDep + 1);
    vm.stopPrank();

    // Fast forward until insolvent
    vm.warp(block.timestamp + 365 days);

    assertTrue(land.isInsolvent(1));

    uint256 charlieBefore = token.balanceOf(charlie);

    // Charlie liquidates
    vm.prank(charlie);
    land.liquidate(1);

    uint256 charlieAfter = token.balanceOf(charlie);

    assertEq(land.getOccupant(1), alice); // back to owner
    // Charlie should have received liquidation bounty (5% of collected tax)
    assertTrue(charlieAfter > charlieBefore, "Liquidator should receive bounty");
    console2.log("Liquidation bounty:", charlieAfter - charlieBefore);
  }

  function test_cannotLiquidateSolvent() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 50e18); // large deposit
    vm.stopPrank();

    vm.warp(block.timestamp + 1 days);

    assertFalse(land.isInsolvent(1));

    vm.expectRevert();
    vm.prank(charlie);
    land.liquidate(1);
  }

  // ═══════════════════════════════════════════════════
  // COLLECT TAX
  // ═══════════════════════════════════════════════════

  function test_collectTax() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    vm.warp(block.timestamp + 30 days);

    uint256 aliceBefore = token.balanceOf(alice);

    vm.prank(alice);
    land.collect(1);

    uint256 aliceAfter = token.balanceOf(alice);
    assertTrue(aliceAfter > aliceBefore);
    console2.log("Tax collected:", aliceAfter - aliceBefore);
  }

  function test_collectRange() public {
    Slots land = _openLand(alice);

    // Bob buys slots 1 and 2
    vm.startPrank(bob);
    token.approve(address(land), 200e18);
    land.buy(1, 10e18);
    land.buy(2, 10e18);
    vm.stopPrank();

    vm.warp(block.timestamp + 30 days);

    uint256 aliceBefore = token.balanceOf(alice);

    vm.prank(alice);
    land.collectRange(1, 3); // slots 1, 2, 3 (slot 3 has no tax — skips silently)

    uint256 aliceAfter = token.balanceOf(alice);
    assertTrue(aliceAfter > aliceBefore);
    console2.log("Tax collected (range):", aliceAfter - aliceBefore);
  }

  // ═══════════════════════════════════════════════════
  // DEPOSIT / WITHDRAW
  // ═══════════════════════════════════════════════════

  function test_topUp() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 5e18);

    // Top up
    land.deposit(1, 5e18);
    vm.stopPrank();

    SlotEscrow memory esc = land.getEscrow(1);
    assertEq(esc.deposit, 10e18);
  }

  function test_depositOnlyOccupant() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 5e18);
    vm.stopPrank();

    // Charlie tries to deposit into bob's slot
    vm.startPrank(charlie);
    token.approve(address(land), 10e18);
    vm.expectRevert(Slots.OnlyOccupant.selector);
    land.deposit(1, 5e18);
    vm.stopPrank();
  }

  function test_withdraw() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);

    uint256 before = token.balanceOf(bob);
    // Can only withdraw down to min deposit
    uint256 minDep = _minDeposit();
    uint256 withdrawable = 10e18 - minDep;
    land.withdraw(1, withdrawable);
    uint256 after_ = token.balanceOf(bob);
    vm.stopPrank();

    assertEq(after_ - before, withdrawable);
  }

  function test_withdraw_rejects_below_minimum() public {
    Slots land = _openLand(alice);
    uint256 minDep = _minDeposit();

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, minDep + 1);

    // Try to withdraw everything — should fail
    vm.expectRevert(Slots.InsufficientDeposit.selector);
    land.withdraw(1, minDep + 1);
    vm.stopPrank();
  }

  // ═══════════════════════════════════════════════════
  // RELEASE
  // ═══════════════════════════════════════════════════

  function test_release() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);

    uint256 before = token.balanceOf(bob);
    land.release(1);
    uint256 after_ = token.balanceOf(bob);
    vm.stopPrank();

    assertEq(land.getOccupant(1), alice);
    assertTrue(after_ > before); // got deposit back
  }

  // ═══════════════════════════════════════════════════
  // SECONDS UNTIL LIQUIDATION
  // ═══════════════════════════════════════════════════

  function test_secondsUntilLiquidation() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    uint256 secs = land.secondsUntilLiquidation(1);
    console2.log("Seconds until liquidation:", secs);
    assertTrue(secs > 0);

    // After half the time, should be roughly halved
    vm.warp(block.timestamp + secs / 2);
    uint256 secsHalf = land.secondsUntilLiquidation(1);
    assertTrue(secsHalf < secs);
    assertTrue(secsHalf > 0);
  }

  // ═══════════════════════════════════════════════════
  // TAX RATE PROPOSALS
  // ═══════════════════════════════════════════════════

  function test_taxRateProposal() public {
    Slots land = _openLand(alice);

    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(1, 10e18);
    vm.stopPrank();

    // Alice proposes tax increase
    vm.prank(alice);
    land.proposeTaxRateUpdate(1, 200); // 2%

    // Can't confirm before period
    vm.prank(alice);
    vm.expectRevert();
    land.confirmTaxRateUpdate(1);

    // Warp past min update period
    vm.warp(block.timestamp + 7 days + 1);

    vm.prank(alice);
    land.confirmTaxRateUpdate(1);

    (, , , , , uint256 newTax, , , ) = land.slots(1);
    assertEq(newTax, 200);
  }

  // ═══════════════════════════════════════════════════
  // MODULE CALLBACKS
  // ═══════════════════════════════════════════════════

  function test_moduleCallback() public {
    // Create land with module
    Slots land = _openLand(alice);

    // Need a land with module — expand with module slot
    SlotParams[] memory params = new SlotParams[](1);
    params[0] = SlotParams({
      currency: IERC20(address(token)),
      basePrice: 1 ether,
      taxPercentage: 100,
      maxTaxPercentage: 1000,
      minTaxUpdatePeriod: 7 days,
      module: address(module)
    });

    vm.prank(alice);
    hub.expandLand(alice, params);

    // Slot 4 should have the module
    assertEq(land.getModule(4), address(module));

    // Buy triggers onTransfer
    vm.startPrank(bob);
    token.approve(address(land), 100e18);
    land.buy(4, 10e18);
    vm.stopPrank();

    assertEq(land.getOccupant(4), bob);
  }

  // ═══════════════════════════════════════════════════
  // EXPAND LAND
  // ═══════════════════════════════════════════════════

  function test_expandLand() public {
    Slots land = _openLand(alice);
    assertEq(land.nextSlotId(), 4);

    SlotParams[] memory params = new SlotParams[](2);
    for (uint256 i = 0; i < 2; i++) {
      params[i] = SlotParams({
        currency: IERC20(address(token)),
        basePrice: 2 ether,
        taxPercentage: 100,
        maxTaxPercentage: 1000,
        minTaxUpdatePeriod: 7 days,
        module: address(0)
      });
    }

    vm.prank(alice);
    hub.expandLand(alice, params);

    assertEq(land.nextSlotId(), 6); // 3 original + 2 new
  }

  // ═══════════════════════════════════════════════════
  // PRICE = BASEPRICE ON CREATION (I-2)
  // ═══════════════════════════════════════════════════

  function test_priceEqualsBasePriceOnCreation() public {
    Slots land = _openLand(alice);
    (, , uint256 basePrice, uint256 price, , , , , ) = land.slots(1);
    assertEq(price, basePrice);
  }
}
