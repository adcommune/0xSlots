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
import {SlotQueue} from "../src/periphery/SlotQueue.sol";
import {QueueExclusivityPolicy} from "../src/policies/QueueExclusivityPolicy.sol";

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

/// @dev USDC-shaped: transfers TO a blocked address revert. This repo already
///      ships a USDC deploy script, so this is a live-token behaviour, not a
///      hypothetical.
contract FFBlocklistERC20 is ERC20 {
    mapping(address => bool) public blocked;
    error Blocklisted(address account);

    constructor() ERC20("Block", "BLK") { _mint(msg.sender, 1_000_000 ether); }

    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function setBlocked(address who, bool v) external { blocked[who] = v; }

    function _update(address from, address to, uint256 value) internal override {
        if (blocked[to]) revert Blocklisted(to);
        super._update(from, to, value);
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

    /// @dev Forge a pre-v4 slot. `createSlotV3` rejects a non-zero epoch now,
    ///      so the only way to reach that state is to write it directly. Slot
    ///      15 packs `occupancyPolicy` (offset 0) with `epochSeconds`
    ///      (offset 20); layout verified against the live Base Sepolia
    ///      bytecode. See NoEpochs.t.sol.
    function _epochSlot(uint64 epoch) internal returns (Slot s) {
        s = Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            0,
            address(0)
        ));
        vm.store(
            address(s),
            bytes32(uint256(15)),
            bytes32((uint256(epoch) << 160) | uint256(uint160(s.occupancyPolicy())))
        );
        assertEq(s.epochSeconds(), epoch, "fixture: epochSeconds not written");
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
        FFDenyAllPolicy p = new FFDenyAllPolicy();
        vm.prank(address(factory));
        s.initializeV3(0, address(p));
        assertEq(s.occupancyPolicy(), address(p));
    }

    /// @dev Epoch scheduling was removed, so a non-zero value is rejected
    ///      rather than written into storage nothing honours.
    function test_InitializeV3_RejectsNonZeroEpoch() public {
        Slot s = _slot();
        vm.prank(address(factory));
        vm.expectRevert(Slot.EpochsRemoved.selector);
        s.initializeV3(3600, address(0));
    }

    /// @dev `SlotConfiguredV3` is the ONLY on-chain signal carrying a slot's
    ///      epoch length and occupancy policy — `createSlotV3` emits the pre-v3
    ///      `SlotDeployed`, whose `SlotInitParams` tuple was deliberately not
    ///      extended (doing so would change the factory's selector and break
    ///      every published ABI). Without this event those two fields are
    ///      invisible to the subgraph and Ponder.
    event SlotConfiguredV3(uint64 epochSeconds, address occupancyPolicy);

    function test_InitializeV3_EmitsConfigForIndexers() public {
        Slot s = _slot();
        FFDenyAllPolicy p = new FFDenyAllPolicy();

        vm.expectEmit(false, false, false, true, address(s));
        emit SlotConfiguredV3(0, address(p));

        vm.prank(address(factory));
        s.initializeV3(0, address(p));
    }

    // ═══════════════════════════════════════════════════════════
    // ATOMIC BEACON UPGRADE + MIGRATION
    // ═══════════════════════════════════════════════════════════

    /// @dev Models the real Base Sepolia situation: occupied slots still on a v1
    ///      implementation, where `factory()` does not even exist. Upgrading the
    ///      beacon exposes them until they are migrated.
    function _occupiedLegacySlot() internal returns (Slot) {
        Slot s = _legacySlot();
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        return s;
    }

    /// THE window this whole mechanism exists to close: between a beacon upgrade
    /// and migration, a v1 slot is capturable by anyone.
    function test_TwoStepUpgrade_LeavesLegacySlotCapturable() public {
        Slot s = _occupiedLegacySlot();

        // Step 1 alone — beacon serves v3 code, slot still has factory == 0.
        Slot newImpl = new Slot();
        factory.beacon().transferOwnership(address(factory));
        factory.upgradeBeacon(address(newImpl));

        // Attacker takes it before the admin's second transaction lands. The
        // absurd epoch that used to be part of this capture is rejected now,
        // but the deny-all policy alone still ends forced sale — the window is
        // narrower, not closed.
        FFDenyAllPolicy deny = new FFDenyAllPolicy();
        vm.startPrank(attacker);
        s.initializeV2(attacker);
        s.initializeV3(0, address(deny));
        vm.stopPrank();

        assertEq(s.factory(), attacker, "attacker owns the factory pointer");
        assertEq(s.occupancyPolicy(), address(deny), "deny-all installed");

        // Forced sale is over: nobody can ever buy this slot again.
        vm.startPrank(bob);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(FFDenyAllPolicy.Denied.selector);
        s.buy(bob, 10 ether, 200 ether);
        vm.stopPrank();
    }

    /// The same scenario through the atomic path — no window, no capture.
    function test_AtomicUpgradeAndMigrate_ClosesTheWindow() public {
        Slot s = _occupiedLegacySlot();
        address occupantBefore = s.occupant();
        uint256 priceBefore = s.price();

        Slot newImpl = new Slot();
        factory.beacon().transferOwnership(address(factory));

        address[] memory slots = new address[](1);
        slots[0] = address(s);
        factory.upgradeBeaconAndMigrateV3(address(newImpl), slots, 0, address(0));

        // Migrated: factory is the real one, config is set, occupancy survived.
        assertEq(s.factory(), address(factory));
        assertEq(s.epochSeconds(), 0);
        assertEq(s.occupant(), occupantBefore, "occupancy survived the upgrade");
        assertEq(s.price(), priceBefore, "price survived the upgrade");

        // The capture is now unreachable — both initializers are spent.
        vm.startPrank(attacker);
        vm.expectRevert();
        s.initializeV2(attacker);
        vm.expectRevert();
        s.initializeV3(type(uint64).max, address(0));
        vm.stopPrank();
    }

    function test_UpgradeBeacon_RejectsNonAdmin() public {
        Slot newImpl = new Slot();
        factory.beacon().transferOwnership(address(factory));
        vm.prank(attacker);
        vm.expectRevert(SlotFactory.NotAdmin.selector);
        factory.upgradeBeacon(address(newImpl));
    }

    /// The migration path must be indexable too — legacy slots brought up to v3
    /// by the admin have to surface their config the same way.
    function test_MigrateSlotsV3_EmitsConfigForIndexers() public {
        Slot s = _legacySlot();
        address[] memory slots = new address[](1);
        slots[0] = address(s);

        vm.expectEmit(false, false, false, true, address(s));
        emit SlotConfiguredV3(0, address(0));

        factory.migrateSlotsV3(slots, 0, address(0));
        assertEq(s.epochSeconds(), 0);
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
        factory.migrateSlotsV3(slots, 0, address(0));

        factory.migrateSlotsV3(slots, 0, address(0));
        assertEq(legacy.factory(), address(factory), "legacy v1 slot migrated to v3");
        assertEq(legacy.factory(), address(factory), "legacy v1 slot got its factory");
        assertEq(v2Slot.factory(), address(factory), "v2 slot migrated to v3");
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

    // ═══════════════════════════════════════════════════════════
    // FINDING 3 — a blocked refund recipient must not brick the slot
    // ═══════════════════════════════════════════════════════════

    FFBlocklistERC20 blk;

    /// @dev Epoch written directly — see `_epochSlot`.
    function _blockSlot(uint64 epoch) internal returns (Slot s) {
        blk = new FFBlocklistERC20();
        blk.mint(alice, 10_000 ether);
        blk.mint(bob, 10_000 ether);
        s = Slot(factory.createSlotV3(
            recipient,
            IERC20(address(blk)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            0,
            address(0)
        ));
        if (epoch != 0) {
            vm.store(
                address(s),
                bytes32(uint256(15)),
                bytes32((uint256(epoch) << 160) | uint256(uint160(s.occupancyPolicy())))
            );
        }
    }

    function _buyBlk(Slot s, address who, uint256 dep, uint256 px) internal {
        vm.startPrank(who);
        blk.approve(address(s), type(uint256).max);
        s.buy(who, dep, px);
        vm.stopPrank();
    }

    /// @dev The escalation this branch introduced: `_materialize` pays the
    ///      outgoing occupant, and it runs inside `_settle()`, which is the
    ///      first statement of every mutating entry point. Before this branch
    ///      only `buy()` was exposed to a reverting refund; afterwards a
    ///      blocked outgoing occupant made `buy`, `release`, `selfAssess`,
    ///      `topUp`, `withdraw`, `liquidate` AND `collect` revert permanently —
    ///      locking the outgoing deposit, the incoming buyer's escrow and all
    ///      accrued tax with no way out.
    function test_BlockedOutgoingOccupant_DoesNotBrickSlot() public {
        Slot s = _blockSlot(0);

        // Alice occupies for real.
        vm.warp(3600);
        _buyBlk(s, alice, 100 ether, 100 ether);
        assertEq(s.occupant(), alice);

        // Alice is blocklisted before she is bought out, so the refund `buy()`
        // owes her cannot be pushed. Exercised on the immediate path, which is
        // the only transfer path there is now — and the one that matters, since
        // it runs on every buy rather than only at a boundary.
        blk.setBlocked(alice, true);
        vm.warp(2 * uint256(3600) + 1);

        // The buy must succeed and the slot must stay fully usable.
        _buyBlk(s, bob, 100 ether, 100 ether);
        assertEq(s.occupant(), bob, "buy landed despite the blocked refund");

        uint256 credited = s.withdrawableOf(alice);
        assertGt(credited, 100 ether, "alice's deposit + bob's price credited, not lost");

        // Every entry point still works.
        vm.prank(bob);
        s.selfAssess(150 ether);
        assertEq(s.price(), 150 ether);

        vm.startPrank(alice);
        blk.approve(address(s), type(uint256).max);
        s.topUp(1 ether);
        vm.stopPrank();

        vm.prank(bob);
        s.withdraw(1);

        vm.prank(bob);
        s.release();
        assertEq(s.occupant(), address(0), "slot released cleanly");

        // Alice was never able to claim while blocked...
        vm.expectRevert(
            abi.encodeWithSelector(FFBlocklistERC20.Blocklisted.selector, alice)
        );
        s.claim(alice);

        // ...and is made whole the moment she is unblocked.
        blk.setBlocked(alice, false);
        uint256 before = blk.balanceOf(alice);
        s.claim(alice); // permissionless caller, funds go to alice
        assertEq(blk.balanceOf(alice), before + credited, "blocked party paid in full");
        assertEq(s.withdrawableOf(alice), 0);

        vm.expectRevert(Slot.NothingToClaim.selector);
        s.claim(alice);
    }

    /// @dev Non-epoch path: a blocked outgoing occupant must not be able to
    ///      veto their own forced sale by being unpayable.
    function test_BlockedOutgoingOccupant_ImmediateBuyStillSucceeds() public {
        Slot s = _blockSlot(0);

        _buyBlk(s, alice, 100 ether, 100 ether);
        blk.setBlocked(alice, true);

        _buyBlk(s, bob, 100 ether, 120 ether);
        assertEq(s.occupant(), bob, "forced sale completed");
        assertGt(s.withdrawableOf(alice), 0, "alice credited rather than paid");
    }

    /// @dev The happy path must be unchanged — a well-behaved token still
    ///      pushes atomically and nothing lands in `withdrawableOf`.
    function test_UnblockedRefund_StillPushedAtomically() public {
        Slot s = _epochSlot(3600);

        vm.warp(3600);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(3600) + 1);
        s.collect();

        uint256 aliceBefore = token.balanceOf(alice);
        _buy(s, bob, 100 ether, 100 ether);
        vm.warp(3 * uint256(3600) + 1);
        s.collect();

        assertGt(token.balanceOf(alice), aliceBefore + 100 ether - 1 ether, "pushed, not credited");
        assertEq(s.withdrawableOf(alice), 0, "nothing left pending");
    }

    // ═══════════════════════════════════════════════════════════
    // FINDING 4 — queue exclusivity must not suspend forced sale
    // ═══════════════════════════════════════════════════════════

    function _queueSlot(QueueExclusivityPolicy p) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            0,
            address(p)
        ));
    }

    /// @dev The self-bid squat. `checkBuy` rejected every non-queue caller
    ///      while the queue was non-empty, and `SlotQueue.fill()` requires
    ///      `occupant() == address(0)` — so while the slot was occupied NOBODY
    ///      could buy: third parties vetoed by the policy, the queue blocked by
    ///      the occupancy check. Alice only had to place a 1-wei-deposit bid in
    ///      her own queue to become permanently unbuyable at any price;
    ///      `MAX_BID_DURATION` caps a bid at 30 days but re-bidding is
    ///      permissionless and costs gas plus 1 wei.
    function test_Exclusivity_DoesNotBlockBuyoutOfOccupiedSlot() public {
        SlotQueue queue = new SlotQueue(address(factory));
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _queueSlot(p);

        // Alice occupies.
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(s.occupant(), alice);

        // ...then squats her own queue with a dust bid.
        vm.startPrank(alice);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 1, 1, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();
        assertFalse(queue.isEmpty(address(s)), "queue is non-empty");

        // The queue itself cannot take an occupied slot...
        vm.expectRevert(SlotQueue.SlotOccupied.selector);
        queue.fill(address(s));

        // ...so if the policy also vetoed bob, the slot would be unbuyable at
        // any price. Bob offers 2x alice's declared price and must succeed.
        _buy(s, bob, 10 ether, 200 ether);
        assertEq(s.occupant(), bob, "forced sale survived the squat");
        assertEq(s.price(), 200 ether);
    }

    /// @dev Exclusivity must still do its actual job: once the slot is VACANT,
    ///      the queue's head bidder is not front-run.
    function test_Exclusivity_StillHoldsWhileVacant() public {
        SlotQueue queue = new SlotQueue(address(factory));
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _queueSlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        // Slot is vacant and the queue is non-empty: a third party is vetoed.
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(QueueExclusivityPolicy.QueueHasPriority.selector);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        // The queue can take it.
        queue.fill(address(s));
        assertEq(s.occupant(), bob);
    }

}
