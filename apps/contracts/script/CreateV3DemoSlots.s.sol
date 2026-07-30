// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";

/**
 * @title CreateV3DemoSlots
 * @notice Creates one slot per v3 occupancy mode so the explorer, the subgraph,
 *         and the SDK's effective-occupancy resolution are exercised against
 *         real chain state rather than only against unit tests.
 *
 *         Every slot that existed before this branch is instant-buy with no
 *         policy, so without these the epoch and policy paths ship completely
 *         unproven end to end.
 *
 * Usage (Base Sepolia):
 *   forge script script/CreateV3DemoSlots.s.sol:CreateV3DemoSlots \
 *     --sig "run(uint8,address,address,address)" \
 *     2 <FACTORY> <CURRENCY> <TENURE_POLICY> --broadcast
 */
contract CreateV3DemoSlots is BaseScript {
    uint64 constant HOUR = 3600;

    function run(
        uint8 chainIdx,
        address factoryProxy,
        address currency,
        address tenurePolicy
    ) external {
        _create(
            DeployementChain(chainIdx),
            factoryProxy,
            currency,
            tenurePolicy
        );
    }

    function _create(
        DeployementChain chain,
        address factoryProxy,
        address currency,
        address tenurePolicy
    ) internal broadcastOn(chain) {
        SlotFactory factory = SlotFactory(factoryProxy);
        address deployer = vm.addr(deployerPrivateKey);

        // 1% / 30 days, 1-day minimum deposit. Same economics as the existing
        // demo slots so the only variable is the occupancy layer.
        SlotInitParams memory init = SlotInitParams({
            taxPercentage: 100,
            module: address(0),
            liquidationBountyBps: 500,
            minDepositSeconds: 86400
        });
        SlotConfig memory cfg = SlotConfig({
            mutableTax: false,
            mutableModule: false,
            manager: address(0)
        });

        // Hourly epochs, no policy. Buys land on the hour rather than on
        // arrival, which is what removes the latency advantage.
        address hourly = factory.createSlotV3(
            deployer,
            IERC20(currency),
            cfg,
            init,
            HOUR,
            address(0)
        );
        console2.log("hourly epoch slot   ", hourly);

        // 7-day minimum tenure, instant buy. The occupant cannot be bought out
        // for a week, must pre-pay that week's tax, and cannot cut their price
        // while protected.
        address tenure = factory.createSlotV3(
            deployer,
            IERC20(currency),
            cfg,
            init,
            0,
            tenurePolicy
        );
        console2.log("7d min-tenure slot  ", tenure);

        // Both dials at once — the combination the explorer most needs to
        // render correctly, since each contributes a separate badge.
        address both = factory.createSlotV3(
            deployer,
            IERC20(currency),
            cfg,
            init,
            HOUR,
            tenurePolicy
        );
        console2.log("hourly + tenure slot", both);
    }
}
