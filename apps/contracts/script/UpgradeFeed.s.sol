// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedRouter} from "../src/FeedRouter.sol";
import {FeedPostModule} from "../src/modules/FeedPostModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title UpgradeFeed
 * @notice Upgrade FeedPostModule (UUPS) + redeploy FeedRouter as UUPS + wire them together.
 *
 * Steps:
 *   1. Deploy new FeedPostModule impl → upgrade UUPS proxy
 *   2. Deploy new FeedRouter impl + proxy (old router was not upgradeable)
 *   3. Wire: set FeedRouter as trusted emitter source in module, set module as trusted emitter in router
 *   4. Set new router as trusted router in module (for buyAndPost)
 *
 * Usage:
 *   # Base Sepolia (chainIdx 2) — dry run:
 *   forge script script/UpgradeFeed.s.sol:UpgradeFeed \
 *     --sig "upgradeChain(uint8)" 2
 *
 *   # Base Sepolia (chainIdx 2) — broadcast:
 *   forge script script/UpgradeFeed.s.sol:UpgradeFeed \
 *     --sig "upgradeChain(uint8)" 2 --broadcast --verify
 *
 *   # Base Mainnet (chainIdx 4) — dry run:
 *   forge script script/UpgradeFeed.s.sol:UpgradeFeed \
 *     --sig "upgradeChain(uint8)" 4
 *
 *   # Base Mainnet (chainIdx 4) — broadcast:
 *   forge script script/UpgradeFeed.s.sol:UpgradeFeed \
 *     --sig "upgradeChain(uint8)" 4 --broadcast --verify
 */
contract UpgradeFeed is BaseScript {

    function upgradeChain(uint8 chainIdx) external {
        _upgrade(DeployementChain(chainIdx));
    }

    function _upgrade(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== UpgradeFeed ===");

        address moduleProxy = _readDeployment("FeedPostModule");
        console2.log("FeedPostModule proxy:", moduleProxy);

        FeedPostModule module = FeedPostModule(moduleProxy);

        // ── Step 1: Upgrade FeedPostModule (UUPS) ──
        console2.log("");
        console2.log("--- Step 1: Upgrade FeedPostModule ---");
        FeedPostModule newModuleImpl = new FeedPostModule();
        console2.log("New FeedPostModule impl:", address(newModuleImpl));
        module.upgradeToAndCall(address(newModuleImpl), "");
        console2.log("FeedPostModule upgraded!");

        // Sanity: version should still be 1.0.0
        console2.log("Module version:", module.version());

        // ── Step 2: Deploy new FeedRouter (UUPS proxy) ──
        console2.log("");
        console2.log("--- Step 2: Deploy new FeedRouter ---");
        FeedRouter newRouterImpl = new FeedRouter();
        console2.log("New FeedRouter impl:", address(newRouterImpl));

        ERC1967Proxy routerProxy = new ERC1967Proxy(
            address(newRouterImpl),
            abi.encodeCall(FeedRouter.initialize, (vm.addr(deployerPrivateKey)))
        );
        address routerAddr = address(routerProxy);
        console2.log("New FeedRouter proxy:", routerAddr);

        FeedRouter feedRouter = FeedRouter(routerAddr);

        // ── Step 3: Wire event hub ──
        console2.log("");
        console2.log("--- Step 3: Wire event hub ---");

        // Module tells router it's a trusted emitter
        feedRouter.setTrustedEmitter(moduleProxy, true);
        console2.log("Module set as trusted emitter on router");

        // Module stores router address for emitEvent calls
        module.setRouter(routerAddr);
        console2.log("Router set on module");

        // ── Step 4: Set new router as trusted router for buyAndPost ──
        console2.log("");
        console2.log("--- Step 4: Set trusted router ---");
        module.setTrustedRouter(routerAddr, true);
        console2.log("New router set as trusted router on module");

        // Save deployment
        _saveDeployment(routerAddr, "FeedRouter");

        console2.log("");
        console2.log("=== All done! ===");
    }
}
