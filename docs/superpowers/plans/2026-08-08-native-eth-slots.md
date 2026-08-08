# Native ETH Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a `Slot` denominate its market in native ETH, selected at creation with `currency == address(0)`, so buying and topping up need no ERC-20 approval.

**Architecture:** A sentinel value (`currency == address(0)`) selects native mode with no new storage field, keeping the `BeaconProxy` layout unchanged. Inbound value arrives through `payable` `buy`/`topUp` with strict `msg.value` equality. Outbound value moves in two tiers: a 30k-gas-capped push for payments that fire inside someone else's transaction (falling back to the existing `withdrawableOf` credit), and an uncapped revert-on-failure send for caller-initiated `withdraw`/`claim`.

**Tech Stack:** Solidity 0.8.29, Foundry (`forge`), OpenZeppelin upgradeable proxies (BeaconProxy for slots, ERC1967 for the factory).

**Spec:** [2026-08-08-native-eth-slots-design.md](../specs/2026-08-08-native-eth-slots-design.md)

## Global Constraints

- **Working directory for all commands is `apps/contracts/`.** Every `forge` command and every path below is relative to it.
- **The ERC-20 branch must stay behaviourally identical.** The existing suite (~190 test functions) passing unchanged is the primary evidence for this. Never modify an existing test to make a change pass — if an existing test fails, the change is wrong.
- **No new storage variables in `Slot.sol`.** Slots are `BeaconProxy`; the storage block at `src/Slot.sol:55-128` is marked `KEEP ORDER, APPEND ONLY`. This work requires no additions to it.
- **`Slot` must never gain a `receive()` or `fallback()` function.** ETH may only enter through paths that account for it.
- Errors are declared in `src/Slot.sol` (existing block at lines 34-52). Events are declared in `src/interfaces/ISlot.sol` — no event changes are needed anywhere in this plan.
- `foundry.toml` sets `via_ir = true`. Compiles are slow; this is expected, not a hang.
- Run the full suite with `forge test`. Run one test with `forge test --mt <testName> -vv`.

---

### Task 1: Remove the orphaned Permit2 router

`SlotsRouter` existed to paper over ERC-20 approval friction using Permit2. Native ETH makes it unnecessary, and nothing in the repository references it or `IPermit2` except the Foundry build cache — no tests, no deploy scripts, no frontend imports.

**Files:**
- Delete: `src/SlotsRouter.sol`
- Delete: `src/interfaces/IPermit2.sol`

**Interfaces:**
- Consumes: nothing
- Produces: nothing (pure removal)

- [ ] **Step 1: Confirm nothing references them**

Run:
```bash
cd /Users/nezzarkefif/Documents/GitHub/0xSlots && \
  git ls-files | grep -v node_modules | xargs grep -ln "SlotsRouter\|IPermit2" 2>/dev/null
```

Expected: only `apps/contracts/cache/solidity-files-cache.json`, `apps/contracts/src/SlotsRouter.sol`, and `apps/contracts/src/interfaces/IPermit2.sol`. If any other file appears — a test, a script, a TypeScript import — **stop and report it**; the deletion is not safe and this task needs revisiting.

- [ ] **Step 2: Delete both files**

```bash
git rm src/SlotsRouter.sol src/interfaces/IPermit2.sol
```

- [ ] **Step 3: Verify the suite still builds and passes**

Run: `forge test`
Expected: compiles cleanly, all tests PASS. Note the exact test count in the summary line (e.g. `Suite result: ok. 40 passed`) — you will compare against it in later tasks.

- [ ] **Step 4: Commit**

`git rm` already staged both deletions, so commit without re-adding. **Do not use `git add -A`** — `apps/contracts/cache/solidity-files-cache.json` is a tracked build artifact that forge rewrites on every run, and it must not be swept into these commits.

```bash
git commit -m "refactor(contracts): drop SlotsRouter and IPermit2

Built to paper over ERC-20 approval friction with Permit2. Native ETH
support makes it redundant, and nothing referenced it."
```

---

### Task 2: The sentinel and its validation

Open `address(0)` as a valid currency and add the helper every later task branches on. This task also closes a latent bug: today a *codeless non-zero* address passes validation, so a slot can be created against an address that is not a token at all.

**Files:**
- Modify: `src/Slot.sol:34-52` (errors), `src/Slot.sol:157` (validation), plus a new internal helper
- Test: `test/NativeEth.t.sol` (create)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `function _isNative() internal view returns (bool)` — true when `address(currency) == address(0)`. Every later task branches on this.
  - `error InvalidValue()` — wrong `msg.value` for the slot's currency mode.
  - `error TransferFailed()` — an uncapped native send failed in `withdraw`/`claim`.

- [ ] **Step 1: Write the failing test**

