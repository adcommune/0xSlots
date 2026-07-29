# Composable Occupancy Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple occupancy rules from the Harberger core so slot behaviour becomes composable — epoch-scheduled transfers in core, a fail-closed `IOccupancyPolicy` veto layer, operator delegation, and two reference policies.

**Architecture:** Three additive stages on the existing beacon. Stage 1 adds a two-hook veto interface called from `buy()` and `selfAssess()`. Stage 2 adds `epochSeconds`, a pending-transfer record, and a two-legged `_settle()` that splits tax accrual across an epoch boundary — plus the getter encapsulation that keeps `occupant()` honest once transfers mature lazily. Stage 3 adds operator approval and a queue built as a peripheral escrow contract plus a one-rule exclusivity policy.

**Tech Stack:** Solidity ^0.8.20, Foundry (forge), OpenZeppelin v5 (`Initializable`, `ReentrancyGuard`, `SafeERC20`), OpenZeppelin Upgradeable for modules, Vocs for docs.

**Spec:** [2026-07-29-occupancy-policies-design.md](../specs/2026-07-29-occupancy-policies-design.md)

## Global Constraints

- **Solidity `^0.8.20`.** Match the pragma of every file you touch.
- **`via_ir = true`** is set in `foundry.toml`. Builds are slow; expect ~60–90s.
- **Storage is strictly append-only.** Slots are `BeaconProxy` instances sharing one implementation. Never reorder, resize, or remove an existing variable. **First free slot is 15.** Verify after every storage change with `forge inspect Slot storageLayout`.
- **`PendingUpdate` (slots 12–13) must not be extended** — an added field collides with slot 14 (`_legacyInitialized` + `factory`, packed).
- **Slot-number comments in `Slot.sol` are wrong from `factory` onward** (source says slot 15; it is actually slot 14 offset 1). Fix them as you touch the block.
- **All existing tests must pass unmodified** with `occupancyPolicy == address(0)` and `epochSeconds == 0`. That is the definition of "works as it does now." Never edit an existing test to make a change pass — if an existing test fails, the change is wrong.
- **Policies are fail-closed.** Call them directly and let reverts bubble. Never wrap a policy call in `try/catch` or a gas-capped `.call` — that is `_notifyModule`'s pattern for advisory utility modules and is wrong here.
- **Policies never touch slot funds.** No policy may move `deposit`, change `price`, or redirect a buyer.
- **`liquidate()` and `release()` are never vetoable.** Do not add policy hooks to them.
- Run all tests from `apps/contracts/`: `forge test`.

---

## File Structure

**Created:**
- `apps/contracts/src/interfaces/IOccupancyPolicy.sol` — interface + `OccupancyContext` struct
- `apps/contracts/src/policies/MinimumTenurePolicy.sol` — stateless tenure policy
- `apps/contracts/src/policies/QueueExclusivityPolicy.sol` — one-rule queue priority veto
- `apps/contracts/src/periphery/SlotQueue.sol` — FIFO bid escrow, permissionless fill
- `apps/contracts/test/OccupancyPolicy.t.sol` — stage 1 coverage
- `apps/contracts/test/Epochs.t.sol` — stage 2 coverage
- `apps/contracts/test/SlotQueue.t.sol` — stage 3 coverage

**Modified:**
- `apps/contracts/src/Slot.sol` — storage, hooks, epochs, settlement, getters, operator
- `apps/contracts/src/SlotFactory.sol` — `createSlotV3`
- `apps/contracts/src/interfaces/ISlot.sol` — `SlotInfo` fields, new events
- `apps/docs/docs/pages/protocol.mdx` — reference docs
- `packages/contracts/src/abis/slot.ts`, `slotFactory.ts` — regenerated ABIs

---

# STAGE 1 — Veto layer

### Task 1: `IOccupancyPolicy` interface + pre-existing docs fixes

**Files:**
- Create: `apps/contracts/src/interfaces/IOccupancyPolicy.sol`
- Modify: `apps/docs/docs/pages/protocol.mdx:5` and `:41`

**Interfaces:**
- Consumes: nothing
- Produces: `struct OccupancyContext`, `interface IOccupancyPolicy` with `checkBuy(OccupancyContext calldata)`, `checkPriceUpdate(OccupancyContext calldata)`, `name()`, `version()`, `policyURI()`. All used by Tasks 2, 4, 13.

- [ ] **Step 1: Create the interface file**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @notice Everything a policy needs to decide, passed by value so policies
///         never have to call back into the slot.
struct OccupancyContext {
    address slot;           // the calling slot
    address caller;         // msg.sender on the slot
    address account;        // incoming occupant (buy) / current occupant (price update)
    address occupant;       // current occupant, address(0) if vacant
    uint256 occupiedSince;  // when current occupancy began; 0 = unknown (legacy slot)
    uint256 taxPercentage;  // bps per 30 days
    uint256 currentPrice;
    uint256 newPrice;
    uint256 depositAmount;
}

/// @title IOccupancyPolicy
/// @notice Authoritative, fail-closed veto over slot occupancy transitions.
/// @dev Contrast with ISlotsModule, which is advisory and fail-open. A policy
///      that reverts BLOCKS the action. A policy may never move funds, change
///      the price, or redirect the buyer — it answers yes/no and nothing else.
///      `liquidate()` and `release()` are never routed through a policy.
interface IOccupancyPolicy is IERC165 {
    /// @notice Revert to block an occupancy transfer.
    function checkBuy(OccupancyContext calldata ctx) external view;

    /// @notice Revert to block a self-assessment.
    function checkPriceUpdate(OccupancyContext calldata ctx) external view;

    function name() external view returns (string memory);
    function version() external view returns (string memory);

    /// @notice Metadata URI (e.g. ipfs://Qm...). May be empty.
    function policyURI() external view returns (string memory);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/contracts && forge build`
Expected: compiles clean.

- [ ] **Step 3: Fix the CREATE2 claim in the docs**

In `apps/docs/docs/pages/protocol.mdx`, replace line 5:

```
The factory deploys slots via BeaconProxy (UUPS-upgradeable). Each slot gets a deterministic address based on `keccak256(recipient, currency, config)`.
```

with:

```
The factory deploys slots via BeaconProxy (UUPS-upgradeable). Addresses are assigned at deploy time — `createSlots` can deploy many slots that share identical parameters, so a slot is identified by its address, not derived from its config.
```

- [ ] **Step 4: Fix the `minDepositSeconds` claim**

In the same file, in the `SlotInitParams` code block, replace:

```solidity
    uint256 minDepositSeconds;     // Minimum deposit to cover (protocol min: 1 day)
```

with:

```solidity
    uint256 minDepositSeconds;     // Deposit must cover this many seconds of tax (0 = no minimum)
```

- [ ] **Step 5: Commit**

```bash
git add apps/contracts/src/interfaces/IOccupancyPolicy.sol apps/docs/docs/pages/protocol.mdx
git commit -m "feat(contracts): add IOccupancyPolicy interface; fix protocol doc inaccuracies"
```

---

### Task 2: Wire the veto into `Slot.sol`

**Files:**
- Modify: `apps/contracts/src/Slot.sol`
- Test: `apps/contracts/test/OccupancyPolicy.t.sol` (create)

**Interfaces:**
- Consumes: `IOccupancyPolicy`, `OccupancyContext` (Task 1)
- Produces: `Slot.occupancyPolicy()` → `address`, `Slot.occupiedSince()` → `uint256`, `Slot.initializeV3(uint64,address)`, internal `_occupancyCtx(address account, uint256 newPrice, uint256 depositAmount)`. Used by Tasks 3, 6, 11, 13.

- [ ] **Step 1: Write the failing test**

Create `apps/contracts/test/OccupancyPolicy.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {IOccupancyPolicy, OccupancyContext} from "../src/interfaces/IOccupancyPolicy.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Policy that blocks everything. Proves the veto is wired and fail-closed.
contract DenyAllPolicy is IOccupancyPolicy {
    error Denied();
    function checkBuy(OccupancyContext calldata) external pure { revert Denied(); }
    function checkPriceUpdate(OccupancyContext calldata) external pure { revert Denied(); }
    function name() external pure returns (string memory) { return "DenyAll"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}

/// @dev Permits buying, denies repricing. Lets a test reach checkPriceUpdate.
contract DenyPriceUpdatePolicy is IOccupancyPolicy {
    error NoReprice();
    function checkBuy(OccupancyContext calldata) external pure {}
    function checkPriceUpdate(OccupancyContext calldata) external pure { revert NoReprice(); }
    function name() external pure returns (string memory) { return "DenyReprice"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}

/// @dev Allows everything, but asserts the slot populated the context.
contract AllowAllPolicy is IOccupancyPolicy {
    function checkBuy(OccupancyContext calldata ctx) external view {
        require(ctx.slot == msg.sender, "ctx.slot must be the caller");
    }
    function checkPriceUpdate(OccupancyContext calldata) external pure {}
    function name() external pure returns (string memory) { return "AllowAll"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}

contract OccupancyPolicyTest is Test {
    SlotFactory factory;
    MockERC20 token;
    Slot slotImplRef;

    address recipient = makeAddr("recipient");
    address manager = makeAddr("manager");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new MockERC20();
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);
    }

    function _init() internal pure returns (SlotInitParams memory) {
        return SlotInitParams({
            taxPercentage: 100,
            module: address(0),
            liquidationBountyBps: 500,
            minDepositSeconds: 86400
        });
    }

    function _immutableConfig() internal pure returns (SlotConfig memory) {
        return SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)});
    }

    /// No policy attached — behaviour must be byte-for-byte as today.
    function test_NoPolicy_BuyWorks() public {
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(Slot(s).occupant(), alice);
    }

    function test_Policy_BlocksBuy() public {
        DenyAllPolicy policy = new DenyAllPolicy();
        address s = factory.createSlotV3(
            recipient, IERC20(address(token)), _immutableConfig(), _init(), 0, address(policy)
        );
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        vm.expectRevert(DenyAllPolicy.Denied.selector);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
    }

    function test_AllowAllPolicy_ReceivesPopulatedContext() public {
        AllowAllPolicy allow = new AllowAllPolicy();
        address s = factory.createSlotV3(
            recipient, IERC20(address(token)), _immutableConfig(), _init(), 0, address(allow)
        );
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(Slot(s).occupant(), alice);
    }

    /// @dev `selfAssess` is `onlyOccupant`, and modifiers run before the body,
    ///      so the caller must genuinely occupy the slot for the policy to be
    ///      reached. Hence a policy that permits buying but denies repricing.
    function test_Policy_BlocksSelfAssess() public {
        DenyPriceUpdatePolicy p = new DenyPriceUpdatePolicy();
        address s = factory.createSlotV3(
            recipient, IERC20(address(token)), _immutableConfig(), _init(), 0, address(p)
        );
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.expectRevert(DenyPriceUpdatePolicy.NoReprice.selector);
        Slot(s).selfAssess(50 ether);
        vm.stopPrank();
    }

    function test_Factory_VerifiesPolicy() public {
        DenyAllPolicy p = new DenyAllPolicy();
        factory.setPolicyVerified(address(p), true);
        assertTrue(factory.verifiedPolicies(address(p)));
    }

    function test_OccupiedSince_SetOnBuy() public {
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());
        vm.warp(1_000_000);
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(Slot(s).occupiedSince(), 1_000_000);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/contracts && forge test --match-path test/OccupancyPolicy.t.sol`
Expected: compile error — `createSlotV3` and `occupiedSince` do not exist yet. That is the correct failure.

- [ ] **Step 3: Add storage, errors, and the import to `Slot.sol`**

Add the import next to the existing `ISlotsModule` import:

```solidity
import {IOccupancyPolicy, OccupancyContext} from "./interfaces/IOccupancyPolicy.sol";
```

At the end of the storage block (after `address public factory;`), append — and fix the wrong comments while you are here:

```solidity
    /// @dev NOTE: `_legacyInitialized` (slot 14 offset 0) and `factory`
    ///      (slot 14 offset 1) are PACKED into one slot. First free slot is 15.

    // --- v3 storage (appended after beacon upgrade) ---
    address public occupancyPolicy; // slot 15, offset 0
    uint64 public epochSeconds;     // slot 15, offset 20 — reserved, used in Stage 2
    uint256 public occupiedSince;   // slot 16
