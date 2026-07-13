// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
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

        // 1) Feed implementation (beacon-proxy logic, injected into every Feed).
        Feed feedImpl = new Feed();
        console2.log("Feed impl:", address(feedImpl));

        // 2) FeedHub implementation + UUPS proxy. Prices start at 0 so Feed #0
        //    (created below) is free; the admin raises feedCreationPrice /
        //    slotPrice afterward via separate txs. feeRecipient = deployer for now.
        FeedHub feedHubImpl = new FeedHub();
        console2.log("FeedHub impl:", address(feedHubImpl));

        ERC1967Proxy hubProxy = new ERC1967Proxy(
            address(feedHubImpl),
            abi.encodeCall(
                FeedHub.initialize,
                (
                    owner,
                    address(feedImpl),
                    slotFactory,
                    feedModule,
                    currency,
                    /* feeRecipient */ owner,
                    /* feedCreationPrice */ 0,
                    /* slotPrice */ 0
                )
            )
        );
        FeedHub hub = FeedHub(address(hubProxy));
        console2.log("FeedHub (proxy):", address(hub));
        console2.log("Beacon:", address(hub.beacon()));

        // 3) Feed #0, owned by the deployer, metadataURI empty for now. The
        //    hub deploys + initializes the Feed with its first tiers (<=10
        //    INCLUDED_SLOTS, so feedCreationPrice covers it), then further
        //    tiers are minted via separate, gas-bounded hub.addSlots(...)
        //    calls so each tier is its own broadcast tx. Prices are 0 at
        //    deploy time, so every call is {value: 0}. Tier ladder totals 41
        //    slots: 7 (initial, <=10) + 12 + 10 + 8 + 4 = 41.
        Feed.SlotTier[] memory firstTiers = new Feed.SlotTier[](2);
        firstTiers[0] = _tierStruct(100, 100, 86400, 2);
        firstTiers[1] = _tierStruct(300, 200, 43200, 5);

        (address feed0, ) = hub.createFeed{value: 0}(owner, feedName, "", recipient, firstTiers);
        console2.log("Feed #0:", feed0);

        hub.addSlots{value: 0}(feed0, _tier(500, 500, 21600, 12));
        hub.addSlots{value: 0}(feed0, _tier(1000, 500, 10800, 10));
        hub.addSlots{value: 0}(feed0, _tier(2000, 1000, 3600, 8));
        hub.addSlots{value: 0}(feed0, _tier(5000, 1000, 1800, 4));

        console2.log("Feed #0 slotCount:", Feed(feed0).slotCount());

        // 4) Persist deployment records (deployments/<chainid>/*.json) so the
        //    SDK's addresses/_readDeployment can pick them up. FeedHub record
        //    points at the PROXY (the address callers should use).
        _saveDeployment(address(hub), "FeedHub");
        _saveDeployment(address(feedImpl), "FeedImplementation");
        _saveDeployment(address(feedHubImpl), "FeedHubImplementation");
    }

    /// @dev One-tier helper: mints `count` slots at (taxBps, bountyBps,
    ///      minDepositSeconds). Each call to hub.addSlots/createFeed is its
    ///      own gas-bounded batch, so callers issue one per tier.
    function _tier(
        uint256 taxPercentage,
        uint256 liquidationBountyBps,
        uint256 minDepositSeconds,
        uint256 count
    ) internal pure returns (Feed.SlotTier[] memory tiers) {
        tiers = new Feed.SlotTier[](1);
        tiers[0] = _tierStruct(taxPercentage, liquidationBountyBps, minDepositSeconds, count);
    }

    function _tierStruct(
        uint256 taxPercentage,
        uint256 liquidationBountyBps,
        uint256 minDepositSeconds,
        uint256 count
    ) internal pure returns (Feed.SlotTier memory) {
        return Feed.SlotTier({
            taxPercentage: taxPercentage,
            liquidationBountyBps: liquidationBountyBps,
            minDepositSeconds: minDepositSeconds,
            count: count
        });
    }
}
