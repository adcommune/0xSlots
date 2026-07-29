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
