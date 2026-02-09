// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {console2} from "forge-std/Test.sol";
import {DSTestFull} from "./DSTestFull.sol";
import {TokenLauncher} from "../src/token/TokenLauncher.sol";

contract TokenLauncherTest is DSTestFull {
  address unifactory = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
  address positionManager = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
  address swapRouter = 0x2626664c2603336E57B271c5C0b26F421741e481;
  address weth = 0x4200000000000000000000000000000000000006;
  address superTokenFactory = 0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3;
  TokenLauncher launcher;

  address owner = vm.addr(44);
  address donald = vm.addr(70);

  function setUp() public {
    vm.createSelectFork("base");

    vm.prank(owner);
    launcher = new TokenLauncher(
      TokenLauncher.DeploymentParams(
        unifactory,
        positionManager,
        swapRouter,
        weth,
        superTokenFactory
      )
    );
  }

  function testTokenLauncher() public {
    uint256 supply = 100_000_000_000 ether;

    vm.deal(address(launcher), 100 ether);
    vm.deal(donald, 100 ether);
    vm.deal(owner, 100 ether);

    vm.prank(owner);
    launcher.launchToken{value: 1 ether}(
      TokenLauncher.TokenLaunchArgs(
        "Donald",
        "D",
        supply,
        supply,
        0.00001 ether,
        0,
        0
      )
    );
  }
}
