// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedSocialGroup} from "../src/FeedSocialGroup.sol";

/**
 * @title UpgradeFeedSocialGroup
 * @notice Upgrade FeedSocialGroup (UUPS) to add slot-management wrappers
 *         (releaseSlot / withdrawFromSlot / selfAssessSlot / sweep) and grant
 *         the new SLOT_MANAGER role to the deployer + posting-manager EOA.
 *
 * Two entrypoints:
 *   - upgradeChain(idx)         deploy new impl + upgrade proxy + grant roles (full path)
 *   - grantSlotManagers(idx)    grant roles only (cheap; use if proxy is already upgraded)
 *
 * Usage:
 *   # Already upgraded — just grant the new role (Base Sepolia):
 *   forge script script/UpgradeFeedSocialGroup.s.sol:UpgradeFeedSocialGroup \
 *     --sig "grantSlotManagers(uint8)" 2 --broadcast
 *
 *   # Full upgrade path (Base Sepolia):
 *   forge script script/UpgradeFeedSocialGroup.s.sol:UpgradeFeedSocialGroup \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 *
 *   # Same flags with chainIdx=4 for Base mainnet.
 */
contract UpgradeFeedSocialGroup is BaseScript {
    /// @dev Mirrors DeployFeedSocialGroup.s.sol — also gets SLOT_MANAGER for one-EOA ops.
    address constant POSTING_MANAGER_ADDR = 0xe7e37649f37Ed6665260316413fdfe89f8edadb6;

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function grantSlotManagers(uint8 chainIdx) external {
        _grantSlotManagers(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== UpgradeFeedSocialGroup ===");

        address proxy = _readDeployment("FeedSocialGroup");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("FeedSocialGroup proxy:", proxy);
        console2.log("Deployer / admin:     ", deployer);

        FeedSocialGroup group = FeedSocialGroup(proxy);

        console2.log("");
        console2.log("--- Step 1: Deploy new FeedSocialGroup impl ---");
        FeedSocialGroup newImpl = new FeedSocialGroup();
        console2.log("New FeedSocialGroup impl:", address(newImpl));

        console2.log("");
        console2.log("--- Step 2: Upgrade proxy ---");
        group.upgradeToAndCall(address(newImpl), "");
        console2.log("FeedSocialGroup upgraded!");

        console2.log("");
        console2.log("--- Step 3: Grant SLOT_MANAGER role ---");
        _ensureSlotManager(group, deployer);
        _ensureSlotManager(group, POSTING_MANAGER_ADDR);

        console2.log("");
        console2.log("=== Done ===");
    }

    function _grantSlotManagers(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== GrantSlotManagers ===");

        address proxy = _readDeployment("FeedSocialGroup");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("FeedSocialGroup proxy:", proxy);
        console2.log("Deployer / admin:     ", deployer);

        FeedSocialGroup group = FeedSocialGroup(proxy);

        _ensureSlotManager(group, deployer);
        _ensureSlotManager(group, POSTING_MANAGER_ADDR);

        console2.log("=== Done ===");
    }

    function _ensureSlotManager(FeedSocialGroup group, address account) internal {
        bytes32 role = group.SLOT_MANAGER();
        if (group.hasRole(role, account)) {
            console2.log("SLOT_MANAGER already held by:", account);
        } else {
            group.grantRole(role, account);
            console2.log("SLOT_MANAGER granted to:      ", account);
        }
    }
}
