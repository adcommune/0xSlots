// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC721Slots} from "../src/ERC721Slots.sol";
import {ERC721SlotsFactory} from "../src/ERC721SlotsFactory.sol";

/**
 * @title DeployERC721Slots
 * @notice Deploys ERC721SlotsFactory: impl + UUPS proxy + beacon
 *
 * Usage (Base Sepolia):
 *   forge script script/DeployERC721Slots.s.sol:DeployERC721Slots \
 *     --sig "deployChain(uint8)" 2 --broadcast --verify
 */
contract DeployERC721Slots is BaseScript {

    function deployChain(uint8 chainIdx) external {
        _deploy(DeployementChain(chainIdx));
    }

    function _deploy(DeployementChain chain) internal broadcastOn(chain) {
        address slotFactory = _readDeployment("SlotFactoryV3");
        console2.log("=== Deploying ERC721SlotsFactory ===");
        console2.log("Using SlotFactory:", slotFactory);

        // 1. Deploy ERC721Slots implementation
        ERC721Slots erc721Impl = new ERC721Slots();
        console2.log("ERC721Slots implementation:", address(erc721Impl));

        // 2. Deploy ERC721SlotsFactory implementation
        ERC721SlotsFactory factoryImpl = new ERC721SlotsFactory();
        console2.log("Factory implementation:", address(factoryImpl));

        // 3. Deploy UUPS proxy
        address deployer = vm.addr(deployerPrivateKey);
        bytes memory initData = abi.encodeCall(
            ERC721SlotsFactory.initialize,
            (deployer, address(erc721Impl), slotFactory)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        console2.log("ERC721SlotsFactory proxy:", address(proxy));

        ERC721SlotsFactory factory = ERC721SlotsFactory(address(proxy));
        console2.log("Beacon:", address(factory.beacon()));
        console2.log("Admin:", factory.admin());

        _saveDeployment(address(proxy), "ERC721SlotsFactory");

        console2.log("=== Done ===");
    }
}
