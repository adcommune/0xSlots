// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";

contract DeployFeedHub is BaseScript {
    address internal constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function deployBaseSepolia() external broadcastOn(DeployementChain.BaseSepolia) {
        address currency = _readDeployment("FeedUSDC");
        _deploy(
            "The Testnet Feed",
            0xFafAd841f9323295AAd9D2dE785bB5AecAEb70D3, // feedRecipients[baseSepolia] (thefeed apps/web/src/lib/feed.ts)
            currency
        );
    }

    function deployBase() external broadcastOn(DeployementChain.Base) {
        _deploy(
            "The Open Feed",
            0x54D023fDe5173BEc84D59AFfb0eEc5A711EC6630, // feedRecipients[base] (thefeed apps/web/src/lib/feed.ts)
            BASE_USDC
        );
    }

    function _deploy(
        string memory feedName,
        address recipient,
        address currency
    ) internal {
        address slotFactory = _readDeployment("SlotFactoryV3");
        address feedModule = _readDeployment("FeedPostModule");
        address owner = vm.addr(deployerPrivateKey);

        // 1) Feed implementation
        Feed feedImpl = new Feed();
        console2.log("Feed impl:", address(feedImpl));

        // 2) FeedHub (constructor deploys the beacon it owns)
        FeedHub hub = new FeedHub(address(feedImpl), slotFactory, feedModule, currency, owner);
        console2.log("FeedHub:", address(hub));
        console2.log("Beacon:", address(hub.beacon()));

        // 3) Feed #0, owned by the deployer, metadataURI empty for now.
        //    The hub mints each tier's slots via the SlotFactory with the
        //    FeedPostModule attached, verifies the module, then registers
        //    the feed. Default tier ladder totals 10 slots.
        (address feed0,) = hub.createFeed(owner, feedName, "", recipient, _defaultTiers());
        console2.log("Feed #0:", feed0);
        console2.log("Feed #0 slotCount:", Feed(feed0).slotCount());

        // 4) Persist deployment records (deployments/<chainid>/*.json) so the
        //    SDK's addresses/_readDeployment can pick them up.
        _saveDeployment(address(hub), "FeedHub");
        _saveDeployment(address(feedImpl), "FeedImplementation");
    }

    /// @dev Default tier ladder: (taxPercentage bps, count), totalling 10 slots.
    function _defaultTiers() internal pure returns (FeedHub.SlotTier[] memory tiers) {
        tiers = new FeedHub.SlotTier[](6);
        tiers[0] = FeedHub.SlotTier({taxPercentage: 100, count: 2});
        tiers[1] = FeedHub.SlotTier({taxPercentage: 300, count: 2});
        tiers[2] = FeedHub.SlotTier({taxPercentage: 500, count: 2});
        tiers[3] = FeedHub.SlotTier({taxPercentage: 1000, count: 2});
        tiers[4] = FeedHub.SlotTier({taxPercentage: 2000, count: 1});
        tiers[5] = FeedHub.SlotTier({taxPercentage: 5000, count: 1});
    }
}
