// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {Slots} from "../src/Slots.sol";
import {SlotsHub} from "../src/SlotsHub.sol";
import {SlotsStreamSuperApp} from "../src/SlotsStreamSuperApp.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";
import {HubSettings} from "../src/interfaces/ISlotsHub.sol";

contract DeployBaseSepolia is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address deployer = vm.addr(pk);

        // Base Sepolia Superfluid
        address sfHost = 0x109412E3C84f0539b43d39dB691B08c90f58dC7c;
        address sfCfa = 0x6836F23d6171D74Ef62FcF776655aBcD2bcd62Ef;

        // ETHx (Native Token Wrapper) on Base Sepolia
        address ethx = 0x143ea239159155B408e71CDbE836e8CFD6766732;

        console2.log("=== Deploying 0xSlots to Base Sepolia ===");
        console2.log("Deployer:", deployer);

        vm.startBroadcast(pk);

        Slots slotsImpl = new Slots();
        console2.log("Slots impl:", address(slotsImpl));

        SlotsStreamSuperApp taxDistributorImpl = new SlotsStreamSuperApp();
        console2.log("TaxDistributor impl:", address(taxDistributorImpl));

        MetadataModule metadataModule = new MetadataModule();
        console2.log("MetadataModule:", address(metadataModule));

        HubSettings memory hubSettings = HubSettings({
            protocolFeeBps: 200,
            protocolFeeRecipient: deployer,
            slotPrice: 0.001 ether,
            newLandInitialCurrency: ethx,
            newLandInitialAmount: 6,
            newLandInitialPrice: 0.001 ether,
            newLandInitialTaxPercentage: 100,
            newLandInitialMaxTaxPercentage: 1000,
            newLandInitialMinTaxUpdatePeriod: 7 days,
            newLandInitialModule: address(metadataModule)
        });

        SlotsHub hub = SlotsHub(
            address(
                new UUPSProxy(
                    address(new SlotsHub()),
                    abi.encodeWithSelector(
                        SlotsHub.initialize.selector,
                        address(slotsImpl),
                        address(taxDistributorImpl),
                        sfHost,
                        sfCfa,
                        hubSettings
                    )
                )
            )
        );

        hub.allowModule(address(metadataModule), true);
        hub.allowCurrency(ethx, true);

        vm.stopBroadcast();

        console2.log("SlotsHub proxy:", address(hub));
        console2.log("=== Done ===");
    }
}
