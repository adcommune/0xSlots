# FeedHub / Feed Contracts Implementation Plan (Phase 1a — contracts)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an on-chain, owner-curated feed primitive to 0xSlots: a `FeedHub` factory that mints beacon-upgradeable `Feed` contracts holding a name, an updateable metadata URI, a declared (non-custodial) recipient, and an ordered list of slot addresses.

**Architecture:** `Feed` is an `Initializable`/`OwnableUpgradeable` implementation deployed behind `BeaconProxy` instances. `FeedHub` (plain `Ownable`) owns a single `UpgradeableBeacon`, deploys `Feed` proxies via `createFeed`, and enumerates them (`feeds(i)`, `feedCount()`). Strictly additive — no existing contract is modified.

**Tech Stack:** Solidity ^0.8.20, Foundry (forge-std), OpenZeppelin v5 (`@openzeppelin/contracts`, `@openzeppelin-upgradeable/contracts`), OZ beacon proxies.

## Global Constraints

- Solidity pragma: `^0.8.20` (match repo).
- Import remappings: `@openzeppelin/contracts/…`, `@openzeppelin-upgradeable/contracts/…`, `forge-std/…`.
- Working dir for all contract/test/script paths: `apps/contracts/`.
- License identifier: `// SPDX-License-Identifier: MIT` on contracts/tests (deploy scripts use `UNLICENSED`, matching repo).
- `Feed` MUST NOT hold or move funds. `feedRecipient()` only *declares* an address.
- Two authorities: FeedHub owner (beacon upgrades + `createFeed`); Feed owner (curates its own feed only).
- `addSlot` validates membership via `SlotFactory.isSlot(slot)` when a factory is configured.
- Run tests from `apps/contracts/`: `forge test`.
- Commit after each task with the repo's conventional-commit style.

---

## File Structure

- Create `apps/contracts/src/interfaces/IFeed.sol` — the enforced read interface.
- Create `apps/contracts/src/feed/Feed.sol` — the beacon implementation.
- Create `apps/contracts/src/feed/FeedHub.sol` — the factory/registry.
- Create `apps/contracts/test/Feed.t.sol` — Feed unit tests.
- Create `apps/contracts/test/FeedHub.t.sol` — FeedHub unit tests.
- Create `apps/contracts/script/DeployFeedHub.s.sol` — deploy + seed feed #0.

(Note: `src/feed/` already exists in the repo — place new feed contracts there.)

---

## Task 1: `IFeed` interface + `Feed` implementation

**Files:**
- Create: `apps/contracts/src/interfaces/IFeed.sol`
- Create: `apps/contracts/src/feed/Feed.sol`
- Test: `apps/contracts/test/Feed.t.sol`

**Interfaces:**
- Produces:
  - `interface IFeed { function name() external view returns (string memory); function metadataURI() external view returns (string memory); function feedRecipient() external view returns (address); function getSlots() external view returns (address[] memory); function slotCount() external view returns (uint256); function containsSlot(address slot) external view returns (bool); }`
  - `Feed.initialize(address owner_, string calldata name_, string calldata metadataURI_, address recipient_, address slotFactory_)`
  - Feed owner mutators: `setName(string)`, `setMetadataURI(string)`, `setFeedRecipient(address)`, `addSlot(address)`, `addSlots(address[])`, `removeSlot(address)`.

- [ ] **Step 1: Write the failing test file**

