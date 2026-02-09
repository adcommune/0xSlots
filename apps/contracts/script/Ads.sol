// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {BaseScript, console2} from "./Base.s.sol";
import {Harberger} from "../src/Harberger.sol";
import {TestPureSuperToken} from "../src/lib/TestPureSuperToken.sol";
import {HarbergerHub} from "../src/HarbergerHub.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {PullSplitFactory} from "splits-v2/splitters/pull/PullSplitFactory.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";
import {HubSettings} from "../src/interfaces/IHarbergerHub.sol";
import {HarbergerStreamSuperApp} from "../src/HarbergerStreamSuperApp.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {console} from "forge-std/console.sol";
import {AdLandSplitDistributor} from "../src/AdLandDistributor.sol";
import {SplitV2Lib} from "@split/contract/libraries/SplitV2.sol";
import {PoolConfig} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";

contract AdScript is BaseScript {
  using SuperTokenV1Library for ISuperToken;

  struct DeploymentParams {
    address pullSplitFactory;
    address host;
    address cfav1;
    address cfav1Forwarder;
    address superTokenFactory;
    address splitWarehouse;
  }

  DeploymentParams public deployParams;

  modifier setupParams(DeployementChain chain) {
    if (chain == DeployementChain.Base) {
      deployParams = DeploymentParams({
        pullSplitFactory: 0x6B9118074aB15142d7524E8c4ea8f62A3Bdb98f1,
        host: 0x4C073B3baB6d8826b8C5b229f3cfdC1eC6E47E74,
        cfav1: 0x19ba78B9cDB05A877718841c574325fdB53601bb,
        cfav1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125,
        superTokenFactory: 0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3,
        splitWarehouse: 0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8
      });
    } else if (chain == DeployementChain.OptimismSepolia) {
      deployParams = DeploymentParams({
        pullSplitFactory: 0x5cbA88D55Cec83caD5A105Ad40C8c9aF20bE21d1,
        host: 0xd399e2Fb5f4cf3722a11F65b88FAB6B2B8621005,
        cfav1: 0x8a3170AdbC67233196371226141736E4151e7C26,
        cfav1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125,
        superTokenFactory: 0xfcF0489488397332579f35b0F711BE570Da0E8f5,
        splitWarehouse: 0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8
      });
    } else if (chain == DeployementChain.Sepolia) {
      deployParams = DeploymentParams({
        pullSplitFactory: 0x5cbA88D55Cec83caD5A105Ad40C8c9aF20bE21d1,
        host: 0x109412E3C84f0539b43d39dB691B08c90f58dC7c,
        cfav1: 0x6836F23d6171D74Ef62FcF776655aBcD2bcd62Ef,
        cfav1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125,
        superTokenFactory: 0x254C2e152E8602839D288A7bccdf3d0974597193,
        splitWarehouse: 0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8
      });
    } else if (chain == DeployementChain.BaseSepolia) {
      deployParams = DeploymentParams({
        pullSplitFactory: 0x6B9118074aB15142d7524E8c4ea8f62A3Bdb98f1,
        host: 0x109412E3C84f0539b43d39dB691B08c90f58dC7c,
        cfav1: 0x6836F23d6171D74Ef62FcF776655aBcD2bcd62Ef,
        cfav1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125,
        superTokenFactory: 0x7447E94Dfe3d804a9f46Bf12838d467c912C8F6C,
        splitWarehouse: 0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8
      });
    }
    _;
  }

  function deploySuperfluidPool(
    DeployementChain chain
  ) public setupParams(chain) broadcastOn(chain) {
    PoolConfig memory poolConfig = PoolConfig({
      transferabilityForUnitsOwner: false,
      distributionFromAnyAddress: false
    });
    ISuperfluidPool superfluidPool = ISuperToken(_readDeployment("ADToken"))
      .createPool(0xc60802e73D3fB9Cd8A14c5497e6D4D5cc7132FFC, poolConfig);

    _openLand(address(superfluidPool));
  }

  function createSplitDistributorLand(
    DeployementChain chain
  ) public setupParams(chain) broadcastOn(chain) {
    address splitDistributor = address(
      new AdLandSplitDistributor(deployParams.splitWarehouse)
    );
    _saveDeployment(splitDistributor, "AdLandSplitDistributor");
  }

  function deployMetadataModule(
    DeployementChain chain
  ) public setupParams(chain) broadcastOn(chain) {
    address metadataModule = address(new MetadataModule());
    _saveDeployment(metadataModule, "MetadataModule");
  }

  function deployAdToken(
    DeployementChain chain
  ) public setupParams(chain) broadcastOn(chain) {
    (, address sender, ) = vm.readCallers();

    TestPureSuperToken token = new TestPureSuperToken();
    token.initialize(
      deployParams.superTokenFactory,
      "AdLand",
      "AD",
      sender,
      100_000_000_000 ether
    );

    _saveDeployment(address(token), "ADToken");
  }

  function deployHarbergerHub(
    DeployementChain chain
  ) public setupParams(chain) broadcastOn(chain) {
    address adToken = _readDeployment("ADToken");
    if (chain == DeployementChain.Base) {
      // Add production chain;
      adToken = address(0);
    }

    Harberger harberger = new Harberger();
    HarbergerStreamSuperApp taxDistributor = new HarbergerStreamSuperApp();

    address metadataModule = _readDeployment("MetadataModule");

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

    hub.allowModule(address(metadataModule), true);
    hub.allowCurrency(address(adToken), true);

    _saveDeployment(address(hub), "HarbergerHub");

    address land1 = _openLand(0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045);
    _openLand(0x26bBec292e5080ecFD36F38FF1619FF35826b113);
    _openLand(0x5145F20A40e442ba48E27c719D62B36B4e9CA15A);

    _dealAdTokens(msg.sender);
    _allowFlowsFor(land1);
    _approveAdTokens(land1, 10_000 ether);
    Harberger(land1).buy(1);
  }

  function openLand(
    DeployementChain chain,
    address account
  ) public setupParams(chain) broadcastOn(chain) {
    _openLand(account);
  }

  function _openLand(address account) internal returns (address) {
    address harbergerHub = _readDeployment("HarbergerHub");

    return HarbergerHub(harbergerHub).openLand(account);
  }

  function _dealAdTokens(address account) internal {
    address adToken = _readDeployment("ADToken");
    TestPureSuperToken(payable(adToken)).mint(account, 10_000 ether);
  }

  function _allowFlowsFor(address account) internal {
    address adToken = _readDeployment("ADToken");
    ISuperToken(payable(adToken)).setMaxFlowPermissions(account);
  }

  function _approveAdTokens(address account, uint256 amount) internal {
    address adToken = _readDeployment("ADToken");
    IERC20(adToken).approve(account, amount);
  }
}
