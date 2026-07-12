// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";

contract DeployFeedHub is BaseScript {
    function deployBaseSepolia() external broadcastOn(DeployementChain.BaseSepolia) {
        _deploy(
            "The Testnet Feed",
            0xFafAd841f9323295AAd9D2dE785bB5AecAEb70D3, // feedRecipients[baseSepolia] (thefeed apps/web/src/lib/feed.ts)
            _seedBaseSepolia()
        );
    }

    function deployBase() external broadcastOn(DeployementChain.Base) {
        _deploy(
            "The Open Feed",
            0x54D023fDe5173BEc84D59AFfb0eEc5A711EC6630, // feedRecipients[base] (thefeed apps/web/src/lib/feed.ts)
            _seedBase()
        );
    }

    function _deploy(
        string memory feedName,
        address recipient,
        address[] memory seedSlots
    ) internal {
        address slotFactory = _readDeployment("SlotFactoryV3");
        address owner = vm.addr(deployerPrivateKey);

        // 1) Feed implementation
        Feed feedImpl = new Feed();
        console2.log("Feed impl:", address(feedImpl));

        // 2) FeedHub (constructor deploys the beacon it owns)
        FeedHub hub = new FeedHub(address(feedImpl), slotFactory, owner);
        console2.log("FeedHub:", address(hub));
        console2.log("Beacon:", address(hub.beacon()));

        // 3) Feed #0, owned by the deployer, metadataURI empty for now
        (address feed0,) = hub.createFeed(owner, feedName, "", recipient);
        console2.log("Feed #0:", feed0);

        // 4) Seed feed #0 with the current curated slot list (order preserved)
        Feed(feed0).addSlots(seedSlots);
        console2.log("Seeded slots:", seedSlots.length);

        // 5) Persist deployment records (deployments/<chainid>/*.json) so the
        //    SDK's addresses/_readDeployment can pick them up.
        _saveDeployment(address(hub), "FeedHub");
        _saveDeployment(address(feedImpl), "FeedImplementation");
    }

    // --- Seed data: pasted verbatim (checksummed) from thefeed apps/web/src/lib/feed.ts ---

    function _seedBaseSepolia() internal pure returns (address[] memory s) {
        s = new address[](42);
        s[0] = 0x7c924bc4c8f9210a85A77F6B410302b0C854D7bA;
        s[1] = 0x800dF17Eb48D12e4B3e6d1D7E280d370E28b5788;
        s[2] = 0xFafAd841f9323295AAd9D2dE785bB5AecAEb70D3;
        s[3] = 0x6bF0d3C862e32642aE8df11b5Dd365ed1E8278Db;
        s[4] = 0x088feb02c4bFc98BCBCA793F602978fDECC154F5;
        s[5] = 0xa265d11b49e7EDE1AFD6c3ce78470Fd8BE627476;
        s[6] = 0xCd9120D502AdFb905359d47001033d03F5A32d93;
        s[7] = 0xebf0D0D10deF856b2f64037f08AFB6E9C43229A0;
        s[8] = 0x52CA5076840863063c025a20d799ebfc39385579;
        s[9] = 0xEb02D4Ec1Ada3a4d42cF4caD250BCBB7E426b72b;
        s[10] = 0xB7357dcE3E0700ad1A08423d2C6051185dc283d8;
        s[11] = 0x0B79B10b7C672f0Ae5f4B519e816511ABC14ca2C;
        s[12] = 0x69685E0fc244c5293B2Bf4a8052D44A2E7165662;
        s[13] = 0x7e236eF039444ba06De4Da54CD6ffF324eEE9f90;
        s[14] = 0x65D8715d7dE5ff4ad8F92B2505b67Da990b1dc73;
        s[15] = 0x4098129Dd1E5B505A440B7253Cf4EBa8A09a6D9d;
        s[16] = 0xC84DB678B6d4F3177b15Ae80bbBAae6A72D290CB;
        s[17] = 0x186bDEd0f58D69da30602542407df02E1D14aa0d;
        s[18] = 0xF87E2Fb62c2E06a51E1F52FFa638f861192459b8;
        s[19] = 0x61f624C0424F7d49FDA3d733a8Cb89BdAFd1a043;
        s[20] = 0x32C9a97FB13B443b02fa6AaE9e3Ee3A696846F8E;
        s[21] = 0x2a2D289dA5B106339D9DbE96e757c95EAeE5a333;
        s[22] = 0x5B25830cce161bceb1B755939ff102632D340A70;
        s[23] = 0xf64FCc1eb4Befe211D101123841993B94a2feB4c;
        s[24] = 0x8920587B149A6229758378201d89eaAb20fDAD83;
        s[25] = 0xF5fe8ab94732Ea4101734Db4f54a50aB5062f029;
        s[26] = 0xBD2f3e642C05EF00a7313619887BCD16d745B349;
        s[27] = 0xE1c5063AD1cc8aCc66dC0a4B713da817507Fa4d5;
        s[28] = 0x5AC454604758df78E369c2B6095C812B775Bf0a9;
        s[29] = 0x9DF75638aFEBb808829387C3088b3A76A3f768b4;
        s[30] = 0x6FBf4465e9d217490b992c14a7f30F4B114f3471;
        s[31] = 0x33c6549A7DD6E4e120F6A3BD0e3Bb9FAf7018708;
        s[32] = 0xE77Df799595627934EfD26461423Bc01208bD1D3;
        s[33] = 0xBd10E72adc095C726cA92Fa1C8C70218B8400313;
        s[34] = 0xbF9468Ca3d83AC31F28537C5C0E81d30BB740068;
        s[35] = 0x935E917d0153eFdF3C3Cc836554f893b3d3A3882;
        s[36] = 0xdd764BE2a9a43640cE542Bb5652ccF52C46cD580;
        s[37] = 0xE070C92D75867997FA5188C1C5d77FCb5a07389d;
        s[38] = 0x92930397cd9506D8Ea11beab86ab983a01D2B58a;
        s[39] = 0x67Ca92D844D1d0873F9F59F121e8d12715710de3;
        s[40] = 0x736dF032572898EB9cf833832550d2Dcb91A7c64;
        s[41] = 0x2877D3A82Ec054338327d2E9971eb68FCEcfD6CF;
    }

    function _seedBase() internal pure returns (address[] memory s) {
        s = new address[](42);
        s[0] = 0x0802a4d3C35CB32953704FaE790Da01fBCC56dc8;
        s[1] = 0x10f608E8c3eB3bFEDE1fB7F3AE37e2F9aE40B5d1;
        s[2] = 0x1171038bB7e595C850281eD198a00D0840E47993;
        s[3] = 0x11B2d8797337553ec6f0Cf8895E55d7d8Ace40Fb;
        s[4] = 0x17fA9Bb5dfc54CAC4728aCdbfa26284fb58b2592;
        s[5] = 0x1cDec5a5f0D95D18636a2c1ed8362D8A060a773f;
        s[6] = 0x1dBD40c5b47A51960C5437e00CB53c5D7FbD0Fb0;
        s[7] = 0x223a54A243e0D51BB2f1b7a561c9bc9CEA1D6748;
        s[8] = 0x27E7105fE600b8A222E90B9229C9450AaCe805Bf;
        s[9] = 0x292DB4d10D8a247eE5D33BCD55f3498E7ED71BD5;
        s[10] = 0x3cDBCe0402a48E084a28750960702d27FD2AC8B8;
        s[11] = 0x4adB5A43A86EA8C6CB075A2700Ba4F1099FCCA7D;
        s[12] = 0x4DcbaeeF5403CE78985F4983dE7bF7Fbc92532b8;
        s[13] = 0x4eF2C4E6edA8F81e78ac0546A5c3d7021c380F69;
        s[14] = 0x5ba5b06afF94535C808764Fc4566629D64A9B170;
        s[15] = 0x5eE159C05D16C5a18385C4A4E77af0336c5DEAeD;
        s[16] = 0x6cBE1D787a9F95497708f028e035043909aF6a63;
        s[17] = 0x73CF8a65fFBF2df87ae5983Cc7AA1c2ffad5FA81;
        s[18] = 0x73d880eb4441624657CbAB2A1F028135079F8000;
        s[19] = 0x77498c2634C7712C982316812f97C2742c5EF570;
        s[20] = 0x84C693E5af525a77A51939edbcC032BC065F9195;
        s[21] = 0x8679dfC07A4Eb77a6f2dA93B7D4FD0A33253037F;
        s[22] = 0x86C19166Aba8c8712F0E7c20DDAe81424C806c08;
        s[23] = 0x8bd7bF270Bff42DD003d7C8fb0777dC4a95a9F01;
        s[24] = 0x953985131B818e33d62a6451E3d72acefBc38241;
        s[25] = 0x9E8A80366D9fA1962bA64948a71eBFd60F945Ed8;
        s[26] = 0xA5d7cac8725ed1966a96b046B2Ee843D808Cf0c3;
        s[27] = 0xA856c58869A167842Fdec4815E5c7590333e4Cd5;
        s[28] = 0xAA02F26780D2610Bd85030bc528aba14C696A08d;
        s[29] = 0xaC9834a4422b3b74Fae068cb07457319F44375a5;
        s[30] = 0xace792d266ca6b53eF8E0b5FD580793F920cf40a;
        s[31] = 0xaD056cA48e69057c09756c3A9Aa3965e381a26E3;
        s[32] = 0xAfD854B1e8A4Ac5c5Ca775981bfB340bb5ed3668;
        s[33] = 0xC7C27Bf924F8651Fe68D50877D1A896C1c8A6334;
        s[34] = 0xC8C5788d60ec16c1f711AD99c8cac922b187e2fb;
        s[35] = 0xd1E36775269580c21C88201CF394aEeF5C0248c6;
        s[36] = 0xd455a9fDf77d5256E4A7DCbB9f9fB9C94E52A0fA;
        s[37] = 0xE301b2F517e51bc3F0d1A2b02023AdCddD5576c8;
        s[38] = 0xeeD6843132672aEe2DC4599ECAa01f8a2B1C304E;
        s[39] = 0xf1471912181Cf9322540CFAD2F9A8bAb7E839c30;
        s[40] = 0xF41dd533B2ba3B83f883A724aB4ECa016a84Ff69;
        s[41] = 0xFfcb363AEceb80006E6fa543983B4a505B779C39;
    }
}