Create `test/NativeEth.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Slot} from "../src/Slot.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {SlotConfig, SlotInitParams} from "../src/interfaces/ISlot.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 ether);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract NativeEthTest is Test {
    SlotFactory factory;
    MockERC20 token;

    address recipient = makeAddr("recipient");
    address manager = makeAddr("manager");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address liquidator = makeAddr("liquidator");

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

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    function _config() internal view returns (SlotConfig memory) {
        return SlotConfig({
            mutableTax: true,
            mutableUtility: false,
            mutablePolicy: false,
            manager: manager
        });
    }

    function _init() internal pure returns (SlotInitParams memory) {
        return SlotInitParams({
            taxPercentage: 100,          // 1% per 30 days
            utility: address(0),
            liquidationBountyBps: 500,   // 5%
            minDepositSeconds: 86400,    // 1 day
            occupancyPolicy: address(0)
        });
    }

    function _createNativeSlot() internal returns (Slot) {
        return Slot(factory.createSlot(recipient, IERC20(address(0)), _config(), _init()));
    }

    function _createTokenSlot() internal returns (Slot) {
        return Slot(factory.createSlot(recipient, IERC20(address(token)), _config(), _init()));
    }

    // ═══════════════════════════════════════════════════════════
    // SENTINEL
    // ═══════════════════════════════════════════════════════════

    function test_createNativeSlot() public {
        Slot slot = _createNativeSlot();
        assertEq(address(slot.currency()), address(0));
        assertEq(slot.recipient(), recipient);
        assertTrue(slot.isVacant());
    }

    function test_createSlot_rejectsCodelessCurrency() public {
        address notAToken = makeAddr("notAToken");
        vm.expectRevert(Slot.InvalidCurrency.selector);
        factory.createSlot(recipient, IERC20(notAToken), _config(), _init());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --mt test_createNativeSlot -vv`
Expected: FAIL, reverting with `InvalidCurrency()` — `src/Slot.sol:157` still rejects `address(0)`.

- [ ] **Step 3: Add the errors**

In `src/Slot.sol`, after the existing `error NothingToClaim();` on line 52, add:

```solidity
    /// @notice `msg.value` did not match what this slot's currency mode expects.
    /// @dev Native slots require exact value; ERC-20 slots require none. The
    ///      ERC-20 direction is what stops ETH being stranded in a token slot.
    error InvalidValue();

    /// @notice An uncapped native send failed in `withdraw` or `claim`.
    error TransferFailed();
```

- [ ] **Step 4: Replace the currency validation**

In `src/Slot.sol`, replace line 157:

```solidity
        if (address(_currency) == address(0)) revert InvalidCurrency();
```

with:

```solidity
        // `address(0)` is the native-ETH sentinel — deliberately valid. Any
        // other address must actually be a contract: a codeless non-zero
        // currency used to pass this check and produce a slot whose every
        // transfer silently no-ops.
        if (address(_currency) != address(0) && address(_currency).code.length == 0)
            revert InvalidCurrency();
```

- [ ] **Step 5: Add the `_isNative` helper**

In `src/Slot.sol`, immediately above the `_payOrCredit` doc comment (which begins `/// @dev Pay \`to\`, and if the currency refuses...` around line 768), add:

```solidity
    /// @dev True when this slot's market is denominated in native ETH.
    ///      `address(0)` is a sound sentinel because `initialize` rejected it
    ///      outright before native support existed, so no slot predating this
    ///      change can be holding it.
    function _isNative() internal view returns (bool) {
        return address(currency) == address(0);
    }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `forge test --mt "test_createNativeSlot|test_createSlot_rejectsCodelessCurrency" -vv`
Expected: both PASS.

- [ ] **Step 7: Run the full suite for regressions**

Run: `forge test`
Expected: all PASS, same count as Task 1 plus the 2 new tests.

- [ ] **Step 8: Commit**

```bash
git add src/Slot.sol test/NativeEth.t.sol
git commit -m "feat(contracts): accept address(0) currency as native-ETH sentinel