```

Add to the errors block:

```solidity
    error PolicyNotMutable();
```

- [ ] **Step 4: Add `initializeV3`**

Directly after `initializeV2`:

```solidity
    /// @notice v3 upgrade — sets epoch length and occupancy policy.
    /// @dev Both default to zero, which is exactly pre-v3 behaviour.
    function initializeV3(
        uint64 _epochSeconds,
        address _occupancyPolicy
    ) external reinitializer(3) {
        if (_occupancyPolicy != address(0) && _occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        epochSeconds = _epochSeconds;
        occupancyPolicy = _occupancyPolicy;
    }
```

- [ ] **Step 5: Add the context builder and the two hook call sites**

Add to the INTERNAL section:

```solidity
    function _occupancyCtx(
        address account,
        uint256 newPrice,
        uint256 depositAmount
    ) internal view returns (OccupancyContext memory) {
        return OccupancyContext({
            slot: address(this),
            caller: msg.sender,
            account: account,
            occupant: occupant,
            occupiedSince: occupiedSince,
            taxPercentage: taxPercentage,
            currentPrice: price,
            newPrice: newPrice,
            depositAmount: depositAmount
        });
    }
```

In `buy()`, the policy must see **settled** state, so it goes *after* the settle
block, not before. Restructure the head of `buy()` to:

```solidity
        if (selfAssessedPrice == 0) revert InvalidPrice();
        if (account == address(0)) revert InvalidRecipient();

        // Settle first so the policy is asked about current, not stale, state.
        // Stage 2 relies on this ordering too — see Task 6.
        _settle();

        if (account == occupant) revert CannotBuyFromYourself();

        if (occupancyPolicy != address(0)) {
            IOccupancyPolicy(occupancyPolicy).checkBuy(
                _occupancyCtx(account, selfAssessedPrice, depositAmount)
            );
        }

        uint256 currentPrice = price;
        address prev = occupant;
```

Then delete the now-redundant conditional settle further down:

```solidity
        // DELETE these three lines — _settle() already ran above
        if (prev != address(0)) {
            _settle();
        }
```

`_settle()` on a vacant slot only advances `lastSettled`, which is harmless — the
existing suite is the proof.

In `selfAssess()`, immediately after `if (newPrice == 0) revert InvalidPrice();`:

```solidity
        if (occupancyPolicy != address(0)) {
            IOccupancyPolicy(occupancyPolicy).checkPriceUpdate(
                _occupancyCtx(occupant, newPrice, deposit)
            );
        }
```

- [ ] **Step 6: Set `occupiedSince` in `buy()`**

In `buy()`, in the state-update block, alongside `lastSettled = block.timestamp;`:

```solidity
        occupiedSince = block.timestamp;
```

And in `release()` and `liquidate()`, alongside each `price = 0;`:

```solidity
        occupiedSince = 0;
```

- [ ] **Step 7: Add `createSlotV3` to the factory**

In `apps/contracts/src/SlotFactory.sol`, add after `createSlots`:

```solidity
    /// @notice Deploy a Slot with v3 params (epoch length + occupancy policy).
    /// @dev `createSlot` is retained unchanged — extending SlotInitParams would
    ///      change the tuple signature and therefore the selector, breaking
    ///      every published ABI.
    function createSlotV3(
        address recipient,
        IERC20 currency,
        SlotConfig memory config,
        SlotInitParams memory initParams,
        uint64 epochSeconds,
        address occupancyPolicy
    ) external returns (address slot) {
        _validateConfig(config, initParams);
        if (occupancyPolicy != address(0) && occupancyPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        slot = _deploySlot(recipient, currency, config, initParams);
        Slot(slot).initializeV3(epochSeconds, occupancyPolicy);
    }
```

Also add a policy registry beside the existing module one. `setModuleVerified`
gates on `ISlotsModule.interfaceId`, which a policy will never satisfy, so
policies need their own entry. This is where purity labelling lives — safety is
enforced in `Slot.sol`, purity is labelled here.

```solidity
    /// @notice Verified occupancy policies (informational, non-blocking)
    mapping(address => bool) public verifiedPolicies;

    event PolicyVerified(
        address indexed policy,
        bool verified,
        string name,
        string version,
        string policyURI
    );

    /// @notice Mark an occupancy policy verified/unverified (admin only)
    function setPolicyVerified(address _policy, bool verified) external onlyAdmin {
        IOccupancyPolicy p = IOccupancyPolicy(_policy);
        require(
            p.supportsInterface(type(IOccupancyPolicy).interfaceId),
            "not IOccupancyPolicy"
        );
        verifiedPolicies[_policy] = verified;
        emit PolicyVerified(_policy, verified, p.name(), p.version(), p.policyURI());
    }
```

Add the import at the top of `SlotFactory.sol`:

```solidity
import {IOccupancyPolicy} from "./interfaces/IOccupancyPolicy.sol";
```

> `verifiedPolicies` is appended after `isSlot` in the factory's storage.
> `SlotFactory` is UUPS, so its layout is append-only too — declare the mapping
> and the event **after** every existing state variable.

- [ ] **Step 8: Run the new tests**

Run: `cd apps/contracts && forge test --match-path test/OccupancyPolicy.t.sol -vv`
Expected: all 4 PASS.

- [ ] **Step 9: Run the full suite — the regression gate**

Run: `cd apps/contracts && forge test`
Expected: every pre-existing test PASSES **unmodified**. If any fails, the change is wrong — fix the change, not the test.

- [ ] **Step 10: Verify storage layout**

Run: `cd apps/contracts && forge inspect Slot storageLayout`
Expected: slots 0–14 identical to before; `occupancyPolicy` at slot 15 offset 0; `epochSeconds` at slot 15 offset 20; `occupiedSince` at slot 16.

- [ ] **Step 11: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/src/SlotFactory.sol apps/contracts/test/OccupancyPolicy.t.sol
git commit -m "feat(contracts): wire fail-closed occupancy policy veto into buy and selfAssess"
```

---

### Task 3: Manager-proposed policy updates + `SlotInfo` fields

**Files:**
- Modify: `apps/contracts/src/Slot.sol`, `apps/contracts/src/interfaces/ISlot.sol`
- Test: `apps/contracts/test/OccupancyPolicy.t.sol`

**Interfaces:**
- Consumes: `occupancyPolicy` storage (Task 2)
- Produces: `Slot.proposePolicyUpdate(address)`, `SlotInfo.occupancyPolicy`, `SlotInfo.epochSeconds`, `SlotInfo.occupiedSince`, `SlotInfo.hasPendingPolicy`, `SlotInfo.pendingPolicy`. Used by Task 14.

- [ ] **Step 1: Write the failing test**

Append to `OccupancyPolicyTest`:

```solidity
    function test_ProposePolicyUpdate_AppliesOnTransition() public {
        SlotConfig memory cfg = SlotConfig({mutableTax: false, mutableModule: true, manager: manager});
        address s = factory.createSlot(recipient, IERC20(address(token)), cfg, _init());

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        DenyAllPolicy policy = new DenyAllPolicy();
        vm.prank(manager);
        Slot(s).proposePolicyUpdate(address(policy));

        // Not applied yet — still no policy
        assertEq(Slot(s).occupancyPolicy(), address(0));

        // Transition applies it
        vm.startPrank(bob);
        token.approve(s, type(uint256).max);
        Slot(s).buy(bob, 10 ether, 100 ether);
        vm.stopPrank();

        assertEq(Slot(s).occupancyPolicy(), address(policy));
    }

    function test_ProposePolicyUpdate_RevertsWhenNotMutable() public {
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());
        DenyAllPolicy policy = new DenyAllPolicy();
        vm.expectRevert(Slot.NotManager.selector);
        Slot(s).proposePolicyUpdate(address(policy));
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_ProposePolicyUpdate`
Expected: compile error — `proposePolicyUpdate` undefined.

- [ ] **Step 3: Add the pending-policy storage**

`PendingUpdate` (slots 12–13) **cannot** be extended. Append a separate struct instead. In `Slot.sol` after `occupiedSince`:

```solidity
    struct PendingPolicyUpdate {
        address newPolicy;
        bool hasPolicyUpdate;
    }
    PendingPolicyUpdate public pendingPolicyUpdate; // slot 17
```

> Stage 2 inserts `PendingTransfer` **after** this. Do not renumber later; just append.

- [ ] **Step 4: Add the manager method**

```solidity
    /// @notice Propose a new occupancy policy (applied on next ownership transition)
    function proposePolicyUpdate(address newPolicy) external onlyManager {
        if (!mutableModule) revert ModuleNotMutable();
        if (newPolicy != address(0) && newPolicy.code.length == 0)
            revert InvalidModule_NoCode();
        pendingPolicyUpdate.newPolicy = newPolicy;
        pendingPolicyUpdate.hasPolicyUpdate = true;
        emit PolicyUpdateProposed(newPolicy);
    }
```

- [ ] **Step 5: Apply it in `_applyPendingUpdates`**

At the **top** of `_applyPendingUpdates()`, before the existing early-return:

```solidity
        if (pendingPolicyUpdate.hasPolicyUpdate) {
            occupancyPolicy = pendingPolicyUpdate.newPolicy;
            emit PolicyUpdateApplied(pendingPolicyUpdate.newPolicy);
            delete pendingPolicyUpdate;
        }
```

Also extend `cancelPendingUpdates()` to clear it — replace its body with:

```solidity
        if (
            !pendingUpdate.hasTaxUpdate &&
            !pendingUpdate.hasModuleUpdate &&
            !pendingPolicyUpdate.hasPolicyUpdate
        ) revert NoPendingUpdate();
        delete pendingUpdate;
        delete pendingPolicyUpdate;
        emit PendingUpdateCancelled();
```

- [ ] **Step 6: Add the events**

In `apps/contracts/src/interfaces/ISlot.sol`, inside `interface ISlotEvents`:

```solidity
    event PolicyUpdateProposed(address newPolicy);
    event PolicyUpdateApplied(address newPolicy);
```

- [ ] **Step 7: Extend `SlotInfo`**

Append to the `SlotInfo` struct (append-only — never insert):

```solidity
    // v3
    address occupancyPolicy;
    uint256 epochSeconds;
    uint256 occupiedSince;
    bool hasPendingPolicy;
    address pendingPolicy;
```

And in `Slot.getSlotInfo()`, before the closing brace:

```solidity
        info.occupancyPolicy = occupancyPolicy;
        info.epochSeconds = epochSeconds;
        info.occupiedSince = occupiedSince;
        info.hasPendingPolicy = pendingPolicyUpdate.hasPolicyUpdate;
        info.pendingPolicy = pendingPolicyUpdate.newPolicy;
```

- [ ] **Step 8: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/OccupancyPolicy.t.sol -vv`
Expected: all PASS.

- [ ] **Step 9: Full regression + layout check**

Run: `cd apps/contracts && forge test && forge inspect Slot storageLayout`
Expected: all pass; `pendingPolicyUpdate` at slot 17; slots 0–16 unchanged.

- [ ] **Step 10: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/src/interfaces/ISlot.sol apps/contracts/test/OccupancyPolicy.t.sol
git commit -m "feat(contracts): manager-proposed occupancy policy updates + SlotInfo v3 fields"
```

---

### Task 4: `MinimumTenurePolicy`

**Files:**
- Create: `apps/contracts/src/policies/MinimumTenurePolicy.sol`
- Test: `apps/contracts/test/OccupancyPolicy.t.sol`

**Interfaces:**
- Consumes: `IOccupancyPolicy`, `OccupancyContext` (Task 1)
- Produces: `MinimumTenurePolicy(uint256 tenureSeconds)` constructor; errors `TenureNotElapsed(uint256 availableAt)`, `TenureUnderfunded(uint256 required)`, `PriceCutDuringTenure()`.

- [ ] **Step 1: Write the failing test**

Append to `OccupancyPolicyTest`:

```solidity
    function _tenureSlot(MinimumTenurePolicy p) internal returns (address) {
        return factory.createSlotV3(
            recipient, IERC20(address(token)), _immutableConfig(), _init(), 0, address(p)
        );
    }

    /// 1% monthly on 100 ether over 7 days = 100e18 * 100 * 604800 / (2592000 * 10000)
    function _tenureCost(uint256 price_, uint256 tenure) internal pure returns (uint256) {
        return (price_ * 100 * tenure) / (30 days * 10_000);
    }

    function test_Tenure_BlocksBuyInsideWindow() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need, 100 ether);
        vm.stopPrank();

        vm.warp(block.timestamp + 3 days);
        vm.startPrank(bob);
        token.approve(s, type(uint256).max);
        vm.expectRevert();
        Slot(s).buy(bob, need, 100 ether);
        vm.stopPrank();
    }

    function test_Tenure_AllowsBuyAfterWindow() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need * 4, 100 ether);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days + 1);
        vm.startPrank(bob);
        token.approve(s, type(uint256).max);
        Slot(s).buy(bob, need, 100 ether);
        vm.stopPrank();
        assertEq(Slot(s).occupant(), bob);
    }

    function test_Tenure_RejectsUnderfundedBuy() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        vm.expectRevert();
        Slot(s).buy(alice, need - 1, 100 ether);
        vm.stopPrank();
    }

    function test_Tenure_RejectsPriceCutInsideWindow() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need * 4, 100 ether);
        vm.warp(block.timestamp + 1 days);
        vm.expectRevert(MinimumTenurePolicy.PriceCutDuringTenure.selector);
        Slot(s).selfAssess(1 ether);
        vm.stopPrank();
    }

    function test_Tenure_AllowsPriceRaiseInsideWindow() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need * 8, 100 ether);
        vm.warp(block.timestamp + 1 days);
        Slot(s).selfAssess(200 ether);
        vm.stopPrank();
        assertEq(Slot(s).price(), 200 ether);
    }

    /// Insolvency must always end tenure — this is the safety invariant.
    function test_Tenure_LiquidationWorksInsideWindow() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(365 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 365 days);

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need, 100 ether);
        vm.stopPrank();

        vm.warp(block.timestamp + 400 days);
        Slot(s).liquidate();
        assertEq(Slot(s).occupant(), address(0));
    }

    /// Vacant slots are always claimable.
    function test_Tenure_VacantAlwaysClaimable() public {
        MinimumTenurePolicy p = new MinimumTenurePolicy(7 days);
        address s = _tenureSlot(p);
        uint256 need = _tenureCost(100 ether, 7 days);
        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, need, 100 ether);
        vm.stopPrank();
        assertEq(Slot(s).occupant(), alice);
    }
```

Add the import at the top of the test file:

```solidity
import {MinimumTenurePolicy} from "../src/policies/MinimumTenurePolicy.sol";
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_Tenure`
Expected: compile error — `MinimumTenurePolicy` not found.

- [ ] **Step 3: Implement the policy**

Create `apps/contracts/src/policies/MinimumTenurePolicy.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IOccupancyPolicy, OccupancyContext} from "../interfaces/IOccupancyPolicy.sol";

/// @title MinimumTenurePolicy
/// @notice An occupant cannot be bought out for `tenureSeconds` after acquiring.
/// @dev Stateless singleton — configuration lives in the address itself, so one
///      deployment can serve any number of slots. Deploy one per duration.
///
///      Harberger impact: SOFT. Forced sale is delayed, not removed — a
///      dishonestly low price is still punished, just `tenureSeconds` later.
///      Two conditions keep it sound and both are enforced here:
///        1. Protection is pre-paid — the buyer must escrow the full tenure's tax.
///        2. Price cannot be cut while protected, or the occupant would declare
///           high, drop to dust on day 1, and pay nothing for the window.
///      Liquidation is unaffected: insolvency always ends tenure.
contract MinimumTenurePolicy is IOccupancyPolicy {
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MONTH = 30 days;

    /// @notice Protection window in seconds.
    uint256 public immutable tenureSeconds;

    error TenureNotElapsed(uint256 availableAt);
    error TenureUnderfunded(uint256 required);
    error PriceCutDuringTenure();

    constructor(uint256 _tenureSeconds) {
        tenureSeconds = _tenureSeconds;
    }

    function checkBuy(OccupancyContext calldata ctx) external view {
        // Condition 1: the incoming occupant pre-pays the whole window.
        uint256 required = _taxFor(ctx.newPrice, ctx.taxPercentage, tenureSeconds);
        if (ctx.depositAmount < required) revert TenureUnderfunded(required);

        if (ctx.occupant == address(0)) return; // vacant — always claimable
        if (ctx.occupiedSince == 0) return;     // legacy slot — treat as unprotected

        uint256 availableAt = ctx.occupiedSince + tenureSeconds;
        if (block.timestamp < availableAt) revert TenureNotElapsed(availableAt);
    }

    function checkPriceUpdate(OccupancyContext calldata ctx) external view {
        if (ctx.occupiedSince == 0) return;
        if (block.timestamp >= ctx.occupiedSince + tenureSeconds) return;
        // Condition 2: no cutting your price while nobody can take it.
        if (ctx.newPrice < ctx.currentPrice) revert PriceCutDuringTenure();
    }

    function name() external pure returns (string memory) { return "MinimumTenurePolicy"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }

    function _taxFor(
        uint256 price_,
        uint256 taxPercentage,
        uint256 seconds_
    ) internal pure returns (uint256) {
        return (price_ * taxPercentage * seconds_) / (MONTH * BASIS_POINTS);
    }
}
```

- [ ] **Step 4: Run the tenure tests**

Run: `cd apps/contracts && forge test --match-test test_Tenure -vv`
Expected: all 7 PASS.

- [ ] **Step 5: Full regression**

Run: `cd apps/contracts && forge test`
Expected: everything passes.

- [ ] **Step 6: Document the policy layer**

In `apps/docs/docs/pages/protocol.mdx`, rename the `## Modules` heading to `## Utility modules` and insert a new sibling section immediately before it:

```markdown
## Occupancy policies

A slot may attach an **occupancy policy** — a contract that vetoes occupancy
transitions. Policies are the opposite of utility modules:

| | Utility module (`ISlotsModule`) | Occupancy policy (`IOccupancyPolicy`) |
|---|---|---|
| Authority | Advisory | Authoritative |
| On failure | Fail-open (slot continues) | Fail-closed (action reverts) |
| Can move funds | No | No |
| Purpose | What the slot *does* | Who may take it, and when |

```solidity
interface IOccupancyPolicy is IERC165 {
    function checkBuy(OccupancyContext calldata ctx) external view;
    function checkPriceUpdate(OccupancyContext calldata ctx) external view;
    function name() external view returns (string memory);
    function version() external view returns (string memory);
    function policyURI() external view returns (string memory);
}
```

Guarantees that hold under **every** policy:

- `liquidate()` can never be blocked — insolvency always ends occupancy
- `release()` can never be blocked — you can always leave
- a policy can never move your deposit, change your price, or redirect a buyer

### MinimumTenurePolicy

You cannot be bought out for a configured window after acquiring the slot. The
buyer must escrow the full window's tax up front, and cannot cut their price
while protected.

**Harberger impact: soft.** Forced sale is delayed, not removed — a dishonestly
low price is still punished, just later.
```

- [ ] **Step 7: Commit**

```bash
git add apps/contracts/src/policies/MinimumTenurePolicy.sol apps/contracts/test/OccupancyPolicy.t.sol apps/docs/docs/pages/protocol.mdx
git commit -m "feat(contracts): add MinimumTenurePolicy with pre-paid tenure and price-cut guard"
```

---

# STAGE 2 — Epochs

> This stage rewrites the accounting path every other feature depends on. Land it on its own beacon upgrade.

### Task 5: Encapsulate `occupant`, `price`, `deposit`

**Files:**
- Modify: `apps/contracts/src/Slot.sol`

**Interfaces:**
- Consumes: nothing new
- Produces: `occupant()`, `price()`, `deposit()` as hand-written `public view` functions over private storage `_occupant` (slot 3), `_price` (slot 4), `_deposit` (slot 9). Task 8 makes them resolve pending transfers.

This is a **pure refactor**. Behaviour and ABI are identical. Doing it separately keeps the risky settlement change in its own reviewable diff.

- [ ] **Step 1: Rename the storage variables**

In `Slot.sol`, change the three declarations (keeping their positions exactly):

```solidity
    address private _occupant; // slot 3
    uint256 private _price; // slot 4
```

```solidity
    uint256 private _deposit; // slot 9
```

- [ ] **Step 2: Add the explicit getters**

In the VIEW section, at the top:

```solidity
    /// @notice Current occupant. Hand-written rather than an auto-getter so that
    ///         Stage 2 can resolve a matured-but-unmaterialised transfer here.
    function occupant() public view returns (address) {
        return _occupant;
    }

    function price() public view returns (uint256) {
        return _price;
    }

    function deposit() public view returns (uint256) {
        return _deposit;
    }
```

- [ ] **Step 3: Update every internal reference**

Replace all remaining bare uses of `occupant`, `price`, and `deposit` inside `Slot.sol` with `_occupant`, `_price`, `_deposit`. The compiler will find them — every read and write in `buy`, `release`, `selfAssess`, `topUp`, `withdraw`, `liquidate`, `_settle`, `taxOwed`, `secondsUntilLiquidation`, `isInsolvent`, `isVacant`, `getSlotInfo`, `_occupancyCtx`, and the `onlyOccupant` modifier.

In `getSlotInfo()` the assignments become:

```solidity
        info.occupant = _occupant;
        info.price = _price;
        info.deposit = _deposit;
```

- [ ] **Step 4: Build**

Run: `cd apps/contracts && forge build`
Expected: compiles clean with no shadowing warnings.

- [ ] **Step 5: Verify the ABI is unchanged**

Run:

```bash
cd apps/contracts && forge inspect Slot abi --json | jq -r '.[] | select(.name=="occupant" or .name=="price" or .name=="deposit") | "\(.name) \(.stateMutability) \(.outputs[0].type)"' | sort
```

Expected exactly:

```
deposit view uint256
occupant view address
price view uint256
```

- [ ] **Step 6: Full regression — this is the whole gate for this task**

Run: `cd apps/contracts && forge test`
Expected: every test passes **unmodified**. A pure refactor that changes behaviour is a failed refactor.

- [ ] **Step 7: Verify storage layout is untouched**

Run: `cd apps/contracts && forge inspect Slot storageLayout`
Expected: `_occupant` slot 3, `_price` slot 4, `_deposit` slot 9 — same slots, same sizes as the public versions had.

- [ ] **Step 8: Commit**

```bash
git add apps/contracts/src/Slot.sol
git commit -m "refactor(contracts): encapsulate occupant/price/deposit behind explicit getters"
```

---

### Task 6: `epochSeconds` scheduling

**Files:**
- Modify: `apps/contracts/src/Slot.sol`, `apps/contracts/src/interfaces/ISlot.sol`
- Test: `apps/contracts/test/Epochs.t.sol` (create)

**Interfaces:**
- Consumes: `epochSeconds` storage (Task 2), private storage (Task 5)
- Produces: `struct PendingTransfer`, `Slot.pendingTransfer()`, `Slot.nextBoundary()` → `uint256`, error `TransferPending()`, event `TransferScheduled(address buyer, uint256 effectiveAt, uint256 price, uint256 deposit)`. Used by Tasks 7, 8, 9.

- [ ] **Step 1: Write the failing test**

Create `apps/contracts/test/Epochs.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract EpochsTest is Test {
    SlotFactory factory;
    MockERC20 token;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint64 constant HOUR = 3600;

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new MockERC20();
        token.mint(alice, 10_000 ether);
        token.mint(bob, 10_000 ether);
        vm.warp(1_000_000);
    }

    function _init() internal pure returns (SlotInitParams memory) {
        return SlotInitParams({
            taxPercentage: 100,
            module: address(0),
            liquidationBountyBps: 500,
            minDepositSeconds: 0
        });
    }

    function _epochSlot(uint64 epoch) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            _init(),
            epoch,
            address(0)
        ));
    }

    function _buy(Slot s, address who, uint256 dep, uint256 px) internal {
        vm.startPrank(who);
        token.approve(address(s), type(uint256).max);
        s.buy(who, dep, px);
        vm.stopPrank();
    }

    function test_NextBoundary_IsNextMultiple() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);                       // 10000 / 3600 = 2.77...
        assertEq(s.nextBoundary(), 3 * HOUR);  // 10800
    }

    function test_NextBoundary_OnExactBoundaryGoesFullEpoch() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(2 * uint256(HOUR));
        assertEq(s.nextBoundary(), 3 * uint256(HOUR));
    }

    function test_Buy_SchedulesInsteadOfExecuting() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        // Not yet occupant — the boundary has not passed
        assertEq(s.occupant(), address(0));

        (address buyer, uint96 effectiveAt, uint256 dep, uint256 newPrice, ) = s.pendingTransfer();
        assertEq(buyer, alice);
        assertEq(uint256(effectiveAt), 3 * uint256(HOUR));
        assertEq(dep, 10 ether);
        assertEq(newPrice, 100 ether);
    }

    function test_Buy_PullsFundsAtCommit() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        uint256 before = token.balanceOf(alice);
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(token.balanceOf(alice), before - 10 ether);
        assertEq(token.balanceOf(address(s)), 10 ether);
    }

    function test_EpochZero_ExecutesImmediately() public {
        Slot s = _epochSlot(0);
        _buy(s, alice, 10 ether, 100 ether);
        assertEq(s.occupant(), alice);
    }

    function test_SecondCommit_Reverts() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        vm.startPrank(bob);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(Slot.TransferPending.selector);
        s.buy(bob, 10 ether, 120 ether);
        vm.stopPrank();
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-path test/Epochs.t.sol`
Expected: compile error — `nextBoundary`, `pendingTransfer`, `TransferPending` undefined.

- [ ] **Step 3: Add the `PendingTransfer` storage**

In `Slot.sol`, after `pendingPolicyUpdate`:

```solidity
    /// @notice A committed-but-not-yet-effective occupancy transfer.
    /// @dev `pricePaid` is stored explicitly rather than re-read from `_price`
    ///      at materialisation. Redundant today (selfAssess is blocked while a
    ///      transfer is pending) but it keeps the refund correct if that
    ///      ordering ever changes.
    struct PendingTransfer {
        address buyer;       // slot 18, offset 0
        uint96 effectiveAt;  // slot 18, offset 20
        uint256 deposit;     // slot 19
        uint256 newPrice;    // slot 20
        uint256 pricePaid;   // slot 21
    }
    PendingTransfer public pendingTransfer;
```

Add the error:

```solidity
    error TransferPending();
```

- [ ] **Step 4: Add the events**

In `ISlot.sol`, inside `ISlotEvents`:

```solidity
    event TransferScheduled(
        address indexed buyer,
        uint256 effectiveAt,
        uint256 price,
        uint256 deposit
    );
```

- [ ] **Step 5: Add `nextBoundary()`**

In the VIEW section:

```solidity
    /// @notice The next epoch boundary. Returns `block.timestamp` when epochs
    ///         are off, so callers can treat both modes uniformly.
    function nextBoundary() public view returns (uint256) {
        uint256 e = epochSeconds;
        if (e == 0) return block.timestamp;
        return ((block.timestamp / e) + 1) * e;
    }
```

- [ ] **Step 6: Split `buy()` into commit and immediate paths**

Task 2 established the order `_settle()` → `CannotBuyFromYourself` → policy. The
pending-transfer guard goes **after** `_settle()` too: a matured-but-unwritten
transfer is materialised by that call, so only a genuinely still-pending transfer
reaches the guard. Guarding before the settle would wrongly reject every buy
after a boundary until someone else poked the contract.

Insert immediately after `_settle()` and before `CannotBuyFromYourself`:

```solidity
        if (pendingTransfer.effectiveAt != 0) revert TransferPending();
```

Then replace the body from `uint256 currentPrice = _price;` onward with:

```solidity
        uint256 currentPrice = _price;
        address prev = _occupant;

        // Epochs off — apply pending updates now, as before.
        if (epochSeconds == 0) {
            _applyPendingUpdates();
        }

        _enforceMinDeposit(depositAmount, selfAssessedPrice);

        // Pull what the buyer owes. Vacant slots cost only the deposit.
        uint256 owedByBuyer = prev == address(0)
            ? depositAmount
            : currentPrice + depositAmount;
        if (owedByBuyer > 0) {
            currency.safeTransferFrom(msg.sender, address(this), owedByBuyer);
        }

        if (epochSeconds > 0) {
            uint256 effectiveAt = nextBoundary();
            pendingTransfer = PendingTransfer({
                buyer: account,
                effectiveAt: uint96(effectiveAt),
                deposit: depositAmount,
                newPrice: selfAssessedPrice,
                pricePaid: prev == address(0) ? 0 : currentPrice
            });
            emit TransferScheduled(account, effectiveAt, selfAssessedPrice, depositAmount);
            return;
        }

        // Immediate path — refund the outgoing occupant now.
        if (prev != address(0)) {
            uint256 refund = _deposit + currentPrice;
            _deposit = 0;
            if (refund > 0) currency.safeTransfer(prev, refund);
        }

        _occupant = account;
        _price = selfAssessedPrice;
        _deposit = depositAmount;
        occupiedSince = block.timestamp;
        lastSettled = block.timestamp;

        _notifyModule(
            "onTransfer",
            abi.encodeCall(ISlotsModule.onTransfer, (0, prev, account))
        );

        emit Bought(account, prev, currentPrice, depositAmount, selfAssessedPrice);
        _emitProtocolEvent(
            EVT_BOUGHT,
            abi.encode(account, prev, currentPrice, depositAmount, selfAssessedPrice)
        );
```

- [ ] **Step 7: Run the epoch tests**

Run: `cd apps/contracts && forge test --match-path test/Epochs.t.sol -vv`
Expected: all 6 PASS.

- [ ] **Step 8: Full regression + layout**

Run: `cd apps/contracts && forge test && forge inspect Slot storageLayout`
Expected: all pass; `pendingTransfer` occupies slots 18–21; slots 0–17 unchanged.

- [ ] **Step 9: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/src/interfaces/ISlot.sol apps/contracts/test/Epochs.t.sol
git commit -m "feat(contracts): schedule occupancy transfers to epoch boundaries"
```

---

### Task 7: Two-legged settlement and materialisation

**Files:**
- Modify: `apps/contracts/src/Slot.sol`
- Test: `apps/contracts/test/Epochs.t.sol`

**Interfaces:**
- Consumes: `PendingTransfer`, `nextBoundary()` (Task 6)
- Produces: internal `_accrue(uint256 upTo)`, internal `_materialize()`. `_settle()` keeps its signature.

- [ ] **Step 1: Write the failing test**

Append to `EpochsTest`:

```solidity
    function test_Materializes_LazilyOnNextInteraction() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(10_000);
        _buy(s, alice, 10 ether, 100 ether);

        vm.warp(3 * uint256(HOUR) + 500); // past the boundary
        s.collect();                       // any state-changing call

        assertEq(s.occupant(), alice);
        assertEq(s.price(), 100 ether);
        (address buyer,,,,) = s.pendingTransfer();
        assertEq(buyer, address(0), "pending should be cleared");
    }

    function test_OutgoingOccupantPaysUntilBoundary_ThenIncomingPays() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);                 // exactly on a boundary
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));    // alice materialises and occupies
        s.collect();
        assertEq(s.occupant(), alice);

        uint256 aliceStart = block.timestamp;
        vm.warp(aliceStart + 1800);    // 30 min into alice's tenure
        _buy(s, bob, 100 ether, 100 ether);

        uint256 boundary = 3 * uint256(HOUR);
        vm.warp(boundary + 1800);      // 30 min past the switch
        s.collect();

        // Alice paid from aliceStart → boundary; bob from boundary → now.
        // Total collected must equal one continuous 1h stream at 100 ether.
        uint256 expected = (100 ether * 100 * (block.timestamp - aliceStart))
            / (30 days * 10_000);
        assertApproxEqAbs(token.balanceOf(recipient), expected, 2);
        assertEq(s.occupant(), bob);
    }

    function test_OutgoingOccupantRefundedAtMaterialisation() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        uint256 aliceBefore = token.balanceOf(alice);
        _buy(s, bob, 100 ether, 100 ether);

        vm.warp(3 * uint256(HOUR) + 1);
        s.collect();

        // Alice gets her remaining deposit plus bob's 100 ether purchase price.
        assertGt(token.balanceOf(alice), aliceBefore + 100 ether - 1 ether);
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_Materializes -vv`
Expected: FAIL — `occupant()` is still `address(0)`; nothing materialises.

- [ ] **Step 3: Replace `_settle()` with the three-part version**

In `Slot.sol`, replace the whole `_settle()` function with:

```solidity
    /// @dev Accrue tax for the current occupant up to `upTo`. Never crosses a
    ///      transfer boundary — `_materialize` splits the legs.
    function _accrue(uint256 upTo) internal {
        if (_occupant == address(0)) {
            lastSettled = upTo;
            return;
        }
        if (upTo <= lastSettled) return;

        uint256 elapsed = upTo - lastSettled;
        uint256 owed = (_price * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);

        uint256 paid;
        if (owed >= _deposit) {
            paid = _deposit;
            collectedTax += _deposit;
            _deposit = 0;
        } else {
            paid = owed;
            _deposit -= owed;
            collectedTax += owed;
        }
        lastSettled = upTo;

        emit Settled(owed, paid, _deposit);
    }

    /// @dev Apply a matured transfer. Passive — nothing runs on a timer, state
    ///      catches up on the next interaction.
    function _materialize() internal {
        PendingTransfer memory p = pendingTransfer;
        if (p.effectiveAt == 0 || block.timestamp < p.effectiveAt) return;

        // Leg 1 — the outgoing occupant pays right up to the boundary.
        _accrue(p.effectiveAt);

        address prev = _occupant;
        if (prev != address(0)) {
            uint256 refund = _deposit + p.pricePaid;
            if (refund > 0) currency.safeTransfer(prev, refund);
        } else if (p.pricePaid > 0) {
            // The slot went vacant (release/liquidation) before the boundary, so
            // the buyer paid a price for a slot nobody holds. Give it back.
            currency.safeTransfer(p.buyer, p.pricePaid);
        }

        _occupant = p.buyer;
        _price = p.newPrice;
        _deposit = p.deposit;
        occupiedSince = p.effectiveAt;
        lastSettled = p.effectiveAt;
        delete pendingTransfer;

        _applyPendingUpdates();

        _notifyModule(
            "onTransfer",
            abi.encodeCall(ISlotsModule.onTransfer, (0, prev, p.buyer))
        );

        emit Bought(p.buyer, prev, p.pricePaid, p.deposit, p.newPrice);
        _emitProtocolEvent(
            EVT_BOUGHT,
            abi.encode(p.buyer, prev, p.pricePaid, p.deposit, p.newPrice)
        );
    }

    function _settle() internal {
        _materialize();
        _accrue(block.timestamp);
    }
