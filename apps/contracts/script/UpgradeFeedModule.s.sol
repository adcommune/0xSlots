// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedPostModule} from "../src/modules/FeedPostModule.sol";

/**
 * @title UpgradeFeedModule
 * @notice Upgrade FeedPostModule UUPS proxy to new impl (adds updateMetadataFor + new event sig).
 *
 * Usage:
 *   # Base Sepolia (chainIdx 2) — dry run:
 *   forge script script/UpgradeFeedModule.s.sol:UpgradeFeedModule \
 *     --sig "upgradeChain(uint8)" 2
 *
 *   # Base Sepolia — broadcast:
 *   forge script script/UpgradeFeedModule.s.sol:UpgradeFeedModule \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 *
 *   # Base Mainnet (chainIdx 4) — broadcast:
 *   forge script script/UpgradeFeedModule.s.sol:UpgradeFeedModule \
 *     --sig "upgradeChain(uint8)" 4 --broadcast --verify
 */
contract UpgradeFeedModule is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== UpgradeFeedModule ===");

        address moduleProxy = _readDeployment("FeedPostModule");
        console2.log("FeedPostModule proxy:", moduleProxy);

        FeedPostModule module = FeedPostModule(moduleProxy);
        console2.log("Current version:", module.version());

        // Deploy new implementation
        FeedPostModule newImpl = new FeedPostModule();
        console2.log("New impl deployed:", address(newImpl));

        // Upgrade
        module.upgradeToAndCall(address(newImpl), "");
        console2.log("Upgraded!");
        console2.log("Version after upgrade:", module.version());

        console2.log("=== Done ===");
    }
}