No new storage, so the BeaconProxy layout is unchanged. Also tightens
validation: a codeless non-zero currency now reverts instead of
producing a slot whose transfers silently no-op."
```

---

### Task 3: Native value in and out

Inbound and outbound land together because neither is independently testable — you cannot verify a refund without first funding the slot. The round trip (buy in, withdraw out) is the smallest unit with its own test cycle.

Note the ordering safety property from the spec: the beacon is not upgraded until Task 7, so no deployed contract ever sits in a state where ETH can enter but not leave.

**Files:**
- Modify: `src/Slot.sol:213-246` (`buy`), `src/Slot.sol:376-383` (`topUp`), `src/Slot.sol:386-398` (`withdraw`), `src/Slot.sol:462-468` (`claim`), `src/Slot.sol:784-800` (`_payOrCredit`)
- Test: `test/NativeEth.t.sol` (append)

**Interfaces:**
- Consumes: `_isNative()`, `InvalidValue()`, `TransferFailed()` from Task 2
- Produces:
  - `function buy(address account, uint256 depositAmount, uint256 selfAssessedPrice) external payable` — was non-payable
  - `function topUp(uint256 amount) external payable` — was non-payable
  - Test helper `_buyNative(Slot slot, address buyer, uint256 depositAmt, uint256 selfPrice) internal` — used by Tasks 4, 5 and 6

- [ ] **Step 1: Write the failing tests**

Append to `test/NativeEth.t.sol`, inside `contract NativeEthTest`, after the `_createTokenSlot` helper:

```solidity
    /// @dev Buys a native slot, dealing the buyer exactly what they owe.
    ///      Vacant slots cost only the deposit; occupied ones also cost price.
    function _buyNative(
        Slot slot,
        address buyer,
        uint256 depositAmt,
        uint256 selfPrice
    ) internal {
        uint256 owed = slot.occupant() == address(0)
            ? depositAmt
            : depositAmt + slot.price();
        vm.deal(buyer, owed);
        vm.prank(buyer);
        slot.buy{value: owed}(buyer, depositAmt, selfPrice);
    }
```

and these tests at the end of the contract:

```solidity
    // ═══════════════════════════════════════════════════════════
    // INBOUND
    // ═══════════════════════════════════════════════════════════

    function test_native_buyRecordsDeposit() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        assertEq(slot.occupant(), alice);
        assertEq(slot.price(), 10 ether);
        assertEq(slot.deposit(), 1 ether);
        assertEq(address(slot).balance, 1 ether);
    }

    function test_native_buyRejectsWrongValue() public {
        Slot slot = _createNativeSlot();
        vm.deal(alice, 5 ether);

        vm.prank(alice);
        vm.expectRevert(Slot.InvalidValue.selector);
        slot.buy{value: 0.5 ether}(alice, 1 ether, 10 ether); // too little

        vm.prank(alice);
        vm.expectRevert(Slot.InvalidValue.selector);
        slot.buy{value: 2 ether}(alice, 1 ether, 10 ether);   // too much
    }

    function test_tokenSlot_rejectsValue() public {
        Slot slot = _createTokenSlot();
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        vm.expectRevert(Slot.InvalidValue.selector);
        slot.buy{value: 1 wei}(alice, 1 ether, 10 ether);
    }

    function test_native_topUp() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.deal(bob, 2 ether);
        vm.prank(bob);
        slot.topUp{value: 2 ether}(2 ether);

        assertEq(slot.deposit(), 3 ether);
        assertEq(address(slot).balance, 3 ether);
    }

    function test_native_topUpRejectsMismatch() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.deal(bob, 2 ether);
        vm.prank(bob);
        vm.expectRevert(Slot.InvalidValue.selector);
        slot.topUp{value: 1 ether}(2 ether);
    }

    function test_native_hasNoReceiveFunction() public {
        Slot slot = _createNativeSlot();
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        (bool ok, ) = address(slot).call{value: 1 ether}("");
        assertFalse(ok, "slot must not accept unaccounted ETH");
        assertEq(address(slot).balance, 0);
    }

    // ═══════════════════════════════════════════════════════════
    // OUTBOUND
    // ═══════════════════════════════════════════════════════════

    function test_native_withdrawRoundTrip() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 5 ether, 10 ether);

        // minDepositSeconds is 1 day at 1%/30d on a 10 ether price,
        // so the floor is tiny and 1 ether is comfortably withdrawable.
        uint256 before = alice.balance;
        vm.prank(alice);
        slot.withdraw(1 ether);

        assertEq(alice.balance, before + 1 ether);
        assertEq(slot.deposit(), 4 ether);
        assertEq(address(slot).balance, 4 ether);
    }

    function test_native_evictionRefundsOutgoingOccupant() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        uint256 before = alice.balance;
        _buyNative(slot, bob, 1 ether, 12 ether);

        // Alice gets her remaining deposit plus the sale price, pushed
        // inline because an EOA fits well inside the 30k cap.
        assertEq(slot.occupant(), bob);
        assertGt(alice.balance, before);
        assertEq(slot.withdrawableOf(alice), 0);
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `forge test --mt "test_native_buyRecordsDeposit" -vv`
Expected: FAIL at compile time — `buy` is not payable, so `slot.buy{value: owed}(...)` does not compile. A compile error is the correct failure here.

- [ ] **Step 3: Make `buy` payable and handle native inbound**

In `src/Slot.sol`, change the `buy` signature on line 217 from:

