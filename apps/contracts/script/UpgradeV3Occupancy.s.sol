// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {MinimumTenurePolicy} from "../src/policies/MinimumTenurePolicy.sol";
import {QueueExclusivityPolicy} from "../src/policies/QueueExclusivityPolicy.sol";
import {SlotQueue} from "../src/periphery/SlotQueue.sol";

/**
 * @title UpgradeV3Occupancy
 * @notice Upgrades an existing 0xSlots v3 deployment to the composable
 *         occupancy layer: epochs, IOccupancyPolicy, operator delegation,
 *         plus the reference policies and the queue peripheral.
 *
 * @dev NO NEW SLOT DEPLOYMENTS ARE NEEDED. Storage is strictly append-only and
 *      every slot is a BeaconProxy sharing one implementation, so a single
 *      beacon upgrade moves the whole network.
 *
 *      ── Why step 3 is one transaction ─────────────────────────────────────
 *      `Slot.initializeV2` is unauthenticated: a v1 slot has no unforgeable
 *      notion of its own factory, so any caller can set it. The moment the
 *      beacon serves v3 code, a slot still at v1 can be captured by
 *      `initializeV2(self)` followed by `initializeV3(hugeEpoch, denyAllPolicy)`
 *      — permanently ending forced sale and stranding the next buyer's escrow,
 *      with no admin repair path.
 *
 *      Splitting the upgrade and the migration across two transactions leaves
 *      that window open in the mempool. `upgradeBeaconAndMigrateV3` closes it.
 *      This is verified by the paired tests in `test/FinalFixes.t.sol`:
 *      `test_TwoStepUpgrade_LeavesLegacySlotCapturable` reproduces the capture,
 *      `test_AtomicUpgradeAndMigrate_ClosesTheWindow` shows it unreachable.
 *
 *      ── Order ─────────────────────────────────────────────────────────────
 *      1. Deploy the new Slot + SlotFactory implementations
 *      2. Upgrade the factory (UUPS) so it gains the v3 entry points
 *      3. Hand beacon ownership to the factory (idempotent)
 *      4. Beacon upgrade + legacy migration, atomically
 *      5. Deploy and register the policies and the queue
 *
 * Usage — always dry-run first (no --broadcast):
 *
 *   forge script script/UpgradeV3Occupancy.s.sol:UpgradeV3Occupancy \
 *     --sig "run(uint8,address)" 2 <FACTORY_PROXY> -vvv
 *
 * Then, once the printed plan looks right:
 *
 *   forge script script/UpgradeV3Occupancy.s.sol:UpgradeV3Occupancy \
 *     --sig "run(uint8,address)" 2 <FACTORY_PROXY> --broadcast --verify -vvv
 *
 * chainIdx: 2 = BaseSepolia, 4 = Base (see BaseScript.DeployementChain)
 *
 * Legacy slots are passed via the SLOTS_TO_MIGRATE env var, comma-separated:
 *   export SLOTS_TO_MIGRATE=0xabc...,0xdef...
 * Leave unset to upgrade the beacon with no migration — ONLY safe when every
 * slot on the chain is already at v2 or later. `checkSlots` tells you which.
 */
