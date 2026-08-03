// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

/**
 * @title UpgradeSlotImplementation
 * @notice Ships a new `Slot` implementation to every slot on a chain, and the
 *         `SlotFactory` implementation alongside it when the two must move
 *         together.
 *
 * @dev Replaces a series of one-shot scripts named after the version they
 *      shipped. Those were completed migrations; git remembers them. This is
 *      the operation that actually recurs.
 *
 *      ── Why both, in one transaction ──────────────────────────────────────
 *      The factory constructs slots by calling `Slot.initialize`. When that
 *      signature changes, an old factory calling a new implementation (or the
 *      reverse) reverts, so slot creation is broken for as long as the two are
 *      out of step. `upgradeToAndCall` closes that: the factory upgrades
 *      itself and, in the same call, upgrades the beacon — so the pair is
 *      never observably mismatched.
 *
 *      Pass `factoryImpl = address(0)` when only the slot implementation
 *      changed; the beacon is then upgraded on its own.
 */
contract UpgradeSlotImplementation is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        SlotFactory factory = SlotFactory(_readDeployment("SlotFactoryV3"));
        UpgradeableBeacon beacon = UpgradeableBeacon(factory.beacon());

        console2.log("factory      ", address(factory));
        console2.log("beacon       ", address(beacon));
        console2.log("impl (before)", beacon.implementation());

        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        console2.log("slot impl    ", address(slotImpl));
        console2.log("factory impl ", address(factoryImpl));

        // One transaction: the factory swaps its own implementation and then,
        // as the new code, points the beacon at the new slot implementation.
        factory.upgradeToAndCall(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.upgradeBeacon, (address(slotImpl)))
        );

        require(
            beacon.implementation() == address(slotImpl),
            "beacon did not take the new implementation"
        );
        console2.log("impl (after) ", beacon.implementation());

        _saveDeployment(address(slotImpl), "SlotImplementation");
        _saveDeployment(address(factoryImpl), "SlotFactoryImplementation");
    }
}
