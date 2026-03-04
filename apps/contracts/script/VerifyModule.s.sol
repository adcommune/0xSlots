// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";

interface ISlotFactory {
    function setModuleVerified(address module, bool verified, string calldata _name, string calldata _version) external;
    function admin() external view returns (address);
}

contract VerifyModule is BaseScript {
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        address factory = 0x57759A2094cbE24313B826b453d4e7760279f79D;
        ISlotFactory f = ISlotFactory(factory);
        console2.log("Admin:", f.admin());
        f.setModuleVerified(
            0x6c5A8A7f061bEd94b1b88CFAd4e1a1a8C5c4e527,
            true,
            "MetadataModule",
            "1.0.0"
        );
        console2.log("MetadataModule verified!");
    }
}
