// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IOccupancyPolicy, OccupancyContext} from "../interfaces/IOccupancyPolicy.sol";
import {SlotQueue} from "../periphery/SlotQueue.sol";

/// @title QueueExclusivityPolicy
/// @notice While a slot has live queued bids, only the queue may claim it.
/// @dev One rule. Without it the queue is worthless — anyone front-runs the
///      instant the slot frees up and the head bidder loses their position.
///
///      CRITICAL: exclusivity applies ONLY while the queue is non-empty AND the
///      slot is vacant. Either condition alone is a freeze:
///
///        * A flat "only the queue may buy" would lock the slot permanently
///          once the queue drained.
///        * Gating on the queue alone suspended forced sale on an OCCUPIED
///          slot. `SlotQueue.fill()` requires `occupant() == address(0)`, so
///          while the slot was occupied the queue could not take it either —
///          third parties vetoed here, the queue blocked there, nobody able to
///          buy at any price. An occupant only had to place a 1-wei-deposit bid
///          in their own queue to become permanently unbuyable, re-bidding
///          every 30 days for gas. That is exactly the property Harberger
///          exists to prevent.
///
///      Vacancy is also the only moment the queue's priority means anything:
///      the queue exists so the head bidder is not front-run the instant the
///      slot frees up. It has no claim on a slot somebody is currently holding.
///
///      Harberger impact: near-pure. It orders who may exercise forced sale; it
///      does not change who sets the price. Each bidder self-assesses their own.
contract QueueExclusivityPolicy is IOccupancyPolicy {
    SlotQueue public immutable queue;

    error QueueHasPriority();

    constructor(SlotQueue _queue) {
        queue = _queue;
    }

    function checkBuy(OccupancyContext calldata ctx) external view {
        // Occupied: forced sale is always open. See the contract note.
        if (ctx.occupant != address(0)) return;
        if (queue.isEmpty(ctx.slot)) return; // never freeze an empty queue
        if (ctx.caller != address(queue)) revert QueueHasPriority();
    }

    function checkPriceUpdate(OccupancyContext calldata) external pure {}

    function name() external pure returns (string memory) { return "QueueExclusivityPolicy"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}
