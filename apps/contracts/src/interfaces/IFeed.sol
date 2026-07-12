// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Read interface every Feed contract must implement.
interface IFeed {
    function name() external view returns (string memory);
    function metadataURI() external view returns (string memory);
    /// @notice The declared tax/treasury recipient for this feed's slots.
    ///         Feed never custodies funds; this only *declares* an address.
    function feedRecipient() external view returns (address);
    function getSlots() external view returns (address[] memory);
    function slotCount() external view returns (uint256);
    function containsSlot(address slot) external view returns (bool);
}
