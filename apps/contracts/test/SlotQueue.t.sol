// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {SlotQueue} from "../src/periphery/SlotQueue.sol";
import {QueueExclusivityPolicy} from "../src/policies/QueueExclusivityPolicy.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Mimics just enough of Slot's external surface to probe SlotQueue's
///      trust boundary. NOT registered with any SlotFactory — that is the
///      whole point: `factory.isSlot(address(this))` must be false, and
///      `joinQueue` must reject it before ever calling `currency()`. If it
///      weren't rejected, `flipToReal` demonstrates the attack C1 closes: a
///      slot that reports a worthless token at join time (cheap escrow) and
///      the real pooled currency later (draining other slots' bidders).
contract EvilSlot {
    IERC20 public fakeCurrency;
    IERC20 public realCurrency;
    bool public useReal;

    constructor(IERC20 _fake, IERC20 _real) {
        fakeCurrency = _fake;
        realCurrency = _real;
    }

    function currency() external view returns (IERC20) {
        return useReal ? realCurrency : fakeCurrency;
    }

    function occupant() external pure returns (address) {
        return address(0);
    }

    function flipToReal() external {
        useReal = true;
    }
}

contract SlotQueueTest is Test {
    SlotFactory factory;
    MockERC20 token;
    SlotQueue queue;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address keeper = makeAddr("keeper");

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new MockERC20();
        queue = new SlotQueue(address(factory));
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);
        token.mint(carol, 1000 ether);
        vm.warp(1_000_000);
    }

    function _slot() internal returns (Slot) {
        return Slot(factory.createSlot(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 100,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 0
            })
        ));
    }

    /// @dev A slot whose minimum deposit is a real, nonzero function of the
    ///      buyer's self-assessed price: minDep = price * taxPercentage *
    ///      minDepositSeconds / (MONTH * BASIS_POINTS). With taxPercentage =
    ///      1000 (10%) and minDepositSeconds = 30 days = MONTH, that reduces
    ///      to minDep = price / 10 — e.g. 8 ether for an 80 ether bid.
    function _slotWithMinDeposit() internal returns (Slot) {
        return Slot(factory.createSlot(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 1000,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 30 days
            })
        ));
    }

    /// @dev A slot with epoch scheduling turned on: `Slot.buy()` only
    ///      *schedules* a transfer (via `pendingTransfer`) instead of
    ///      executing it immediately, so `occupant()` keeps reading
    ///      `address(0)` until the boundary matures.
    function _epochSlot(uint64 epochSeconds_) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 100,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 0
            }),
            epochSeconds_,
            address(0)
        ));
    }

    function test_Fill_AfterRelease() public {
        Slot s = _slot();
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.prank(alice);
        s.release();

        uint256 keeperBefore = token.balanceOf(keeper);
        vm.prank(keeper);
        queue.fill(address(s));

        assertEq(s.occupant(), bob);
        assertEq(s.price(), 80 ether);
        assertEq(token.balanceOf(keeper), keeperBefore + 1 ether, "keeper tipped");
    }

    function test_Fill_RevertsWhileOccupied() public {
        Slot s = _slot();
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.expectRevert(SlotQueue.SlotOccupied.selector);
        queue.fill(address(s));
    }

    /// @dev Rewritten per security fix-round I2: the original assertion was
    ///      trivially true because `fill()` reverted, so nothing had run.
    ///      This now drives the refund through the permissionless
    ///      `sweepExpired` (its own transaction, so its effects commit
    ///      instead of being unwound by a later revert — see I1), asserts
    ///      the bidder actually got their money back, and only then checks
    ///      that a subsequent `fill()` correctly reports the queue empty.
    function test_Fill_SkipsExpiredBid() public {
        Slot s = _slot();
        uint256 before = token.balanceOf(bob);
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 1 days));
        vm.stopPrank();

        vm.warp(block.timestamp + 2 days);

        queue.sweepExpired(address(s), 10);
        assertEq(token.balanceOf(bob), before, "expired bid refunded by sweep");
        assertTrue(queue.isEmpty(address(s)));
        assertEq(queue.liveBidCount(address(s)), 0);

        vm.expectRevert(SlotQueue.QueueEmpty.selector);
        queue.fill(address(s));
    }

    function test_Cancel_RefundsBidder() public {
        Slot s = _slot();
        uint256 before = token.balanceOf(bob);
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        queue.cancel(address(s), 0);
        vm.stopPrank();
        assertEq(token.balanceOf(bob), before);
        assertTrue(queue.isEmpty(address(s)));
    }

    function test_IsEmpty_TrueWhenNoBids() public {
        Slot s = _slot();
        assertTrue(queue.isEmpty(address(s)));
    }

    /// @dev Security fix C1: `slot` is attacker-controllable input into a
    ///      contract holding ONE pooled escrow balance across every slot's
    ///      bidders. An unregistered "slot" must be rejected before
    ///      `joinQueue` ever calls `currency()` on it — otherwise a fake
    ///      slot could report a worthless token at join time and the real
    ///      pooled currency later, via `cancel`/`fill`, draining other
    ///      slots' bidders. `factory.isSlot` is the gate.
    function test_JoinQueue_RevertsForUnregisteredSlot() public {
        MockERC20 fakeToken = new MockERC20();
        EvilSlot evil = new EvilSlot(IERC20(address(fakeToken)), IERC20(address(token)));
        assertFalse(factory.isSlot(address(evil)), "sanity: evil slot is not factory-registered");

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        vm.expectRevert(SlotQueue.NotASlot.selector);
        queue.joinQueue(address(evil), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        // Even the switch itself is inert: without ever accepting the join,
        // there is no cached currency and no escrow for EvilSlot to reach.
        evil.flipToReal();
        assertTrue(evil.useReal());
    }

    /// @dev Security fix C2: a bid that will always revert `Slot.buy()`
    ///      (here, an underfunded deposit for the slot's minimum-deposit
    ///      policy) must not block the queue forever. `fill()` catches the
    ///      revert, refunds and skips exactly that one bid, and returns
    ///      normally — a follow-up `fill()` call then reaches and fills the
    ///      next, properly-funded bid.
    function test_Fill_SkipsUnfillableBid_ThenFillsNext() public {
        Slot s = _slotWithMinDeposit();

        uint256 bobBefore = token.balanceOf(bob);
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        // 80 ether price needs an 8 ether minimum deposit on this slot; 1
        // ether is deliberately insufficient, so Slot.buy() will revert
        // InsufficientDeposit for this bid specifically.
        queue.joinQueue(address(s), 80 ether, 1 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.startPrank(carol);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        // First fill(): bob's bid is skipped and refunded, not filled.
        queue.fill(address(s));
        assertEq(s.occupant(), address(0), "slot still vacant after a skip");
        assertEq(token.balanceOf(bob), bobBefore, "bob refunded deposit + tip in full");
        assertEq(queue.headIndex(address(s)), 1, "head advanced past the skipped bid");

        // Second fill(): carol's properly-funded bid, now at the head, succeeds.
        uint256 keeperBefore = token.balanceOf(keeper);
        vm.prank(keeper);
        queue.fill(address(s));
        assertEq(s.occupant(), carol);
        assertEq(s.price(), 80 ether);
        assertEq(token.balanceOf(keeper), keeperBefore + 1 ether, "keeper tipped for the successful fill");
        assertTrue(queue.isEmpty(address(s)));
    }

    /// @dev Security fix C3: `isEmpty`/`liveBidCount` must track join,
    ///      cancel and fill in O(1) without ever rescanning the bid array.
    function test_LiveBidCount_JoinThenCancel() public {
        Slot s = _slot();
        assertTrue(queue.isEmpty(address(s)));
        assertEq(queue.liveBidCount(address(s)), 0);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();
        assertFalse(queue.isEmpty(address(s)));
        assertEq(queue.liveBidCount(address(s)), 1);

        vm.prank(bob);
        queue.cancel(address(s), 0);
        assertTrue(queue.isEmpty(address(s)));
        assertEq(queue.liveBidCount(address(s)), 0);
    }

    function test_LiveBidCount_JoinThenFill() public {
        Slot s = _slot();
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();
        assertEq(queue.liveBidCount(address(s)), 1);
        assertFalse(queue.isEmpty(address(s)));

        queue.fill(address(s));
        assertEq(queue.liveBidCount(address(s)), 0);
        assertTrue(queue.isEmpty(address(s)));
    }

    /// @dev Security fix M1: an already-resolved bid (here, filled) cannot
    ///      be "cancelled" afterward — that would emit a misleading
    ///      BidCancelled with no funds left to move.
    function test_Cancel_RevertsForAlreadyProcessedBid() public {
        Slot s = _slot();
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        queue.fill(address(s));

        vm.prank(bob);
        vm.expectRevert(SlotQueue.AlreadyProcessed.selector);
        queue.cancel(address(s), 0);
    }

    /// @dev Security fix round 2, Important: closes the "eviction jumping"
    ///      hole the C2 `try/catch` introduced. On an `epochSeconds > 0`
    ///      slot, filling bid #1 only *schedules* a transfer — `occupant()`
    ///      still reads `address(0)` afterward. Without the pre-check, an
    ///      unguarded second `fill()` would pass the vacancy check, reach
    ///      `Slot.buy()`, hit `TransferPending`, and the C2 catch would
    ///      wrongly treat that transient condition as a deterministic
    ///      failure — permanently evicting and refunding bid #2 even though
    ///      it did nothing wrong, defeating FIFO. `fill()` must instead
    ///      revert `SlotTransferPending`, leaving bid #2's position, escrow,
    ///      and queue bookkeeping completely untouched.
    function test_Fill_RevertsOnPendingTransfer_DoesNotEvictNextBid() public {
        Slot s = _epochSlot(1 hours);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        uint256 carolBefore = token.balanceOf(carol);
        vm.startPrank(carol);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 90 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        // First fill(): bob's bid schedules a transfer; the slot is not yet
        // vacated of its "pending" state, but occupant() still reads address(0).
        queue.fill(address(s));
        assertEq(s.occupant(), address(0), "transfer only scheduled, not yet materialised");
        assertEq(queue.liveBidCount(address(s)), 1, "carol's bid is still live");
        assertEq(queue.headIndex(address(s)), 1, "head sits at carol's bid");

        // Second fill(): must revert SlotTransferPending, not evict carol.
        vm.expectRevert(SlotQueue.SlotTransferPending.selector);
        queue.fill(address(s));

        // Carol's bid is completely untouched by the failed attempt.
        assertEq(queue.liveBidCount(address(s)), 1, "liveBidCount unchanged");
        assertEq(queue.headIndex(address(s)), 1, "headIndex unchanged");
        assertEq(token.balanceOf(carol), carolBefore - 11 ether, "carol not refunded, still escrowed");
    }

    /// @dev Security fix round 2, Important: `joinQueue` must bound how far
    ///      in the future `expiry` may be set, so every bid is guaranteed to
    ///      eventually reach the expiry sweep as a backstop.
    function test_JoinQueue_RevertsForExpiryBeyondMaxDuration() public {
        Slot s = _slot();
        // Computed BEFORE vm.expectRevert: expectRevert only guards the very
        // next call, and an inline `queue.MAX_BID_DURATION()` call used as an
        // argument expression would itself be "the next call" — it succeeds
        // (it's just a view getter), silently consuming the expectation
        // before joinQueue ever runs.
        uint96 tooFar = uint96(block.timestamp + queue.MAX_BID_DURATION() + 1);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        vm.expectRevert(SlotQueue.ExpiryTooFar.selector);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, tooFar);
        vm.stopPrank();
    }

    function test_JoinQueue_AcceptsExpiryAtMaxDuration() public {
        Slot s = _slot();
        uint96 atCap = uint96(block.timestamp + queue.MAX_BID_DURATION());

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, atCap);
        vm.stopPrank();
        assertEq(queue.liveBidCount(address(s)), 1);
    }

    /// @dev Slot wired to a QueueExclusivityPolicy `p`. `SlotQueue`'s
    ///      constructor now takes the factory address (`new SlotQueue(address(factory))`,
    ///      not the brief's original zero-arg form), so this test file's
    ///      `queue` — built that way in `setUp` — can be handed straight to
    ///      the policy's constructor unchanged.
    function _policySlot(QueueExclusivityPolicy p) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 100,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 0
            }),
            0,
            address(p)
        ));
    }

    /// The whole point: nobody front-runs the queue when the slot frees up.
    function test_Exclusivity_BlocksDirectBuyWhenQueueNonEmpty() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(QueueExclusivityPolicy.QueueHasPriority.selector);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
    }

    /// Invariant: an empty queue must never freeze the slot.
    function test_Exclusivity_EmptyQueueAllowsAnyone() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(s.occupant(), alice);
    }

    function test_Exclusivity_QueueItselfCanFill() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        queue.fill(address(s));
        assertEq(s.occupant(), bob);
    }

    /// After the queue drains, the slot returns to open access.
    function test_Exclusivity_ReopensAfterQueueDrains() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        queue.fill(address(s));
        vm.prank(bob);
        s.release();

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(s.occupant(), alice);
    }
}