```solidity
    ) external nonReentrant {
```

to:

```solidity
    ) external payable nonReentrant {
```

Then, immediately after `if (account == address(0)) revert InvalidRecipient();` (line 219), add the fail-fast guard:

```solidity
        // Fails fast: the ERC-20 case needs no computed amount, and letting a
        // stray-value call run the policy check first would only waste gas.
        if (!_isNative() && msg.value != 0) revert InvalidValue();
```

Then replace the pull at lines 244-246:

```solidity
        if (owedByBuyer > 0) {
            currency.safeTransferFrom(msg.sender, address(this), owedByBuyer);
        }
```

with:

```solidity
        if (_isNative()) {
            // The value is already held by this contract; there is nothing to
            // pull. This check cannot move to the top of the function because
            // `owedByBuyer` is only known after `_settle()` and the policy.
            if (msg.value != owedByBuyer) revert InvalidValue();
        } else if (owedByBuyer > 0) {
            currency.safeTransferFrom(msg.sender, address(this), owedByBuyer);
        }
```

- [ ] **Step 4: Make `topUp` payable and handle native inbound**

In `src/Slot.sol`, replace the body of `topUp` (lines 376-383) with:

```solidity
    function topUp(uint256 amount) external payable nonReentrant {
        if (occupant() == address(0)) revert NotOccupant();
        if (msg.value != (_isNative() ? amount : 0)) revert InvalidValue();
        _settle();
        if (!_isNative()) {
            currency.safeTransferFrom(msg.sender, address(this), amount);
        }
        _deposit += amount;
        emit Deposited(msg.sender, amount);
        _emitProtocolEvent(EVT_DEPOSITED, abi.encode(msg.sender, amount));
    }
```

- [ ] **Step 5: Add the native branch to `_payOrCredit`**

In `src/Slot.sol`, replace the body of `_payOrCredit` (lines 784-800) with:

```solidity
    function _payOrCredit(address to, uint256 amount) internal {
        if (amount == 0) return;

        bool paid;
        if (_isNative()) {
            // Gas-capped deliberately. Unlike an ERC-20 transfer, a native send
            // runs the recipient's code — and this fires inside SOMEONE ELSE'S
            // transaction (a buy, a liquidation). Uncapped, an outgoing occupant
            // with a gas-burning `receive()` could make their own eviction
            // expensive and unreliable. 30k covers an EOA (2300) and a typical
            // Safe (~20k); anything greedier degrades to a claimable credit,
            // which `claim()` then delivers at full gas.
            (paid, ) = to.call{value: amount, gas: 30_000}("");
        } else {
            address token = address(currency);
            if (token.code.length > 0) {
                (bool ok, bytes memory data) = token.call(
                    abi.encodeCall(IERC20.transfer, (to, amount))
                );
                paid = ok && (data.length == 0 || abi.decode(data, (bool)));
            }
        }

        if (!paid) {
            withdrawableOf[to] += amount;
            emit RefundCredited(to, amount);
        }
    }
```

Keep the existing doc comment above it untouched. Note the `token.code.length` guard stays **inside** the ERC-20 branch — hoisted to the shared path it would route every native payment to credit.

- [ ] **Step 6: Add native branches to `withdraw` and `claim`**

In `src/Slot.sol`, replace line 395:

```solidity
        currency.safeTransfer(msg.sender, amount);
```

with:

```solidity
        // Uncapped and revert-on-failure: this is caller-initiated, so a
        // failure affects only the caller. It is also what makes the 30k cap
        // in `_payOrCredit` safe — a recipient too gas-hungry for the capped
        // push is credited, then collects here with all the gas it needs.
        if (_isNative()) {
            (bool ok, ) = msg.sender.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            currency.safeTransfer(msg.sender, amount);
        }
```

and replace line 466:

```solidity
        currency.safeTransfer(account, amount);
```

with:

```solidity
        if (_isNative()) {
            (bool ok, ) = account.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            currency.safeTransfer(account, amount);
        }
```

- [ ] **Step 7: Run the new tests**

Run: `forge test --mt "test_native_|test_tokenSlot_" -vv`
Expected: all PASS.

- [ ] **Step 8: Run the full suite for regressions**

Run: `forge test`
Expected: all PASS. The ERC-20 tests passing unchanged is the evidence that the token branch did not drift.

- [ ] **Step 9: Commit**

```bash
git add src/Slot.sol test/NativeEth.t.sol
git commit -m "feat(contracts): native ETH in and out of slots

buy/topUp become payable with strict msg.value equality in both
directions — the ERC-20 direction is what stops ETH stranding in a
token slot.

Outbound splits in two tiers: _payOrCredit caps native pushes at 30k
because they fire inside someone else's transaction, while
withdraw/claim send uncapped and revert, because they are
caller-initiated. The cap can therefore only defer delivery, never
destroy it."
```