Create `apps/contracts/test/Feed.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Feed} from "../src/feed/Feed.sol";
import {IFeed} from "../src/interfaces/IFeed.sol";

// Minimal stand-in for SlotFactory's `isSlot` membership check.
contract MockSlotFactory {
    mapping(address => bool) public isSlot;
    function setSlot(address a, bool v) external { isSlot[a] = v; }
}

contract FeedTest is Test {
    UpgradeableBeacon beacon;
    Feed feed;
    MockSlotFactory factory;

    address owner = makeAddr("owner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");
    address slotA = makeAddr("slotA");
    address slotB = makeAddr("slotB");
    address slotC = makeAddr("slotC");

    function setUp() public {
        factory = new MockSlotFactory();
        factory.setSlot(slotA, true);
        factory.setSlot(slotB, true);
        factory.setSlot(slotC, true);

        Feed impl = new Feed();
        beacon = new UpgradeableBeacon(address(impl), address(this));

        bytes memory init = abi.encodeCall(
            Feed.initialize,
            (owner, "The Testnet Feed", "", recipient, address(factory))
        );
        feed = Feed(address(new BeaconProxy(address(beacon), init)));
    }

    function test_initialState() public view {
        assertEq(feed.owner(), owner);
        assertEq(feed.name(), "The Testnet Feed");
        assertEq(feed.metadataURI(), "");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotCount(), 0);
    }

    function test_cannotInitializeTwice() public {
        vm.expectRevert();
        feed.initialize(owner, "x", "", recipient, address(factory));
    }

    function test_ownerCanSetNameAndUri() public {
        vm.startPrank(owner);
        feed.setName("Renamed");
        feed.setMetadataURI("ipfs://abc");
        vm.stopPrank();
        assertEq(feed.name(), "Renamed");
        assertEq(feed.metadataURI(), "ipfs://abc");
    }

    function test_strangerCannotSetName() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.setName("nope");
    }

    function test_setRecipient_rejectsZero() public {
        vm.prank(owner);
        vm.expectRevert(Feed.ZeroRecipient.selector);
        feed.setFeedRecipient(address(0));
    }

    function test_addSlot_appendsInOrder() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        feed.addSlot(slotB);
        vm.stopPrank();

        address[] memory s = feed.getSlots();
        assertEq(s.length, 2);
        assertEq(s[0], slotA);
        assertEq(s[1], slotB);
        assertTrue(feed.containsSlot(slotA));
        assertTrue(feed.containsSlot(slotB));
        assertFalse(feed.containsSlot(slotC));
    }

    function test_addSlots_batch() public {
        address[] memory batch = new address[](3);
        batch[0] = slotA;
        batch[1] = slotB;
        batch[2] = slotC;
        vm.prank(owner);
        feed.addSlots(batch);
        assertEq(feed.slotCount(), 3);
        assertEq(feed.getSlots()[2], slotC);
    }

    function test_addSlot_rejectsNonSlot() public {
        address notASlot = makeAddr("notASlot"); // factory.isSlot == false
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Feed.NotASlot.selector, notASlot));
        feed.addSlot(notASlot);
    }

    function test_addSlot_rejectsDuplicate() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        vm.expectRevert(abi.encodeWithSelector(Feed.SlotAlreadyAdded.selector, slotA));
        feed.addSlot(slotA);
        vm.stopPrank();
    }

    function test_addSlot_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        feed.addSlot(slotA);
    }

    function test_removeSlot_swapPop() public {
        vm.startPrank(owner);
        feed.addSlot(slotA);
        feed.addSlot(slotB);
        feed.addSlot(slotC);
        feed.removeSlot(slotB); // middle: last (slotC) swaps into its place
        vm.stopPrank();

        address[] memory s = feed.getSlots();
        assertEq(s.length, 2);
        assertEq(s[0], slotA);
        assertEq(s[1], slotC);
        assertFalse(feed.containsSlot(slotB));
        assertTrue(feed.containsSlot(slotC));
    }

    function test_removeSlot_revertsIfAbsent() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Feed.SlotNotInFeed.selector, slotA));
        feed.removeSlot(slotA);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail (contracts do not exist yet)**

Run: `cd apps/contracts && forge test --match-contract FeedTest -vv`
Expected: FAIL — compilation error, `Feed`/`IFeed` not found.

- [ ] **Step 3: Create the `IFeed` interface**

Create `apps/contracts/src/interfaces/IFeed.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Read interface every Feed contract must implement.
interface IFeed {
    function name() external view returns (string memory);
    function metadataURI() external view returns (string memory);
    /// @notice The declared tax/treasury recipient for this feed's slots.
    ///         Feed never custodies funds; this only *declares* an address.
    function feedRecipient() external view returns (address);
    function getSlots() external view returns (address[] memory);
    function slotCount() external view returns (uint256);
    function containsSlot(address slot) external view returns (bool);
}
```

- [ ] **Step 4: Create the `Feed` implementation**

Create `apps/contracts/src/feed/Feed.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IFeed} from "../interfaces/IFeed.sol";

interface ISlotFactoryLike {
    function isSlot(address) external view returns (bool);
}

