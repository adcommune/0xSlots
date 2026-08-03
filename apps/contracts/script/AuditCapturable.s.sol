// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";

/**
 * @title AuditCapturable
 * @notice Read-only. Finds slots exposed to the unauthenticated `initializeV2`.
 *
 * @dev The capture needs BOTH conditions at once:
 *
 *        a) the slot's beacon serves v3+ code, so `initializeV3` exists, AND
 *        b) the slot never ran `initializeV2`, so `factory == address(0)`
 *
 *      Then anyone can call `initializeV2(self)` to become the slot's factory,
 *      and `initializeV3(0, denyAllPolicy)` to install a veto that blocks every
 *      buy — permanently ending forced sale on that slot.
 *
 *      A slot whose `factory()` call reverts is on pre-v2 bytecode: it has no
 *      `initializeV3` to reach, so (a) fails and it is not capturable while its
 *      beacon stays where it is.
 */
contract AuditCapturable is BaseScript {
    function check(DeployementChain chain, address[] calldata slots) external {
        vm.createSelectFork(forks[chain]);

        uint256 capturable;
        uint256 oldBytecode;
        uint256 safe;

        for (uint256 i = 0; i < slots.length; i++) {
            try Slot(slots[i]).factory() returns (address f) {
                if (f == address(0)) {
                    capturable++;
                    console2.log("CAPTURABLE", slots[i]);
                } else {
                    safe++;
                }
            } catch {
                // No `factory()` getter => pre-v2 code => no initializeV3.
                oldBytecode++;
            }
        }

        console2.log("checked                 ", slots.length);
        console2.log("migrated (factory set)  ", safe);
        console2.log("pre-v2 bytecode         ", oldBytecode);
        console2.log("CAPTURABLE RIGHT NOW    ", capturable);
    }
}
