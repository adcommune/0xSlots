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