contract UpgradeV3Occupancy is BaseScript {
    /// @notice Default epoch applied to migrated legacy slots.
    /// @dev 0 = instant buy, i.e. exactly their current behaviour. Migration
    ///      should not silently change how a live slot trades; turn epochs on
    ///      deliberately, per slot, afterwards.
    uint64 public constant MIGRATION_EPOCH_SECONDS = 0;

    /// @notice Tenure length for the reference policy deployed here.
    uint256 public constant TENURE_SECONDS = 7 days;

    // ───────────────────────────────────────────────────────────────────────
    // READ-ONLY PREFLIGHT — run this first, it broadcasts nothing
    // ───────────────────────────────────────────────────────────────────────

    /// @notice Reports, per slot, whether it still needs migrating.
    /// @dev A slot whose `factory()` reverts is at v1 and MUST be included in
    ///      SLOTS_TO_MIGRATE. One whose `factory()` returns zero is also at v1.
    ///      One already at v3 must be EXCLUDED — `initializeV3` reverts on it
    ///      and would revert the whole batch.
    function checkSlots(uint8 chainIdx, address[] calldata slots) external {
        vm.createSelectFork(forks[DeployementChain(chainIdx)]);

        console2.log("=== Slot migration preflight ===");
        uint256 needsMigration;

        for (uint256 i = 0; i < slots.length; i++) {
            address s = slots[i];
            (bool okFactory, bytes memory factoryData) = s.staticcall(
                abi.encodeWithSignature("factory()")
            );
            (bool okEpoch, ) = s.staticcall(
                abi.encodeWithSignature("epochSeconds()")
            );

            if (!okFactory || factoryData.length < 32) {
                console2.log("  v1  MIGRATE   ", s);
                needsMigration++;
            } else if (abi.decode(factoryData, (address)) == address(0)) {
                console2.log("  v1  MIGRATE   ", s);
                needsMigration++;
            } else if (okEpoch) {
                console2.log("  v3  skip      ", s);
            } else {
                console2.log("  v2  MIGRATE   ", s);
                needsMigration++;
            }
        }

        console2.log("Slots needing migration:", needsMigration);
        console2.log("Pass exactly those in SLOTS_TO_MIGRATE.");
    }

    // ───────────────────────────────────────────────────────────────────────
    // THE UPGRADE
    // ───────────────────────────────────────────────────────────────────────

    function run(uint8 chainIdx, address factoryProxy) external {
        _upgrade(DeployementChain(chainIdx), factoryProxy);
    }

    function _upgrade(
        DeployementChain chain,
        address factoryProxy
    ) internal broadcastOn(chain) {
        SlotFactory factory = SlotFactory(factoryProxy);
        address deployer = vm.addr(deployerPrivateKey);
        address[] memory legacySlots = _readSlotsToMigrate();

        console2.log("=== 0xSlots v3 occupancy upgrade ===");
        console2.log("factory   ", factoryProxy);
        console2.log("admin     ", factory.admin());
        console2.log("deployer  ", deployer);
        console2.log("beacon    ", address(factory.beacon()));
        console2.log("old impl  ", factory.implementation());
        console2.log("migrating ", legacySlots.length);

        require(
            factory.admin() == deployer,
            "deployer is not factory admin - upgrade must be run by the admin"
        );

        // 1 ── new implementations
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        console2.log("new Slot impl   ", address(slotImpl));
        console2.log("new Factory impl", address(factoryImpl));

        // 2 ── factory first: it must already expose upgradeBeaconAndMigrateV3
        //      before we touch the beacon.
        factory.upgradeToAndCall(address(factoryImpl), "");
        console2.log("factory upgraded");

        // 3 ── beacon ownership -> factory (idempotent; skipped if already done)
        UpgradeableBeacon beacon = factory.beacon();
        if (beacon.owner() != address(factory)) {
            require(
                beacon.owner() == deployer,
                "beacon owner is neither the factory nor the deployer"
            );
            beacon.transferOwnership(address(factory));
            console2.log("beacon ownership -> factory");
        }

        // 4 ── the atomic step. Never split these.
        factory.upgradeBeaconAndMigrateV3(
            address(slotImpl),
            legacySlots,
            MIGRATION_EPOCH_SECONDS,
            address(0)
        );
        console2.log("beacon upgraded + slots migrated atomically");

        // 5 ── reference policies and the queue peripheral
        MinimumTenurePolicy tenure = new MinimumTenurePolicy(TENURE_SECONDS);
        SlotQueue queue = new SlotQueue(address(factory));
        QueueExclusivityPolicy exclusivity = new QueueExclusivityPolicy(queue);

        factory.setPolicyVerified(address(tenure), true);
        factory.setPolicyVerified(address(exclusivity), true);

        console2.log("MinimumTenurePolicy   ", address(tenure));
        console2.log("SlotQueue             ", address(queue));
        console2.log("QueueExclusivityPolicy", address(exclusivity));

        // ── postconditions ──
        require(
            factory.implementation() == address(slotImpl),
            "beacon did not take the new implementation"
        );
        for (uint256 i = 0; i < legacySlots.length; i++) {
            require(
                Slot(legacySlots[i]).factory() == address(factory),
                "a migrated slot has the wrong factory - CAPTURE RISK"
            );
        }

        console2.log("=== done ===");
        console2.log("Record these in deployments/<chainId>/ and re-index.");
    }

    /// @dev Comma-separated addresses in SLOTS_TO_MIGRATE; empty when unset.
    function _readSlotsToMigrate() internal view returns (address[] memory) {
        return vm.envOr("SLOTS_TO_MIGRATE", ",", new address[](0));
    }
}
