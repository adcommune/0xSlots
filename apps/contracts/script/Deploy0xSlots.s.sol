// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Harberger} from "../src/Harberger.sol";
import {HarbergerHub} from "../src/HarbergerHub.sol";
import {HarbergerStreamSuperApp} from "../src/HarbergerStreamSuperApp.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";
import {HubSettings} from "../src/interfaces/IHarbergerHub.sol";

/**
 * @title Deploy0xSlots
 * @notice Deploys the core 0xSlots protocol: HarbergerHub + MetadataModule
 *         on Arbitrum, Base, and Optimism mainnets.
 *
 * Usage:
 *   forge script script/Deploy0xSlots.s.sol:Deploy0xSlots \
 *     --sig "deployAll()" --broadcast --verify
 *
 * Or single chain:
 *   forge script script/Deploy0xSlots.s.sol:Deploy0xSlots \
 *     --sig "deployChain(uint8)" 5 --broadcast --verify
 *
 *   Chain indices: 4=Base, 5=Arbitrum, 6=Optimism
 */
contract Deploy0xSlots is BaseScript {

    struct SuperfluidParams {
        address host;
        address cfav1;
    }

    mapping(DeployementChain => SuperfluidParams) internal sfParams;

    function _initSfParams() internal {
        sfParams[DeployementChain.Base] = SuperfluidParams({
            host: 0x4C073B3baB6d8826b8C5b229f3cfdC1eC6E47E74,
            cfav1: 0x19ba78B9cDB05A877718841c574325fdB53601bb
        });
        sfParams[DeployementChain.Arbitrum] = SuperfluidParams({
            host: 0xCf8Acb4eF033efF16E8080aed4c7D5B9285D2192,
            cfav1: 0xe4a0dc18DD1C25bEFBe45E78b03E89f4D54c5e8E
        });
        sfParams[DeployementChain.Optimism] = SuperfluidParams({
            host: 0x567c4B141ED61923967cA25Ef4906C8781069a10,
            cfav1: 0x204C6f131bb7F258b2Ea1593f5309911d745571A
        });
    }

    /// @notice Deploy to all three mainnet chains
    function deployAll() external {
        _initSfParams();
        _deploy(DeployementChain.Arbitrum);
        _deploy(DeployementChain.Base);
        _deploy(DeployementChain.Optimism);
    }

    /// @notice Deploy to a single chain by enum index
    function deployChain(uint8 chainIdx) external {
        _initSfParams();
        _deploy(DeployementChain(chainIdx));
    }

    function _deploy(DeployementChain chain) internal broadcastOn(chain) {
        SuperfluidParams memory sf = sfParams[chain];
        require(sf.host != address(0), "Chain not configured");

        console2.log("=== Deploying 0xSlots ===");

        // 1. Deploy implementations
        Harberger harbergerImpl = new Harberger();
        console2.log("Harberger impl:", address(harbergerImpl));

        HarbergerStreamSuperApp taxDistributorImpl = new HarbergerStreamSuperApp();
        console2.log("TaxDistributor impl:", address(taxDistributorImpl));

        MetadataModule metadataModule = new MetadataModule();
        console2.log("MetadataModule:", address(metadataModule));
        _saveDeployment(address(metadataModule), "MetadataModule");

        // 2. Deploy HarbergerHub behind UUPS proxy
        HubSettings memory hubSettings = HubSettings({
            protocolFeeBps: 200,              // 2%
            protocolFeeRecipient: msg.sender,
            slotPrice: 0.001 ether,
            newLandInitialCurrency: address(0), // set per-chain token later
            newLandInitialAmount: 6,
            newLandInitialPrice: 0.001 ether,
            newLandInitialTaxPercentage: 100,   // 1%
            newLandInitialMaxTaxPercentage: 1000, // 10%
            newLandInitialMinTaxUpdatePeriod: 7 days,
            newLandInitialModule: address(metadataModule)
        });

        HarbergerHub hub = HarbergerHub(
            address(
                new UUPSProxy(
                    address(new HarbergerHub()),
                    abi.encodeWithSelector(
                        HarbergerHub.initialize.selector,
                        address(harbergerImpl),
                        address(taxDistributorImpl),
                        sf.host,
                        sf.cfav1,
                        hubSettings
                    )
                )
            )
        );

        hub.allowModule(address(metadataModule), true);

        console2.log("HarbergerHub proxy:", address(hub));
        _saveDeployment(address(hub), "HarbergerHub");

        console2.log("=== Done ===");
    }
}
