// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPermit2} from "./IPermit2.sol";
import {Slot} from "./Slot.sol";

/// @title SlotsRouter — Permit2-powered entry point for 0xSlots
/// @notice Enables gasless token approvals for buy/topUp via Permit2 signatures.
///         Users approve Permit2 once, then sign off-chain permits per action.
/// @dev Stateless, no ownership, no upgrades. Deploy and forget.
contract SlotsRouter {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Canonical Permit2 deployment (same on all EVM chains)
    IPermit2 public constant PERMIT2 = IPermit2(0x000000000022D473030F116dDEE9F6B43aC78BA3);

    // ═══════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════

    error InvalidSlot();
    error InsufficientPermit();

    // ═══════════════════════════════════════════════════════════
    // BUY
    // ═══════════════════════════════════════════════════════════

    /// @notice Buy a slot using a Permit2 signature for token transfer
    /// @param slot The slot contract to buy
    /// @param depositAmount Deposit for tax escrow
    /// @param selfAssessedPrice New self-assessed price
    /// @param permit The Permit2 permit data (token, amount, nonce, deadline)
    /// @param signature The user's EIP-712 signature over the permit
    function buy(
        Slot slot,
        uint256 depositAmount,
        uint256 selfAssessedPrice,
        IPermit2.PermitTransferFrom calldata permit,
        bytes calldata signature
    ) external {
        address token = address(slot.currency());
        if (token == address(0)) revert InvalidSlot();

        // Total tokens needed: current price (if occupied) + deposit
        uint256 currentPrice = slot.price();
        uint256 totalNeeded = currentPrice + depositAmount;
        if (permit.permitted.amount < totalNeeded) revert InsufficientPermit();

        // Pull tokens from user via Permit2
        PERMIT2.permitTransferFrom(
            permit,
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: totalNeeded
            }),
            msg.sender,
            signature
        );

        // Approve slot to spend tokens and buy
        IERC20(token).forceApprove(address(slot), totalNeeded);
        slot.buy(msg.sender, depositAmount, selfAssessedPrice);
    }

    // ═══════════════════════════════════════════════════════════
    // TOP UP
    // ═══════════════════════════════════════════════════════════

    /// @notice Top up a slot's deposit using a Permit2 signature
    /// @param slot The slot contract to top up
    /// @param amount Amount to add to the deposit
    /// @param permit The Permit2 permit data
    /// @param signature The user's EIP-712 signature over the permit
    function topUp(
        Slot slot,
        uint256 amount,
        IPermit2.PermitTransferFrom calldata permit,
        bytes calldata signature
    ) external {
        address token = address(slot.currency());
        if (token == address(0)) revert InvalidSlot();
        if (permit.permitted.amount < amount) revert InsufficientPermit();

        // Pull tokens from user via Permit2
        PERMIT2.permitTransferFrom(
            permit,
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender,
            signature
        );

        // Approve slot and top up
        IERC20(token).forceApprove(address(slot), amount);
        slot.topUp(amount);
    }
}
