// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedUSDC} from "../src/test/FeedUSDC.sol";

contract DeployFeedUSDC is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        FeedUSDC usdcf = new FeedUSDC();
        console2.log("FeedUSDC (USDCf):", address(usdcf));
        _saveDeployment(address(usdcf), "FeedUSDC");
    }
}
