// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRecipientModule} from "./modules/RecipientModile.sol";
import {PullSplit} from "@split/contract/splitters/pull/PullSplit.sol";

contract AdLandSplitDistributor is IRecipientModule, PullSplit {
  constructor(address _splitWarehouse) PullSplit(_splitWarehouse) {}

  function id() external pure returns (string memory) {
    return "split-distributor";
  }
}
