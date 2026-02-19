// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {Slots} from "../src/v2/Slots.sol";
import {SlotsHub} from "../src/v2/SlotsHub.sol";
import {HubSettings} from "../src/v2/ISlots.sol";
import {UUPSProxy} from "../src/lib/UUPSProxy.sol";

/**
 * @title DeployV2
 * @notice Deploys 0xSlots v2 (escrow-based, no Superfluid)
 *
 * Usage:
 *   forge script script/DeployV2.s.sol:DeployV2 \
 *     --sig "deployChain(uint8)" 2 --broadcast --verify
 *
 *   Chain index 2 = BaseSepolia
 */
contract DeployV2 is BaseScript {

    function deployChain(uint8 chainIdx) external {
        _deploy(DeployementChain(chainIdx));
    }

    function _deploy(DeployementChain chain) internal broadcastOn(chain) {
        console2.log("=== Deploying 0xSlots v2 ===");

        // 1. Deploy Slots implementation (clone template)
        Slots slotsImpl = new Slots();
        console2.log("Slots impl:", address(slotsImpl));
        _saveDeployment(address(slotsImpl), "SlotsV2Impl");

        // 2. Hub settings — escrow-based, no Superfluid
        HubSettings memory hubSettings = HubSettings({
            protocolFeeBps: 200,                    // 2%
            protocolFeeRecipient: msg.sender,
            landCreationFee: 0,                     // free for testnet
            slotExpansionFee: 0,                    // free for testnet
            newLandInitialCurrency: address(0),     // set after allowCurrency
            newLandInitialAmount: 6,
            newLandInitialPrice: 1e6,              // 1 USDC (6 decimals)
            newLandInitialTaxPercentage: 100,       // 1%
            newLandInitialMaxTaxPercentage: 1000,   // 10%
            newLandInitialMinTaxUpdatePeriod: 7 days,
            newLandInitialModule: address(0),
            moduleCallGasLimit: 500_000,
            liquidationBountyBps: 500,              // 5%
            minDepositSeconds: 86400                // 1 day minimum deposit
        });

        // 3. Deploy SlotsHub behind UUPS proxy
        SlotsHub hubImpl = new SlotsHub();
        SlotsHub hub = SlotsHub(payable(
            address(
                new UUPSProxy(
                    address(hubImpl),
                    abi.encodeWithSelector(
                        SlotsHub.initialize.selector,
                        address(slotsImpl),
                        hubSettings
                    )
                )
            )
        ));

        console2.log("SlotsHub proxy:", address(hub));
        _saveDeployment(address(hub), "SlotsHubV2");

        console2.log("=== Done ===");
    }
}
