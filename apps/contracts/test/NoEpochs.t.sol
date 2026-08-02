// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/**
 * @title NoEpochsTest
 * @notice Epoch scheduling was removed: `buy()` always transfers immediately.
 *
 * @dev Two properties matter here and they pull in opposite directions.
 *
 *      1. No NEW pending transfer can be created, even on a slot whose
 *         `epochSeconds` is still non-zero from before the upgrade.
 *      2. Any pending transfer that ALREADY exists must still materialise.
 *         `_materialize` is retained precisely for this. The buyer of a
 *         scheduled transfer has already paid price + deposit; dropping the
 *         code that completes it would strand their escrow permanently.
 *
 *      Legacy state is written with `vm.store` because there is no longer any
 *      way to reach it through the public API — which is the point. The layout
 *      was verified against the live Base Sepolia bytecode before these tests
 *      were written: slot 15 packs `occupancyPolicy` (offset 0) with
 *      `epochSeconds` (offset 20), and `pendingTransfer` spans slots 18-21.
 */
contract NoEpochsTest is Test {
    SlotFactory factory;
    MockERC20 token;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint64 constant HOUR = 3600;

    uint256 constant SLOT_POLICY_AND_EPOCH = 15;
    uint256 constant SLOT_PENDING_HEAD = 18; // buyer + effectiveAt
    uint256 constant SLOT_PENDING_DEPOSIT = 19;
    uint256 constant SLOT_PENDING_NEWPRICE = 20;
    uint256 constant SLOT_PENDING_PRICEPAID = 21;

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new MockERC20();
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
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            0,
            address(0)
        ));
    }

    /// @dev Forge a pre-upgrade slot: non-zero epochSeconds, which the factory
    ///      now refuses to set.
    function _forceEpochSeconds(Slot s, uint64 epoch) internal {
        address policy = s.occupancyPolicy();
        vm.store(
            address(s),
            bytes32(SLOT_POLICY_AND_EPOCH),
            bytes32((uint256(epoch) << 160) | uint256(uint160(policy)))
        );
        assertEq(s.epochSeconds(), epoch, "fixture: epochSeconds not written");
    }

    function _buy(Slot s, address who, uint256 dep, uint256 px) internal {
        vm.startPrank(who);
        token.approve(address(s), type(uint256).max);
        s.buy(who, dep, px);
        vm.stopPrank();
    }

    // ── 1. No new scheduling ────────────────────────────────────────────────

    function test_Buy_VacantSlotClaimsImmediately() public {
        Slot s = _slot();
        _buy(s, alice, 10 ether, 100 ether);

        assertEq(s.occupant(), alice);
        assertEq(s.price(), 100 ether);
        (, uint96 effectiveAt, , , ) = s.pendingTransfer();
        assertEq(uint256(effectiveAt), 0);
    }

    /// The behaviour change: taking the slot FROM someone used to schedule.
    function test_Buy_OccupiedSlot_AppliesNow_EvenWithEpochsConfigured() public {
        Slot s = _slot();
        _buy(s, alice, 100 ether, 100 ether);
        _forceEpochSeconds(s, HOUR);

        _buy(s, bob, 100 ether, 200 ether);

        assertEq(s.occupant(), bob, "buy must apply now, not at a boundary");
        assertEq(s.price(), 200 ether);
        (, uint96 effectiveAt, , , ) = s.pendingTransfer();
        assertEq(uint256(effectiveAt), 0, "no transfer may be scheduled");
    }

    /// Back-to-back buys must not hit the TransferPending guard.
    function test_Buy_TwiceInSameBlock_BothApply() public {
        Slot s = _slot();
        _forceEpochSeconds(s, HOUR);

        _buy(s, alice, 100 ether, 100 ether);
        _buy(s, bob, 100 ether, 300 ether);

        assertEq(s.occupant(), bob);
        assertEq(s.price(), 300 ether);
    }

    // ── 2. Legacy pending transfers still land ──────────────────────────────

    function test_LegacyPendingTransfer_StillMaterialises() public {
        Slot s = _slot();
        _forceEpochSeconds(s, HOUR);
        _buy(s, alice, 100 ether, 100 ether);

        // Forge the state a pre-upgrade `buy()` would have written: bob's
        // transfer, matured one second ago, price already paid into the slot.
        uint96 effectiveAt = uint96(block.timestamp - 1);
        vm.store(
            address(s),
            bytes32(SLOT_PENDING_HEAD),
            bytes32((uint256(effectiveAt) << 160) | uint256(uint160(bob)))
        );
        vm.store(address(s), bytes32(SLOT_PENDING_DEPOSIT), bytes32(uint256(50 ether)));
        vm.store(address(s), bytes32(SLOT_PENDING_NEWPRICE), bytes32(uint256(200 ether)));
        vm.store(address(s), bytes32(SLOT_PENDING_PRICEPAID), bytes32(uint256(100 ether)));
        // Fund the slot as the pre-upgrade commit would have.
        token.mint(address(s), 150 ether);

        uint256 aliceBefore = token.balanceOf(alice);

        s.collect(); // permissionless — anyone can push the handover through

        assertEq(s.occupant(), bob, "drain must still work after removal");
        assertEq(s.price(), 200 ether);
        (, uint96 stillPending, , , ) = s.pendingTransfer();
        assertEq(uint256(stillPending), 0, "pending transfer must be cleared");
        assertGt(
            token.balanceOf(alice),
            aliceBefore,
            "outgoing occupant must be refunded"
        );
    }

    /// A matured transfer resolves through the getters until someone settles —
    /// retained so a legacy slot never misreports its occupant in the gap.
    function test_LegacyPendingTransfer_ResolvesBeforeMaterialisation() public {
        Slot s = _slot();
        _forceEpochSeconds(s, HOUR);
        _buy(s, alice, 100 ether, 100 ether);

        uint96 effectiveAt = uint96(block.timestamp - 1);
        vm.store(
            address(s),
            bytes32(SLOT_PENDING_HEAD),
            bytes32((uint256(effectiveAt) << 160) | uint256(uint160(bob)))
        );
        vm.store(address(s), bytes32(SLOT_PENDING_DEPOSIT), bytes32(uint256(50 ether)));
        vm.store(address(s), bytes32(SLOT_PENDING_NEWPRICE), bytes32(uint256(200 ether)));
        vm.store(address(s), bytes32(SLOT_PENDING_PRICEPAID), bytes32(uint256(100 ether)));

        assertEq(s.occupant(), bob, "getter must resolve the matured transfer");
        assertEq(s.price(), 200 ether);
    }

    // ── 3. Creation rejects epochs ──────────────────────────────────────────

    function test_CreateSlotV3_RejectsNonZeroEpoch() public {
        vm.expectRevert(SlotFactory.EpochsRemoved.selector);
        factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            HOUR,
            address(0)
        );
    }

    function test_CreateSlotV3_AcceptsZeroEpoch() public {
        Slot s = _slot();
        assertEq(s.epochSeconds(), 0);
    }
}
