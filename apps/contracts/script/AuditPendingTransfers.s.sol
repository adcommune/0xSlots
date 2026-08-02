// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";

/**
 * @title AuditPendingTransfers
 * @notice Read-only. Proves no slot anywhere holds a pending transfer.
 *
 * @dev Gate for deleting `_materialize`. That function is the only code path
 *      that completes a transfer whose buyer has already paid price + deposit,
 *      so removing it while one is outstanding would strand that escrow with no
 *      recovery. Zero here is the precondition.
 *
 *      The slot list comes from the caller (derived from SlotDeployed logs)
 *      rather than from the subgraph, so a slot the indexer missed cannot hide
 *      from this check.
 */
contract AuditPendingTransfers is BaseScript {
    function check(address[] calldata slots) external {
        vm.createSelectFork(forks[DeployementChain.BaseSepolia]);

        uint256 outstanding;
        uint256 unreadable;

        for (uint256 i = 0; i < slots.length; i++) {
            try Slot(slots[i]).pendingTransfer() returns (
                address buyer,
                uint96 effectiveAt,
                uint256,
                uint256,
                uint256
            ) {
                if (effectiveAt != 0) {
                    outstanding++;
                    console2.log("PENDING", slots[i]);
                    console2.log("   buyer      ", buyer);
                    console2.log("   effectiveAt", uint256(effectiveAt));
                }
            } catch {
                // A pre-v3 slot has no such getter. It also never had epochs,
                // so it cannot hold a pending transfer — but count it so the
                // total is honest rather than silently skipped.
                unreadable++;
            }
        }

        console2.log("slots checked      ", slots.length);
        console2.log("no pendingTransfer ", unreadable, "(pre-v3, cannot have one)");
        console2.log("OUTSTANDING        ", outstanding);
    }
}
