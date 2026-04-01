// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";

/**
 * @title UpgradeV3ModuleFees
 * @notice Full upgrade: Beacon (Slot) + MetadataModule (UUPS) + SlotFactory (UUPS) + Re-verify
 *
 * Steps:
 *   1. Deploy new Slot impl → upgrade beacon
 *   2. Deploy new MetadataModule impl → upgrade UUPS proxy
 *   3. Deploy new SlotFactory impl → upgrade UUPS proxy
 *   4. Re-verify MetadataModule (reads name/version/feeBps/moduleURI onchain)
 *
 * Usage:
 *   # Base Sepolia (chainIdx 2):
 *   forge script script/UpgradeV3ModuleFees.s.sol:UpgradeV3ModuleFees \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 *
 *   # Base Mainnet (chainIdx 4):
 *   forge script script/UpgradeV3ModuleFees.s.sol:UpgradeV3ModuleFees \
 *     --sig "upgradeChain(uint8)" 4 --broadcast --verify
 */
contract UpgradeV3ModuleFees is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== UpgradeV3ModuleFees ===");

        // ── Load deployments ──
        address factoryProxy = _readDeployment("SlotFactoryV3");
        address metadataProxy = _readDeployment("MetadataModule");
        console2.log("Factory proxy:", factoryProxy);
        console2.log("MetadataModule proxy:", metadataProxy);

        SlotFactory factory = SlotFactory(factoryProxy);
        UpgradeableBeacon beacon = factory.beacon();
        console2.log("Beacon:", address(beacon));

        // ── Step 1: Upgrade Beacon (new Slot implementation) ──
        console2.log("");
        console2.log("--- Step 1: Upgrade Beacon ---");
        console2.log("Old Slot impl:", beacon.implementation());
        Slot newSlotImpl = new Slot();
        console2.log("New Slot impl:", address(newSlotImpl));
        beacon.upgradeTo(address(newSlotImpl));
        console2.log("Beacon upgraded!");

        // ── Step 2: Upgrade MetadataModule (UUPS) ──
        console2.log("");
        console2.log("--- Step 2: Upgrade MetadataModule ---");
        MetadataModule newMetaImpl = new MetadataModule();
        console2.log("New MetadataModule impl:", address(newMetaImpl));
        MetadataModule(metadataProxy).upgradeToAndCall(address(newMetaImpl), "");
        console2.log("MetadataModule upgraded!");

        // Sanity check: feeBps() should return 0
        uint256 fee = MetadataModule(metadataProxy).feeBps();
        console2.log("MetadataModule feeBps:", fee);
        require(fee == 0, "feeBps should be 0");

        // ── Step 3: Upgrade SlotFactory (UUPS) ──
        console2.log("");
        console2.log("--- Step 3: Upgrade SlotFactory ---");
        SlotFactory newFactoryImpl = new SlotFactory();
        console2.log("New SlotFactory impl:", address(newFactoryImpl));
        factory.upgradeToAndCall(address(newFactoryImpl), "");
        console2.log("SlotFactory upgraded!");

        // ── Step 4: Re-verify MetadataModule ──
        console2.log("");
        console2.log("--- Step 4: Re-verify MetadataModule ---");
        factory.setModuleVerified(metadataProxy, true);
        console2.log("MetadataModule re-verified!");

        console2.log("");
        console2.log("=== All done! ===");
    }
}
