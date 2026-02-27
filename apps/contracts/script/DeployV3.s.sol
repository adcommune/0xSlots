// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {SlotFactory} from "../src/v3/SlotFactory.sol";

/**
 * @title DeployV3
 * @notice Deploys 0xSlots v3 SlotFactory
 *
 * Usage (Base Sepolia):
 *   forge script script/DeployV3.s.sol:DeployV3 \
 *     --sig "deployChain(uint8)" 2 --broadcast --verify
 */
contract DeployV3 is BaseScript {

    function deployChain(uint8 chainIdx) external {
        _deploy(DeployementChain(chainIdx));
    }

    function _deploy(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== Deploying 0xSlots v3 ===");

        SlotFactory factory = new SlotFactory(msg.sender);
        console2.log("SlotFactory:", address(factory));
        console2.log("Slot implementation:", factory.implementation());

        _saveDeployment(address(factory), "SlotFactoryV3");

        console2.log("=== Done ===");
    }
}