---

### Task 4: Prove the gas cap holds

This is the task that justifies the 30k cap. Two adversarial receivers, testing two different guarantees: that a hostile occupant cannot block their own eviction, and that the cap defers delivery rather than destroying it.

**Files:**
- Test: `test/NativeEth.t.sol` (append)

**Interfaces:**
- Consumes: `_buyNative` and `_createNativeSlot` from Tasks 2-3
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing tests**

Append these two contracts to `test/NativeEth.t.sol` at **file scope** (outside `contract NativeEthTest`, next to `MockERC20`):

```solidity
/// @dev Burns every wei of gas forwarded to it. Models an occupant trying to
///      make their own eviction fail. Can never receive ETH by any means —
///      which is the point: it must still not be able to block a buy.
contract GasBurner {
    function buyInto(Slot slot, uint256 dep, uint256 price) external payable {
        slot.buy{value: msg.value}(address(this), dep, price);
    }

    receive() external payable {
        while (true) {}
    }
}

/// @dev Needs far more than the 30k push cap but succeeds at full gas.
///      Models a legitimate smart-contract occupant: credited on eviction,
///      paid on claim.
contract GasHog {
    uint256[] private junk;

    function buyInto(Slot slot, uint256 dep, uint256 price) external payable {
        slot.buy{value: msg.value}(address(this), dep, price);
    }

    receive() external payable {
        // Four cold SSTOREs — roughly 80k gas, comfortably over the 30k cap
        // and comfortably under a full-gas claim.
        for (uint256 i = 0; i < 4; i++) junk.push(i);
    }
}

/// @dev Rejects ETH outright. The simplest form of an unpayable recipient,
///      distinct from GasBurner in that it fails immediately rather than by
///      exhausting gas — both must degrade to a credit.
contract RevertingReceiver {
    function buyInto(Slot slot, uint256 dep, uint256 price) external payable {
        slot.buy{value: msg.value}(address(this), dep, price);
    }

    receive() external payable {
        revert("no ETH thanks");
    }
}
```

Then append these tests inside `contract NativeEthTest`:

```solidity
    // ═══════════════════════════════════════════════════════════
    // ADVERSARIAL RECEIVERS
    // ═══════════════════════════════════════════════════════════

    function test_native_gasBurnerCannotBlockEviction() public {
        Slot slot = _createNativeSlot();
        GasBurner burner = new GasBurner();

        vm.deal(address(burner), 1 ether);
        burner.buyInto{value: 1 ether}(slot, 1 ether, 10 ether);
        assertEq(slot.occupant(), address(burner));

        // The eviction must succeed despite the burner's hostile receive().
        //
        // The explicit gas bound is load-bearing, NOT decoration. Forge's
        // default test gas limit is i64::MAX, and the 63/64 rule leaves the
        // outer frame 1/64 of whatever remains — which at that limit is still
        // enormous. Without a realistic bound the buy would survive even with
        // an uncapped push, and this test would pass for the wrong reason.
        // 2M gas models an ordinary transaction.
        uint256 owed = 1 ether + slot.price();
        vm.deal(alice, owed);
        vm.prank(alice);
        slot.buy{value: owed, gas: 2_000_000}(alice, 1 ether, 12 ether);

        assertEq(slot.occupant(), alice);
        assertGt(slot.withdrawableOf(address(burner)), 0, "refund must be credited");
    }

    function test_native_revertingReceiverIsCredited() public {
        Slot slot = _createNativeSlot();
        RevertingReceiver rejecter = new RevertingReceiver();

        vm.deal(address(rejecter), 1 ether);
        rejecter.buyInto{value: 1 ether}(slot, 1 ether, 10 ether);

        _buyNative(slot, alice, 1 ether, 12 ether);

        assertEq(slot.occupant(), alice);
        assertGt(
            slot.withdrawableOf(address(rejecter)),
            0,
            "a reverting recipient must degrade to a credit, not fail the buy"
        );
    }

    function test_native_gasHogIsCreditedThenClaims() public {
        Slot slot = _createNativeSlot();
        GasHog hog = new GasHog();

        vm.deal(address(hog), 1 ether);
        hog.buyInto{value: 1 ether}(slot, 1 ether, 10 ether);

        _buyNative(slot, alice, 1 ether, 12 ether);

        // Too gas-hungry for the 30k push, so it was credited...
        uint256 credited = slot.withdrawableOf(address(hog));
        assertGt(credited, 0, "hog must be credited, not paid inline");

        // ...and claim(), which is uncapped, delivers it.
        uint256 before = address(hog).balance;
        slot.claim(address(hog));

        assertEq(address(hog).balance, before + credited);
        assertEq(slot.withdrawableOf(address(hog)), 0);
    }

    function test_native_gasBurnerClaimReverts() public {
        Slot slot = _createNativeSlot();
        GasBurner burner = new GasBurner();

        vm.deal(address(burner), 1 ether);
        burner.buyInto{value: 1 ether}(slot, 1 ether, 10 ether);
        _buyNative(slot, alice, 1 ether, 12 ether);

        // A contract that burns ALL gas can never receive ETH by any mechanism.
        // claim() reverts rather than silently zeroing the credit.
        vm.expectRevert(Slot.TransferFailed.selector);
        slot.claim(address(burner));

        assertGt(slot.withdrawableOf(address(burner)), 0, "credit must survive");
    }
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `forge test --mt "test_native_gas" -vv`
Expected: all three PASS. These are behaviour-verification tests over Task 3's implementation, so they should pass immediately — if `test_native_gasBurnerCannotBlockEviction` fails, the cap in `_payOrCredit` is missing or wrong, and that is a real bug to fix before continuing.

- [ ] **Step 3: Confirm the cap is actually load-bearing**

A test that would pass without the thing it claims to test is worthless, so verify it fails when the cap is removed.

Temporarily change the native branch of `_payOrCredit` from `to.call{value: amount, gas: 30_000}("")` to an uncapped `to.call{value: amount}("")`, then run:

Run: `forge test --mt test_native_gasBurnerCannotBlockEviction -vv`
Expected: **FAIL** with an out-of-gas revert. The `gas: 2_000_000` bound on the buy is what makes this demonstration work — see the comment in the test.

If it still PASSES, the gas bound in the test is too generous relative to what `GasBurner` can consume. Lower it (try `500_000`) until removing the cap produces a failure, then keep that value.

**Then restore `gas: 30_000`** and re-run to confirm PASS again. Do not commit the uncapped version.

- [ ] **Step 4: Commit**

```bash
git add test/NativeEth.t.sol
git commit -m "test(contracts): adversarial receivers for the native push cap

