// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {TestPureSuperToken} from "../src/lib/TestPureSuperToken.sol";

interface ISlotsHub {
    function allowCurrency(address currency, bool allowed) external;
}

interface ISuperfluidHost {
    function getSuperTokenFactory() external view returns (address);
}

contract DeployKToken is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address deployer = vm.addr(pk);

        // Base Sepolia
        address sfHost = 0x109412E3C84f0539b43d39dB691B08c90f58dC7c;
        address hub = 0x268cfaB9ddDdF6A326458Ae79d55592516f382eF;

        console2.log("=== Deploying KToken (KT) on Base Sepolia ===");
        console2.log("Deployer:", deployer);

        // Get SuperTokenFactory from host
        address factory = ISuperfluidHost(sfHost).getSuperTokenFactory();
        console2.log("SuperTokenFactory:", factory);

        vm.startBroadcast(pk);

        // Deploy TestPureSuperToken (freely mintable)
        TestPureSuperToken kt = new TestPureSuperToken();
        console2.log("TestPureSuperToken deployed:", address(kt));

        // Initialize via factory
        kt.initialize(factory, "KToken", "KT", deployer, 1_000_000 ether);
        console2.log("Initialized: KToken (KT), 1M minted to deployer");

        // Allow on SlotsHub
        ISlotsHub(hub).allowCurrency(address(kt), true);
        console2.log("KToken allowed on SlotsHub");

        vm.stopBroadcast();

        console2.log("=== Done ===");
        console2.log("KToken:", address(kt));
    }
}
