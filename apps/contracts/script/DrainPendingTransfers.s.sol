// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";

/**
 * @title DrainPendingTransfers
 * @notice One-off migration ahead of removing epoch scheduling: push every
 *         matured pending transfer into storage.
 *
 * @dev A scheduled buy takes the buyer's price + deposit at commit time and
 *      only becomes real occupancy when some later transaction runs
 *      `_settle()`. Nothing runs at the boundary itself — there is no timer
 *      on-chain — so a matured transfer can sit unwritten indefinitely.
 *
 *      Removing the scheduling path while one of those is outstanding would
 *      strand the buyer's escrow and leave the slot naming the wrong occupant
 *      forever. This drains them first.
 *
 *      `collect()` is permissionless and its first statement is `_settle()`,
 *      which calls `_materialize()`. Anyone can push the handover through; the
 *      deployer key is used here only to pay gas.
 *
 *      Belt and braces: the v4 implementation retains `_materialize` precisely
 *      so that a transfer scheduled between this drain and the beacon upgrade
 *      still lands. This script removes the backlog; the staged upgrade removes
 *      the race.
 *
 *      Run `check()` first — it broadcasts nothing.
 */
contract DrainPendingTransfers is BaseScript {
    /// @dev Re-derive from the subgraph before running. Captured 2026-08-02:
    ///      { slots(where:{pendingBuyer_not:null}) { id pendingEffectiveAt } }
    function _targets() internal pure returns (address[] memory a) {
        a = new address[](2);
        a[0] = 0x147De881d0A564097f0b0158488A553730607Eca;
        a[1] = 0x1E1885F22c5346ab4366cdf48DD1109A6f46591E;
    }

    /// @notice Read-only preflight. No broadcast.
    function check() external {
        vm.createSelectFork(forks[DeployementChain.BaseSepolia]);
        address[] memory slots = _targets();
        uint256 outstanding;
        for (uint256 i = 0; i < slots.length; i++) {
            (address buyer, uint96 effectiveAt, , , ) = Slot(slots[i])
                .pendingTransfer();
            if (effectiveAt == 0) {
                console2.log("clean    ", slots[i]);
                continue;
            }
            outstanding++;
            console2.log("PENDING  ", slots[i]);
            console2.log("   buyer      ", buyer);
            console2.log("   effectiveAt", uint256(effectiveAt));
            console2.log("   now        ", block.timestamp);
            console2.log(
                "   matured    ",
                block.timestamp >= effectiveAt ? "yes" : "NO - rerun later"
            );
        }
        console2.log("outstanding:", outstanding);
    }

    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        address[] memory slots = _targets();
        for (uint256 i = 0; i < slots.length; i++) {
            Slot s = Slot(slots[i]);
            (, uint96 effectiveAt, , , ) = s.pendingTransfer();

            if (effectiveAt == 0) {
                console2.log("skip (clean)", slots[i]);
                continue;
            }
            if (block.timestamp < effectiveAt) {
                // Materialising early is impossible by design; leave it for a
                // later run rather than sending a transaction that no-ops.
                console2.log("skip (not matured)", slots[i]);
                console2.log("   retry after", uint256(effectiveAt));
                continue;
            }

            s.collect();
            console2.log("drained", slots[i]);
        }
    }
}
