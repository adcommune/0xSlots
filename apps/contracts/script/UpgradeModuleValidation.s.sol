// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";

/**
 * @title UpgradeModuleValidation
 * @notice Beacon (Slot) + SlotFactory (UUPS) upgrade for module-address validation.
 *
 * Fixes:
 *   - Slot.getSlotInfo() reverting when `module` has no deployed code
 *     (retroactively repairs slots already pointing at codeless addresses)
 *   - Slot.proposeModuleUpdate() rejects codeless newModule
 *   - SlotFactory._validateConfig() rejects codeless module at creation
 *
 * Usage:
 *   # Dry-run a single chain (Base Sepolia, chainIdx 2):
 *   forge script script/UpgradeModuleValidation.s.sol:UpgradeModuleValidation \
 *     --sig "upgradeChain(uint8)" 2
 *
 *   # Broadcast + verify a single chain (Base mainnet, chainIdx 4):
 *   forge script script/UpgradeModuleValidation.s.sol:UpgradeModuleValidation \
 *     --sig "upgradeChain(uint8)" 4 --broadcast --verify
 *
 *   # Dry-run BOTH Base chains (Sepolia first, then mainnet):
 *   forge script script/UpgradeModuleValidation.s.sol:UpgradeModuleValidation \
 *     --sig "upgradeBaseChains()"
 *
 *   # Broadcast + verify BOTH Base chains:
 *   forge script script/UpgradeModuleValidation.s.sol:UpgradeModuleValidation \
 *     --sig "upgradeBaseChains()" --broadcast --verify
 */
contract UpgradeModuleValidation is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    /// @notice Run upgrade on Base Seposia first, then Base mainnet.
    /// @dev Each _upgrade() call switches its own fork + broadcast scope,
    ///      so the two chains are upgraded independently in one script run.
    function upgradeBaseChains() external {
        _upgrade(DeployementChain.BaseSepolia);
        _upgrade(DeployementChain.Base);
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== UpgradeModuleValidation ===");

        // ── Load deployments ──
        address factoryProxy = _readDeployment("SlotFactoryV3");
        console2.log("Factory proxy:", factoryProxy);

        SlotFactory factory = SlotFactory(factoryProxy);
        UpgradeableBeacon beacon = factory.beacon();
        console2.log("Beacon:", address(beacon));

        // ── Step 1: Upgrade Beacon (new Slot implementation) ──
        console2.log("");
        console2.log("--- Step 1: Upgrade Beacon (Slot impl) ---");
        console2.log("Old Slot impl:", beacon.implementation());
        Slot newSlotImpl = new Slot();
        console2.log("New Slot impl:", address(newSlotImpl));
        beacon.upgradeTo(address(newSlotImpl));
        console2.log("Beacon upgraded.");
        require(beacon.implementation() == address(newSlotImpl), "beacon upgrade mismatch");

        // ── Step 2: Upgrade SlotFactory (UUPS) ──
        console2.log("");
        console2.log("--- Step 2: Upgrade SlotFactory (UUPS) ---");
        SlotFactory newFactoryImpl = new SlotFactory();
        console2.log("New SlotFactory impl:", address(newFactoryImpl));
        factory.upgradeToAndCall(address(newFactoryImpl), "");
        console2.log("SlotFactory upgraded.");

        console2.log("");
        console2.log("=== Done ===");
    }
}