GasBurner proves a hostile occupant cannot block their own eviction.
GasHog proves the cap defers delivery rather than destroying it —
credited on eviction, paid in full on claim."
```

---

### Task 5: Full native lifecycle and the balance invariant

Covers the paths Task 3 did not: `release`, `liquidate`, `collect`, and tax attribution. The invariant assertion is what catches any wei that enters or leaves unaccounted.

**Files:**
- Test: `test/NativeEth.t.sol` (append)

**Interfaces:**
- Consumes: `_buyNative`, `_createNativeSlot` from Tasks 2-3
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the invariant helper and lifecycle tests**

Append inside `contract NativeEthTest`:

```solidity
    // ═══════════════════════════════════════════════════════════
    // LIFECYCLE + INVARIANT
    // ═══════════════════════════════════════════════════════════

    /// @dev Every wei the slot holds is attributed to exactly one of three
    ///      places. This holds only because Slot has no `receive()`: nothing
    ///      can enter without being recorded. `withdrawableOf` is not
    ///      enumerable, so the known actors are summed explicitly.
    function _assertBalanceInvariant(Slot slot, address[] memory credited) internal view {
        uint256 credits;
        for (uint256 i = 0; i < credited.length; i++) {
            credits += slot.withdrawableOf(credited[i]);
        }
        assertEq(
            address(slot).balance,
            slot.deposit() + slot.collectedTax() + credits,
            "balance must equal deposit + collectedTax + credits"
        );
    }

    function _actors() internal view returns (address[] memory a) {
        a = new address[](4);
        a[0] = alice;
        a[1] = bob;
        a[2] = recipient;
        a[3] = liquidator;
    }

    function test_native_releaseRefundsAndFlushesTax() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.warp(block.timestamp + 15 days);

        uint256 recipientBefore = recipient.balance;
        uint256 aliceBefore = alice.balance;

        vm.prank(alice);
        slot.release();

        assertEq(slot.occupant(), address(0));
        assertTrue(slot.isVacant());
        assertGt(recipient.balance, recipientBefore, "tax must flush to recipient");
        assertGt(alice.balance, aliceBefore, "remaining deposit must refund");
        _assertBalanceInvariant(slot, _actors());
    }

    function test_native_liquidatePaysBounty() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        // Run the deposit dry. 1% per 30 days on a 10 ether price is
        // 0.1 ether per 30 days, so a 1 ether deposit lasts ~300 days.
        vm.warp(block.timestamp + 5000 days);
        assertTrue(slot.isInsolvent());

        uint256 bountyBefore = liquidator.balance;
        vm.prank(liquidator);
        slot.liquidate();

        assertEq(slot.occupant(), address(0));
        assertGt(liquidator.balance, bountyBefore, "bounty must be paid in ETH");
        _assertBalanceInvariant(slot, _actors());
    }

    function test_native_collectFlushesTax() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.warp(block.timestamp + 10 days);

        uint256 before = recipient.balance;
        slot.collect();

        assertGt(recipient.balance, before);
        assertEq(slot.collectedTax(), 0);
        _assertBalanceInvariant(slot, _actors());
    }

    function test_native_taxChargesOutgoingOccupant() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.warp(block.timestamp + 10 days);

        // Buying charges the OUTGOING occupant for their own tenure, so
        // alice's deposit funds the tax, not bob's.
        _buyNative(slot, bob, 1 ether, 12 ether);

        assertEq(slot.occupant(), bob);
        assertEq(slot.deposit(), 1 ether, "bob's deposit must be untouched");
        assertGt(slot.collectedTax(), 0, "alice's tenure must be charged");
        _assertBalanceInvariant(slot, _actors());
    }

    function test_native_selfAssessWorks() public {
        Slot slot = _createNativeSlot();
        _buyNative(slot, alice, 1 ether, 10 ether);

        vm.prank(alice);
        slot.selfAssess(20 ether);

        assertEq(slot.price(), 20 ether);
        _assertBalanceInvariant(slot, _actors());
    }
