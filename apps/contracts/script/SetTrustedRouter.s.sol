// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";

interface IFeedPostModule {
    function setTrustedRouter(address router, bool trusted) external;
    function trustedRouters(address) external view returns (bool);
}

contract SetTrustedRouter is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        IFeedPostModule module = IFeedPostModule(0x17b663b7C779B64f339ab916aB734A6a4f0b075E);
        module.setTrustedRouter(0x31D6eE9028f5C102c2116e9552Fc20f3aA468194, true);
        console2.log("Router trusted:", module.trustedRouters(0x31D6eE9028f5C102c2116e9552Fc20f3aA468194));
    }
}
