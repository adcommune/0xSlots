// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Test} from "forge-std/Test.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {HarbergerHub} from "../src/HarbergerHub.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {TestPureSuperToken} from "../src/lib/TestPureSuperToken.sol";
import {Harberger} from "../src/Harberger.sol";
import {HarbergerStreamSuperApp} from "../src/HarbergerStreamSuperApp.sol";
import {HubSettings} from "../src/interfaces/IHarbergerHub.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";
import {console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct DeploymentParams {
  address pullSplitFactory;
  address host;
  address cfav1;
  address cfav1Forwarder;
  address superTokenFactory;
}

contract HabergerBaseTest is Test {
  using SuperTokenV1Library for ISuperToken;
  HarbergerHub internal harbergerHub;
  MetadataModule internal metadataModule;
  DeploymentParams internal deployParams;
  TestPureSuperToken internal adToken;

  event SlotReleased(uint256 indexed slotId);

  function setUp() public virtual {
    vm.createSelectFork("basesepolia");

    deployParams = DeploymentParams({
      pullSplitFactory: 0x6B9118074aB15142d7524E8c4ea8f62A3Bdb98f1,
      host: 0x109412E3C84f0539b43d39dB691B08c90f58dC7c,
      cfav1: 0x6836F23d6171D74Ef62FcF776655aBcD2bcd62Ef,
      cfav1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125,
      superTokenFactory: 0x7447E94Dfe3d804a9f46Bf12838d467c912C8F6C
    });

    adToken = TestPureSuperToken(
      payable(0x24B3E68C5B4A9dBe609426B1b0d6438B02Dc0428)
    );

    Harberger harberger = new Harberger();
    HarbergerStreamSuperApp taxDistributor = new HarbergerStreamSuperApp();
    vm.label(address(harberger), "harberger");

    metadataModule = new MetadataModule();

    vm.label(address(metadataModule), "metadataModule");

    HubSettings memory hubSettings = HubSettings({
      protocolFeeBps: 200,
      protocolFeeRecipient: msg.sender,
      slotPrice: 0.001 ether,
      newLandInitialCurrency: address(adToken),
      newLandInitialAmount: 6,
      newLandInitialPrice: 0.001 ether,
      newLandInitialTaxPercentage: 100,
      newLandInitialMaxTaxPercentage: 1000,
      newLandInitialMinTaxUpdatePeriod: 7 days,
      newLandInitialModule: address(metadataModule)
    });

    HarbergerHub hub = HarbergerHub(
      address(
        new UUPSProxy(
          address(new HarbergerHub()),
          abi.encodeWithSelector(
            HarbergerHub.initialize.selector,
            address(harberger),
            address(taxDistributor),
            deployParams.host,
            deployParams.cfav1,
            hubSettings
          )
        )
      )
    );
    vm.label(address(hub), "hub");

    harbergerHub = HarbergerHub(hub);

    harbergerHub.allowModule(address(metadataModule), true);
    harbergerHub.allowCurrency(address(adToken), true);
  }

  function _approveAdToken(
    address account,
    address spender,
    uint256 amount
  ) internal {
    vm.prank(account);
    IERC20(address(adToken)).approve(spender, amount);
  }

  function _fundAdToken(address account, uint256 amount) internal {
    adToken.mint(account, amount);
  }

  function _getSlotPrice(
    Harberger land,
    uint256 slotId
  ) internal view returns (uint256) {
    return land.getSlot(slotId).price;
  }

  function _allowLandToOperateAdTokenFlowsFor(
    Harberger land,
    address account
  ) internal {
    vm.startPrank(account);
    ISuperToken(payable(address(adToken))).setMaxFlowPermissions(address(land));
    // ISuperToken(payable(address(adToken))).setMaxFlowPermissions(
    //   land.getTaxDistributor()
    // );
    vm.stopPrank();
  }

  function _getFlowRate(
    ISuperToken token,
    address sender,
    address receiver
  ) internal view returns (int96) {
    return token.getFlowRate(sender, receiver);
  }

  function _calculateFlowRate(
    uint256 price,
    uint256 taxPercentage
  ) internal pure returns (int96) {
    // Calculate tax amount for 30 days: price * taxPercentage / BASIS_POINTS
    uint256 thirtyDayTax = (price * taxPercentage) / 10000;

    // Convert to flow rate per second: thirtyDayTax / THIRTY_DAYS
    uint256 flowRatePerSecond = thirtyDayTax / 30 days;

    return int96(int256(flowRatePerSecond));
  }

  function _createBuyer(uint256 pk, Harberger land) internal returns (address) {
    address buyer = vm.addr(pk);
    _allowLandToOperateAdTokenFlowsFor(land, buyer);
    _fundAdToken(buyer, 100 ether);
    _approveAdToken(buyer, address(land), type(uint256).max);
    return buyer;
  }

  function _logSection(string memory section) internal pure {
    console2.log("");
    console2.log(
      "======================================== ",
      section,
      " ========================================"
    );
    console2.log("");
  }
}
