// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuardUpgradeable} from "@openzeppelin-upgradeable/contracts/security/ReentrancyGuardUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISlotsModule} from "../ISlotsModule.sol";
import {Slot, SlotEscrow, SlotParams, TaxUpdate, TaxUpdateStatus, ISlotsEvents} from "./ISlots.sol";
import {SlotsHub} from "./SlotsHub.sol";

/// @title Slots (v2) — Harberger tax with escrow deposits, no Superfluid
contract Slots is ISlotsEvents, ReentrancyGuardUpgradeable, OwnableUpgradeable {
  using SafeERC20 for IERC20;

  uint256 public constant BASIS_POINTS = 10_000;
  uint256 public constant MONTH = 30 days;

  error OnlyHub();
  error SlotNotActive(uint256 slotId);
  error SlotNotExist(uint256 slotId);
  error SlotAlreadyExists(uint256 slotId);
  error UnauthorizedRelease();
  error UnauthorizedSelfAssess();
  error UnauthorizedTaxUpdate();
  error InvalidPrice();
  error TaxUpdateAlreadyPending();
  error NoTaxUpdatePending();
  error TaxPercentageOutOfBounds(uint256 percentage, uint256 max);
  error TaxUpdatePeriodNotPassed(uint256 currentTime, uint256 requiredTime);
  error CannotBuyFromYourself();
  error ModuleNotAllowed(address module);
  error InvalidTaxPercentage();
  error SlotMustBeUnoccupied(uint256 slotId);
  error SlotAlreadyActive(uint256 slotId);
  error SlotAlreadyInactive(uint256 slotId);
  error UnauthorizedSlotActivation();
  error InsufficientDeposit();
  error NotInsolvent();
  error NothingToCollect();
  error NothingToWithdraw();
  error InvalidRange();
  error OnlyOccupant();
  error CurrencyChangeWhileOccupied();

  event ModuleCallFailed(uint256 indexed slotId, string callbackName);

  SlotsHub public hub;
  mapping(uint256 => Slot) public slots;
  mapping(uint256 => SlotEscrow) public escrows;
  uint256 public nextSlotId;

  function initialize(
    address payable _hub,
    address account,
    SlotParams[] memory params
  ) public initializer {
    __ReentrancyGuard_init();
    __Ownable_init();
    hub = SlotsHub(_hub);
    transferOwnership(account);
    nextSlotId = 1;
    _createBatch(params);
  }

  modifier onlyHub() {
    if (msg.sender != address(hub)) revert OnlyHub();
    _;
  }

  // ══════════════════════════════════════════════════════════════
  // CORE
  // ══════════════════════════════════════════════════════════════

  function buy(uint256 slotId, uint256 depositAmount) external nonReentrant {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (!slot.active) revert SlotNotActive(slotId);
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (msg.sender == slot.occupant) revert CannotBuyFromYourself();

    _settle(slotId);

    address prev = slot.occupant;
    uint256 price = slot.price;
    IERC20 currency = slot.currency;

    // Enforce minimum deposit
    _enforceMinDeposit(slotId, depositAmount);

    // Transfer total from buyer to contract in one call
    uint256 totalFromBuyer = price + depositAmount;
    if (totalFromBuyer > 0) {
      currency.safeTransferFrom(msg.sender, address(this), totalFromBuyer);
    }

    // Distribute price
    if (prev != owner()) {
      // Secondary sale: refund previous occupant's remaining deposit + price
      uint256 refund = esc.deposit + price;
      esc.deposit = 0;
      if (refund > 0) currency.safeTransfer(prev, refund);
    } else {
      // First sale: full price to owner
      if (price > 0) {
        currency.safeTransfer(owner(), price);
      }
    }

    slot.occupant = msg.sender;
    esc.deposit = depositAmount;
    esc.lastSettled = block.timestamp;
    esc.collectedTax = 0;

    _notifyModule(slotId, "onTransfer", abi.encodeCall(ISlotsModule.onTransfer, (slotId, prev, msg.sender)));
    emit SlotPurchased(owner(), slotId, msg.sender, price);
  }

  function release(uint256 slotId) external nonReentrant {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (msg.sender != slot.occupant) revert UnauthorizedRelease();

    _settle(slotId);

    address prev = slot.occupant;
    uint256 refund = esc.deposit;

    slot.occupant = owner();
    slot.price = slot.basePrice;
    esc.deposit = 0;
    esc.lastSettled = block.timestamp;

    if (refund > 0) slot.currency.safeTransfer(prev, refund);

    _notifyModule(slotId, "onRelease", abi.encodeCall(ISlotsModule.onRelease, (slotId, prev)));
    emit SlotReleased(owner(), slotId);
  }

  function selfAssess(uint256 slotId, uint256 newPrice) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != slot.occupant) revert UnauthorizedSelfAssess();
    if (newPrice == 0) revert InvalidPrice();
    if (!slot.active || slot.occupant == owner()) revert SlotNotActive(slotId);

    _settle(slotId);

    uint256 oldPrice = slot.price;
    slot.price = newPrice;

    // After price change, check that remaining deposit still meets minimum
    _enforceMinDepositExisting(slotId);

    _notifyModule(slotId, "onPriceUpdate", abi.encodeCall(ISlotsModule.onPriceUpdate, (slotId, oldPrice, newPrice)));
    emit PriceUpdated(owner(), slotId, oldPrice, newPrice);
  }

  // ══════════════════════════════════════════════════════════════
  // ESCROW
  // ══════════════════════════════════════════════════════════════

  function deposit(uint256 slotId, uint256 amount) external nonReentrant {
    Slot storage slot = slots[slotId];
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (msg.sender != slot.occupant) revert OnlyOccupant();
    _settle(slotId);
    slot.currency.safeTransferFrom(msg.sender, address(this), amount);
    escrows[slotId].deposit += amount;
    emit Deposited(slotId, msg.sender, amount);
  }

  function withdraw(uint256 slotId, uint256 amount) external nonReentrant {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (msg.sender != slot.occupant) revert UnauthorizedRelease();
    _settle(slotId);
    if (amount > esc.deposit) revert NothingToWithdraw();

    // Ensure remaining deposit still meets minimum after withdrawal
    uint256 remaining = esc.deposit - amount;
    uint256 minDeposit = _minDepositFor(slotId);
    if (remaining < minDeposit) revert InsufficientDeposit();

    esc.deposit = remaining;
    slot.currency.safeTransfer(msg.sender, amount);
    emit Withdrawn(slotId, msg.sender, amount);
  }

  function liquidate(uint256 slotId) external nonReentrant {
    Slot storage slot = slots[slotId];
    if (slot.occupant == address(0) || slot.occupant == owner()) revert SlotNotExist(slotId);
    _settle(slotId);
    if (escrows[slotId].deposit > 0) revert NotInsolvent();

    address prev = slot.occupant;
    slot.occupant = owner();
    slot.price = slot.basePrice;
    escrows[slotId].lastSettled = block.timestamp;

    // Pay liquidation bounty from collected tax
    uint256 bountyBps = hub.hubSettings().liquidationBountyBps;
    uint256 collected = escrows[slotId].collectedTax;
    uint256 bounty = 0;
    if (bountyBps > 0 && collected > 0) {
      bounty = (collected * bountyBps) / BASIS_POINTS;
      escrows[slotId].collectedTax = collected - bounty;
      slot.currency.safeTransfer(msg.sender, bounty);
    }

    _notifyModule(slotId, "onRelease", abi.encodeCall(ISlotsModule.onRelease, (slotId, prev)));
    emit SlotLiquidated(owner(), slotId, msg.sender, prev, bounty);
  }

  function collect(uint256 slotId) external nonReentrant {
    _settle(slotId);
    _collectSingle(slotId);
  }

  function collectRange(uint256 fromId, uint256 toId) external nonReentrant {
    if (fromId == 0 || toId < fromId || toId >= nextSlotId) revert InvalidRange();
    for (uint256 i = fromId; i <= toId; i++) {
      _settle(i);
      _collectSingle(i);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TAX RATE UPDATES
  // ══════════════════════════════════════════════════════════════

  function proposeTaxRateUpdate(uint256 slotId, uint256 newPct) external {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (esc.pendingTaxUpdate.status != TaxUpdateStatus.None) revert TaxUpdateAlreadyPending();
    if (newPct == 0 || newPct > slot.maxTaxPercentage) revert TaxPercentageOutOfBounds(newPct, slot.maxTaxPercentage);

    esc.pendingTaxUpdate = TaxUpdate(newPct, block.timestamp, TaxUpdateStatus.Pending);
    emit TaxRateUpdateProposed(owner(), slotId, newPct, block.timestamp + slot.minTaxUpdatePeriod);
  }

  function confirmTaxRateUpdate(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (esc.pendingTaxUpdate.status != TaxUpdateStatus.Pending) revert NoTaxUpdatePending();
    uint256 req = esc.pendingTaxUpdate.proposedAt + slot.minTaxUpdatePeriod;
    if (block.timestamp < req) revert TaxUpdatePeriodNotPassed(block.timestamp, req);

    _settle(slotId);
    uint256 old = slot.taxPercentage;
    slot.taxPercentage = esc.pendingTaxUpdate.newRate;
    esc.pendingTaxUpdate = TaxUpdate(0, 0, TaxUpdateStatus.None);
    emit TaxRateUpdateConfirmed(owner(), slotId, old, slot.taxPercentage);
  }

  function cancelTaxRateUpdate(uint256 slotId) external {
    SlotEscrow storage esc = escrows[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (esc.pendingTaxUpdate.status != TaxUpdateStatus.Pending) revert NoTaxUpdatePending();
    esc.pendingTaxUpdate = TaxUpdate(0, 0, TaxUpdateStatus.None);
    emit TaxRateUpdateCancelled(owner(), slotId);
  }

  // ══════════════════════════════════════════════════════════════
  // SLOT SETTINGS (LAND OWNER)
  // ══════════════════════════════════════════════════════════════

  function updateSlotSettings(
    uint256 slotId,
    uint256 newBasePrice,
    address newCurrency,
    uint256 newMaxTaxPercentage,
    address newModule
  ) external {
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    Slot storage slot = slots[slotId];
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);

    bool isVacant = slot.occupant == owner();

    if (newBasePrice > 0) {
      slot.basePrice = newBasePrice;
      if (isVacant) slot.price = newBasePrice;
    }

    if (newCurrency != address(0) && newCurrency != address(slot.currency)) {
      if (!isVacant) revert CurrencyChangeWhileOccupied();
      slot.currency = IERC20(newCurrency);
    }

    if (newMaxTaxPercentage > 0 && newMaxTaxPercentage != slot.maxTaxPercentage) {
      if (!isVacant) revert SlotMustBeUnoccupied(slotId);
      slot.maxTaxPercentage = newMaxTaxPercentage;
    }

    if (newModule != slot.module) {
      if (!isVacant) revert SlotMustBeUnoccupied(slotId);
      slot.module = newModule;
    }

    emit SlotSettingsUpdated(owner(), slotId, slot.basePrice, address(slot.currency), slot.maxTaxPercentage, slot.module);
  }

  // ══════════════════════════════════════════════════════════════
  // ACTIVATION
  // ══════════════════════════════════════════════════════════════

  function deactivateSlot(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedSlotActivation();
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (!slot.active) revert SlotAlreadyInactive(slotId);
    if (slot.occupant != owner()) revert SlotMustBeUnoccupied(slotId);
    slot.active = false;
    emit SlotDeactivated(owner(), slotId);
  }

  function activateSlot(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedSlotActivation();
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (slot.active) revert SlotAlreadyActive(slotId);
    slot.active = true;
    emit SlotActivated(owner(), slotId);
  }

  function open(SlotParams[] memory params) external onlyHub returns (uint256[] memory) {
    return _createBatch(params);
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW
  // ══════════════════════════════════════════════════════════════

  function getSlot(uint256 slotId) external view returns (Slot memory) {
    return slots[slotId];
  }

  function getEscrow(uint256 slotId) external view returns (SlotEscrow memory) {
    return escrows[slotId];
  }

  function taxOwed(uint256 slotId) public view returns (uint256) {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (slot.occupant == owner() || slot.occupant == address(0)) return 0;
    uint256 elapsed = block.timestamp - esc.lastSettled;
    return (slot.price * slot.taxPercentage * elapsed) / (MONTH * BASIS_POINTS);
  }

  function secondsUntilLiquidation(uint256 slotId) public view returns (uint256) {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (slot.occupant == owner() || slot.occupant == address(0)) return type(uint256).max;
    uint256 owed = taxOwed(slotId);
    uint256 remaining = esc.deposit > owed ? esc.deposit - owed : 0;
    uint256 ratePerSec = (slot.price * slot.taxPercentage) / (MONTH * BASIS_POINTS);
    if (ratePerSec == 0) return type(uint256).max;
    return remaining / ratePerSec;
  }

  function isInsolvent(uint256 slotId) public view returns (bool) {
    Slot storage slot = slots[slotId];
    if (slot.occupant == owner() || slot.occupant == address(0)) return false;
    return taxOwed(slotId) >= escrows[slotId].deposit;
  }

  function getOccupant(uint256 slotId) external view returns (address) {
    return slots[slotId].occupant;
  }

  function getModule(uint256 slotId) external view returns (address) {
    return slots[slotId].module;
  }

  function getPendingTaxUpdate(uint256 slotId) external view returns (uint256, uint256, TaxUpdateStatus) {
    TaxUpdate memory u = escrows[slotId].pendingTaxUpdate;
    return (u.newRate, u.proposedAt, u.status);
  }

  // ══════════════════════════════════════════════════════════════
  // INTERNAL
  // ══════════════════════════════════════════════════════════════

  function _settle(uint256 slotId) internal {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    if (slot.occupant == owner() || slot.occupant == address(0)) {
      esc.lastSettled = block.timestamp;
      return;
    }
    uint256 elapsed = block.timestamp - esc.lastSettled;
    if (elapsed == 0) return;

    uint256 owed = (slot.price * slot.taxPercentage * elapsed) / (MONTH * BASIS_POINTS);

    if (owed >= esc.deposit) {
      esc.collectedTax += esc.deposit;
      esc.deposit = 0;
    } else {
      esc.deposit -= owed;
      esc.collectedTax += owed;
    }
    esc.lastSettled = block.timestamp;
    emit Settled(slotId, owed, esc.deposit);
  }

  function _collectSingle(uint256 slotId) internal {
    Slot storage slot = slots[slotId];
    SlotEscrow storage esc = escrows[slotId];
    uint256 amount = esc.collectedTax;
    if (amount == 0) return; // skip silently for range calls
    esc.collectedTax = 0;

    uint256 fee = (amount * hub.hubSettings().protocolFeeBps) / BASIS_POINTS;
    uint256 ownerAmt = amount - fee;
    if (fee > 0) slot.currency.safeTransfer(hub.hubSettings().protocolFeeRecipient, fee);
    slot.currency.safeTransfer(owner(), ownerAmt);
    emit TaxCollected(slotId, owner(), amount);
  }

  function _minDepositFor(uint256 slotId) internal view returns (uint256) {
    uint256 minSecs = hub.hubSettings().minDepositSeconds;
    if (minSecs == 0) return 0;
    Slot storage slot = slots[slotId];
    return (slot.price * slot.taxPercentage * minSecs) / (MONTH * BASIS_POINTS);
  }

  function _enforceMinDeposit(uint256 slotId, uint256 depositAmount) internal view {
    uint256 minDeposit = _minDepositFor(slotId);
    if (depositAmount < minDeposit) revert InsufficientDeposit();
  }

  function _enforceMinDepositExisting(uint256 slotId) internal view {
    uint256 minDeposit = _minDepositFor(slotId);
    if (escrows[slotId].deposit < minDeposit) revert InsufficientDeposit();
  }

  function _createBatch(SlotParams[] memory params) internal returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](params.length);
    for (uint256 i = 0; i < params.length; i++) {
      uint256 id = nextSlotId++;
      _createSlot(id, owner(), params[i]);
      ids[i] = id;
    }
    return ids;
  }

  function _createSlot(uint256 slotId, address occupant, SlotParams memory params) internal {
    if (slots[slotId].occupant != address(0)) revert SlotAlreadyExists(slotId);
    if (!hub.isModuleAllowed(params.module)) revert ModuleNotAllowed(params.module);
    if (params.basePrice == 0) revert InvalidPrice();
    if (params.taxPercentage == 0 || params.taxPercentage > params.maxTaxPercentage) revert InvalidTaxPercentage();

    slots[slotId] = Slot({
      currency: params.currency,
      occupant: occupant,
      basePrice: params.basePrice,
      price: params.basePrice, // I-2: price = basePrice on creation
      active: true,
      taxPercentage: params.taxPercentage,
      maxTaxPercentage: params.maxTaxPercentage,
      minTaxUpdatePeriod: params.minTaxUpdatePeriod,
      module: params.module
    });

    escrows[slotId] = SlotEscrow({
      deposit: 0,
      lastSettled: block.timestamp,
      collectedTax: 0,
      pendingTaxUpdate: TaxUpdate(0, 0, TaxUpdateStatus.None)
    });

    emit SlotCreated(owner(), slotId, occupant, params);
  }

  function _notifyModule(uint256 slotId, string memory name, bytes memory data) internal {
    address module = slots[slotId].module;
    if (module == address(0)) return;
    uint256 gasLimit = hub.hubSettings().moduleCallGasLimit;
    if (gasLimit == 0) gasLimit = 500_000; // default fallback
    (bool ok,) = module.call{gas: gasLimit}(data);
    if (!ok) emit ModuleCallFailed(slotId, name);
  }
}
