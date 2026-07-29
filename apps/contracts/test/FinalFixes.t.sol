// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {IOccupancyPolicy, OccupancyContext} from "../src/interfaces/IOccupancyPolicy.sol";

contract FFMockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Vetoes every buy. Used to prove that an unauthenticated `initializeV3`
///      would let anyone permanently end forced sale on a live slot.
contract FFDenyAllPolicy is IOccupancyPolicy {
    error Denied();
    function checkBuy(OccupancyContext calldata) external pure { revert Denied(); }
    function checkPriceUpdate(OccupancyContext calldata) external pure { revert Denied(); }
    function name() external pure returns (string memory) { return "DenyAll"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}

/// @notice Regression tests for the whole-branch security review findings.
contract FinalFixesTest is Test {
    SlotFactory factory;
    FFMockERC20 token;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address attacker = makeAddr("attacker");

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new FFMockERC20();
        token.mint(alice, 10_000 ether);
        token.mint(bob, 10_000 ether);
        vm.warp(1_000_000);
    }

    function _init() internal pure returns (SlotInitParams memory) {
        return SlotInitParams({
            taxPercentage: 100,
            module: address(0),
            liquidationBountyBps: 500,
            minDepositSeconds: 0
        });
    }

    function _slot() internal returns (Slot) {
        return Slot(factory.createSlot(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init()
        ));
    }

    function _epochSlot(uint64 epoch) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            epoch,
            address(0)
        ));
    }

    function _buy(Slot s, address who, uint256 dep, uint256 px) internal {
        vm.startPrank(who);
        token.approve(address(s), type(uint256).max);
        s.buy(who, dep, px);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════
    // FINDING 1 — initializeV3 must be factory-only
    // ═══════════════════════════════════════════════════════════

    /// @dev `reinitializer(3)` only requires the stored version be below 3.
    ///      Every slot from `createSlot`/`createSlots` sits at version 2, so
    ///      without a caller check an arbitrary EOA could install a deny-all
    ///      policy and an absurd `epochSeconds`, permanently ending forced sale
    ///      and stranding the next buyer's escrow ~584 billion years out.
    function test_InitializeV3_RejectsNonFactoryCaller() public {
        Slot s = _slot();
        FFDenyAllPolicy deny = new FFDenyAllPolicy();

        vm.prank(attacker);
        vm.expectRevert(Slot.NotFactory.selector);
        s.initializeV3(type(uint64).max, address(deny));

        // The hijack never landed: state is untouched and the slot is still
        // freely buyable — forced sale intact.
        assertEq(s.epochSeconds(), 0, "epochSeconds untouched");
        assertEq(s.occupancyPolicy(), address(0), "policy untouched");
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(s.occupant(), alice);
    }

    /// @dev The factory itself is still allowed — the gate is a caller check,
    ///      not a blanket freeze.
    function test_InitializeV3_FactoryIsAllowed() public {
        Slot s = _slot();
        vm.prank(address(factory));
        s.initializeV3(3600, address(0));
        assertEq(s.epochSeconds(), 3600);
    }

    /// @dev A "legacy" slot: a bare BeaconProxy that only ever ran v1
    ///      `initialize`, exactly like the slots deployed before the v2 beacon
    ///      upgrade. `factory` is still address(0) there, which must be
    ///      rejected outright rather than treated as "anyone may call".
    function _legacySlot() internal returns (Slot) {
        bytes memory initData = abi.encodeCall(
            Slot.initialize,
            (
                recipient,
                IERC20(address(token)),
                SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
                _init()
            )
        );
        return Slot(address(new BeaconProxy(address(factory.beacon()), initData)));
    }

    function test_InitializeV3_RejectsWhenFactoryUnset() public {
        Slot s = _legacySlot();
        assertEq(s.factory(), address(0), "sanity: legacy slot has no factory");

        vm.prank(attacker);
        vm.expectRevert(Slot.NotFactory.selector);
        s.initializeV3(type(uint64).max, address(0));
    }

    /// @dev The admin migration path must still work end to end, including on
    ///      a legacy v1 slot that has not yet been through `migrateSlots`.
    function test_MigrateSlotsV3_AdminOnly_AndUpgradesLegacySlots() public {
        Slot legacy = _legacySlot();
        Slot v2Slot = _slot();
        address[] memory slots = new address[](2);
        slots[0] = address(legacy);
        slots[1] = address(v2Slot);

        vm.prank(attacker);
        vm.expectRevert(SlotFactory.NotAdmin.selector);
        factory.migrateSlotsV3(slots, 3600, address(0));

        factory.migrateSlotsV3(slots, 3600, address(0));
        assertEq(legacy.epochSeconds(), 3600, "legacy v1 slot migrated to v3");
        assertEq(legacy.factory(), address(factory), "legacy v1 slot got its factory");
        assertEq(v2Slot.epochSeconds(), 3600, "v2 slot migrated to v3");
        assertTrue(factory.isSlot(address(legacy)));
    }

    /// @dev Documents the deliberate limit of the fix (see the note on
    ///      `Slot.initializeV2`). A v1 slot has no root of trust naming its
    ///      factory, so `initializeV2` stays open and an attacker who reaches
    ///      an unmigrated slot first can still claim factory-hood and then
    ///      reach `initializeV3`. Every slot on the migrated/created path —
    ///      which is all of them once `migrateSlots` has run — is at version 2
    ///      with `factory` already correct, and is closed by the gate above.
    function test_InitializeV2_UnmigratedLegacySlot_RemainsClaimable() public {
        Slot s = _legacySlot();
        vm.prank(attacker);
        s.initializeV2(attacker);
        assertEq(s.factory(), attacker, "known, documented residual on v1 slots");

        // ...whereas a slot that went through the factory is already at v2 and
        // cannot be re-pointed at all.
        Slot live = _slot();
        vm.prank(attacker);
        vm.expectRevert();
        live.initializeV2(attacker);
        assertEq(live.factory(), address(factory));
    }

    // ═══════════════════════════════════════════════════════════
    // FINDING 2 — liquidate()/topUp() must gate on occupant(), not _occupant
    // ═══════════════════════════════════════════════════════════

    /// @dev The zero-deposit-from-vacant path. `minDepositSeconds == 0` lets
    ///      alice buy a VACANT epoch slot with a zero deposit; because the slot
    ///      was vacant, `_occupant` stays address(0) behind the pending
    ///      transfer. Past the boundary every getter reports alice as occupant
    ///      and `isInsolvent()` is true — yet the old raw-storage gates made
    ///      her unremovable: `liquidate()` reverted NotInsolvent, `topUp()`
    ///      reverted NotOccupant, and `collect()` reverted NothingToCollect
    ///      (rolling back the materialisation it had just performed). Alice
    ///      occupied indefinitely having paid zero tax.
    function test_Liquidate_ZeroDepositFromVacant_OnEpochSlot() public {
        Slot s = _epochSlot(3600);

        vm.warp(3600);
        _buy(s, alice, 0, 100 ether); // zero deposit, slot was vacant

        // Raw storage is still vacant; the transfer is only scheduled.
        assertEq(s.occupant(), address(0), "not yet effective");

        vm.warp(2 * uint256(3600) + 1); // past the boundary
        assertEq(s.occupant(), alice, "alice resolves as occupant");
        assertTrue(s.isInsolvent(), "zero deposit => insolvent");

        // The whole point: liquidation must succeed.
        s.liquidate();
        assertEq(s.occupant(), address(0), "occupancy ended");
        assertEq(s.price(), 0);

        // And the slot is immediately reusable.
        _buy(s, bob, 10 ether, 50 ether);
        vm.warp(4 * uint256(3600) + 1);
        assertEq(s.occupant(), bob);
    }

    /// @dev Same window, the `topUp` half: anyone must be able to fund an
    ///      occupancy that has matured but not yet been written to storage.
    function test_TopUp_ResolvesMaturedTransfer() public {
        Slot s = _epochSlot(3600);

        vm.warp(3600);
        _buy(s, alice, 0, 100 ether);
        vm.warp(2 * uint256(3600) + 1);

        vm.startPrank(bob);
        token.approve(address(s), type(uint256).max);
        s.topUp(5 ether); // would revert NotOccupant against raw _occupant
        vm.stopPrank();

        assertEq(s.occupant(), alice);
        assertFalse(s.isInsolvent(), "funded, so no longer insolvent");
        assertGe(s.deposit(), 4 ether);
    }
}
