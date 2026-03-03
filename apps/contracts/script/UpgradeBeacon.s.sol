// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";

/**
 * @title UpgradeBeacon
 * @notice Deploy new Slot implementation and upgrade beacon (upgrades all slots)
 *
 * Usage (Base Sepolia):
 *   forge script script/UpgradeBeacon.s.sol:UpgradeBeacon \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 */
contract UpgradeBeacon is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== Upgrading 0xSlots Beacon ===");

        address factoryProxy = _readDeployment("SlotFactoryV3");
        console2.log("Factory proxy:", factoryProxy);

        SlotFactory factory = SlotFactory(factoryProxy);
        UpgradeableBeacon beacon = factory.beacon();
        console2.log("Beacon:", address(beacon));
        console2.log("Old implementation:", beacon.implementation());

        // Deploy new Slot implementation
        Slot newImpl = new Slot();
        console2.log("New implementation:", address(newImpl));

        // Upgrade beacon
        beacon.upgradeTo(address(newImpl));
        console2.log("Beacon upgraded!");
        console2.log("Verified impl:", beacon.implementation());

        console2.log("=== Done ===");
    }
}
