// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {console2} from "forge-std/Test.sol";
import {DSTestFull} from "./DSTestFull.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";
import {SlotsHub} from "../src/SlotsHub.sol";
import {Harberger} from "../src/Slots.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {TestPureSuperToken} from "../src/lib/TestPureSuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HubSettings} from "../src/interfaces/ISlotsHub.sol";
import {SlotsStreamSuperApp} from "../src/SlotsStreamSuperApp.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {HabergerBaseTest} from "./HabergerBaseTest.sol";

contract SlotsHubTest is HabergerBaseTest {
  using SuperTokenV1Library for ISuperToken;

  // Base Land Test data:
  Slots internal land;
  address internal landOwner = vm.addr(1);
  address internal landOwner2 = vm.addr(2);
  address internal taxDistributor;
  address internal buyer;
  address internal buyer2;
  address internal buyer3;
  uint256 internal baseSlotPrice;
  int96 internal baseSlotFlowRate;
  uint256 internal baseTaxPercentage;
  ISuperToken internal slotCurrency;

  function setUp() public override {
    super.setUp();
    land = _openLand(landOwner);
    taxDistributor = land.getTaxDistributor();
    buyer = _createBuyer(101, land);
    buyer2 = _createBuyer(102, land);
    buyer3 = _createBuyer(103, land);
    baseSlotPrice = land.getSlot(1).price;
    baseSlotFlowRate = _calculateFlowRate(baseSlotPrice, 100);
    baseTaxPercentage = land.getSlot(1).taxPercentage;
    slotCurrency = land.getSlot(1).currency;
  }

  function testBuyFromExistingOccupant() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer2);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer2);
    assertEq(_flowToDistributor(buyer), 0);
    assertEq(_flowToDistributor(buyer2), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);
  }

  function testTwoBuysFromSameBuyer() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer);
    land.buy(2);

    assertEq(land.getOccupant(2), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate * 2);
    assertEq(_flowToOwner(), baseSlotFlowRate * 2);
  }

  function testBuySelfAssessmentUpAndDown() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer);
    land.selfAssess(1, baseSlotPrice * 2);

    _assertFlowRate(_flowToDistributor(buyer), baseSlotFlowRate * 2);
    _assertFlowRate(_flowToOwner(), baseSlotFlowRate * 2);
  }

  function testBuyAndRelease() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer);
    land.release(1);

    assertEq(land.getOccupant(1), land.owner());
    _assertFlowRate(_flowToDistributor(buyer), 0);
    _assertFlowRate(_flowToOwner(), 0);
  }

  function testBuySelfAssessAndRelease() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer);
    land.selfAssess(1, baseSlotPrice * 2);

    _assertFlowRate(_flowToDistributor(buyer), baseSlotFlowRate * 2);
    _assertFlowRate(_flowToOwner(), baseSlotFlowRate * 2);

    vm.prank(buyer);
    land.release(1);

    assertEq(land.getOccupant(1), land.owner());
    _assertFlowRate(_flowToDistributor(buyer), 0);
    _assertFlowRate(_flowToOwner(), 0);
  }

  function testTwoBuysFromDifferentBuyers() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer2);
    land.buy(2);

    assertEq(land.getOccupant(2), buyer2);
    assertEq(_flowToDistributor(buyer2), baseSlotFlowRate);
    _assertFlowRate(_flowToOwner(), baseSlotFlowRate * 2);
  }

  function testTwoBuysFromDifferentBuyersAndOneRelease() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    assertEq(_flowToDistributor(buyer), baseSlotFlowRate);
    assertEq(_flowToOwner(), baseSlotFlowRate);

    vm.prank(buyer2);
    land.buy(2);

    assertEq(land.getOccupant(2), buyer2);
    _assertFlowRate(_flowToDistributor(buyer2), baseSlotFlowRate);
    _assertFlowRate(_flowToOwner(), baseSlotFlowRate * 2);

    vm.prank(buyer2);
    land.release(2);

    assertEq(land.getOccupant(2), land.owner());
    _assertFlowRate(_flowToDistributor(buyer2), 0);
    _assertFlowRate(_flowToOwner(), baseSlotFlowRate);
  }

  function testDeleteFlowFromOutsideApp() public {
    vm.prank(buyer);
    land.buy(1);

    vm.prank(buyer);
    ISuperToken(payable(address(adToken))).deleteFlow(buyer, taxDistributor);

    assertEq(_getFlowRate(land.getSlot(1).currency, buyer, taxDistributor), 0);
    address slotOccupant = land.getOccupant(1);
    assertEq(slotOccupant, land.owner());
  }

  function testUpdateDownFlowFromOutsideAppOwningMultipleSlots() public {
    vm.prank(buyer);
    land.buy(1);
    vm.prank(buyer);
    land.buy(2);
    vm.prank(buyer);
    land.buy(3);
    vm.prank(buyer);
    land.buy(4);

    vm.prank(buyer);
    ISuperToken(payable(address(adToken))).updateFlow(
      taxDistributor,
      baseSlotFlowRate + (baseSlotFlowRate / 2)
    );

    assertEq(land.getOccupant(1), buyer);
    assertEq(land.getOccupant(2), land.owner());
    assertEq(land.getOccupant(3), land.owner());
    assertEq(land.getOccupant(4), land.owner());
  }

  function testBuyAndOwnerTaxUpdate() public {
    vm.prank(buyer);
    land.buy(1);

    vm.prank(landOwner);
    land.proposeTaxRateUpdate(1, baseTaxPercentage * 2);

    vm.warp(block.timestamp + land.getSlot(1).minTaxUpdatePeriod + 1);
    vm.prank(landOwner);
    land.confirmTaxRateUpdate(1);

    int96 expectedFlowRate = _calculateFlowRate(
      baseSlotPrice,
      baseTaxPercentage * 2
    );
    assertEq(_flowToDistributor(buyer), expectedFlowRate);
    assertEq(_flowToOwner(), expectedFlowRate);
  }

  function testMetadataModule() public {
    vm.prank(buyer);
    land.buy(1);

    assertEq(land.getOccupant(1), buyer);
    MetadataModule metadataModule = MetadataModule(land.getModule(1));

    vm.prank(buyer);
    metadataModule.setMetadata(address(land), 1, "test metadata");
    MetadataModule.MetadataSlot memory metadata = metadataModule.getMetadata(
      address(land),
      1
    );
    assertEq(metadata.metadata, "test metadata");
    assertEq(metadata.owner, buyer);

    vm.prank(buyer2);
    vm.expectRevert();
    metadataModule.setMetadata(address(land), 1, "test metadata");

    vm.prank(buyer2);
    land.buy(1);

    MetadataModule.MetadataSlot memory newMetadata = metadataModule.getMetadata(
      address(land),
      1
    );
    assertEq(newMetadata.metadata, "");
    assertEq(newMetadata.owner, buyer2);
  }

  function testOwnerDeletesStream() public {
    //
  }

  function _openLand(address owner) internal returns (Harberger) {
    vm.prank(owner);
    return Slots(harbergerHub.openLand(owner));
  }

  function _flowToDistributor(address account) internal view returns (int96) {
    return _getFlowRate(slotCurrency, account, taxDistributor);
  }

  function _flowToOwner() internal view returns (int96) {
    return _getFlowRate(slotCurrency, taxDistributor, landOwner);
  }

  function _assertFlowRate(int96 flowRateA, int96 flowRateB) internal {
    vm.assertApproxEqAbs(flowRateA, flowRateB, 1);
  }
}
