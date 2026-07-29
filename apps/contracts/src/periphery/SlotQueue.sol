// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Slot} from "../Slot.sol";

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
contract SlotQueue is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Bid {
        address bidder;
        uint96 expiry;
        uint256 price;    // bidder's own self-assessed price
        uint256 deposit;  // escrowed, forwarded to the slot on fill
        uint256 tip;      // escrowed, paid to whoever calls fill
        bool cancelled;
    }

    /// @notice slot => FIFO bid list
    mapping(address => Bid[]) public bids;
    /// @notice slot => index of the first live bid
    mapping(address => uint256) public headIndex;

    event BidPlaced(address indexed slot, address indexed bidder, uint256 index, uint256 price);
    event BidCancelled(address indexed slot, address indexed bidder, uint256 index);
    event Filled(address indexed slot, address indexed bidder, address indexed keeper, uint256 tip);

    error SlotOccupied();
    error QueueEmpty();
    error NotBidder();
    error AlreadyCancelled();
    error InvalidExpiry();

    /// @notice Escrow a funded bid to occupy `slot` once it is vacant.
    /// @dev A vacant slot costs only the deposit, so no purchase price is escrowed.
    function joinQueue(
        address slot,
        uint256 price,
        uint256 deposit,
        uint256 tip,
        uint96 expiry
    ) external nonReentrant {
        if (expiry <= block.timestamp) revert InvalidExpiry();

        IERC20 currency = Slot(slot).currency();
        currency.safeTransferFrom(msg.sender, address(this), deposit + tip);

        bids[slot].push(Bid({
            bidder: msg.sender,
            expiry: expiry,
            price: price,
            deposit: deposit,
            tip: tip,
            cancelled: false
        }));

        emit BidPlaced(slot, msg.sender, bids[slot].length - 1, price);
    }

    /// @notice Withdraw your bid before it is filled.
    function cancel(address slot, uint256 index) external nonReentrant {
        Bid storage b = bids[slot][index];
        if (b.bidder != msg.sender) revert NotBidder();
        if (b.cancelled) revert AlreadyCancelled();

        b.cancelled = true;
        uint256 refund = b.deposit + b.tip;
        b.deposit = 0;
        b.tip = 0;

        Slot(slot).currency().safeTransfer(msg.sender, refund);
        emit BidCancelled(slot, msg.sender, index);
    }

    /// @notice Permissionless. Hands the vacant slot to the head bidder.
    function fill(address slot) external nonReentrant {
        if (Slot(slot).occupant() != address(0)) revert SlotOccupied();

        uint256 i = _advanceHead(slot);
        Bid[] storage list = bids[slot];
        if (i >= list.length) revert QueueEmpty();

        Bid storage b = list[i];
        headIndex[slot] = i + 1;

        uint256 dep = b.deposit;
        uint256 tip = b.tip;
        address bidder = b.bidder;
        uint256 px = b.price;
        b.deposit = 0;
        b.tip = 0;

        IERC20 currency = Slot(slot).currency();
        currency.forceApprove(slot, dep);
        Slot(slot).buy(bidder, dep, px);
        currency.forceApprove(slot, 0);

        if (tip > 0) currency.safeTransfer(msg.sender, tip);
        emit Filled(slot, bidder, msg.sender, tip);
    }

    /// @notice True when no live bid remains. The exclusivity policy MUST fall
    ///         through to open access in this case, or the slot freezes forever.
    function isEmpty(address slot) external view returns (bool) {
        Bid[] storage list = bids[slot];
        for (uint256 i = headIndex[slot]; i < list.length; i++) {
            if (!list[i].cancelled && list[i].expiry > block.timestamp) return false;
        }
        return true;
    }

    /// @dev Skips cancelled and expired bids, refunding expired ones as it goes.
    function _advanceHead(address slot) internal returns (uint256) {
        Bid[] storage list = bids[slot];
        uint256 i = headIndex[slot];
        while (i < list.length) {
            Bid storage b = list[i];
            if (b.cancelled) { i++; continue; }
            if (b.expiry <= block.timestamp) {
                uint256 refund = b.deposit + b.tip;
                b.deposit = 0;
                b.tip = 0;
                b.cancelled = true;
                if (refund > 0) Slot(slot).currency().safeTransfer(b.bidder, refund);
                i++;
                continue;
            }
            break;
        }
        headIndex[slot] = i;
        return i;
    }
}
