// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {SlotFactory} from "../src/SlotFactory.sol";
import {Slot} from "../src/Slot.sol";
import {MetadataModule} from "../src/modules/MetadataModule.sol";
import {SlotNameRegistry} from "../src/ens/SlotNameRegistry.sol";
import {SlotNameResolver} from "../src/ens/SlotNameResolver.sol";
import {IENSRegistry} from "../src/ens/IENSRegistry.sol";

/// @dev Mock ENS registry for testing
contract MockENS is IENSRegistry {
    mapping(bytes32 => address) public owners;
    mapping(bytes32 => address) public resolvers;

    function setSubnodeRecord(bytes32 node, bytes32 label, address _owner, address _resolver, uint64) external {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        owners[subnode] = _owner;
        resolvers[subnode] = _resolver;
    }

    function setResolver(bytes32 node, address _resolver) external {
        resolvers[node] = _resolver;
    }

    function owner(bytes32 node) external view returns (address) {
        return owners[node];
    }

    function resolver(bytes32 node) external view returns (address) {
        return resolvers[node];
    }

    // Helper: set owner directly for setup
    function setOwner(bytes32 node, address _owner) external {
        owners[node] = _owner;
    }
}

/// @dev Mock ERC20 for testing
contract MockToken is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract SlotNamesTest is Test {
    MockENS ens;
    MockToken usdc;
    SlotFactory factory;
    SlotNameRegistry registry;
    SlotNameResolver resolver;
    MetadataModule metadataModule;

    address admin = address(0xAD);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address treasury = address(0x77EA5);

    // namehash("slots.eth") — for testing we use a fixed value
    bytes32 constant PARENT_NODE = keccak256("slots.eth");

    function setUp() public {
        // Deploy mock ENS + token
        ens = new MockENS();
        usdc = new MockToken();

        // Deploy factory via proxy
        Slot slotImpl = new Slot();
        SlotFactory factoryImpl = new SlotFactory();
        ERC1967Proxy factoryProxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeCall(SlotFactory.initialize, (admin, address(slotImpl)))
        );
        factory = SlotFactory(address(factoryProxy));

        // Deploy metadata module
        MetadataModule metaImpl = new MetadataModule();
        ERC1967Proxy metaProxy = new ERC1967Proxy(
            address(metaImpl),
            abi.encodeCall(MetadataModule.initialize, (admin))
        );
        metadataModule = MetadataModule(address(metaProxy));

        // Deploy resolver first (needs registry address — chicken-and-egg, deploy with placeholder)
        // We'll deploy registry, then resolver, then update registry
        // Actually: resolver takes registry in constructor. Deploy registry first, get address, then resolver.
        
        // Predict registry address
        address predictedRegistry = vm.computeCreateAddress(address(this), vm.getNonce(address(this)));
        
        // Deploy resolver with predicted registry
        resolver = new SlotNameResolver(predictedRegistry);
        
        // Deploy registry (must be next create)
        // Actually the nonce already incremented from resolver deploy, so let's do it differently
        registry = new SlotNameRegistry(
            address(ens),
            PARENT_NODE,
            address(factory),
            address(resolver),
            treasury,
            IERC20(address(usdc)),
            500, // 5% tax
            address(metadataModule)
        );

        // Check that resolver's registry matches
        // If prediction was wrong, we need to fix it
        if (address(registry) != predictedRegistry) {
            // Re-deploy with correct address
            resolver = new SlotNameResolver(address(registry));
            registry.setResolver(address(resolver));
        }

        // Set registry as owner of parent node in ENS
        ens.setOwner(PARENT_NODE, address(registry));

        // Fund alice
        usdc.mint(alice, 1000e6);
    }

    function test_register_name() public {
        address slot = registry.register("nike");

        // Slot was created
        assertTrue(slot != address(0), "slot should be deployed");

        // Name is registered
        assertEq(registry.getSlot("nike"), slot);
        assertFalse(registry.available("nike"));
        assertEq(registry.nameCount(), 1);

        // ENS subnode points to resolver
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        assertEq(ens.resolver(subnode), address(resolver));
    }

    function test_register_then_buy_controls_name() public {
        // Register name
        address slot = registry.register("nike");

        // Alice buys the slot
        vm.startPrank(alice);
        usdc.approve(slot, 100e6);
        Slot(slot).buy(50e6, 100e6); // deposit 50, price 100
        vm.stopPrank();

        // Alice is now the occupant
        assertEq(Slot(slot).occupant(), alice);

        // Resolver returns alice as the default addr
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        assertEq(resolver.addr(subnode), alice);
    }

    function test_occupant_can_set_custom_addr() public {
        address slot = registry.register("nike");
        address customAddr = address(0xC0FFEE);

        // Alice buys
        vm.startPrank(alice);
        usdc.approve(slot, 100e6);
        Slot(slot).buy(50e6, 100e6);

        // Set custom resolution address
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        resolver.setAddr(subnode, customAddr);
        vm.stopPrank();

        // Resolver returns custom addr
        assertEq(resolver.addr(subnode), customAddr);
    }

    function test_occupant_can_set_text_records() public {
        address slot = registry.register("nike");

        vm.startPrank(alice);
        usdc.approve(slot, 100e6);
        Slot(slot).buy(50e6, 100e6);

        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        resolver.setText(subnode, "avatar", "https://example.com/avatar.png");
        resolver.setText(subnode, "url", "https://nike.com");
        vm.stopPrank();

        assertEq(resolver.text(subnode, "avatar"), "https://example.com/avatar.png");
        assertEq(resolver.text(subnode, "url"), "https://nike.com");
    }

    function test_non_occupant_cannot_set_addr() public {
        address slot = registry.register("nike");

        vm.startPrank(alice);
        usdc.approve(slot, 100e6);
        Slot(slot).buy(50e6, 100e6);
        vm.stopPrank();

        // Bob tries to set addr — should fail
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        vm.prank(bob);
        vm.expectRevert(SlotNameResolver.NotOccupant.selector);
        resolver.setAddr(subnode, bob);
    }

    function test_force_buy_transfers_name_control() public {
        address slot = registry.register("nike");

        // Alice buys first
        vm.startPrank(alice);
        usdc.approve(slot, 100e6);
        Slot(slot).buy(50e6, 100e6);
        
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        resolver.setAddr(subnode, alice);
        vm.stopPrank();

        assertEq(resolver.addr(subnode), alice);

        // Bob force-buys at alice's price (100 USDC)
        usdc.mint(bob, 1000e6);
        vm.startPrank(bob);
        usdc.approve(slot, 200e6);
        Slot(slot).buy(100e6, 200e6); // deposit 100, new price 200
        vm.stopPrank();

        // Bob is now occupant
        assertEq(Slot(slot).occupant(), bob);

        // addr() still returns alice's custom addr (not auto-cleared)
        // Bob should set his own
        vm.prank(bob);
        resolver.setAddr(subnode, bob);
        assertEq(resolver.addr(subnode), bob);
    }

    function test_duplicate_name_reverts() public {
        registry.register("nike");

        vm.expectRevert(SlotNameRegistry.NameAlreadyRegistered.selector);
        registry.register("nike");
    }

    function test_short_name_reverts() public {
        vm.expectRevert(SlotNameRegistry.NameTooShort.selector);
        registry.register("ab");
    }

    function test_invalid_chars_revert() public {
        vm.expectRevert(SlotNameRegistry.InvalidCharacter.selector);
        registry.register("NIKE"); // uppercase

        vm.expectRevert(SlotNameRegistry.InvalidCharacter.selector);
        registry.register("ni ke"); // space

        vm.expectRevert(SlotNameRegistry.InvalidCharacter.selector);
        registry.register("ni.ke"); // dot
    }

    function test_valid_names() public {
        registry.register("nike");
        registry.register("hello-world");
        registry.register("123");
        registry.register("a-1-b");
        assertEq(registry.nameCount(), 4);
    }

    function test_vacant_slot_resolves_zero() public {
        address slot = registry.register("nike");

        // No one bought it yet — occupant is zero
        bytes32 subnode = keccak256(abi.encodePacked(PARENT_NODE, keccak256("nike")));
        assertEq(resolver.addr(subnode), address(0));
        assertEq(Slot(slot).occupant(), address(0));
    }
}