```

- [ ] **Step 4: Make `collect()` settle even when vacant**

`collect()` already calls `_settle()` first, so no change is needed — but confirm it is not gated on occupancy. Read `collect()` and verify the first statement is `_settle();`.

- [ ] **Step 5: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/Epochs.t.sol -vv`
Expected: all PASS.

- [ ] **Step 6: Full regression**

Run: `cd apps/contracts && forge test`
Expected: all pre-existing tests pass unmodified. With `epochSeconds == 0`, `pendingTransfer.effectiveAt` is always 0, so `_materialize()` returns immediately and `_settle()` is behaviourally identical to before.

- [ ] **Step 7: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/test/Epochs.t.sol
git commit -m "feat(contracts): two-legged settlement with lazy transfer materialisation"
```

---

### Task 8: Resolving getters

**Files:**
- Modify: `apps/contracts/src/Slot.sol`
- Test: `apps/contracts/test/Epochs.t.sol`

**Interfaces:**
- Consumes: `_materialize` semantics (Task 7)
- Produces: `occupant()`, `price()`, `deposit()`, `taxOwed()` resolve matured transfers; internal `_effectiveLastSettled()`.

This closes the real bug: between `effectiveAt` and the next write, storage still names the outgoing occupant while `_settle()` already charges the incoming one. `MetadataModule` authenticates via `staticcall occupant()`, so a stale getter lets the outgoing occupant write metadata after effectively losing the slot.

- [ ] **Step 1: Write the failing test**

Append to `EpochsTest`:

```solidity
    function test_GettersResolveBeforeMaterialisation() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        _buy(s, bob, 50 ether, 80 ether);

        // Past the boundary, but NOTHING has written to storage since.
        vm.warp(3 * uint256(HOUR) + 1);

        assertEq(s.occupant(), bob, "occupant must resolve to bob");
        assertEq(s.price(), 80 ether, "price must resolve to bob's");
        assertEq(s.deposit(), 50 ether, "deposit must resolve to bob's");
    }

    function test_TaxOwedResolvesFromBoundary() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        _buy(s, bob, 100 ether, 100 ether);
        vm.warp(3 * uint256(HOUR) + 600); // 10 min past the switch

        // Bob owes for 600 seconds, not for the whole hour.
        uint256 expected = (100 ether * 100 * 600) / (30 days * 10_000);
        assertApproxEqAbs(s.taxOwed(), expected, 2);
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_GettersResolve -vv`
Expected: FAIL — `occupant()` returns alice, not bob.

- [ ] **Step 3: Make the getters resolve**

Replace the three getters added in Task 5:

```solidity
    /// @dev True once a scheduled transfer's boundary has passed, whether or not
    ///      it has been written to storage yet.
    function _transferMatured() internal view returns (bool) {
        uint96 at = pendingTransfer.effectiveAt;
        return at != 0 && block.timestamp >= at;
    }

    function occupant() public view returns (address) {
        if (_transferMatured()) return pendingTransfer.buyer;
        return _occupant;
    }

    function price() public view returns (uint256) {
        if (_transferMatured()) return pendingTransfer.newPrice;
        return _price;
    }

    function deposit() public view returns (uint256) {
        if (_transferMatured()) return pendingTransfer.deposit;
        return _deposit;
    }

    function _effectiveLastSettled() internal view returns (uint256) {
        if (_transferMatured()) return pendingTransfer.effectiveAt;
        return lastSettled;
    }
