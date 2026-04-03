// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";

interface ISlotFactory {
    function createSlot(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams
    ) external returns (address slot);
}

contract DeployFeed is BaseScript {
    /// @dev Mirrors the JSON slot entry shape for abi.decode (fields alphabetical)
    struct SlotEntry {
        uint256 liquidationBountyBps;
        uint256 minDepositSeconds;
        uint256 taxBps;
    }

    // ── Per-chain addresses ───────────────────────────────────

    function _getFactory() internal view returns (address) {
        if (block.chainid == 84532) return 0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF;
        if (block.chainid == 8453)  return 0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e;
        revert("Unsupported chain");
    }

    function _getFeedModule() internal view returns (address) {
        if (block.chainid == 84532) return 0x17b663b7C779B64f339ab916aB734A6a4f0b075E;
        if (block.chainid == 8453)  return 0xe92BE44E3D77be84E2aC4D6da9FFDaC0FCa67f72;
        revert("Unsupported chain");
    }

    function _getCurrency() internal view returns (address) {
        if (block.chainid == 84532) return 0xFA28A416810e39a7142C7557e6e43407d765f627; // USDCf
        if (block.chainid == 8453)  return 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // USDC
        revert("Unsupported chain");
    }

    // ── Entry points ──────────────────────────────────────────

    function runBaseSepolia() external broadcastOn(DeployementChain.BaseSepolia) {
        _deploy();
    }

    function runBase() external broadcastOn(DeployementChain.Base) {
        _deploy();
    }

    // ── Core logic ────────────────────────────────────────────

    function _deploy() internal {
        string memory json = vm.readFile("./script/feed/slots.json");

        address factory    = _getFactory();
        address feedModule = _getFeedModule();
        address currency   = _getCurrency();
        address recipient  = vm.parseJsonAddress(json, ".recipient");

        bytes memory slotsRaw = vm.parseJson(json, ".slots");
        SlotEntry[] memory slots = abi.decode(slotsRaw, (SlotEntry[]));

        console2.log("Chain:", block.chainid);
        console2.log("Factory:", factory);
        console2.log("FeedModule:", feedModule);
        console2.log("Currency:", currency);
        console2.log("Recipient:", recipient);
        console2.log("Slot count:", slots.length);

        ISlotFactory f = ISlotFactory(factory);

        for (uint256 i = 0; i < slots.length; i++) {
            SlotConfig memory config = SlotConfig({
                mutableTax: true,
                mutableModule: false,
                manager: vm.addr(deployerPrivateKey)
            });

            SlotInitParams memory initParams = SlotInitParams({
                taxPercentage: slots[i].taxBps,
                module: feedModule,
                liquidationBountyBps: slots[i].liquidationBountyBps,
                minDepositSeconds: slots[i].minDepositSeconds
            });

            address slot = f.createSlot(
                recipient,
                IERC20(currency),
                config,
                initParams
            );

            console2.log("  Slot", i, ":", slot);
        }
    }
}
