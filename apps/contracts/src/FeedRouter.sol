// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISlot {
    function buy(address account, uint256 depositAmount, uint256 selfAssessedPrice) external;
    function currency() external view returns (IERC20);
    function price() external view returns (uint256);
    function occupant() external view returns (address);
    function module() external view returns (address);
}

interface IFeedPostModule {
    function postFor(address account, address slot, string calldata uri) external;
}

/// @title FeedRouter
/// @notice Stateless router: buy a slot + post metadata in one transaction.
/// @dev User approves this router for the slot's currency. The router:
///      1. Pulls tokens from msg.sender
///      2. Approves the slot contract
///      3. Calls slot.buy(msg.sender, ...) — msg.sender becomes occupant
///      4. Calls module.postFor(msg.sender, slot, uri)
///      5. Sweeps leftover tokens + resets approval
contract FeedRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error SlotHasNoModule();

    /// @notice Buy a slot and post metadata in one transaction.
    /// @param slot The slot contract to buy
    /// @param depositAmount Amount to deposit for tax escrow
    /// @param selfAssessedPrice The price you're setting
    /// @param uri The metadata URI to post (e.g. ipfs://...)
    /// @dev Caller must have approved this router for (price + depositAmount) of the slot's currency.
    ///      If the slot is occupied, price = current slot price. If vacant, price = 0.
    function buyAndPost(
        address slot,
        uint256 depositAmount,
        uint256 selfAssessedPrice,
        string calldata uri
    ) external nonReentrant {
        ISlot s = ISlot(slot);
        IERC20 token = s.currency();
        address mod = s.module();
        if (mod == address(0)) revert SlotHasNoModule();

        // Calculate total needed: current price (if occupied) + deposit
        uint256 currentPrice = s.occupant() != address(0) ? s.price() : 0;
        uint256 total = currentPrice + depositAmount;

        // Pull tokens from user → router
        if (total > 0) {
            token.safeTransferFrom(msg.sender, address(this), total);
            token.forceApprove(slot, total);
        }

        // Buy: msg.sender becomes occupant
        s.buy(msg.sender, depositAmount, selfAssessedPrice);

        // Reset approval to 0 (in case slot consumed less than expected)
        token.forceApprove(slot, 0);

        // Sweep any leftover tokens back to caller
        uint256 remaining = token.balanceOf(address(this));
        if (remaining > 0) {
            token.safeTransfer(msg.sender, remaining);
        }

        // Post metadata via module
        IFeedPostModule(mod).postFor(msg.sender, slot, uri);
    }
}
