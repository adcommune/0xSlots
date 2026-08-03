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

  /// @notice Tax was taken from `occupant`'s deposit.
  /// @dev The economic counterpart to the three occupancy hooks above, which
  ///      only report WHO holds the slot and at what price — never that money
  ///      moved. Modules doing revenue share, rebates, loyalty or contribution
  ///      accounting need this one.
  ///
  ///      `paid` is capped by the remaining deposit and is the only sound basis
  ///      for accounting. `owed - paid` is non-zero exactly when the occupant
  ///      has run dry, which is a useful distress signal.
  ///
  ///      Do NOT rely on this hook for anything whose correctness matters:
  ///      module calls are gas-capped and failures are swallowed (see
  ///      `Slot._notifyModule`). The `TaxPaid` event is the authoritative
  ///      record and always fires. This hook is for reacting, not for being the
  ///      source of truth.
  ///
  ///      CALLED MID-TRANSACTION. Unlike `onTransfer`/`onRelease`, which fire
  ///      after their entry point has settled, this fires from `_accrue` inside
  ///      `_settle()` — the first statement of every mutating function. The slot
  ///      is in its PRE-operation state: during `buy()`, `occupant()` still
  ///      returns the outgoing occupant. Reentry into the slot is blocked by
  ///      `nonReentrant`, but treat any state you read here as in-flux.
  function onSettle(
    uint256 slotId,
    address occupant,
    uint256 owed,
    uint256 paid
  ) external;

  /// @notice Module fee in basis points (e.g. 500 = 5%), taken from collected tax
  function feeBps() external view returns (uint256);

  /// @notice Address that receives module fees (EOA, multisig, Splits, etc.)
  function feeRecipient() external view returns (address);

  /// @notice Module metadata URI (e.g. ipfs://Qm... pointing to JSON with image, description)
  function moduleURI() external view returns (string memory);
}
