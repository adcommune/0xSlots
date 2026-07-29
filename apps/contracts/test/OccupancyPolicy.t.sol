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
}