```

- [ ] **Step 4: Make the derived views resolve too**

Replace `taxOwed()`, `secondsUntilLiquidation()`, `isInsolvent()`, and `isVacant()`:

```solidity
    function taxOwed() public view returns (uint256) {
        address occ = occupant();
        if (occ == address(0)) return 0;
        uint256 elapsed = block.timestamp - _effectiveLastSettled();
        return (price() * taxPercentage * elapsed) / (MONTH * BASIS_POINTS);
    }

    function secondsUntilLiquidation() public view returns (uint256) {
        if (occupant() == address(0)) return type(uint256).max;
        uint256 owed = taxOwed();
        uint256 dep = deposit();
        uint256 remaining = dep > owed ? dep - owed : 0;
        uint256 taxNumerator = price() * taxPercentage;
        if (taxNumerator == 0) return type(uint256).max;
        return (remaining * MONTH * BASIS_POINTS) / taxNumerator;
    }

    function isInsolvent() public view returns (bool) {
        if (occupant() == address(0)) return false;
        return taxOwed() >= deposit();
    }

    function isVacant() public view returns (bool) {
        return occupant() == address(0);
    }
```

And in `getSlotInfo()`, switch the three assignments to the resolving getters:

```solidity
        info.occupant = occupant();
        info.price = price();
        info.deposit = deposit();
