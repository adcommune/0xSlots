// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedSocialGroup} from "../src/FeedSocialGroup.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployFeedSocialGroup is BaseScript {
    address constant POSTING_MANAGER_ADDR = 0xe7e37649f37Ed6665260316413fdfe89f8edadb6;

    function deployBaseSepolia() external broadcastOn(DeployementChain.BaseSepolia) {
        _deploy();
    }

    function deployBase() external broadcastOn(DeployementChain.Base) {
        _deploy();
    }

    function _deploy() internal {
        address feedModule = _readDeployment("FeedPostModule");
        address admin = vm.addr(deployerPrivateKey);

        // Deploy implementation
        FeedSocialGroup impl = new FeedSocialGroup();
        console2.log("FeedSocialGroup impl:", address(impl));

        // Deploy UUPS proxy (initialize grants DEFAULT_ADMIN_ROLE to admin)
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(impl),
            abi.encodeCall(FeedSocialGroup.initialize, (admin, feedModule))
        );
        console2.log("FeedSocialGroup proxy:", address(proxy));
        console2.log("Admin:", admin);
        console2.log("FeedModule:", feedModule);

        // Grant POSTING_MANAGER role
        FeedSocialGroup(address(proxy)).grantRole(
            keccak256("POSTING_MANAGER"),
            POSTING_MANAGER_ADDR
        );
        console2.log("POSTING_MANAGER granted to:", POSTING_MANAGER_ADDR);

        _saveDeployment(address(proxy), "FeedSocialGroup");
    }
}
