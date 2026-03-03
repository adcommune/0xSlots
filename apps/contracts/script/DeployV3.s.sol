// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";

/**
 * @title DeployV3
 * @notice Deploys 0xSlots v3: Slot impl + SlotFactory (UUPS proxy)
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

        // 1. Deploy Slot implementation (used by beacon inside factory)
        Slot slotImpl = new Slot();
        console2.log("Slot implementation:", address(slotImpl));

        // 2. Deploy SlotFactory implementation
        SlotFactory factoryImpl = new SlotFactory();
        console2.log("Factory implementation:", address(factoryImpl));

        // 3. Deploy ERC1967Proxy for factory, calling initialize
        bytes memory initData = abi.encodeCall(
            SlotFactory.initialize,
            (msg.sender, address(slotImpl))
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        console2.log("Factory proxy:", address(proxy));

        // 4. Log beacon info
        SlotFactory factory = SlotFactory(address(proxy));
        console2.log("Beacon:", address(factory.beacon()));
        console2.log("Beacon implementation:", factory.implementation());
        console2.log("Admin:", factory.admin());

        _saveDeployment(address(proxy), "SlotFactoryV3");

        console2.log("=== Done ===");
    }
}
