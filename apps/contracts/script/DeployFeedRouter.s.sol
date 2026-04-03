// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedRouter} from "../src/FeedRouter.sol";

contract DeployFeedRouter is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        FeedRouter router = new FeedRouter();
        console2.log("FeedRouter:", address(router));

        _saveDeployment(address(router), "FeedRouter");
    }
}
