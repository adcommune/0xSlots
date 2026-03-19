// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ERC721Slots} from "../src/ERC721Slots.sol";
import {SlotConfig, SlotInitParams} from "../src/ISlot.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployERC721Slots is Script {
    function run() external {
        uint256 deployerPK = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPK);

        // Base Sepolia addresses
        address factory = 0xc44De86e2A5f0C47f1Ba87C36DaBf54275814DEb;
        address usdc = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // Base Sepolia USDC

        SlotConfig memory config = SlotConfig({
            mutableTax: false,
            mutableModule: false,
            manager: address(0)
        });

        SlotInitParams memory initParams = SlotInitParams({
            taxPercentage: 500,           // 5% monthly
            module: address(0),
            liquidationBountyBps: 100,    // 1%
            minDepositSeconds: 86400      // 1 day minimum
        });

        vm.startBroadcast(deployerPK);

        ERC721Slots nft = new ERC721Slots(
            "Harberger NFTs",
            "HNFT",
            factory,
            deployer,
            usdc,
            config,
            initParams
        );

        console2.log("ERC721Slots deployed at:", address(nft));
        console2.log("Creator:", deployer);

        vm.stopBroadcast();
    }
}
