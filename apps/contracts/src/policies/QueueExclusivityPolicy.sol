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
///      CRITICAL: exclusivity applies ONLY while the queue is non-empty. A flat
///      "only the queue may buy" would freeze the slot permanently once the
///      queue drained.
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
