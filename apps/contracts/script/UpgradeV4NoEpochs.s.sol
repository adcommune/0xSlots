// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

/**
 * @title UpgradeV4NoEpochs
 * @notice Removes epoch scheduling from every slot in one beacon upgrade.
 *
 * @dev NO MIGRATION CALL. Unlike the v3 upgrade this adds no storage and moves
 *      nothing, so there is no `initializeV4` and no capture window to close —
 *      it is a pure code swap.
 *
 *      ── Preconditions ─────────────────────────────────────────────────────
 *      Run `DrainPendingTransfers` first and confirm zero outstanding. The new
 *      implementation still materialises a pending transfer it finds (that is
 *      deliberate — stage A keeps `_materialize` precisely so no escrow is
 *      stranded), but draining first means the retained path has nothing left
 *      to do and stage B can delete it.
 *
 *      ── What changes for existing slots ───────────────────────────────────
 *      6 slots on Base Sepolia still have a non-zero `epochSeconds`. After this
 *      upgrade that value is simply ignored: `buy()` transfers immediately on
 *      every slot. The field stays readable, and its storage slot stays
 *      occupied forever — `pendingTransfer` sits at slots 18-21 with
 *      `isOperator` (22) and `withdrawableOf` (23) after it, so nothing may be
 *      deleted without corrupting operator approvals and unclaimed refunds.
 */
contract UpgradeV4NoEpochs is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        SlotFactory factory = SlotFactory(_readDeployment("SlotFactoryV3"));
        UpgradeableBeacon beacon = UpgradeableBeacon(factory.beacon());

        address oldImpl = beacon.implementation();
        console2.log("factory      ", address(factory));
        console2.log("beacon       ", address(beacon));
        console2.log("beacon owner ", beacon.owner());
        console2.log("impl (before)", oldImpl);

        Slot newImpl = new Slot();
        console2.log("impl (new)   ", address(newImpl));

        // The beacon is owned by the factory, so the upgrade goes through the
        // factory's admin-gated entry point rather than the beacon directly.
        factory.upgradeBeacon(address(newImpl));

        require(
            beacon.implementation() == address(newImpl),
            "beacon did not take the new implementation"
        );
        console2.log("impl (after) ", beacon.implementation());

        _saveDeployment(address(newImpl), "SlotV4NoEpochsImpl");
    }
}