```

- [ ] **Step 2: Run the tests**

Run: `forge test --mt "test_native_release|test_native_liquidate|test_native_collect|test_native_tax|test_native_selfAssess" -vv`
Expected: all PASS.

If `test_native_liquidatePaysBounty` fails on `isInsolvent()`, the warp is not far enough for the configured tax rate — increase it rather than lowering the deposit, so the test still exercises a realistic tenure.

- [ ] **Step 3: Run the full suite**

Run: `forge test`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add test/NativeEth.t.sol
git commit -m "test(contracts): native ETH lifecycle and balance invariant

Covers release, liquidate, collect, self-assess and tax attribution,
each asserting that slot balance equals deposit + collectedTax +
outstanding credits."
```

---

### Task 6: Allow ETH-denominated price floors

`MinimumPricePolicy` binds a currency because a bare integer floor is meaningless without decimals — `100e6` is 100 USDC but a ten-billionth of an 18-decimal token. `address(0)` denotes 18-decimal ETH unambiguously, so that rationale is satisfied rather than bypassed. The policy contract itself needs no change: `_assertCurrency` is pure equality against `Slot.currency()`.

**Files:**
- Modify: `src/policies/MinimumPricePolicyFactory.sol:51`
- Test: `test/NativeEth.t.sol` (append)

**Interfaces:**
- Consumes: `_createNativeSlot`, `_buyNative` from Tasks 2-3
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing test**

Add this import at the top of `test/NativeEth.t.sol`, alongside the existing imports:

```solidity
import {MinimumPricePolicyFactory} from "../src/policies/MinimumPricePolicyFactory.sol";
import {MinimumPricePolicy} from "../src/policies/MinimumPricePolicy.sol";
```

Append inside `contract NativeEthTest`:

```solidity
    // ═══════════════════════════════════════════════════════════
    // PRICE FLOOR ON A NATIVE SLOT
    // ═══════════════════════════════════════════════════════════

    function test_native_minimumPriceFloor() public {
        MinimumPricePolicyFactory policyFactory = new MinimumPricePolicyFactory();
        address policy = policyFactory.getOrDeploy(address(0), 5 ether);

        SlotInitParams memory init = _init();
        init.occupancyPolicy = policy;
        Slot slot = Slot(factory.createSlot(recipient, IERC20(address(0)), _config(), init));

        // Below the floor is rejected.
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(MinimumPricePolicy.PriceBelowFloor.selector, 5 ether)
        );
        slot.buy{value: 1 ether}(alice, 1 ether, 4 ether);

        // At or above the floor is accepted.
        _buyNative(slot, alice, 1 ether, 5 ether);
        assertEq(slot.price(), 5 ether);
    }

    function test_native_tokenBoundPolicyRejectsNativeSlot() public {
        MinimumPricePolicyFactory policyFactory = new MinimumPricePolicyFactory();
        address policy = policyFactory.getOrDeploy(address(token), 5 ether);

        SlotInitParams memory init = _init();
        init.occupancyPolicy = policy;
        Slot slot = Slot(factory.createSlot(recipient, IERC20(address(0)), _config(), init));

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(MinimumPricePolicy.WrongCurrency.selector);
        slot.buy{value: 1 ether}(alice, 1 ether, 10 ether);
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --mt test_native_minimumPriceFloor -vv`
Expected: FAIL, reverting with `InvalidCurrency()` from `MinimumPricePolicyFactory:51`.

