// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {MinimumPricePolicy} from "./MinimumPricePolicy.sol";

/// @title MinimumPricePolicyFactory
/// @notice Deploys one `MinimumPricePolicy` per (currency, minPrice) pair, at
///         an address determined solely by that pair.
///
/// @dev Same shape as `MinimumTenurePolicyFactory`, and for the same reason:
///      the policy keeps its configuration in immutable constructor args rather
///      than storage, so its terms ARE its address. There is no setter, so
///      nobody — not the slot's manager, not this factory — can raise a floor
///      under an occupant who is already standing on it.
///
///      Keeping the parameters in the address rather than in a shared
///      `mapping(slot => floor)` is deliberate. Changing a slot's floor is
///      already expressible: propose a different policy address through the
///      core's existing `proposePolicyUpdate`, with whatever gating that
///      carries. A storage-backed variant would need a second setter with its
///      own authorization and its own front-running question, duplicating
///      governance that already exists — and it would cost the property that a
///      slot's entire occupancy terms are readable from one address, with no
///      state and no trust in whoever wrote it.
///
///      The cost is one deployment per pair. Paid once, protocol-wide, by
///      whoever first wants those terms; every later slot reuses the address.
///      `predict` resolves it without a transaction, so a client can skip
///      `getOrDeploy` entirely when the address already has code.
contract MinimumPricePolicyFactory {
    event PricePolicyDeployed(
        address indexed policy,
        address indexed currency,
        uint256 indexed minPrice
    );

    error InvalidFloor();
    error InvalidCurrency();

    /// @notice Deploy the policy for `(currency, minPrice)`, or return the
    ///         existing one.
    /// @dev Idempotent and permissionless — calling it for an already-deployed
    ///      pair is a no-op that still returns the right address.
    function getOrDeploy(
        address currency,
        uint256 minPrice
    ) external returns (address policy) {
        if (currency == address(0)) revert InvalidCurrency();
        // A zero floor is the same as having no policy, but installed it would
        // still cost a call on every buy. Reject it as a misconfiguration.
        if (minPrice == 0) revert InvalidFloor();

        policy = predict(currency, minPrice);
        if (policy.code.length != 0) return policy;

        policy = address(
            new MinimumPricePolicy{salt: _salt(currency, minPrice)}(
                IERC20(currency),
                minPrice
            )
        );
        emit PricePolicyDeployed(policy, currency, minPrice);
    }

    /// @notice The address the policy for `(currency, minPrice)` has, or would.
    function predict(
        address currency,
        uint256 minPrice
    ) public view returns (address) {
        return
            Create2.computeAddress(
                _salt(currency, minPrice),
                keccak256(
                    abi.encodePacked(
                        type(MinimumPricePolicy).creationCode,
                        abi.encode(IERC20(currency), minPrice)
                    )
                )
            );
    }

    /// @notice Whether the policy for `(currency, minPrice)` already exists.
    /// @dev Lets a client decide between one transaction and two.
    function isDeployed(
        address currency,
        uint256 minPrice
    ) external view returns (bool) {
        return predict(currency, minPrice).code.length != 0;
    }

    /// @dev Two parameters, one 32-byte salt. Hashed rather than packed so the
    ///      full 256 bits of `minPrice` survive alongside the address.
    function _salt(
        address currency,
        uint256 minPrice
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(currency, minPrice));
    }
}
