// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuardUpgradeable} from "@openzeppelin-upgradeable/contracts/security/ReentrancyGuardUpgradeable.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IHarbergerModule} from "./IHarbergerModule.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {IHarberger, SlotParams, Slot, TaxUpdate, TaxUpdateStatus, HarbergerArgs, SlotDirective} from "./interfaces/IHarberger.sol";
import {HarbergerHub} from "./HarbergerHub.sol";
import {HubSettings} from "./interfaces/IHarbergerHub.sol";
import {HarbergerStreamSuperApp} from "./HarbergerStreamSuperApp.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract Harberger is
  IHarberger,
  ReentrancyGuardUpgradeable,
  OwnableUpgradeable
{
  using SuperTokenV1Library for ISuperToken;

  uint256 public constant MODULE_CALL_GAS_LIMIT = 100000;

  // Custom errors for gas efficiency
  error OnlyHub();
  error SlotNotActive(uint256 slotId);
  error SlotNotExist(uint256 slotId);
  error SlotAlreadyExists(uint256 slotId);
  error UnauthorizedRelease();
  error UnauthorizedSelfAssess();
  error UnauthorizedTaxUpdate();
  error InvalidPrice();
  error NegativeFlowRate(int96 flowRate);
  error TaxUpdateAlreadyPending();
  error NoTaxUpdatePending();
  error TaxPercentageOutOfBounds(uint256 percentage, uint256 max);
  error TaxUpdatePeriodNotPassed(uint256 currentTime, uint256 requiredTime);
  error CannotBuyFromYourself();
  error ModuleNotAllowed(address module);
  error CurrencyNotAllowed(address currency);
  error PriceTooLowForValidFlowRate(uint256 price);
  error FlowRateOverflow(uint256 flowRate);
  error InvalidTaxPercentage();
  error TokenTransferFailed();
  error OwnershipTransferDisabled();
  error SlotMustBeUnoccupied(uint256 slotId);
  error SlotAlreadyActive(uint256 slotId);
  error SlotAlreadyInactive(uint256 slotId);
  error UnauthorizedSlotActivationDeactivation();

  event ModuleCallFailed(uint256 indexed slotId, string callbackName);

  uint256 public constant INITIAL_SLOT_ID = 1;
  uint256 public constant THIRTY_DAYS = 30 days;
  uint256 public constant BASIS_POINTS = 10000;

  HarbergerHub public h;
  IConstantFlowAgreementV1 public cfa;
  address public taxDistributorBeacon;
  address public taxDistributor;

  mapping(uint256 => Slot) public slots;
  uint256 public nextSlotId;

  bool public ownershipTransferabilityDisabled;

  function initialize(
    HarbergerArgs memory args,
    address account,
    SlotParams[] memory params
  ) public initializer {
    cfa = IConstantFlowAgreementV1(args._cfa);
    taxDistributorBeacon = args._taxDistributorBeacon;
    __ReentrancyGuard_init();
    __Ownable_init();

    h = HarbergerHub(args._hub);
    // Transfer ownership to the account
    transferOwnership(account);
    nextSlotId = INITIAL_SLOT_ID;
    taxDistributor = address(
      new BeaconProxy(
        taxDistributorBeacon,
        abi.encodeWithSelector(
          HarbergerStreamSuperApp.initialize.selector,
          ISuperfluid(args._host),
          address(this)
        )
      )
    );
    _create(params);

    ownershipTransferabilityDisabled = true;
  }

  modifier onlyHub() {
    if (msg.sender != address(h)) revert OnlyHub();
    _;
  }

  function open(
    SlotParams[] memory params
  ) external onlyHub returns (uint256[] memory) {
    return _create(params);
  }

  function _create(
    SlotParams[] memory params
  ) internal returns (uint256[] memory) {
    uint256[] memory slotIds = new uint256[](params.length);

    for (uint256 i = 0; i < params.length; i++) {
      uint256 slotId = nextSlotId++;

      _createSlot(slotId, owner(), params[i]);

      slotIds[i] = slotId;
    }

    return slotIds;
  }

  function buy(uint256 slotId) external nonReentrant {
    _buy(slotId);
  }

  function buyBatch(uint256[] memory slotIds) external nonReentrant {
    for (uint256 i = 0; i < slotIds.length; i++) {
      _buy(slotIds[i]);
    }
  }

  // Occupant can voluntarily release ownership
  function release(uint256 slotId) external nonReentrant {
    Slot storage slot = slots[slotId];
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (msg.sender != slot.occupant && msg.sender != taxDistributor) {
      revert UnauthorizedRelease();
    }

    address releaseTo = owner();
    address previousOccupant = slot.occupant;
    uint256 oldPrice = slot.price;

    slot.occupant = releaseTo;
    slot.price = slot.basePrice; // Reset price to default

    int96 slotFlow = _calculateFlowRate(oldPrice, slot.taxPercentage);
    int96 exiterFlow = _getFlowRate(
      slot.currency,
      previousOccupant,
      taxDistributor
    );

    /**
     * Don't update flow rate if tax distributor is the one releasing
     */
    if (msg.sender != taxDistributor) {
      _flow(
        slot.currency,
        previousOccupant,
        taxDistributor,
        exiterFlow - slotFlow,
        _encodeSlotStreamData(slotId, SlotDirective.LOSE_OWNERSHIP)
      );
    }

    // Notify module if exists (with gas limit and try/catch to prevent DoS)
    if (slot.module != address(0)) {
      try
        IHarbergerModule(slot.module).onRelease{gas: MODULE_CALL_GAS_LIMIT}(
          slotId,
          previousOccupant
        )
      {} catch {
        emit ModuleCallFailed(slotId, "onRelease");
      }
    }

    emit SlotReleased(owner(), slotId);
  }

  // Owner can update the price (self-assessment)
  function selfAssess(uint256 slotId, uint256 newPrice) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != slot.occupant) revert UnauthorizedSelfAssess();
    if (newPrice == 0) revert InvalidPrice();
    if (!slot.active || slot.occupant == owner()) revert SlotNotActive(slotId);

    uint256 oldPrice = slot.price;
    slot.price = newPrice;

    int96 currentSlotFlow = _getFlowRate(
      slot.currency,
      slot.occupant,
      taxDistributor
    );
    int96 oldSlotFlow = _calculateFlowRate(oldPrice, slot.taxPercentage);
    int96 newSlotFlow = _calculateFlowRate(newPrice, slot.taxPercentage);
    int96 delta = newSlotFlow - oldSlotFlow;
    int96 newFlowRate = currentSlotFlow + delta;
    if (newFlowRate >= 0) {
      _flow(
        slot.currency,
        slot.occupant,
        taxDistributor,
        newFlowRate,
        _encodeSlotStreamData(slotId, SlotDirective.SELF_ASSESSMENT)
      );
    } else {
      revert NegativeFlowRate(newFlowRate);
    }

    // Notify module if exists (with gas limit and try/catch to prevent DoS)
    if (slot.module != address(0)) {
      try
        IHarbergerModule(slot.module).onPriceUpdate{gas: MODULE_CALL_GAS_LIMIT}(
          slotId,
          oldPrice,
          newPrice
        )
      {} catch {
        emit ModuleCallFailed(slotId, "onPriceUpdate");
      }
    }

    emit PriceUpdated(owner(), slotId, oldPrice, newPrice);
  }

  // Tax rate update
  function proposeTaxRateUpdate(
    uint256 slotId,
    uint256 newPercentage
  ) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (slot.pendingTaxUpdate.status != TaxUpdateStatus.None) {
      revert TaxUpdateAlreadyPending();
    }
    if (newPercentage == 0 || newPercentage > slot.maxTaxPercentage) {
      revert TaxPercentageOutOfBounds(newPercentage, slot.maxTaxPercentage);
    }

    slot.pendingTaxUpdate = TaxUpdate({
      newRate: newPercentage,
      proposedAt: block.timestamp,
      status: TaxUpdateStatus.Pending
    });

    emit TaxRateUpdateProposed(
      owner(),
      slotId,
      newPercentage,
      block.timestamp + slot.minTaxUpdatePeriod
    );
  }

  function confirmTaxRateUpdate(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (slot.pendingTaxUpdate.status != TaxUpdateStatus.Pending) {
      revert NoTaxUpdatePending();
    }
    uint256 requiredTime = slot.pendingTaxUpdate.proposedAt +
      slot.minTaxUpdatePeriod;
    if (block.timestamp < requiredTime) {
      revert TaxUpdatePeriodNotPassed(block.timestamp, requiredTime);
    }

    uint256 oldPercentage = slot.taxPercentage;
    slot.taxPercentage = slot.pendingTaxUpdate.newRate;

    // Reset pending update
    slot.pendingTaxUpdate.status = TaxUpdateStatus.None;
    slot.pendingTaxUpdate.newRate = 0;
    slot.pendingTaxUpdate.proposedAt = 0;

    // Update flow rate if slot is active and has an occupant
    if (
      slot.active && slot.occupant != address(0) && slot.occupant != owner()
    ) {
      int96 currentSlotFlow = _getFlowRate(
        slot.currency,
        slot.occupant,
        taxDistributor
      );
      int96 oldSlotFlow = _calculateFlowRate(slot.price, oldPercentage);
      int96 newSlotFlow = _calculateFlowRate(slot.price, slot.taxPercentage);
      int96 delta = newSlotFlow - oldSlotFlow;
      int96 newFlowRate = currentSlotFlow + delta;
      if (newFlowRate >= 0) {
        _flow(
          slot.currency,
          slot.occupant,
          taxDistributor,
          newFlowRate,
          _encodeSlotStreamData(slotId, SlotDirective.SELF_ASSESSMENT)
        );
      } else {
        revert NegativeFlowRate(newFlowRate);
      }
    }

    emit TaxRateUpdateConfirmed(
      owner(),
      slotId,
      oldPercentage,
      slot.taxPercentage
    );
  }

  function cancelTaxRateUpdate(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedTaxUpdate();
    if (slot.pendingTaxUpdate.status != TaxUpdateStatus.Pending) {
      revert NoTaxUpdatePending();
    }

    slot.pendingTaxUpdate.status = TaxUpdateStatus.None;
    slot.pendingTaxUpdate.newRate = 0;
    slot.pendingTaxUpdate.proposedAt = 0;

    emit TaxRateUpdateCancelled(owner(), slotId);
  }

  // Slot activation/deactivation functions
  function deactivateSlot(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedSlotActivationDeactivation();
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (!slot.active) revert SlotAlreadyInactive(slotId);
    // Only allow deactivation if slot is unoccupied (occupant == owner)
    if (slot.occupant != owner()) revert SlotMustBeUnoccupied(slotId);

    slot.active = false;
    emit SlotDeactivated(owner(), slotId);
  }

  function activateSlot(uint256 slotId) external {
    Slot storage slot = slots[slotId];
    if (msg.sender != owner()) revert UnauthorizedSlotActivationDeactivation();
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (slot.active) revert SlotAlreadyActive(slotId);

    slot.active = true;
    emit SlotActivated(owner(), slotId);
  }

  // View function to get pending tax update
  function getPendingTaxUpdate(
    uint256 slotId
  )
    external
    view
    returns (uint256 newRate, uint256 proposedAt, TaxUpdateStatus status)
  {
    TaxUpdate memory update = slots[slotId].pendingTaxUpdate;
    return (update.newRate, update.proposedAt, update.status);
  }

  function isCurrencyAllowed(address currency) public view returns (bool) {
    return h.isCurrencyAllowed(currency);
  }

  function getSlot(uint256 slotId) external view returns (Slot memory) {
    return slots[slotId];
  }

  function getOccupant(uint256 slotId) external view returns (address) {
    return slots[slotId].occupant;
  }

  function getBeneficiary(uint256) external view returns (address) {
    return owner();
  }

  function getTaxDistributor() external view returns (address) {
    return taxDistributor;
  }

  function getModule(uint256 slotId) external view returns (address) {
    return slots[slotId].module;
  }

  function _buy(uint256 slotId) internal {
    _requireBuyValid(slotId);

    Slot storage slot = slots[slotId];

    _distributePayment(slot.currency, slot.occupant, slot.price);

    // Transfer ownership
    address exiter = slot.occupant;
    slot.occupant = msg.sender;

    // Calculate and handle flow changes
    int96 slotFlow = _calculateFlowRate(slot.price, slot.taxPercentage);

    int96 exiterFlow = _getFlowRate(slot.currency, exiter, taxDistributor) -
      slotFlow;
    int96 buyerFlow = _getFlowRate(slot.currency, msg.sender, taxDistributor) +
      slotFlow;

    if (exiter != owner()) {
      _flow(
        slot.currency,
        exiter,
        taxDistributor,
        exiterFlow,
        _encodeSlotStreamData(slotId, SlotDirective.LOSE_OWNERSHIP)
      );
    }

    _flow(
      slot.currency,
      msg.sender,
      taxDistributor,
      buyerFlow,
      _encodeSlotStreamData(slotId, SlotDirective.GAIN_OWNERSHIP)
    );

    // Notify module if exists (with gas limit and try/catch to prevent DoS)
    if (slot.module != address(0)) {
      try
        IHarbergerModule(slot.module).onTransfer{gas: MODULE_CALL_GAS_LIMIT}(
          slotId,
          exiter,
          msg.sender
        )
      {} catch {
        emit ModuleCallFailed(slotId, "onTransfer");
      }
    }

    emit SlotPurchased(owner(), slotId, msg.sender);
  }

  function _createSlot(
    uint256 slotId,
    address occupant,
    SlotParams memory params
  ) internal {
    if (slots[slotId].occupant != address(0)) revert SlotAlreadyExists(slotId);
    if (!h.isModuleAllowed(params.module))
      revert ModuleNotAllowed(params.module);
    if (!h.isCurrencyAllowed(address(params.currency))) {
      revert CurrencyNotAllowed(address(params.currency));
    }
    _requireValidSlotParams(params);

    slots[slotId] = Slot({
      currency: params.currency,
      occupant: occupant,
      basePrice: params.basePrice,
      price: params.price,
      active: true,
      taxPercentage: params.taxPercentage,
      maxTaxPercentage: params.maxTaxPercentage,
      minTaxUpdatePeriod: params.minTaxUpdatePeriod,
      pendingTaxUpdate: TaxUpdate({
        newRate: 0,
        proposedAt: 0,
        status: TaxUpdateStatus.None
      }),
      module: params.module
    });

    emit SlotCreated(owner(), slotId, occupant, params);
  }

  function calculateFlowRate(uint256 slotId) external view returns (int96) {
    Slot storage slot = slots[slotId];
    return _calculateFlowRate(slot.price, slot.taxPercentage);
  }

  // Internal helper functions for flow rate calculations
  function _calculateFlowRate(
    uint256 price,
    uint256 taxPercentage
  ) internal pure returns (int96) {
    // Calculate tax amount for 30 days: price * taxPercentage / BASIS_POINTS
    uint256 thirtyDayTax = (price * taxPercentage) / BASIS_POINTS;

    // Convert to flow rate per second: thirtyDayTax / THIRTY_DAYS
    uint256 flowRatePerSecond = thirtyDayTax / THIRTY_DAYS;

    // H-3: Enforce minimum flow rate to prevent free slot occupation
    if (flowRatePerSecond == 0 && price != 0)
      revert PriceTooLowForValidFlowRate(price);

    // M-5: Bounds check to prevent int96 overflow
    if (flowRatePerSecond > uint256(uint96(type(int96).max)))
      revert FlowRateOverflow(flowRatePerSecond);

    return int96(int256(flowRatePerSecond));
  }

  function _requireBuyValid(uint256 slotId) internal view {
    Slot storage slot = slots[slotId];
    if (!slot.active) revert SlotNotActive(slotId);
    if (slot.occupant == address(0)) revert SlotNotExist(slotId);
    if (msg.sender == slot.occupant) revert CannotBuyFromYourself();
  }

  function _requireValidSlotParams(SlotParams memory params) internal pure {
    if (params.basePrice == 0) revert InvalidPrice();
    if (params.taxPercentage > params.maxTaxPercentage) {
      revert TaxPercentageOutOfBounds(
        params.taxPercentage,
        params.maxTaxPercentage
      );
    }
    if (params.taxPercentage == 0) revert InvalidTaxPercentage();
  }

  function _distributePayment(
    ISuperToken token,
    address occupant,
    uint256 payment
  ) internal {
    // Calculate required payment and protocol fee
    uint256 fee = _calculateProtocolFee(payment);

    if (!token.transferFrom(msg.sender, occupant, payment)) {
      revert TokenTransferFailed();
    }
    if (
      !token.transferFrom(msg.sender, h.hubSettings().protocolFeeRecipient, fee)
    ) {
      revert TokenTransferFailed();
    }
  }

  // Protocol fee functions
  function _calculateProtocolFee(
    uint256 amount
  ) internal view returns (uint256) {
    return (amount * h.hubSettings().protocolFeeBps) / BASIS_POINTS;
  }

  function _getFlowRate(
    ISuperToken token,
    address from,
    address to
  ) internal view returns (int96) {
    (, int96 flowRate, , ) = token.getFlowInfo(from, to);
    return flowRate;
  }

  function _transferOwnership(address newOwner) internal override {
    if (ownershipTransferabilityDisabled) revert OwnershipTransferDisabled();
    super._transferOwnership(newOwner);
  }

  function _encodeSlotStreamData(
    uint256 slotId,
    SlotDirective directive
  ) internal pure returns (bytes memory) {
    return abi.encode(slotId, directive);
  }

  function _flow(
    ISuperToken token,
    address sender,
    address receiver,
    int96 flowRate,
    bytes memory userData
  ) internal returns (bool) {
    // note: from the lib's perspective, the caller is "this", NOT "msg.sender"
    int96 prevFlowRate = _getFlowRate(token, sender, receiver);

    if (flowRate > 0) {
      if (prevFlowRate == 0) {
        ISuperfluid(token.getHost()).callAgreement(
          cfa,
          abi.encodeCall(
            cfa.createFlowByOperator,
            (token, sender, receiver, flowRate, new bytes(0))
          ),
          userData
        );
        return true;
      } else if (prevFlowRate != flowRate) {
        ISuperfluid(token.getHost()).callAgreement(
          cfa,
          abi.encodeCall(
            cfa.updateFlowByOperator,
            (token, sender, receiver, flowRate, new bytes(0))
          ),
          userData
        );
        return true;
      } // else no change, do nothing
      return true;
    } else if (flowRate == 0) {
      if (prevFlowRate > 0) {
        ISuperfluid(token.getHost()).callAgreement(
          cfa,
          abi.encodeCall(
            cfa.deleteFlowByOperator,
            (token, sender, receiver, new bytes(0))
          ),
          userData
        );
        return true;
      } // else no change, do nothing
      return true;
    } else {
      // can't set negative flowrate
      revert IConstantFlowAgreementV1.CFA_INVALID_FLOW_RATE();
    }
  }
}
