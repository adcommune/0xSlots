// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";

/**
 * @title MigrateV2
 * @notice Full v2 migration: upgrade factory, upgrade beacon, migrate existing slots.
 *
 * Steps:
 *   1. Deploy new SlotFactory implementation & upgrade UUPS proxy
 *   2. Deploy new Slot implementation & upgrade beacon
 *   3. Call migrateSlots() to register + initializeV2 all existing slots
 *
 * Usage:
 *   # Base Sepolia (chainIdx=2)
 *   forge script script/MigrateV2.s.sol:MigrateV2 \
 *     --sig "run(uint8)" 2 --broadcast --verify
 *
 *   # Base Mainnet (chainIdx=4)
 *   forge script script/MigrateV2.s.sol:MigrateV2 \
 *     --sig "run(uint8)" 4 --broadcast --verify
 *
 *   # Dry run (no --broadcast)
 *   forge script script/MigrateV2.s.sol:MigrateV2 \
 *     --sig "run(uint8)" 2
 */
contract MigrateV2 is BaseScript {

    function run(uint8 chainIdx) external {
        _migrate(DeployementChain(chainIdx));
    }

    function _migrate(DeployementChain chain) internal broadcastOn(chain) {
        address factoryProxy = _readDeployment("SlotFactoryV3");
        SlotFactory factory = SlotFactory(factoryProxy);
        UpgradeableBeacon beacon = factory.beacon();

        console2.log("=== 0xSlots V2 Migration ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Factory proxy:", factoryProxy);
        console2.log("Beacon:", address(beacon));
        console2.log("Old Slot impl:", beacon.implementation());

        // ── Step 1: Upgrade factory (UUPS) ──────────────────────────────────
        SlotFactory newFactoryImpl = new SlotFactory();
        console2.log("New factory impl:", address(newFactoryImpl));

        factory.upgradeToAndCall(address(newFactoryImpl), "");
        console2.log("Factory upgraded!");

        // ── Step 2: Upgrade beacon (new Slot implementation) ────────────────
        Slot newSlotImpl = new Slot();
        console2.log("New Slot impl:", address(newSlotImpl));

        beacon.upgradeTo(address(newSlotImpl));
        console2.log("Beacon upgraded!");

        // ── Step 3: Migrate existing slots ──────────────────────────────────
        address[] memory slots = _getSlotsForChain();
        console2.log("Migrating slots:", slots.length);

        factory.migrateSlots(slots);
        console2.log("All slots migrated!");

        // ── Verify ──────────────────────────────────────────────────────────
        if (slots.length > 0) {
            address slotFactory = Slot(slots[0]).factory();
            console2.log("Slot[0] factory:", slotFactory);
            require(slotFactory == factoryProxy, "factory not set!");
            require(factory.isSlot(slots[0]), "slot not registered!");
        }

        console2.log("=== Migration Complete ===");
    }

    function _getSlotsForChain() internal view returns (address[] memory) {
        if (block.chainid == 84532) {
            return _sepoliaSlots();
        } else if (block.chainid == 8453) {
            return _mainnetSlots();
        } else {
            revert("unsupported chain");
        }
    }

    // ─── Base Sepolia (15 slots) ─────────────────────────────────────────────

    function _sepoliaSlots() internal pure returns (address[] memory s) {
        s = new address[](15);
        s[0]  = 0x8bb48464720059Bf68BdC05BB10a89A4C012a667;
        s[1]  = 0x6854207ED0F8519859141e33Dd0B144c1c464A32;
        s[2]  = 0x87e6A34269feC847c69CC8fC91D1885C7542Bfb5;
        s[3]  = 0xA9a2d1121819724213b6035b9039ddF6ACE3D7ef;
        s[4]  = 0x5A5A4e4eA52A39B55eADce69dF7e29E04Cd5535d;
        s[5]  = 0x9079b20f9Af7250A790E516aE2dd84c96cFA469e;
        s[6]  = 0xaF629A0E3660556d353aF72BfDA3c089ABcAeb70;
        s[7]  = 0xe913AFB5A93aBd9D7cBFdD5dea757D01279d4272;
        s[8]  = 0xfF514382fad6a645bbB71037Ad95e1EA916A465D;
        s[9]  = 0xb607a11a07845605A460f7EeB27316f6EA1BF5df;
        s[10] = 0x8985947322F1510285e21f8703f2c28417eB09c6;
        s[11] = 0x196897309e6f45B6Ce0A40096A4B45673AB4Ce28;
        s[12] = 0x589f1368b70bBCdC5Ad764e0D12D52Dee933D43d;
        s[13] = 0xa22aaC20326302690d5F4712e0955718180B2Eff;
        s[14] = 0xd33Ca49DcF14Cc87f4A896E79655DA2e0C291b84;
    }

    // ─── Base Mainnet (13 slots) ─────────────────────────────────────────────

    function _mainnetSlots() internal pure returns (address[] memory s) {
        s = new address[](13);
        s[0]  = 0xec38Ff9e462b34A7053951bD59deF8745C3Cff33;
        s[1]  = 0x4172BE9C53f1f959AFd357a1E4795A9245C18baa;
        s[2]  = 0x5fdBfFAab5d7ddFF5F0652Fa0925eD2451c9b859;
        s[3]  = 0xA6216BfDe517941a757073A42b27F33413cfA7Fe;
        s[4]  = 0x77f340148C2C4b14398C61B2A7d04AF82d289976;
        s[5]  = 0x2a7A873Bf8484B3feB2AA8F69DD18Affd9bC7FeE;
        s[6]  = 0x9c7fBdcf9A63cA9721Bf91F3472D8cA10a146086;
        s[7]  = 0xa6aD85b3C3d4C12753c36a8DE7C4158A0d0F9960;
        s[8]  = 0x18bC9df928DEc09ED7E702e29E8E715415b078EE;
        s[9]  = 0xb1A182826e5Db0fd94a9EF0b20dD2a861ea756a6;
        s[10] = 0x21834896DaA664F2081442A777C354335654AFD6;
        s[11] = 0xa6Eb42F770f0C4c95a9De8b70b1c178a8eA90575;
        s[12] = 0xb6A6d14bb374b6AA6D52B2b982547031fDDfeed5;
    }
}
