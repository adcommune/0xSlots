// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Slot} from "../Slot.sol";
import {SlotFactory} from "../SlotFactory.sol";

/// @title SlotQueue
/// @notice FIFO queue of funded bids to occupy a slot once it becomes vacant.
/// @dev Holds ITS OWN escrow — never the slot's deposit. Filling is a separate,
///      permissionless transaction rather than a hook: `release()` and
///      `liquidate()` are `nonReentrant`, so the queue cannot call `buy()` back
///      into the slot from inside them. A tip pays whoever calls `fill`, the
///      same incentive shape `liquidationBountyBps` already uses.
///
///      Ordering is FIFO. Ranking bids by price would make this an auction —
///      third parties setting the price — which the protocol does not do.
///
///      Escrow is ONE pooled ERC-20 balance shared across every slot's bids
///      held by this contract. Two consequences follow:
///       1. `slot` is untrusted, attacker-controllable input on every entry
///          point — it must be validated against the factory (`isSlot`) before
///          this contract ever trusts anything the "slot" reports back, most
///          importantly its `currency()`.
///       2. The currency for a bid is read ONCE, at join time (after the
///          `isSlot` gate), and cached in the `Bid` itself. `cancel`, `fill`
///          and the sweep never re-read `currency()` from the slot — a
///          malicious contract could otherwise report a worthless token while
///          escrowing (cheap to join) and the real pooled currency while being
///          refunded (draining other slots' bidders).
contract SlotQueue is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Bound on how many dead (cancelled/expired) bids a single call
    ///         will skip over. Keeps `fill()` — and any internal sweep it
    ///         triggers — bounded per call regardless of queue backlog size.
    uint256 public constant MAX_SWEEP = 32;

    /// @notice Bound on how far in the future a bid's `expiry` may be set.
    ///         Without this, `expiry` could be `type(uint96).max`, so a bid
    ///         that turns out to be unfillable-but-not-caught (or simply
    ///         never gets swept) could sit in the queue effectively forever.
    ///         Capping duration guarantees every bid eventually becomes
    ///         expired and thus eligible for the bounded sweep as a backstop,
    ///         regardless of what else about it goes wrong.
    uint256 public constant MAX_BID_DURATION = 30 days;

    /// @notice The SlotFactory used to validate that `slot` is a real,
    ///         factory-deployed Slot before this contract trusts anything it
    ///         reports (in particular its `currency()`).
    SlotFactory public immutable factory;

    struct Bid {
        address bidder;
        uint96 expiry;
        uint256 price;    // bidder's own self-assessed price
        uint256 deposit;  // escrowed, forwarded to the slot on fill
        uint256 tip;      // escrowed, paid to whoever calls fill
        IERC20 currency;  // cached at join time — never re-read from the slot
        bool cancelled;   // also set once a bid is filled or skipped — "no longer live"
    }

    /// @notice slot => FIFO bid list
    mapping(address => Bid[]) public bids;
    /// @notice slot => index of the first not-yet-resolved bid
    mapping(address => uint256) public headIndex;
    /// @notice slot => count of bids that are still live (not cancelled, not
    ///         filled, not swept as expired). O(1) source of truth for
    ///         `isEmpty` — see the note on that function for the one
    ///         deliberate exception.
    mapping(address => uint256) public liveBidCount;

    event BidPlaced(address indexed slot, address indexed bidder, uint256 index, uint256 price);
    event BidCancelled(address indexed slot, address indexed bidder, uint256 index);
    event Filled(address indexed slot, address indexed bidder, address indexed keeper, uint256 tip);
    event BidSkipped(address indexed slot, address indexed bidder, uint256 index);

    error SlotOccupied();
    error QueueEmpty();
    error SweepIncomplete();
    error NotBidder();
    error AlreadyCancelled();
    error AlreadyProcessed();
    error InvalidExpiry();
    error ExpiryTooFar();
    error InvalidBid();
    error NotASlot();
    error SlotTransferPending();

    constructor(address _factory) {
        factory = SlotFactory(_factory);
    }

    /// @notice Escrow a funded bid to occupy `slot` once it is vacant.
    /// @dev A vacant slot costs only the deposit, so no purchase price is escrowed.
    ///      `slot` must be a real factory-deployed slot — checked before we
    ///      ever call into it — and its currency is cached here, once, for
    ///      the lifetime of this bid.
    function joinQueue(
        address slot,
        uint256 price,
        uint256 deposit,
        uint256 tip,
        uint96 expiry
    ) external nonReentrant {
        if (!factory.isSlot(slot)) revert NotASlot();
        if (expiry <= block.timestamp) revert InvalidExpiry();
        // Bound every bid's lifetime so it is guaranteed to eventually reach
        // the expiry sweep — a backstop no matter what else about it is
        // wrong. See MAX_BID_DURATION.
        if (expiry > block.timestamp + MAX_BID_DURATION) revert ExpiryTooFar();
        // Slot.buy() reverts unconditionally on a zero price, and a zero
        // deposit is either useless or unfundable. Reject both up front so
        // `fill()` can never be permanently blocked by a bid engineered to
        // always revert `Slot.buy()`.
        if (price == 0 || deposit == 0) revert InvalidBid();

        IERC20 currency = Slot(slot).currency();
        currency.safeTransferFrom(msg.sender, address(this), deposit + tip);

        bids[slot].push(Bid({
            bidder: msg.sender,
            expiry: expiry,
            price: price,
            deposit: deposit,
            tip: tip,
            currency: currency,
            cancelled: false
        }));
        liveBidCount[slot]++;

        emit BidPlaced(slot, msg.sender, bids[slot].length - 1, price);
    }

    /// @notice Withdraw your bid before it is filled.
    function cancel(address slot, uint256 index) external nonReentrant {
        // A bid at an index the sweep/fill cursor has already passed has
        // already been resolved (filled, skipped, or expiry-swept) and its
        // funds already moved. Cancelling it now would be a no-op refund
        // that still emits a misleading BidCancelled event.
        if (index < headIndex[slot]) revert AlreadyProcessed();

        Bid storage b = bids[slot][index];
        if (b.bidder != msg.sender) revert NotBidder();
        if (b.cancelled) revert AlreadyCancelled();

        b.cancelled = true;
        uint256 refund = b.deposit + b.tip;
        IERC20 currency = b.currency;
        b.deposit = 0;
        b.tip = 0;
        liveBidCount[slot]--;

        currency.safeTransfer(msg.sender, refund);
        emit BidCancelled(slot, msg.sender, index);
    }

    /// @notice Permissionless. Clears a bounded number of dead (cancelled or
    ///         expired) bids from the front of `slot`'s queue, refunding any
    ///         expired ones as it goes. Anyone can call this to work down a
    ///         backlog left by `fill()`'s bounded internal sweep — see the
    ///         residual note on `isEmpty`.
    function sweepExpired(address slot, uint256 maxSteps) external nonReentrant {
        _sweep(slot, maxSteps);
    }

    /// @notice Permissionless. Hands the vacant slot to the head bidder.
    /// @dev Processes at most one outcome per call: either the head bid
    ///      fills successfully, or — if `Slot.buy()` reverts for it (a stale
    ///      policy rejection, an unmet minimum deposit, etc.) — that single
    ///      bid is refunded and skipped and the call returns normally. It
    ///      does NOT loop trying subsequent bids: an unbounded retry loop
    ///      over attacker-supplied always-failing bids would reopen the same
    ///      gas-griefing hazard `MAX_SWEEP` closes for cancelled/expired
    ///      bids. A queue with several unfillable bids in a row simply needs
    ///      `fill()` called again — permissionless, bounded, and each call
    ///      makes forward progress by moving the head past one bid.
    function fill(address slot) external nonReentrant {
        if (Slot(slot).occupant() != address(0)) revert SlotOccupied();

        uint256 i = _sweep(slot, MAX_SWEEP);
        Bid[] storage list = bids[slot];
        if (i >= list.length) revert QueueEmpty();

        Bid storage b = list[i];
        // The sweep is bounded by MAX_SWEEP: if there were more than
        // MAX_SWEEP consecutive dead bids at the front, the sweep stops
        // mid-backlog without having examined index i. Detect that case
        // explicitly rather than mistaking it for "genuinely nothing left" —
        // the fix is `sweepExpired`, not silently trying to fill a dead bid.
        if (b.cancelled || b.expiry <= block.timestamp) revert SweepIncomplete();

        // Re-check vacancy: the sweep above may have made external calls
        // (refunds to expired bidders). A malicious bidder's token could
        // attempt to reenter and occupy the slot directly (bypassing this
        // contract, so our own `nonReentrant` guard does not cover it). Fail
        // cleanly here rather than letting `Slot.buy()` revert confusingly
        // (e.g. paying a stale price it was never funded for).
        if (Slot(slot).occupant() != address(0)) revert SlotOccupied();

        // Reject a transient condition instead of letting it reach the catch
        // below: on an `epochSeconds > 0` slot, filling one bid *schedules*
        // a transfer rather than executing it, so `occupant()` above still
        // read `address(0)` even though the slot is no longer really free.
        // Without this check, a second `fill()` would reach `Slot.buy()`,
        // hit `TransferPending`, and the catch below would treat that as a
        // deterministic failure — permanently evicting and refunding the
        // (perfectly fine, just temporarily blocked) head bid. That breaks
        // the FIFO guarantee: anyone could evict the head by calling `fill`
        // at the right moment and then fill their own bid next. A revert
        // here instead leaves the head bid's position, funds, and queue
        // index completely untouched; the caller (or anyone) simply retries
        // `fill()` after the scheduled boundary passes.
        (, uint96 effectiveAt, , , ) = Slot(slot).pendingTransfer();
        if (effectiveAt != 0) revert SlotTransferPending();

        address bidder = b.bidder;
        uint256 dep = b.deposit;
        uint256 tip = b.tip;
        uint256 px = b.price;
        IERC20 currency = b.currency;

        // This bid is resolved either way — filled or skipped — so retire it
        // and advance the head before the external call (checks-effects-interactions).
        b.deposit = 0;
        b.tip = 0;
        b.cancelled = true;
        headIndex[slot] = i + 1;
        liveBidCount[slot]--;

        currency.forceApprove(slot, dep);
        // Everything transient (occupied, a scheduled transfer) has already
        // been pre-checked and reverted above without touching this bid's
        // state. What reaches this try/catch is only what's deterministic
        // for THIS bid on the slot's CURRENT terms — e.g. a manager having
        // since raised `taxPercentage`/`minDepositSeconds` so the escrowed
        // deposit is now insufficient, or a third-party occupancy policy
        // rejecting this bidder outright. Those can never resolve themselves
        // by retrying later with the same bid, so eviction-with-refund is
        // the correct behaviour rather than blocking the queue forever.
        try Slot(slot).buy(bidder, dep, px) {
            currency.forceApprove(slot, 0);
            if (tip > 0) currency.safeTransfer(msg.sender, tip);
            emit Filled(slot, bidder, msg.sender, tip);
        } catch {
            currency.forceApprove(slot, 0);
            uint256 refund = dep + tip;
            if (refund > 0) currency.safeTransfer(bidder, refund);
            emit BidSkipped(slot, bidder, i);
        }
    }

    /// @notice True when no live bid remains for `slot`. O(1).
    /// @dev Residual: if every remaining bid has expired but nobody has
    ///      called `sweepExpired` (or `fill`, which sweeps internally) yet,
    ///      `liveBidCount` has not been decremented and `isEmpty` still
    ///      reports `false` even though none of those bids could ever fill.
    ///      An exclusivity policy gating on this MUST treat that as a
    ///      one-transaction inconvenience, not a design defect — anyone can
    ///      clear it permissionlessly by calling `sweepExpired`. It is not a
    ///      brick: the slot unblocks the moment someone (a bidder wanting
    ///      their refund, a keeper wanting the tip, or a third party who
    ///      simply wants the slot open) pays that one transaction.
    function isEmpty(address slot) external view returns (bool) {
        return liveBidCount[slot] == 0;
    }

    /// @dev Skips cancelled and expired bids starting at `headIndex[slot]`,
    ///      refunding expired ones as it goes, bounded to `maxSteps`
    ///      iterations so an arbitrarily large backlog can never make a
    ///      single call run out of gas. Persists `headIndex[slot]` before
    ///      returning so progress is never lost across calls.
    ///
    ///      A bid can never be refunded twice: `cancel()` refunds and sets
    ///      `cancelled = true` in the same call, and this sweep only ever
    ///      refunds a bid it finds with `cancelled == false`, immediately
    ///      setting `cancelled = true` (and zeroing `deposit`/`tip`) in the
    ///      same atomic step as the transfer. Every later visit to that same
    ///      index — from this sweep, from `fill`, or from a future call —
    ///      sees `cancelled == true` and only skips it, never transfers
    ///      again.
    function _sweep(address slot, uint256 maxSteps) internal returns (uint256) {
        Bid[] storage list = bids[slot];
        uint256 i = headIndex[slot];
        uint256 steps = 0;
        while (i < list.length && steps < maxSteps) {
            Bid storage b = list[i];
            if (b.cancelled) {
                i++;
                steps++;
                continue;
            }
            if (b.expiry <= block.timestamp) {
                uint256 refund = b.deposit + b.tip;
                IERC20 currency = b.currency;
                b.deposit = 0;
                b.tip = 0;
                b.cancelled = true;
                liveBidCount[slot]--;
                if (refund > 0) currency.safeTransfer(b.bidder, refund);
                i++;
                steps++;
                continue;
            }
            break;
        }
        headIndex[slot] = i;
        return i;
    }
}
