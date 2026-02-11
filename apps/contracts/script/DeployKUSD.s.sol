// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {TestERC20} from "../src/test/TestERC20.sol";

interface ISuperTokenFactory {
    function createERC20Wrapper(
        address underlyingToken,
        uint8 underlyingDecimals,
        uint8 upgradability,
        string calldata name,
        string calldata symbol
    ) external returns (address superToken);
}

interface ISuperfluidHost {
    function getSuperTokenFactory() external view returns (address);
}

interface ISlotsHub {
    function allowCurrency(address currency, bool allowed) external;
}

contract DeployKUSD is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address deployer = vm.addr(pk);

        // Base Sepolia
        address sfHost = 0x109412E3C84f0539b43d39dB691B08c90f58dC7c;
        address hub = 0x268cfaB9ddDdF6A326458Ae79d55592516f382eF;

        address factory = ISuperfluidHost(sfHost).getSuperTokenFactory();
        console2.log("SuperTokenFactory:", factory);

        vm.startBroadcast(pk);

        // 1. Deploy kUSD (freely mintable ERC-20)
        TestERC20 kusd = new TestERC20("kUSD", "kUSD");
        console2.log("kUSD:", address(kusd));

        // Mint 1M to deployer
        kusd.mint(deployer, 1_000_000 ether);
        console2.log("Minted 1M kUSD");

        // 2. Create SuperToken wrapper (kUSDx)
        // upgradability: 1 = semi-upgradable (standard)
        address kusdx = ISuperTokenFactory(factory).createERC20Wrapper(
            address(kusd),
            18,
            1, // semi-upgradable
            "Super kUSD",
            "kUSDx"
        );
        console2.log("kUSDx:", kusdx);

        // 3. Allow kUSDx on hub
        ISlotsHub(hub).allowCurrency(kusdx, true);
        console2.log("kUSDx allowed on SlotsHub");

        vm.stopBroadcast();

        console2.log("=== Done ===");
        console2.log("kUSD:", address(kusd));
        console2.log("kUSDx:", kusdx);
    }
}