```

- [ ] **Step 5: Make `onlyOccupant` use the resolving getter**

Critical — otherwise the outgoing occupant can still act past the boundary:

```solidity
    modifier onlyOccupant() {
        if (msg.sender != occupant()) revert NotOccupant();
        _;
    }
```

- [ ] **Step 6: Make the policy context resolve too**

A policy handed stale state makes stale decisions — `MinimumTenurePolicy` would
compute tenure from the *previous* occupant's start. Update `_occupancyCtx`:

```solidity
    function _effectiveOccupiedSince() internal view returns (uint256) {
        if (_transferMatured()) return pendingTransfer.effectiveAt;
        return occupiedSince;
    }

    function _occupancyCtx(
        address account,
        uint256 newPrice,
        uint256 depositAmount
    ) internal view returns (OccupancyContext memory) {
        return OccupancyContext({
            slot: address(this),
            caller: msg.sender,
            account: account,
            occupant: occupant(),
            occupiedSince: _effectiveOccupiedSince(),
            taxPercentage: taxPercentage,
            currentPrice: price(),
            newPrice: newPrice,
            depositAmount: depositAmount
        });
    }
```

In `selfAssess()`, the ctx call must also pass the resolving getter:

```solidity
            IOccupancyPolicy(occupancyPolicy).checkPriceUpdate(
                _occupancyCtx(occupant(), newPrice, deposit())
            );
