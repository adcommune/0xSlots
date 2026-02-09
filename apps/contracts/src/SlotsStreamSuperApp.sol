// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CFASuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFASuperAppBase.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {Slots} from "./Slots.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SlotDirective} from "./interfaces/ISlots.sol";
import {CFAv1Forwarder} from "@superfluid-finance/ethereum-contracts/contracts/utils/CFAv1Forwarder.sol";
import {CFASuperAppBaseUpgradeable} from "./lib/CFASuperAppBaseUpgradeable.sol";

/**
 * TODO:
 * - Release slots in case of uncontrolled flow deletion
 */
contract SlotsStreamSuperApp is CFASuperAppBaseUpgradeable {
  using SuperTokenV1Library for ISuperToken;

  uint256 public constant MAX_SLOTS_PER_USER = 100;

  event SlotStreamDataDecodeFailed(address indexed sender);
  event SlotsAutoReleased(address indexed sender, uint256[] slotIds, int96 remainingFlow);

  error MaxSlotsPerUserExceeded(address user, uint256 currentSlots);

  Slots public slots;

  mapping(uint256 => address) public slotOwnership;
  mapping(address => uint256[]) public ownedSlots;

  function initialize(
    ISuperfluid host,
    Slots harb
  ) public reinitializer(1) {
    slots = harb;
    __CFASuperAppBaseUpgradeable_init(host);
    selfRegister(true, true, true);
  }

  function isAcceptedSuperToken(
    ISuperToken superToken
  ) public view override returns (bool) {
    return slots.isCurrencyAllowed(address(superToken));
  }

  function onFlowCreated(
    ISuperToken superToken,
    address sender,
    bytes calldata ctx
  ) internal override returns (bytes memory) {
    _handleSlotStreamData(sender, ctx);
    int96 currentFlowRateToRecipient = _currentFlowRateToOwner(superToken);
    int96 flowRateFromSender = superToken.getFlowRate(sender, address(this));
    int96 newFlowRate = currentFlowRateToRecipient + flowRateFromSender;
    return superToken.flowWithCtx(_recipient(), newFlowRate, ctx);
  }

  function onFlowUpdated(
    ISuperToken superToken,
    address sender,
    int96 previousFlowRate,
    uint256 /*lastUpdated*/,
    bytes calldata ctx
  ) internal override returns (bytes memory) {
    _handleSlotStreamData(sender, ctx);
    int96 currentFlowRateToThis = _currentFlowRateToThis(superToken, sender);
    int96 currentFlowRateToRecipient = _currentFlowRateToOwner(superToken);
    int96 delta = currentFlowRateToThis - previousFlowRate;
    bool updatingDown = delta < 0;

    if (updatingDown) {
      int96 currentFlow = currentFlowRateToThis;
      int96 owedFlow = _calculateOwedFlow(sender);

      // If current flow is less than what's owed, we need to release some slots
      if (currentFlow < owedFlow) {
        uint256[] memory slotsToRelease = _calculateSlotsToRelease(
          sender,
          currentFlow
        );

        // Release the calculated slots
        for (uint256 i = 0; i < slotsToRelease.length; i++) {
          slots.release(slotsToRelease[i]);
        }

        if (slotsToRelease.length > 0) {
          emit SlotsAutoReleased(sender, slotsToRelease, currentFlow);
        }
      }
    }

    // Apply the delta to the recipient flow
    int96 newFlowRate = currentFlowRateToRecipient + delta;

    return superToken.flowWithCtx(_recipient(), newFlowRate, ctx);
  }

  function onFlowDeleted(
    ISuperToken superToken,
    address sender,
    address /*receiver*/,
    int96 previousFlowRate,
    uint256 /*lastUpdated*/,
    bytes calldata ctx
  ) internal override returns (bytes memory) {
    _handleSlotStreamData(sender, ctx);
    for (uint256 i = 0; i < ownedSlots[sender].length; i++) {
      uint256 slotId = ownedSlots[sender][i];
      slots.release(slotId);
    }
    delete ownedSlots[sender];
    int96 currentFlowToRecipient = _currentFlowRateToOwner(superToken);
    int96 newFlowRate = currentFlowToRecipient - previousFlowRate;
    return superToken.flowWithCtx(_recipient(), newFlowRate, ctx);
  }

  function _currentFlowRateToThis(
    ISuperToken t,
    address sender
  ) internal view returns (int96) {
    return t.getFlowRate(sender, address(this));
  }

  function _currentFlowRateToOwner(
    ISuperToken t
  ) internal view returns (int96) {
    return t.getFlowRate(address(this), _recipient());
  }

  function _recipient() internal view returns (address) {
    return slots.owner();
  }

  function _decodeSlotStreamData(
    bytes memory ctx
  ) external view returns (uint256, SlotDirective) {
    ISuperfluid.Context memory decodedCtx = HOST.decodeCtx(ctx);
    bytes memory userData = decodedCtx.userData;
    return abi.decode(userData, (uint256, SlotDirective));
  }

  function _handleSlotStreamData(address sender, bytes memory ctx) internal {
    ISuperfluid.Context memory decodedCtx = HOST.decodeCtx(ctx);
    bytes memory userData = decodedCtx.userData;

    if (userData.length > 0) {
      try this._decodeSlotStreamData(ctx) returns (
        uint256 slotId,
        SlotDirective directive
      ) {
        if (directive == SlotDirective.GAIN_OWNERSHIP) {
          slotOwnership[slotId] = sender;
          _addSlot(sender, slotId);
        } else if (directive == SlotDirective.LOSE_OWNERSHIP) {
          slotOwnership[slotId] = address(0);
          _removeSlot(sender, slotId);
        }
      } catch {
        emit SlotStreamDataDecodeFailed(sender);
      }
    }
  }

  function _addSlot(address owner, uint256 slotId) internal {
    if (ownedSlots[owner].length >= MAX_SLOTS_PER_USER) {
      revert MaxSlotsPerUserExceeded(owner, ownedSlots[owner].length);
    }
    ownedSlots[owner].push(slotId);
  }

  function _removeSlot(address owner, uint256 slotId) internal {
    uint256[] storage slots = ownedSlots[owner];
    for (uint256 i = 0; i < slots.length; i++) {
      if (slots[i] == slotId) {
        // Swap with last element and pop
        uint256 lastIndex = slots.length - 1;
        if (i != lastIndex) {
          slots[i] = slots[lastIndex];
        }
        slots.pop();
        break;
      }
    }
  }

  function getOwnedSlots(
    address owner
  ) external view returns (uint256[] memory) {
    return ownedSlots[owner];
  }

  function _calculateOwedFlow(address account) internal view returns (int96) {
    int96 owedFlow = 0;
    for (uint256 i = 0; i < ownedSlots[account].length; i++) {
      uint256 slotId = ownedSlots[account][i];
      int96 slotFlow = slots.calculateFlowRate(slotId);
      owedFlow += slotFlow;
    }
    return owedFlow;
  }

  function _calculateSlotsToRelease(
    address sender,
    int96 currentFlow
  ) internal view returns (uint256[] memory) {
    uint256[] storage ownedSlotsArray = ownedSlots[sender];
    uint256 totalSlots = ownedSlotsArray.length;

    // If no slots owned, return empty array
    if (totalSlots == 0) {
      return new uint256[](0);
    }

    // Calculate how much flow is needed for remaining slots
    int96 remainingFlowNeeded = 0;
    uint256 slotsToKeep = 0;

    // Start from the beginning and count how many slots we can keep
    for (uint256 i = 0; i < totalSlots; i++) {
      uint256 slotId = ownedSlotsArray[i];
      int96 slotFlow = slots.calculateFlowRate(slotId);

      if (remainingFlowNeeded + slotFlow <= currentFlow) {
        remainingFlowNeeded += slotFlow;
        slotsToKeep++;
      } else {
        break;
      }
    }

    // Calculate how many slots to release (from the end)
    uint256 slotsToReleaseCount = totalSlots - slotsToKeep;

    if (slotsToReleaseCount == 0) {
      return new uint256[](0);
    }

    // Create array of slots to release (from the end of the array)
    uint256[] memory slotsToRelease = new uint256[](slotsToReleaseCount);
    for (uint256 i = 0; i < slotsToReleaseCount; i++) {
      // Get slots from the end of the array
      uint256 slotIndex = totalSlots - 1 - i;
      slotsToRelease[i] = ownedSlotsArray[slotIndex];
    }

    return slotsToRelease;
  }
}