- [ ] **Step 3: Relax the factory validation**

In `src/policies/MinimumPricePolicyFactory.sol`, replace line 51:

```solidity
        if (currency == address(0)) revert InvalidCurrency();
```

with:

```solidity
        // `address(0)` is the native-ETH sentinel and denotes 18 decimals
        // unambiguously, so the decimals rationale for binding a currency is
        // satisfied, not bypassed. Any other address must be a real contract.
        if (currency != address(0) && currency.code.length == 0)
            revert InvalidCurrency();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `forge test --mt "test_native_minimumPriceFloor|test_native_tokenBoundPolicyRejectsNativeSlot" -vv`
Expected: both PASS.

- [ ] **Step 5: Run the full suite**

Run: `forge test`
Expected: all PASS, including the existing `test/MinimumPricePolicy.t.sol` cases unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/policies/MinimumPricePolicyFactory.sol test/NativeEth.t.sol
git commit -m "feat(contracts): allow ETH-denominated minimum price floors

address(0) denotes 18-decimal ETH unambiguously, so the policy's
decimals rationale still holds. Non-zero currencies now additionally
have to be real contracts."
```

---

### Task 7: Verify and prepare the upgrade

The beacon upgrade is the only step that touches deployed contracts. It is prepared here but **not executed** — running it is the user's call.

**Files:**
- Read: `script/UpgradeSlotImplementation.s.sol`
- Modify: `docs/superpowers/specs/2026-08-08-native-eth-slots-design.md` (status line only)

**Interfaces:**
- Consumes: everything from Tasks 1-6
- Produces: nothing

- [ ] **Step 1: Full suite, clean build**

Run:
```bash
forge clean && forge test
```
Expected: all PASS. A clean build matters because `via_ir = true` and stale artifacts can mask compile problems.

- [ ] **Step 2: Confirm no storage layout drift**

The baseline was captured **before Task 1 began**, at the commit the branch started from. Using a stashing approach here instead would be fragile: `apps/contracts/cache/solidity-files-cache.json` is a tracked file that forge rewrites on every run, so `git stash`/`pop` races with the build.

Run:
```bash
forge inspect Slot storage-layout > "$LAYOUT_DIR/slot-layout-after.txt"
diff "$LAYOUT_DIR/slot-layout-before.txt" "$LAYOUT_DIR/slot-layout-after.txt" \
  && echo "OK: storage layout unchanged"
```

(`LAYOUT_DIR` is the scratchpad path recorded in Step 0 of Task 1.)

Expected: **no differences**, then `OK: storage layout unchanged`. Any diff means a storage variable was added or reordered, which would corrupt every live slot on upgrade — stop and report it.

- [ ] **Step 3: Confirm Slot has no receive/fallback**

Run:
```bash
grep -n "receive()\|fallback()" src/Slot.sol || echo "OK: no receive/fallback"
```
Expected: `OK: no receive/fallback`. The balance invariant from Task 5 depends on this.

- [ ] **Step 4: Read the upgrade script and report what it does**

Run: `cat script/UpgradeSlotImplementation.s.sol`

Summarise for the user: which env vars it needs, which network it targets, and what it changes. **Do not run it.** Deploying is an outward-facing action that needs explicit approval, and the user may want to sequence it themselves.

- [ ] **Step 5: Mark the spec implemented**

In `docs/superpowers/specs/2026-08-08-native-eth-slots-design.md`, change:

```markdown
**Status:** Draft, pending review
```

to:

```markdown
**Status:** Implemented — beacon upgrade pending
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-08-native-eth-slots-design.md
git commit -m "docs(contracts): mark native ETH spec implemented

Contracts and tests are complete; the beacon upgrade is still to be run."
```

- [ ] **Step 7: Report to the user**

State plainly: the test count before and after, that the storage layout diff was empty, and that the beacon upgrade has **not** been run. If any step above failed or was skipped, say so explicitly rather than reporting completion.

---

## Notes for the implementer

**On `Slot(addr)` casts.** `ERC721Slots.sol` uses `Slot(payable(slot))` even though `Slot` has no payable fallback — harmless verbosity that predates this work. Adding `payable` to `buy`/`topUp` does **not** require callers to change their casts; only a `receive()`/`fallback()` would, and we are deliberately not adding one. Existing `Slot(addr)` casts throughout the tests stay valid.

**On `.call{value:}` and address types.** In Solidity 0.8, `.call{value: x}("")` works on a plain `address` — only `.transfer()` and `.send()` require `address payable`. No casts are needed in any snippet above.

**If an existing test fails at any point,** the change is wrong. Do not edit the existing test to accommodate it. The ERC-20 branch passing unchanged is the central safety claim of this work.