```

> In practice `buy()` and `selfAssess()` both `_settle()` before reaching the
> policy, so the resolution is usually a no-op. It is here so the context is
> correct by construction rather than by call-ordering luck.

- [ ] **Step 7: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/Epochs.t.sol -vv`
Expected: all PASS.

- [ ] **Step 8: Full regression**

Run: `cd apps/contracts && forge test`
Expected: all pass. `MetadataModule.t.sol` in particular must be green — it exercises the `occupant()` auth path.

- [ ] **Step 9: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/test/Epochs.t.sol
git commit -m "fix(contracts): resolve occupant/price/deposit against matured transfers"
```

---

### Task 9: Pending-transfer guards and vacancy edge cases

**Files:**
- Modify: `apps/contracts/src/Slot.sol`
- Test: `apps/contracts/test/Epochs.t.sol`

**Interfaces:**
- Consumes: everything from Tasks 6–8
- Produces: no new external surface; adds `TransferPending` guard to `selfAssess`.

- [ ] **Step 1: Write the failing tests**

Append to `EpochsTest`:

```solidity
    /// Without this, the outgoing occupant raises their price after seeing a
    /// commit and dodges the sale.
    function test_SelfAssess_BlockedWhileTransferPending() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        _buy(s, bob, 50 ether, 80 ether);

        vm.prank(alice);
        vm.expectRevert(Slot.TransferPending.selector);
        s.selfAssess(500 ether);
    }

    function test_ReleaseBeforeBoundary_TransferStillLands() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        _buy(s, bob, 50 ether, 80 ether);

        vm.prank(alice);
        s.release();
        assertEq(s.occupant(), address(0), "vacant until the boundary");

        vm.warp(3 * uint256(HOUR) + 1);
        assertEq(s.occupant(), bob, "transfer still lands");
    }

    /// Bob paid alice's price for a slot that went vacant — he must get it back.
    function test_VacantAtMaterialisation_RefundsBuyersPrice() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 100 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        uint256 bobBefore = token.balanceOf(bob);
        _buy(s, bob, 50 ether, 80 ether); // pays 100 price + 50 deposit

        vm.prank(alice);
        s.release();

        vm.warp(3 * uint256(HOUR) + 1);
        s.collect();

        // Bob is out only his deposit; the 100 ether price came back.
        assertEq(token.balanceOf(bob), bobBefore - 50 ether);
        assertEq(s.occupant(), bob);
    }

    function test_LiquidateBeforeBoundary_TransferStillLands() public {
        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 1, 100 ether); // dust deposit — insolvent almost at once
        vm.warp(2 * uint256(HOUR));
        s.collect();

        _buy(s, bob, 100 ether, 80 ether);

        vm.warp(2 * uint256(HOUR) + 60);
        s.liquidate();
        assertEq(s.occupant(), address(0));

        vm.warp(3 * uint256(HOUR) + 1);
        assertEq(s.occupant(), bob);
    }
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/contracts && forge test --match-test "test_SelfAssess_Blocked|test_VacantAtMaterialisation" -vv`
Expected: FAIL — `selfAssess` succeeds; bob is not refunded.

- [ ] **Step 3: Guard `selfAssess`**

In `selfAssess()`, immediately after the `InvalidPrice` check and **before** the policy call:

```solidity
        if (pendingTransfer.effectiveAt != 0) revert TransferPending();
```

- [ ] **Step 4: Stop `release()` and `liquidate()` from clobbering the pending transfer**

Both call `_settle()` (which materialises first — correct) and then clear occupancy. Neither touches `pendingTransfer`, so a pending transfer survives by construction. **Verify** by reading both functions: confirm neither contains `delete pendingTransfer` nor writes to it.

The buyer-refund path for the vacant case was added in Task 7 Step 3 (`else if (p.pricePaid > 0)`). Confirm it is present.

- [ ] **Step 5: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/Epochs.t.sol -vv`
Expected: all PASS.

- [ ] **Step 6: Full regression**

Run: `cd apps/contracts && forge test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/test/Epochs.t.sol
git commit -m "feat(contracts): guard pending transfers across selfAssess, release, and liquidation"
```

---

### Task 10: Tax-conservation fuzz + epoch docs

**Files:**
- Modify: `apps/contracts/test/Epochs.t.sol`, `apps/docs/docs/pages/protocol.mdx`

**Interfaces:**
- Consumes: all of Stage 2
- Produces: nothing new

- [ ] **Step 1: Write the invariant fuzz test**

Append to `EpochsTest`:

```solidity
    /// The core Stage 2 invariant: splitting accrual across a boundary must
    /// charge exactly what one continuous stream would have. No gap, no
    /// double-charge.
    function testFuzz_TaxConservedAcrossBoundary(uint32 offset, uint32 tail) public {
        offset = uint32(bound(offset, 1, HOUR - 1));
        tail = uint32(bound(tail, 1, 10 * HOUR));

        Slot s = _epochSlot(HOUR);
        vm.warp(HOUR);
        _buy(s, alice, 1000 ether, 100 ether);
        vm.warp(2 * uint256(HOUR));
        s.collect();

        uint256 start = block.timestamp;
        vm.warp(start + offset);
        _buy(s, bob, 1000 ether, 100 ether); // same price — stream is continuous

        vm.warp(3 * uint256(HOUR) + tail);
        s.collect();

        uint256 expected = (100 ether * 100 * (block.timestamp - start))
            / (30 days * 10_000);
        // Two integer divisions instead of one; tolerance covers the rounding.
        assertApproxEqAbs(token.balanceOf(recipient), expected, 4);
    }
```

- [ ] **Step 2: Run it**

Run: `cd apps/contracts && forge test --match-test testFuzz_TaxConserved -vv`
Expected: PASS across 256 runs.

- [ ] **Step 3: Document epochs**

In `apps/docs/docs/pages/protocol.mdx`, add a new subsection under `## Slot`, immediately after the `### Tax` block:

```markdown
### Epochs

A slot can be configured with `epochSeconds` so occupancy changes only take
effect on a clock boundary. `epochSeconds = 0` (the default) means instant buy.

With `epochSeconds = 3600`:

```
14:14  buyer calls buy()   — funds are escrowed, current occupant keeps occupying
15:00  boundary            — occupancy AND tax liability transfer to the buyer
```

Nothing runs on a timer. The transfer is applied lazily on the next interaction
with the contract, and `occupant()`, `price()`, `deposit()`, and `taxOwed()` all
report the post-boundary state as soon as the boundary passes.

- **First commit wins.** A second `buy()` while a transfer is pending reverts.
- **Commits cannot be cancelled** — otherwise a slot could be locked every epoch.
- **`selfAssess()` is blocked while a transfer is pending**, so the outgoing
  occupant cannot raise their price to dodge a sale they have already seen.
- If the occupant releases or is liquidated before the boundary, the slot goes
  vacant and the scheduled transfer still lands. The buyer's purchase price is
  refunded, since a vacant slot costs only the deposit.

**Harberger impact: near-pure.** Everyone gets the same sub-epoch delay and
nobody chooses theirs, so there is nothing to game — it removes the latency
advantage without weakening forced sale.
```

- [ ] **Step 4: Commit**

```bash
git add apps/contracts/test/Epochs.t.sol apps/docs/docs/pages/protocol.mdx
git commit -m "test(contracts): fuzz tax conservation across epoch boundaries; document epochs"
```

---

# STAGE 3 — Delegation and queue

### Task 11: Operator approval

**Files:**
- Modify: `apps/contracts/src/Slot.sol`, `apps/contracts/src/interfaces/ISlot.sol`
- Test: `apps/contracts/test/OccupancyPolicy.t.sol`

**Interfaces:**
- Consumes: `occupant()` (Task 8)
- Produces: `Slot.setOperator(address,bool)`, `Slot.isOperator(address,address)` → `bool`, event `OperatorSet(address indexed occupant, address indexed operator, bool approved)`.

- [ ] **Step 1: Write the failing test**

Append to `OccupancyPolicyTest`:

```solidity
    function test_Operator_CanSelfAssess() public {
        address agent = makeAddr("agent");
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        Slot(s).setOperator(agent, true);
        vm.stopPrank();

        vm.prank(agent);
        Slot(s).selfAssess(150 ether);
        assertEq(Slot(s).price(), 150 ether);
    }

    function test_Operator_CannotWithdraw() public {
        address agent = makeAddr("agent");
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        Slot(s).setOperator(agent, true);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(Slot.NotOccupant.selector);
        Slot(s).withdraw(1 ether);
    }

    function test_Operator_CannotRelease() public {
        address agent = makeAddr("agent");
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        Slot(s).setOperator(agent, true);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(Slot.NotOccupant.selector);
        Slot(s).release();
    }

    function test_Operator_RevokedCannotAct() public {
        address agent = makeAddr("agent");
        address s = factory.createSlot(recipient, IERC20(address(token)), _immutableConfig(), _init());

        vm.startPrank(alice);
        token.approve(s, type(uint256).max);
        Slot(s).buy(alice, 10 ether, 100 ether);
        Slot(s).setOperator(agent, true);
        Slot(s).setOperator(agent, false);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(Slot.NotOccupant.selector);
        Slot(s).selfAssess(150 ether);
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_Operator`
Expected: compile error — `setOperator` undefined.

- [ ] **Step 3: Add the storage and setter**

In `Slot.sol`, after `pendingTransfer`:

```solidity
    /// @notice occupant => operator => approved. Keyed by occupant so approvals
    ///         survive leaving and re-entering, matching setApprovalForAll.
    mapping(address => mapping(address => bool)) public isOperator; // slot 22
```

```solidity
    /// @notice Delegate slot management to an operator (e.g. an agent).
    /// @dev Operators may selfAssess and topUp. They may NOT withdraw or
    ///      release — those move the position's principal and stay
    ///      occupant-only. Bounded authority is the point.
    function setOperator(address operator, bool approved) external {
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
    }
```

