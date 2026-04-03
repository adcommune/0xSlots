// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedPostModule} from "../src/modules/FeedPostModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployFeedPostModule is BaseScript {
    function run() external broadcastOn(DeployementChain.Base) {
        // Deploy implementation
        FeedPostModule impl = new FeedPostModule();
        console2.log("FeedPostModule impl:", address(impl));

        // Deploy UUPS proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(impl),
            abi.encodeCall(FeedPostModule.initialize, (vm.addr(deployerPrivateKey)))
        );
        console2.log("FeedPostModule proxy:", address(proxy));
        console2.log("Owner:", vm.addr(deployerPrivateKey));

        _saveDeployment(address(proxy), "FeedPostModule");
    }
}
