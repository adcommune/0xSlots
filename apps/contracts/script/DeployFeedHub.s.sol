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

        // 3) Feed #0, owned by the deployer, metadataURI empty for now. The hub
        //    only deploys + initializes the (empty) feed; slots are minted
        //    afterward via separate, gas-bounded Feed.createSlots(...) calls so
        //    each tier is its own broadcast tx. Tier ladder totals 41 slots.
        (address feed0,) = hub.createFeed(owner, feedName, "", recipient);
        console2.log("Feed #0:", feed0);

        Feed(feed0).createSlots(_tier(100, 100, 86400, 2));
        Feed(feed0).createSlots(_tier(300, 200, 43200, 5));
        Feed(feed0).createSlots(_tier(500, 500, 21600, 12));
        Feed(feed0).createSlots(_tier(1000, 500, 10800, 10));
        Feed(feed0).createSlots(_tier(2000, 1000, 3600, 8));
        Feed(feed0).createSlots(_tier(5000, 1000, 1800, 4));

        console2.log("Feed #0 slotCount:", Feed(feed0).slotCount());

        // 4) Persist deployment records (deployments/<chainid>/*.json) so the
        //    SDK's addresses/_readDeployment can pick them up.
        _saveDeployment(address(hub), "FeedHub");
        _saveDeployment(address(feedImpl), "FeedImplementation");
    }

    /// @dev One-tier helper: mints `count` slots at (taxBps, bountyBps,
    ///      minDepositSeconds). Each call to Feed.createSlots is its own
    ///      gas-bounded batch, so callers issue one per tier.
    function _tier(
        uint256 taxPercentage,
        uint256 liquidationBountyBps,
        uint256 minDepositSeconds,
        uint256 count
    ) internal pure returns (Feed.SlotTier[] memory tiers) {
        tiers = new Feed.SlotTier[](1);
        tiers[0] = Feed.SlotTier({
            taxPercentage: taxPercentage,
            liquidationBountyBps: liquidationBountyBps,
            minDepositSeconds: minDepositSeconds,
            count: count
        });
    }
}