- [ ] **Step 4: Add the modifier and apply it to `selfAssess` only**

```solidity
    modifier onlyOccupantOrOperator() {
        address occ = occupant();
        if (msg.sender != occ && !isOperator[occ][msg.sender]) revert NotOccupant();
        _;
    }
```

Change `selfAssess`'s modifier from `onlyOccupant` to `onlyOccupantOrOperator`. Leave `withdraw()` and `release()` on `onlyOccupant`.

Note `selfAssess` uses `msg.sender` nowhere else, but its `_occupancyCtx` call passes `occupant` as `account` — confirm it reads `occupant()`, not `msg.sender`.

- [ ] **Step 5: Add the event**

In `ISlot.sol`, inside `ISlotEvents`:

```solidity
    event OperatorSet(address indexed occupant, address indexed operator, bool approved);
```

- [ ] **Step 6: Run the tests**

Run: `cd apps/contracts && forge test --match-test test_Operator -vv`
Expected: all 4 PASS.

- [ ] **Step 7: Full regression + layout**

Run: `cd apps/contracts && forge test && forge inspect Slot storageLayout`
Expected: all pass; `isOperator` at slot 22.

- [ ] **Step 8: Document it**

In `apps/docs/docs/pages/protocol.mdx`, add a row to the Roles table:

```markdown
| **Operator** | No revenue | No control | Delegated by occupant: may `selfAssess` and `topUp`, may **not** `withdraw` or `release` |
```

And under `### Core operations`, add:

```solidity
/// Delegate management to an operator (occupant only)
function setOperator(address operator, bool approved) external;
```

- [ ] **Step 9: Commit**

```bash
git add apps/contracts/src/Slot.sol apps/contracts/src/interfaces/ISlot.sol apps/contracts/test/OccupancyPolicy.t.sol apps/docs/docs/pages/protocol.mdx
git commit -m "feat(contracts): operator approval for delegated slot management"
```

---

### Task 12: `SlotQueue` peripheral

**Files:**
- Create: `apps/contracts/src/periphery/SlotQueue.sol`
- Test: `apps/contracts/test/SlotQueue.t.sol` (create)

**Interfaces:**
- Consumes: `Slot.buy(address,uint256,uint256)`, `Slot.occupant()`
- Produces: `SlotQueue.joinQueue(address slot, uint256 price, uint256 deposit, uint256 tip, uint96 expiry)`, `SlotQueue.cancel(address slot, uint256 index)`, `SlotQueue.fill(address slot)`, `SlotQueue.isEmpty(address slot)` → `bool`, `SlotQueue.headIndex(address)` → `uint256`. Used by Task 13.

A vacant slot costs only the deposit — `buy()` pulls `depositAmount` alone when there is no previous occupant. So a bid escrows `deposit + tip`, never a purchase price.

- [ ] **Step 1: Write the failing test**

Create `apps/contracts/test/SlotQueue.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {SlotQueue} from "../src/periphery/SlotQueue.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") { _mint(msg.sender, 1_000_000 ether); }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract SlotQueueTest is Test {
    SlotFactory factory;
    MockERC20 token;
    SlotQueue queue;

    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address keeper = makeAddr("keeper");

    function setUp() public {
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (address(this), address(slotImpl)))
        );
        factory = SlotFactory(address(proxy));
        token = new MockERC20();
        queue = new SlotQueue();
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);
        vm.warp(1_000_000);
    }

    function _slot() internal returns (Slot) {
        return Slot(factory.createSlot(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 100,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 0
            })
        ));
    }

    function test_Fill_AfterRelease() public {
        Slot s = _slot();
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.prank(alice);
        s.release();

        uint256 keeperBefore = token.balanceOf(keeper);
        vm.prank(keeper);
        queue.fill(address(s));

        assertEq(s.occupant(), bob);
        assertEq(s.price(), 80 ether);
        assertEq(token.balanceOf(keeper), keeperBefore + 1 ether, "keeper tipped");
    }

    function test_Fill_RevertsWhileOccupied() public {
        Slot s = _slot();
        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.expectRevert(SlotQueue.SlotOccupied.selector);
        queue.fill(address(s));
    }

    function test_Fill_SkipsExpiredBid() public {
        Slot s = _slot();
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 1 days));
        vm.stopPrank();

        vm.warp(block.timestamp + 2 days);
        vm.expectRevert(SlotQueue.QueueEmpty.selector);
        queue.fill(address(s));
        assertTrue(queue.isEmpty(address(s)));
    }

    function test_Cancel_RefundsBidder() public {
        Slot s = _slot();
        uint256 before = token.balanceOf(bob);
        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 1 ether, uint96(block.timestamp + 30 days));
        queue.cancel(address(s), 0);
        vm.stopPrank();
        assertEq(token.balanceOf(bob), before);
        assertTrue(queue.isEmpty(address(s)));
    }

    function test_IsEmpty_TrueWhenNoBids() public {
        Slot s = _slot();
        assertTrue(queue.isEmpty(address(s)));
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-path test/SlotQueue.t.sol`
Expected: compile error — `SlotQueue` not found.

- [ ] **Step 3: Implement `SlotQueue`**

Create `apps/contracts/src/periphery/SlotQueue.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Slot} from "../Slot.sol";

/// @title SlotQueue
/// @notice FIFO queue of funded bids to occupy a slot once it becomes vacant.
/// @dev Holds ITS OWN escrow — never the slot's deposit. Filling is a separate,
///      permissionless transaction rather than a hook: `release()` and
///      `liquidate()` are `nonReentrant`, so the queue cannot call `buy()` back
///      into the slot from inside them. A tip pays whoever calls `fill`, the
///      same incentive shape `liquidationBountyBps` already uses.
///
///      Ordering is FIFO. Ranking bids by price would make this an auction —
///      third parties setting the price — which the protocol does not do.
contract SlotQueue is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Bid {
        address bidder;
        uint96 expiry;
        uint256 price;    // bidder's own self-assessed price
        uint256 deposit;  // escrowed, forwarded to the slot on fill
        uint256 tip;      // escrowed, paid to whoever calls fill
        bool cancelled;
    }

    /// @notice slot => FIFO bid list
    mapping(address => Bid[]) public bids;
    /// @notice slot => index of the first live bid
    mapping(address => uint256) public headIndex;

    event BidPlaced(address indexed slot, address indexed bidder, uint256 index, uint256 price);
    event BidCancelled(address indexed slot, address indexed bidder, uint256 index);
    event Filled(address indexed slot, address indexed bidder, address indexed keeper, uint256 tip);

    error SlotOccupied();
    error QueueEmpty();
    error NotBidder();
    error AlreadyCancelled();
    error InvalidExpiry();

    /// @notice Escrow a funded bid to occupy `slot` once it is vacant.
    /// @dev A vacant slot costs only the deposit, so no purchase price is escrowed.
    function joinQueue(
        address slot,
        uint256 price,
        uint256 deposit,
        uint256 tip,
        uint96 expiry
    ) external nonReentrant {
        if (expiry <= block.timestamp) revert InvalidExpiry();

        IERC20 currency = Slot(slot).currency();
        currency.safeTransferFrom(msg.sender, address(this), deposit + tip);

        bids[slot].push(Bid({
            bidder: msg.sender,
            expiry: expiry,
            price: price,
            deposit: deposit,
            tip: tip,
            cancelled: false
        }));

        emit BidPlaced(slot, msg.sender, bids[slot].length - 1, price);
    }

    /// @notice Withdraw your bid before it is filled.
    function cancel(address slot, uint256 index) external nonReentrant {
        Bid storage b = bids[slot][index];
        if (b.bidder != msg.sender) revert NotBidder();
        if (b.cancelled) revert AlreadyCancelled();

        b.cancelled = true;
        uint256 refund = b.deposit + b.tip;
        b.deposit = 0;
        b.tip = 0;

        Slot(slot).currency().safeTransfer(msg.sender, refund);
        emit BidCancelled(slot, msg.sender, index);
    }

    /// @notice Permissionless. Hands the vacant slot to the head bidder.
    function fill(address slot) external nonReentrant {
        if (Slot(slot).occupant() != address(0)) revert SlotOccupied();

        uint256 i = _advanceHead(slot);
        Bid[] storage list = bids[slot];
        if (i >= list.length) revert QueueEmpty();

        Bid storage b = list[i];
        headIndex[slot] = i + 1;

        uint256 dep = b.deposit;
        uint256 tip = b.tip;
        address bidder = b.bidder;
        uint256 px = b.price;
        b.deposit = 0;
        b.tip = 0;

        IERC20 currency = Slot(slot).currency();
        currency.forceApprove(slot, dep);
        Slot(slot).buy(bidder, dep, px);
        currency.forceApprove(slot, 0);

        if (tip > 0) currency.safeTransfer(msg.sender, tip);
        emit Filled(slot, bidder, msg.sender, tip);
    }

    /// @notice True when no live bid remains. The exclusivity policy MUST fall
    ///         through to open access in this case, or the slot freezes forever.
    function isEmpty(address slot) external view returns (bool) {
        Bid[] storage list = bids[slot];
        for (uint256 i = headIndex[slot]; i < list.length; i++) {
            if (!list[i].cancelled && list[i].expiry > block.timestamp) return false;
        }
        return true;
    }

    /// @dev Skips cancelled and expired bids, refunding expired ones as it goes.
    function _advanceHead(address slot) internal returns (uint256) {
        Bid[] storage list = bids[slot];
        uint256 i = headIndex[slot];
        while (i < list.length) {
            Bid storage b = list[i];
            if (b.cancelled) { i++; continue; }
            if (b.expiry <= block.timestamp) {
                uint256 refund = b.deposit + b.tip;
                b.deposit = 0;
                b.tip = 0;
                b.cancelled = true;
                if (refund > 0) Slot(slot).currency().safeTransfer(b.bidder, refund);
                i++;
                continue;
            }
            break;
        }
        headIndex[slot] = i;
        return i;
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/SlotQueue.t.sol -vv`
Expected: all 5 PASS.

- [ ] **Step 5: Full regression**

Run: `cd apps/contracts && forge test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/contracts/src/periphery/SlotQueue.sol apps/contracts/test/SlotQueue.t.sol
git commit -m "feat(contracts): SlotQueue peripheral with FIFO bids and permissionless fill"
```

---

### Task 13: `QueueExclusivityPolicy`

**Files:**
- Create: `apps/contracts/src/policies/QueueExclusivityPolicy.sol`
- Test: `apps/contracts/test/SlotQueue.t.sol`

