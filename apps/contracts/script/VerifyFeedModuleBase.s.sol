// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";

interface ISlotFactory {
    function setModuleVerified(address module, bool verified) external;
    function isModuleVerified(address module) external view returns (bool);
}

contract VerifyFeedModuleBase is BaseScript {
    function run() external broadcastOn(DeployementChain.Base) {
        ISlotFactory factory = ISlotFactory(0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e);
        address feedModule = 0xe92BE44E3D77be84E2aC4D6da9FFDaC0FCa67f72;

        factory.setModuleVerified(feedModule, true);
        console2.log("FeedPostModule verified:", factory.isModuleVerified(feedModule));
    }
}
