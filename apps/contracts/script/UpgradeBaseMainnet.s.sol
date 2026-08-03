// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

/**
 * @title UpgradeBaseMainnet
 * @notice Ships the occupancy-policy implementation to Base mainnet.
 *
 * @dev Deliberately NOT a flag on `UpgradeSlotImplementation`. Mainnet differs
 *      from Base Sepolia in one operational fact that silently breaks the
 *      testnet script, and in one economic fact that earns this its own
 *      pre-flight.
 *
 *      ── The ownership difference ──────────────────────────────────────────
 *      `SlotFactory.initialize` constructs the beacon owned by `admin`, and
 *      `upgradeBeacon` requires the FACTORY to own it. Base Sepolia's beacon
 *      was transferred to its factory; mainnet's never was — it is still owned
 *      by the admin EOA. So `factory.upgradeBeacon(...)`, which is how the
 *      testnet script moves the implementation, reverts here.
 *
 *      This script therefore upgrades the beacon directly (the EOA is its
 *      owner) and then hands ownership to the factory, so mainnet ends up in
 *      the same shape as Sepolia and every future upgrade can take the atomic
 *      path. Authority does not change: `onlyAdmin` is the same address that
 *      owns the beacon today.
 *
 *      ── Ordering, and the one-transaction window ──────────────────────────
 *      The factory calls `Slot.initialize`, whose signature changed. Whichever
 *      of the two moves first, `createSlot` reverts until the other lands.
 *      Beacon-first makes that window exactly one transaction wide and is the
 *      order used below. Nothing else is affected: every existing slot keeps
 *      working throughout, because the window is about CREATING slots, not
 *      operating them. No funds are ever at risk in it — a create simply
 *      reverts.
 *
 *      ── What this upgrade does NOT do to the 63 existing slots ────────────
 *      They were created before `mutablePolicy` existed, so that bit is zero:
 *      no occupancy policy can ever be installed on them. That is the correct
 *      default — a policy is part of a slot's founding terms, and nobody
 *      agreed to one that could appear later. They stay plain-Harberger
 *      forever. New slots created after this choose their own.
 */
contract UpgradeBaseMainnet is BaseScript {
    /// @dev A live mainnet slot, used as the layout witness. Vacant at the time
    ///      of writing, which is why its expected values are the founding terms
    ///      rather than occupancy state.
    address constant WITNESS = 0xec38Ff9e462b34A7053951bD59deF8745C3Cff33;

    function run() external broadcastOn(DeployementChain.Base) {
        SlotFactory factory = SlotFactory(_readDeployment("SlotFactoryV3"));
        UpgradeableBeacon beacon = UpgradeableBeacon(factory.beacon());

        console2.log("factory       ", address(factory));
        console2.log("beacon        ", address(beacon));
        console2.log("impl (before) ", beacon.implementation());
        console2.log("beacon owner  ", beacon.owner());
        console2.log("factory admin ", factory.admin());

        // ── Pre-flight ────────────────────────────────────────────────────
        // The upgrade is only safe because the live storage layout already
        // matches what the new implementation declares. Assert that against a
        // real slot rather than trusting it: a beacon upgrade reinterprets the
        // storage of every proxy at once, and there is no second chance.
        _assertLayout();

        require(
            beacon.owner() == factory.admin(),
            "beacon owner is not the admin: this script cannot upgrade it"
        );
        require(factory.isSlot(WITNESS), "witness is not a slot of this factory");

        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        console2.log("new slot impl ", address(slotImpl));
        console2.log("new factory   ", address(factoryImpl));

        // ── 1. Beacon first: every existing slot gets the new code ────────
        beacon.upgradeTo(address(slotImpl));
        require(
            beacon.implementation() == address(slotImpl),
            "beacon did not take the new implementation"
        );

        // ── 2. Factory second: closes the create window ───────────────────
        factory.upgradeToAndCall(address(factoryImpl), "");

        // ── 3. Hand the beacon to the factory, matching Base Sepolia ──────
        beacon.transferOwnership(address(factory));
        require(
            beacon.owner() == address(factory),
            "beacon ownership did not transfer"
        );

        // ── Post-flight ───────────────────────────────────────────────────
        // The witness must still read back its founding terms through the new
        // code. If the layout had shifted, this is where it shows.
        _assertLayout();
        require(
            !Slot(WITNESS).mutablePolicy(),
            "pre-existing slot must not have gained policy mutability"
        );
        require(
            Slot(WITNESS).occupancyPolicy() == address(0),
            "pre-existing slot must have no occupancy policy"
        );

        console2.log("impl (after)  ", beacon.implementation());
        console2.log("beacon owner  ", beacon.owner());

        _saveDeployment(address(slotImpl), "SlotImplementation");
        _saveDeployment(address(factoryImpl), "SlotFactoryImplementation");
    }

    /// @dev Reads the witness through the CURRENT code at each call site — once
    ///      before the upgrade and once after — so the two runs compare the old
    ///      implementation's view with the new one's. Values are the slot's
    ///      founding terms, which no upgrade may alter.
    function _assertLayout() internal view {
        Slot s = Slot(WITNESS);
        require(
            s.recipient() == 0xc0e5E0E823aDf148b4c39b96b20848d29CCAE188,
            "layout: recipient moved"
        );
        require(
            address(s.currency()) == 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
            "layout: currency moved"
        );
        require(s.taxPercentage() == 100, "layout: taxPercentage moved");
        require(s.liquidationBountyBps() == 500, "layout: bounty moved");
        require(s.minDepositSeconds() == 86_400, "layout: minDeposit moved");
        // Slot 14 packs `_legacyInitialized` (offset 0) with `factory`
        // (offset 1). If the packing were wrong this address would be garbage,
        // which makes it the sharpest single check in the set.
        require(
            s.factory() == 0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e,
            "layout: factory moved -- ABORT, slot 14 packing differs"
        );
    }
}
