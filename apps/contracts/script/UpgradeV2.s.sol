// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slots} from "../src/v2/Slots.sol";
import {SlotsHub} from "../src/v2/SlotsHub.sol";

/**
 * @title UpgradeV2
 * @notice Upgrades SlotsHub proxy + Slots beacon implementation (all lands update)
 *
 * Usage (Base Sepolia):
 *   forge script script/UpgradeV2.s.sol:UpgradeV2 \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 *
 * Usage (Arbitrum):
 *   forge script script/UpgradeV2.s.sol:UpgradeV2 \
 *     --sig "upgradeChain(uint8)" 5 --broadcast --verify
 */
contract UpgradeV2 is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== Upgrading 0xSlots v2 ===");

        address hubProxy = _readDeployment("SlotsHubV2");
        console2.log("SlotsHub proxy:", hubProxy);

        SlotsHub hub = SlotsHub(payable(hubProxy));

        // 1. Deploy new Slots implementation
        Slots newSlotsImpl = new Slots();
        console2.log("New Slots impl:", address(newSlotsImpl));

        // 2. Upgrade beacon - all existing lands get the new code
        hub.upgradeSlotsImplementation(address(newSlotsImpl));
        console2.log("Beacon upgraded - all lands updated");

        // 3. Deploy new SlotsHub implementation and upgrade proxy
        SlotsHub newHubImpl = new SlotsHub();
        console2.log("New SlotsHub impl:", address(newHubImpl));
        hub.upgradeToAndCall(address(newHubImpl), "");

        console2.log("=== Upgrade complete ===");
    }
}
