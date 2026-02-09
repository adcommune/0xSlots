// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISlotsModule} from "../ISlotsModule.sol";
import {console2} from "forge-std/console2.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract MetadataModule is ERC165, ISlotsModule {
  function name() external pure returns (string memory) {
    return "MetadataModule";
  }

  function version() external pure returns (string memory) {
    return "1.0.0";
  }

  struct MetadataSlot {
    string metadata;
    address owner;
  }

  mapping(address land => mapping(uint256 slotId => MetadataSlot metadata))
    public _metadata;

  event MetadataSlotUpdated(
    address land,
    uint256 slotId,
    MetadataSlot metadata
  );

  modifier onlyOwner(address land, uint256 slotId) {
    require(
      msg.sender == _metadata[land][slotId].owner,
      "Only owner can set metadata"
    );
    _;
  }

  function setMetadata(
    address land,
    uint256 slotId,
    string memory metadata
  ) external onlyOwner(land, slotId) {
    _metadata[land][slotId] = MetadataSlot({
      metadata: metadata,
      owner: msg.sender
    });
    emit MetadataSlotUpdated(land, slotId, _metadata[land][slotId]);
  }

  function getMetadata(
    address land,
    uint256 slotId
  ) external view returns (MetadataSlot memory) {
    return _metadata[land][slotId];
  }

  function onTransfer(uint256 slotId, address /*from*/, address to) external {
    _metadata[msg.sender][slotId] = MetadataSlot({metadata: "", owner: to});
    emit MetadataSlotUpdated(msg.sender, slotId, _metadata[msg.sender][slotId]);
  }

  function onRelease(uint256 slotId, address /*from*/) external {
    _metadata[msg.sender][slotId] = MetadataSlot({
      metadata: "",
      owner: address(0)
    });
    emit MetadataSlotUpdated(msg.sender, slotId, _metadata[msg.sender][slotId]);
  }

  function onPriceUpdate(
    uint256 slotId,
    uint256 /*oldPrice*/,
    uint256 /*newPrice*/
  ) external {}

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(ERC165, IERC165) returns (bool) {
    return
      interfaceId == type(ISlotsModule).interfaceId ||
      super.supportsInterface(interfaceId);
  }
}
