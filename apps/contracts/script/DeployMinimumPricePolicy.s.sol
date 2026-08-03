// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {MinimumPricePolicyFactory} from "../src/policies/MinimumPricePolicyFactory.sol";

/**
 * @title DeployMinimumPricePolicy
 * @notice Deploys the price-floor policy factory, plus a couple of starter
 *         policies so the create form has something to offer immediately.
 *
 * @dev The factory is the only thing that needs a fixed address — individual
 *      policies are CREATE2'd from it on demand and are content-addressed by
 *      their (currency, minPrice) pair, so any combination a user picks is
 *      reachable without another deploy script.
 *
 *      The starter policies below are pure convenience: pre-paying the ~250k
 *      gas so the first person to want those terms gets a one-transaction
 *      create instead of two.
 */
contract DeployMinimumPricePolicy is BaseScript {
    // Feed USDC (USDCf), 6 decimals — the default currency on Base Sepolia.
    address constant USDCF = 0xFA28A416810e39a7142C7557e6e43407d765f627;

    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        MinimumPricePolicyFactory f = new MinimumPricePolicyFactory();
        console2.log("MinimumPricePolicyFactory", address(f));
        _saveDeployment(address(f), "MinimumPricePolicyFactory");

        // 1 USDCf and 10 USDCf floors.
        address p1 = f.getOrDeploy(USDCF, 1e6);
        console2.log("floor 1 USDCf ", p1);

        address p10 = f.getOrDeploy(USDCF, 10e6);
        console2.log("floor 10 USDCf", p10);

        require(f.predict(USDCF, 1e6) == p1, "predict mismatch");
        require(f.isDeployed(USDCF, 10e6), "not deployed");
    }
}