**Interfaces:**
- Consumes: `IOccupancyPolicy` (Task 1), `SlotQueue.isEmpty` (Task 12)
- Produces: `QueueExclusivityPolicy(SlotQueue queue)` constructor, error `QueueHasPriority()`.

- [ ] **Step 1: Write the failing test**

Append to `SlotQueueTest`, and add the import (`SlotConfig` and
`SlotInitParams` are already imported by Task 12):

```solidity
import {QueueExclusivityPolicy} from "../src/policies/QueueExclusivityPolicy.sol";
```

```solidity
    function _policySlot(QueueExclusivityPolicy p) internal returns (Slot) {
        return Slot(factory.createSlotV3(
            recipient,
            IERC20(address(token)),
            SlotConfig({mutableTax: false, mutableModule: false, manager: address(0)}),
            SlotInitParams({
                taxPercentage: 100,
                module: address(0),
                liquidationBountyBps: 500,
                minDepositSeconds: 0
            }),
            0,
            address(p)
        ));
    }

    /// The whole point: nobody front-runs the queue when the slot frees up.
    function test_Exclusivity_BlocksDirectBuyWhenQueueNonEmpty() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        vm.expectRevert(QueueExclusivityPolicy.QueueHasPriority.selector);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
    }

    /// Invariant: an empty queue must never freeze the slot.
    function test_Exclusivity_EmptyQueueAllowsAnyone() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(s.occupant(), alice);
    }

    function test_Exclusivity_QueueItselfCanFill() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        queue.fill(address(s));
        assertEq(s.occupant(), bob);
    }

    /// After the queue drains, the slot returns to open access.
    function test_Exclusivity_ReopensAfterQueueDrains() public {
        QueueExclusivityPolicy p = new QueueExclusivityPolicy(queue);
        Slot s = _policySlot(p);

        vm.startPrank(bob);
        token.approve(address(queue), type(uint256).max);
        queue.joinQueue(address(s), 80 ether, 10 ether, 0, uint96(block.timestamp + 30 days));
        vm.stopPrank();

        queue.fill(address(s));
        vm.prank(bob);
        s.release();

        vm.startPrank(alice);
        token.approve(address(s), type(uint256).max);
        s.buy(alice, 10 ether, 100 ether);
        vm.stopPrank();
        assertEq(s.occupant(), alice);
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/contracts && forge test --match-test test_Exclusivity`
Expected: compile error — `QueueExclusivityPolicy` not found.

- [ ] **Step 3: Implement the policy**

Create `apps/contracts/src/policies/QueueExclusivityPolicy.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IOccupancyPolicy, OccupancyContext} from "../interfaces/IOccupancyPolicy.sol";
import {SlotQueue} from "../periphery/SlotQueue.sol";

/// @title QueueExclusivityPolicy
/// @notice While a slot has live queued bids, only the queue may claim it.
/// @dev One rule. Without it the queue is worthless — anyone front-runs the
///      instant the slot frees up and the head bidder loses their position.
///
///      CRITICAL: exclusivity applies ONLY while the queue is non-empty. A flat
///      "only the queue may buy" would freeze the slot permanently once the
///      queue drained.
///
///      Harberger impact: near-pure. It orders who may exercise forced sale; it
///      does not change who sets the price. Each bidder self-assesses their own.
contract QueueExclusivityPolicy is IOccupancyPolicy {
    SlotQueue public immutable queue;

    error QueueHasPriority();

    constructor(SlotQueue _queue) {
        queue = _queue;
    }

    function checkBuy(OccupancyContext calldata ctx) external view {
        if (queue.isEmpty(ctx.slot)) return; // never freeze an empty queue
        if (ctx.caller != address(queue)) revert QueueHasPriority();
    }

    function checkPriceUpdate(OccupancyContext calldata) external pure {}

    function name() external pure returns (string memory) { return "QueueExclusivityPolicy"; }
    function version() external pure returns (string memory) { return "1.0.0"; }
    function policyURI() external pure returns (string memory) { return ""; }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == type(IOccupancyPolicy).interfaceId || id == type(IERC165).interfaceId;
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd apps/contracts && forge test --match-path test/SlotQueue.t.sol -vv`
Expected: all PASS.

- [ ] **Step 5: Full regression**

Run: `cd apps/contracts && forge test`
Expected: all pass.

- [ ] **Step 6: Document the queue**

In `apps/docs/docs/pages/protocol.mdx`, under `## Occupancy policies`, after the `### MinimumTenurePolicy` subsection:

```markdown
### SlotQueue + QueueExclusivityPolicy

A queue of funded bids waiting for the slot to become vacant. Each bidder
escrows a deposit (and an optional keeper tip) in the **queue contract** — never
in the slot. When the slot frees up, anyone may call `fill()` and the head
bidder becomes the occupant at their own self-assessed price.

The paired policy grants the queue priority: while live bids exist, only the
queue may claim the slot. Once the queue drains, the slot reopens to everyone.

This turns a `release()` into a sale — the departing occupant's alternative was
releasing for nothing.

**Ordering is FIFO.** Ranking bids by price would make it an auction, which the
protocol does not do.

**Harberger impact: near-pure.** It orders who may exercise forced sale; it does
not change who sets the price.
```

- [ ] **Step 7: Commit**

```bash
git add apps/contracts/src/policies/QueueExclusivityPolicy.sol apps/contracts/test/SlotQueue.t.sol apps/docs/docs/pages/protocol.mdx
git commit -m "feat(contracts): QueueExclusivityPolicy granting queued bidders priority"
```

---

### Task 14: Regenerate ABIs and final verification

**Files:**
- Modify: `packages/contracts/src/abis/slot.ts`, `packages/contracts/src/abis/slotFactory.ts`

**Interfaces:**
- Consumes: the built artifacts from all prior tasks
- Produces: updated `slotAbi`, `slotFactoryAbi` exports

ABIs in `packages/contracts` are hand-maintained TS files with no sync script, so extract them explicitly.

- [ ] **Step 1: Write the beacon-upgrade test**

Every slot shares one implementation, so an upgrade that shifts storage corrupts
live positions. Append to `apps/contracts/test/Epochs.t.sol`:

```solidity
    /// Occupied slot must survive a beacon upgrade with state intact.
    function test_BeaconUpgrade_PreservesOccupiedState() public {
        Slot s = _epochSlot(0);
        _buy(s, alice, 100 ether, 250 ether);
        vm.warp(block.timestamp + 1 days);

        address occBefore = s.occupant();
        uint256 priceBefore = s.price();
        uint256 depBefore = s.deposit();
        uint256 sinceBefore = s.occupiedSince();
        uint256 owedBefore = s.taxOwed();

        // Upgrade every slot at once.
        Slot newImpl = new Slot();
        UpgradeableBeacon(address(factory.beacon())).upgradeTo(address(newImpl));

        assertEq(s.occupant(), occBefore, "occupant survived");
        assertEq(s.price(), priceBefore, "price survived");
        assertEq(s.deposit(), depBefore, "deposit survived");
        assertEq(s.occupiedSince(), sinceBefore, "occupiedSince survived");
        assertEq(s.taxOwed(), owedBefore, "accrual survived");

        // And the slot still works afterwards.
        vm.prank(alice);
        s.selfAssess(300 ether);
        assertEq(s.price(), 300 ether);
    }
```

Add the import to the top of `Epochs.t.sol`:

```solidity
import {UpgradeableBeacon} from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
```

The test contract is the factory admin (it passes `address(this)` to
`SlotFactory.initialize` in `setUp`), and the factory constructs the beacon with
that same admin, so `upgradeTo` is authorised without a prank.

- [ ] **Step 2: Run it**

Run: `cd apps/contracts && forge test --match-test test_BeaconUpgrade -vv`
Expected: PASS.

- [ ] **Step 3: Build fresh artifacts**

Run: `cd apps/contracts && forge build`
Expected: clean build.

- [ ] **Step 4: Regenerate `slot.ts`**

```bash
cd /Users/nezzarkefif/Documents/GitHub/0xSlots
{ printf 'export const slotAbi = '; \
  jq '.abi' apps/contracts/out/Slot.sol/Slot.json; \
  printf ' as const;\n'; } > packages/contracts/src/abis/slot.ts
```

- [ ] **Step 5: Regenerate `slotFactory.ts`**

```bash
cd /Users/nezzarkefif/Documents/GitHub/0xSlots
{ printf 'export const slotFactoryAbi = '; \
  jq '.abi' apps/contracts/out/SlotFactory.sol/SlotFactory.json; \
  printf ' as const;\n'; } > packages/contracts/src/abis/slotFactory.ts
```

- [ ] **Step 6: Confirm the new surface is present**

```bash
cd /Users/nezzarkefif/Documents/GitHub/0xSlots
grep -c "occupancyPolicy\|epochSeconds\|setOperator\|nextBoundary\|pendingTransfer" packages/contracts/src/abis/slot.ts
grep -c "createSlotV3" packages/contracts/src/abis/slotFactory.ts
```

Expected: first count > 0, second count > 0.

- [ ] **Step 7: Typecheck the package**

Run: `cd packages/contracts && pnpm typecheck`
Expected: no errors.

- [ ] **Step 8: Full contract suite one final time**

Run: `cd apps/contracts && forge test`
Expected: every test green, including all pre-existing tests unmodified.

- [ ] **Step 9: Final storage-layout audit**

Run: `cd apps/contracts && forge inspect Slot storageLayout`

Confirm exactly:

| Slot | Expected |
|---|---|
| 0–13 | unchanged from before this work |
| 14 | `_legacyInitialized` (offset 0) + `factory` (offset 1) |
| 15 | `occupancyPolicy` (offset 0) + `epochSeconds` (offset 20) |
| 16 | `occupiedSince` |
| 17 | `pendingPolicyUpdate` |
| 18–21 | `pendingTransfer` |
| 22 | `isOperator` |

- [ ] **Step 10: Commit**

```bash
git add packages/contracts/src/abis/slot.ts packages/contracts/src/abis/slotFactory.ts
git commit -m "chore(contracts): regenerate Slot and SlotFactory ABIs for v3 occupancy"
```

---

## Deployment note

Stages land as **separate beacon upgrades**, in order. Stage 2 rewrites the
accounting path every other feature depends on and deserves its own upgrade and
its own audit pass. Existing slots need no migration at any stage:
`occupancyPolicy == address(0)` and `epochSeconds == 0` reproduce current
behaviour exactly, and `initializeV3` is only called for slots deployed via
`createSlotV3`.

For pre-v3 slots that later want a policy, `SlotFactory.migrateSlots` already
demonstrates the pattern — an equivalent admin call would invoke `initializeV3`
on existing proxies.