/// @title Feed
/// @notice Owner-curated, beacon-upgradeable feed: name, updateable metadata
///         URI, a declared (non-custodial) recipient, and an ordered slot list.
contract Feed is Initializable, OwnableUpgradeable, IFeed {
    string private _name;
    string private _metadataURI;
    address private _feedRecipient;

    /// @notice SlotFactory used to validate `addSlot` membership (0 disables).
    address public slotFactory;

    address[] private _slots;
    mapping(address => uint256) private _slotIndex1; // 1-based; 0 == absent

    event NameUpdated(string name);
    event MetadataURIUpdated(string uri);
    event RecipientUpdated(address indexed recipient);
    event SlotAdded(address indexed slot);
    event SlotRemoved(address indexed slot);

    error NotASlot(address slot);
    error SlotAlreadyAdded(address slot);
    error SlotNotInFeed(address slot);
    error ZeroRecipient();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_,
        address slotFactory_
    ) external initializer {
        __Ownable_init(owner_);
        if (recipient_ == address(0)) revert ZeroRecipient();
        _name = name_;
        _metadataURI = metadataURI_;
        _feedRecipient = recipient_;
        slotFactory = slotFactory_;
    }

    // ---- IFeed views ----
    function name() external view returns (string memory) {
        return _name;
    }

    function metadataURI() external view returns (string memory) {
        return _metadataURI;
    }

    function feedRecipient() external view returns (address) {
        return _feedRecipient;
    }

    function getSlots() external view returns (address[] memory) {
        return _slots;
    }

    function slotCount() external view returns (uint256) {
        return _slots.length;
    }

    function containsSlot(address slot) external view returns (bool) {
        return _slotIndex1[slot] != 0;
    }

    // ---- owner mutators ----
    function setName(string calldata name_) external onlyOwner {
        _name = name_;
        emit NameUpdated(name_);
    }

    function setMetadataURI(string calldata uri_) external onlyOwner {
        _metadataURI = uri_;
        emit MetadataURIUpdated(uri_);
    }

    function setFeedRecipient(address recipient_) external onlyOwner {
        if (recipient_ == address(0)) revert ZeroRecipient();
        _feedRecipient = recipient_;
        emit RecipientUpdated(recipient_);
    }

    function addSlot(address slot) public onlyOwner {
        _addSlot(slot);
    }

    function addSlots(address[] calldata slots_) external onlyOwner {
        for (uint256 i = 0; i < slots_.length; i++) {
            _addSlot(slots_[i]);
        }
    }

    /// @dev Swap-and-pop: O(1) but does not preserve order of remaining slots.
    function removeSlot(address slot) external onlyOwner {
        uint256 idx1 = _slotIndex1[slot];
        if (idx1 == 0) revert SlotNotInFeed(slot);
        uint256 i = idx1 - 1;
        uint256 lastIdx = _slots.length - 1;
        if (i != lastIdx) {
            address last = _slots[lastIdx];
            _slots[i] = last;
            _slotIndex1[last] = i + 1;
        }
        _slots.pop();
        delete _slotIndex1[slot];
        emit SlotRemoved(slot);
    }

    function _addSlot(address slot) internal {
        if (slotFactory != address(0) && !ISlotFactoryLike(slotFactory).isSlot(slot)) {
            revert NotASlot(slot);
        }
        if (_slotIndex1[slot] != 0) revert SlotAlreadyAdded(slot);
        _slots.push(slot);
        _slotIndex1[slot] = _slots.length; // 1-based
        emit SlotAdded(slot);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/contracts && forge test --match-contract FeedTest -vv`
Expected: PASS — all `FeedTest` tests green.

- [ ] **Step 6: Commit**

```bash
cd apps/contracts
git add src/interfaces/IFeed.sol src/feed/Feed.sol test/Feed.t.sol
git commit -m "feat(contracts): Feed — owner-curated beacon-upgradeable feed"
```

---

## Task 2: `FeedHub` factory + registry

**Files:**
- Create: `apps/contracts/src/feed/FeedHub.sol`
- Test: `apps/contracts/test/FeedHub.t.sol`

**Interfaces:**
- Consumes: `Feed` (Task 1), `Feed.initialize(address,string,string,address,address)`.
- Produces:
  - `FeedHub(address feedImplementation, address slotFactory_, address owner_)`
  - `createFeed(address owner_, string name_, string metadataURI_, address recipient_) returns (address feed, uint256 index)` — `onlyOwner`
  - `feeds(uint256) view returns (address)`, `feedCount() view returns (uint256)`, `beacon() view returns (UpgradeableBeacon)`, `implementation() view returns (address)`, `slotFactory() view returns (address)`
  - `upgradeFeedImplementation(address newImplementation)` — `onlyOwner`

- [ ] **Step 1: Write the failing test file**

Create `apps/contracts/test/FeedHub.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";

contract MockSlotFactory2 {
    mapping(address => bool) public isSlot;
    function setSlot(address a, bool v) external { isSlot[a] = v; }
}

// Alternate implementation to prove beacon upgrades propagate to all proxies.
contract FeedV2 is Feed {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract FeedHubTest is Test {
    FeedHub hub;
    MockSlotFactory2 factory;
    Feed feedImpl;

    address hubOwner = makeAddr("hubOwner");
    address feedOwner = makeAddr("feedOwner");
    address stranger = makeAddr("stranger");
    address recipient = makeAddr("recipient");

    function setUp() public {
        factory = new MockSlotFactory2();
        feedImpl = new Feed();
        hub = new FeedHub(address(feedImpl), address(factory), hubOwner);
    }

    function test_initialState() public view {
        assertEq(hub.owner(), hubOwner);
        assertEq(hub.slotFactory(), address(factory));
        assertEq(hub.feedCount(), 0);
        assertEq(hub.implementation(), address(feedImpl));
    }

    function test_createFeed_ownerOnly() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.createFeed(feedOwner, "F0", "", recipient);
    }

    function test_createFeed_registersAndInitializes() public {
        vm.prank(hubOwner);
        (address feedAddr, uint256 index) = hub.createFeed(feedOwner, "F0", "ipfs://x", recipient);

        assertEq(index, 0);
        assertEq(hub.feedCount(), 1);
        assertEq(hub.feeds(0), feedAddr);

        Feed feed = Feed(feedAddr);
        assertEq(feed.owner(), feedOwner);
        assertEq(feed.name(), "F0");
        assertEq(feed.metadataURI(), "ipfs://x");
        assertEq(feed.feedRecipient(), recipient);
        assertEq(feed.slotFactory(), address(factory)); // injected by the hub
    }

    function test_createFeed_multipleEnumerated() public {
        vm.startPrank(hubOwner);
        (, uint256 i0) = hub.createFeed(feedOwner, "F0", "", recipient);
        (, uint256 i1) = hub.createFeed(feedOwner, "F1", "", recipient);
        vm.stopPrank();
        assertEq(i0, 0);
        assertEq(i1, 1);
        assertEq(hub.feedCount(), 2);
        assertTrue(hub.feeds(0) != hub.feeds(1));
    }

    function test_upgrade_ownerOnly() public {
        FeedV2 v2 = new FeedV2();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        hub.upgradeFeedImplementation(address(v2));
    }

    function test_upgrade_propagatesToAllProxies() public {
        vm.prank(hubOwner);
        (address feedAddr,) = hub.createFeed(feedOwner, "F0", "", recipient);

        FeedV2 v2 = new FeedV2();
        vm.prank(hubOwner);
        hub.upgradeFeedImplementation(address(v2));

        assertEq(hub.implementation(), address(v2));
        // existing proxy now runs V2 logic while preserving state
        assertEq(FeedV2(feedAddr).version(), 2);
        assertEq(FeedV2(feedAddr).name(), "F0");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/contracts && forge test --match-contract FeedHubTest -vv`
Expected: FAIL — `FeedHub` not found.

- [ ] **Step 3: Create the `FeedHub` contract**

Create `apps/contracts/src/feed/FeedHub.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Feed} from "./Feed.sol";

/// @title FeedHub
/// @notice Factory + registry for beacon-upgradeable Feed contracts. Owns the
///         beacon (one upgrade updates every feed) and enumerates deployed feeds.
contract FeedHub is Ownable {
    UpgradeableBeacon public immutable beacon;
    /// @notice SlotFactory injected into every Feed for `addSlot` validation.
    address public immutable slotFactory;

    address[] public feeds;

    event FeedCreated(uint256 indexed index, address indexed feed, address indexed owner);

    constructor(address feedImplementation, address slotFactory_, address owner_) Ownable(owner_) {
        beacon = new UpgradeableBeacon(feedImplementation, address(this));
        slotFactory = slotFactory_;
    }

    /// @notice Deploy a new Feed (beacon proxy) and register it. Phase 1: owner-only.
    function createFeed(
        address owner_,
        string calldata name_,
        string calldata metadataURI_,
        address recipient_
    ) external onlyOwner returns (address feed, uint256 index) {
        bytes memory initData = abi.encodeCall(
            Feed.initialize,
            (owner_, name_, metadataURI_, recipient_, slotFactory)
        );
        feed = address(new BeaconProxy(address(beacon), initData));
        index = feeds.length;
        feeds.push(feed);
        emit FeedCreated(index, feed, owner_);
    }

    function feedCount() external view returns (uint256) {
        return feeds.length;
    }

    function implementation() external view returns (address) {
        return beacon.implementation();
    }

    /// @notice Upgrade the shared Feed implementation for ALL feeds at once.
    function upgradeFeedImplementation(address newImplementation) external onlyOwner {
        beacon.upgradeTo(newImplementation);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/contracts && forge test --match-contract FeedHubTest -vv`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `cd apps/contracts && forge test`
Expected: PASS — new `FeedTest` + `FeedHubTest` green, all pre-existing tests still green.

- [ ] **Step 6: Commit**

```bash
cd apps/contracts
git add src/feed/FeedHub.sol test/FeedHub.t.sol
git commit -m "feat(contracts): FeedHub — beacon factory + registry for feeds"
```

---

## Task 3: Deploy script — deploy hub + beacon + seed feed #0

**Files:**
- Create: `apps/contracts/script/DeployFeedHub.s.sol`

**Interfaces:**
- Consumes: `FeedHub` (Task 2), `Feed` (Task 1), the repo's `BaseScript` (`./Base.s.sol`) helpers used by existing scripts: `broadcastOn(DeployementChain.X)`, `deployerPrivateKey`, `_readDeployment(name)`, `_writeDeployment(name, addr)`, `vm.addr(...)`.

**Pre-req note:** This script depends on the chain's `SlotFactory` deployment. Confirm the exact deployment key by reading an existing script that references it (e.g. `grep -rn "_readDeployment" apps/contracts/script`), and match the name (likely `"SlotFactory"`). If `BaseScript` lacks `_writeDeployment`, log addresses with `console2.log` and record them manually — do not invent a helper.

- [ ] **Step 1: Confirm BaseScript helpers and SlotFactory deployment key**

Run: `cd apps/contracts && sed -n '1,120p' script/Base.s.sol && grep -rn "_readDeployment\|SlotFactory" script | head`
Expected: You can see the `DeployementChain` enum, `broadcastOn`, `deployerPrivateKey`, `_readDeployment`, and whether `_writeDeployment` exists, plus the exact deployment name used for the SlotFactory. Use those exact names in Step 2.

- [ ] **Step 2: Write the deploy script**

Create `apps/contracts/script/DeployFeedHub.s.sol`. Replace `SLOT_FACTORY_KEY` with the exact `_readDeployment` name confirmed in Step 1, and paste the seed slot arrays verbatim from thefeed `apps/web/src/lib/feed.ts` (`feedSlots[base.id]` → `_seedBase()`, `feedSlots[baseSepolia.id]` → `_seedBaseSepolia()`), and the recipients from `feedRecipients` there.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {FeedHub} from "../src/feed/FeedHub.sol";
import {Feed} from "../src/feed/Feed.sol";

contract DeployFeedHub is BaseScript {
    function deployBaseSepolia() external broadcastOn(DeployementChain.BaseSepolia) {
        _deploy(
            "The Testnet Feed",
            0xfafad841f9323295aad9d2De785bb5aEcAeb70D3, // feedRecipients[baseSepolia]
            _seedBaseSepolia()
        );
    }

    function deployBase() external broadcastOn(DeployementChain.Base) {
        _deploy(
            "The Open Feed",
            0x54D023fDe5173BEc84D59AFfb0eEc5A711eC6630, // feedRecipients[base]
            _seedBase()
        );
    }

    function _deploy(
        string memory feedName,
        address recipient,
        address[] memory seedSlots
    ) internal {
        address slotFactory = _readDeployment("SlotFactory"); // SLOT_FACTORY_KEY (confirm in Step 1)
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

        // Record for later stages (SDK addresses.ts). If BaseScript lacks
        // _writeDeployment, copy these from the logs manually.
        // _writeDeployment("FeedHub", address(hub));
    }

    // --- Seed data: paste verbatim from thefeed apps/web/src/lib/feed.ts ---

    function _seedBaseSepolia() internal pure returns (address[] memory s) {
        s = new address[](42);
        // s[0] = 0x...; ... s[41] = 0x...;  (copy feedSlots[baseSepolia.id])
    }

    function _seedBase() internal pure returns (address[] memory s) {
        s = new address[](42);
        // s[0] = 0x...; ... s[41] = 0x...;  (copy feedSlots[base.id])
    }
}
```

- [ ] **Step 3: Fill the seed arrays**

Open `thefeed/apps/web/src/lib/feed.ts`. Copy the 42 addresses from `feedSlots[baseSepolia.id]` into `_seedBaseSepolia()` (as `s[0] = 0x...;` … `s[41] = 0x...;`) and the 42 from `feedSlots[base.id]` into `_seedBase()`, in the same order. Verify the recipient literals in `deployBaseSepolia`/`deployBase` match `feedRecipients` for each chain (checksummed).

- [ ] **Step 4: Build to verify the script compiles**

Run: `cd apps/contracts && forge build`
Expected: PASS — no compile errors (all 42 assignments present, no dangling comments-only bodies).

- [ ] **Step 5: Simulate the testnet deploy (no broadcast)**

Run: `cd apps/contracts && forge script script/DeployFeedHub.s.sol:DeployFeedHub --sig "deployBaseSepolia()" --rpc-url basesepolia`
Expected: Simulation succeeds; logs print `FeedHub`, `Beacon`, `Feed #0`, and `Seeded slots: 42`. (No `--broadcast` yet — actual deploy happens in the next plan after review.)

- [ ] **Step 6: Commit**

```bash
cd apps/contracts
git add script/DeployFeedHub.s.sol
git commit -m "feat(contracts): DeployFeedHub script — deploy hub + seed feed #0"
```

---

## Self-Review

**Spec coverage:**
- IFeed / Feed (name, metadataURI, feedRecipient, slot list, addSlot isSlot-validation) → Task 1. ✓
- FeedHub factory/registry + beacon + enumeration + upgrade + createFeed owner-only + SlotFactory injection → Task 2. ✓
- Deploy + seed feed #0 (empty metadataURI, current recipient, 42 slots ordered) → Task 3. ✓
- "Feed never custodies funds" → `feedRecipient()` is a declared address only; no token logic in Feed. ✓
- Two authorities → hub `Ownable` vs feed `OwnableUpgradeable`, tested. ✓
- Additive only → no existing file modified; new files under `src/feed/`, `src/interfaces/`, `test/`, `script/`. ✓
- Deferred (permissionless createFeed, per-feed slot management, SDK, app codegen) → NOT in this plan; SDK + app are Plans 1b and 1c. ✓ (intentional scope boundary)

**Placeholder scan:** The only intentionally-deferred content is the seed address arrays in Task 3, which Step 3 fills verbatim from a named source file (`feed.ts`) — an explicit copy instruction, not a vague TODO. No other placeholders.

**Type consistency:** `Feed.initialize(address,string,string,address,address)` is used identically in Feed tests, FeedHub `createFeed`, and the deploy script. `feeds(uint256)`, `feedCount()`, `implementation()`, `slotFactory()`, `beacon()` names match across FeedHub source, tests, and script. Custom errors (`NotASlot`, `SlotAlreadyAdded`, `SlotNotInFeed`, `ZeroRecipient`) match between `Feed.sol` and `Feed.t.sol`.

## Follow-on plans (not in this document)
- **Plan 1b — Deploy + SDK:** broadcast the testnet deploy, record `feedHubAddress` in `packages/contracts/addresses.ts`, add `feedHubAbi`/`feedAbi`, and SDK read methods (`getFeedHub`, `listFeeds`, `getFeed`, `getDefaultFeed`).
- **Plan 1c — App migration:** `scripts/gen-feed.ts` build-time codegen → `feed.generated.ts`; re-point `lib/feed.ts` exports; verify the 13 consumers.
