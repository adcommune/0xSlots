// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";

interface ISlotFactory {
    function setModuleVerified(address module, bool verified) external;
    function isModuleVerified(address module) external view returns (bool);
}

contract VerifyFeedModule is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        // Use Factory2 (latest)
        ISlotFactory factory = ISlotFactory(0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF);
        address feedModule = 0x17b663b7C779B64f339ab916aB734A6a4f0b075E;

        factory.setModuleVerified(feedModule, true);
        console2.log("FeedPostModule verified:", factory.isModuleVerified(feedModule));
    }
}
