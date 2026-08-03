// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";

/**
 * @title AuditInitVersions
 * @notice Read-only. What reinitializer version is every live slot at?
 *
 * @dev Gate for deleting an initializer. `initializeV2` can only go if no slot
 *      is still at version 1 — one that is would be permanently unable to
 *      migrate, since the function that moves it forward would no longer exist.
 *      Same logic for `initializeV3` and version 2.
 *
 *      Reads OZ v5's ERC-7201 Initializable slot directly; `_initialized` is
 *      the low 8 bytes of that word.
 */
contract AuditInitVersions is BaseScript {
    bytes32 constant INITIALIZABLE_SLOT =
        0xf0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00;

    function check(DeployementChain chain, address[] calldata slots) external {
        vm.createSelectFork(forks[chain]);

        uint256[5] memory counts; // index = version, capped at 4
        for (uint256 i = 0; i < slots.length; i++) {
            uint64 v = uint64(uint256(vm.load(slots[i], INITIALIZABLE_SLOT)));
            if (v < 4) counts[v]++;
            else counts[4]++;
            if (v < 2) console2.log("AT V1 (blocks removal)", slots[i]);
        }

        console2.log("checked   ", slots.length);
        console2.log("version 0 ", counts[0]);
        console2.log("version 1 ", counts[1]);
        console2.log("version 2 ", counts[2]);
        console2.log("version 3 ", counts[3]);
        console2.log("version 4+", counts[4]);
    }
}
