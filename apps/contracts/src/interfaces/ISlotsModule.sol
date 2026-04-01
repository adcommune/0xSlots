// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface ISlotsModule is IERC165 {
  function name() external view returns (string memory);

  function version() external view returns (string memory);

  function onTransfer(uint256 slotId, address from, address to) external;

  function onPriceUpdate(
    uint256 slotId,
    uint256 oldPrice,
    uint256 newPrice
  ) external;

  function onRelease(uint256 slotId, address from) external;

  /// @notice Module fee in basis points (e.g. 500 = 5%), taken from collected tax
  function feeBps() external view returns (uint256);

  /// @notice Address that receives module fees (EOA, multisig, Splits, etc.)
  function feeRecipient() external view returns (address);

  /// @notice Module metadata URI (e.g. ipfs://Qm... pointing to JSON with image, description)
  function moduleURI() external view returns (string memory);
}
