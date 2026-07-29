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

contract EpochsTest is Test {
    SlotFactory factory;
    MockERC20 token;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint64 constant HOUR = 3600;

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

    function test_NextBoundary_IsNextMultiple() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);                       // 10000 / 3600 = 2.77...
        assertEq(s.nextBoundary(), 3 * HOUR);  // 10800
    }

    function test_NextBoundary_OnExactBoundaryGoesFullEpoch() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(2 * uint256(HOUR));
        assertEq(s.nextBoundary(), 3 * uint256(HOUR));
    }

    function test_Buy_SchedulesInsteadOfExecuting() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        // Not yet occupant — the boundary has not passed
        assertEq(s.occupant(), address(0));

        (address buyer, uint96 effectiveAt, uint256 dep, uint256 newPrice, ) = s.pendingTransfer();
        assertEq(buyer, alice);
        assertEq(uint256(effectiveAt), 3 * uint256(HOUR));
        assertEq(dep, 10 ether);
        assertEq(newPrice, 100 ether);
    }

    function test_Buy_PullsFundsAtCommit() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        uint256 before = token.balanceOf(alice);
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(token.balanceOf(alice), before - 10 ether);
        assertEq(token.balanceOf(address(s)), 10 ether);
    }

    function test_EpochZero_ExecutesImmediately() public {
        Slot s = _epochSlot(0);
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(s.occupant(), alice);
    }

    function test_SecondCommit_Reverts() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        vm.startPrank(bob);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(Slot.TransferPending.selector);
        s.buy(bob, 10 ether, 120 ether);
        vm.stopPrank();
    }

    function test_Materializes_LazilyOnNextInteraction() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        vm.warp(3 * uint256(HOUR) + 500); // past the boundary
        s.collect();                       // any state-changing call

        assertEq(s.occupant(), alice);
        assertEq(s.price(), 100 ether);
        (address buyer,,,,) = s.pendingTransfer();
        assertEq(buyer, address(0), "pending should be cleared");
    }

    function test_OutgoingOccupantPaysUntilBoundary_ThenIncomingPays() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);                 // exactly on a boundary
        _buy(s, alice, 100 ether, 100 ether);

        // NOTE: timestamps below are derived from `HOUR` (a compile-time
        // constant), not from a local variable assigned `= block.timestamp`.
        // Under this repo's via_ir pipeline, a local initialized from
        // block.timestamp and later re-read after an intervening vm.warp()
        // gets value-numbered against the *current* block.timestamp instead
        // of keeping its stored copy — verified in isolation: capturing
        // `t = block.timestamp`, then `vm.warp(t + 1)`, then reading `t`
        // again yields the post-warp value, not the original. Sticking to
        // literal/constant arithmetic for all warp targets sidesteps it.
        uint256 aliceStart = 2 * uint256(HOUR); // alice materialises here
        vm.warp(aliceStart + 1);       // nudge past the exact boundary so
                                        // there is something to collect —
                                        // at the boundary itself, elapsed
                                        // since materialisation is 0 and
                                        // collect() reverts NothingToCollect
        s.collect();
        assertEq(s.occupant(), alice);

        vm.warp(aliceStart + 1800);    // 30 min into alice's tenure
        _buy(s, bob, 100 ether, 100 ether);

        uint256 boundary = 3 * uint256(HOUR);
        uint256 endTime = boundary + 1800;
        vm.warp(endTime);              // 30 min past the switch
        s.collect();

        // Alice paid from aliceStart → boundary; bob from boundary → now.
        // Total collected must equal one continuous 1h stream at 100 ether.
        uint256 expected = (100 ether * 100 * (endTime - aliceStart))
            / (30 days * 10_000);
        assertApproxEqAbs(token.balanceOf(recipient), expected, 2);
        assertEq(s.occupant(), bob);
    }

    function test_OutgoingOccupantRefundedAtMaterialisation() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR) + 1); // nudge past the exact boundary, see
                                         // note in the test above
        s.collect();

        uint256 aliceBefore = token.balanceOf(alice);
        _buy(s, bob, 100 ether, 100 ether);

        vm.warp(3 * uint256(HOUR) + 1);
        s.collect();

        // Alice gets her remaining deposit plus bob's 100 ether purchase price.
        assertGt(token.balanceOf(alice), aliceBefore + 100 ether - 1 ether);
    }
}
