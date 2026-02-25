export const slotsAbi = [
  {
    type: "function",
    name: "BASIS_POINTS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MONTH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activateSlot",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buy",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "depositAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelTaxRateUpdate",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "collect",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "collectRange",
    inputs: [
      {
        name: "fromId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "toId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "confirmTaxRateUpdate",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateSlot",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "escrows",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "deposit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "lastSettled",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collectedTax",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "pendingTaxUpdate",
        type: "tuple",
        internalType: "struct TaxUpdate",
        components: [
          {
            name: "newRate",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "proposedAt",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum TaxUpdateStatus",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEscrow",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct SlotEscrow",
        components: [
          {
            name: "deposit",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastSettled",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "collectedTax",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "pendingTaxUpdate",
            type: "tuple",
            internalType: "struct TaxUpdate",
            components: [
              {
                name: "newRate",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "proposedAt",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "status",
                type: "uint8",
                internalType: "enum TaxUpdateStatus",
              },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getModule",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOccupant",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPendingTaxUpdate",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "uint8",
        internalType: "enum TaxUpdateStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSlot",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Slot",
        components: [
          {
            name: "currency",
            type: "address",
            internalType: "contract IERC20",
          },
          {
            name: "occupant",
            type: "address",
            internalType: "address",
          },
          {
            name: "basePrice",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "price",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "taxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "maxTaxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "minTaxUpdatePeriod",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "module",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hub",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract SlotsHub",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_hub",
        type: "address",
        internalType: "address payable",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "params",
        type: "tuple[]",
        internalType: "struct SlotParams[]",
        components: [
          {
            name: "currency",
            type: "address",
            internalType: "contract IERC20",
          },
          {
            name: "basePrice",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "taxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "maxTaxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "minTaxUpdatePeriod",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "module",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isInsolvent",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "liquidate",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextSlotId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "open",
    inputs: [
      {
        name: "params",
        type: "tuple[]",
        internalType: "struct SlotParams[]",
        components: [
          {
            name: "currency",
            type: "address",
            internalType: "contract IERC20",
          },
          {
            name: "basePrice",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "taxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "maxTaxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "minTaxUpdatePeriod",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "module",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proposeTaxRateUpdate",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "newPct",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "release",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "secondsUntilLiquidation",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "selfAssess",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "newPrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "slots",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "currency",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "occupant",
        type: "address",
        internalType: "address",
      },
      {
        name: "basePrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "price",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "active",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "taxPercentage",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxTaxPercentage",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minTaxUpdatePeriod",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "module",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "taxOwed",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateSlotSettings",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "newBasePrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "newCurrency",
        type: "address",
        internalType: "address",
      },
      {
        name: "newMaxTaxPercentage",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "newModule",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "depositor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ModuleCallFailed",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "callbackName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "oldPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Settled",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "taxOwed",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "depositRemaining",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotActivated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotCreated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "params",
        type: "tuple",
        indexed: false,
        internalType: "struct SlotParams",
        components: [
          {
            name: "currency",
            type: "address",
            internalType: "contract IERC20",
          },
          {
            name: "basePrice",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "taxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "maxTaxPercentage",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "minTaxUpdatePeriod",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "module",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotDeactivated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotLiquidated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "liquidator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "occupant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "bounty",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotPurchased",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newOccupant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "price",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotReleased",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SlotSettingsUpdated",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "basePrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "currency",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "maxTaxPercentage",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "module",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TaxCollected",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TaxRateUpdateCancelled",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TaxRateUpdateConfirmed",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "oldPercentage",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newPercentage",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TaxRateUpdateProposed",
    inputs: [
      {
        name: "landOwner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newPercentage",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "confirmableAt",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "occupant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "CannotBuyFromYourself",
    inputs: [],
  },
  {
    type: "error",
    name: "CurrencyChangeWhileOccupied",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientDeposit",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidPrice",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidRange",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidTaxPercentage",
    inputs: [],
  },
  {
    type: "error",
    name: "ModuleNotAllowed",
    inputs: [
      {
        name: "module",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NoTaxUpdatePending",
    inputs: [],
  },
  {
    type: "error",
    name: "NotInsolvent",
    inputs: [],
  },
  {
    type: "error",
    name: "NothingToCollect",
    inputs: [],
  },
  {
    type: "error",
    name: "NothingToWithdraw",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlyHub",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlyOccupant",
    inputs: [],
  },
  {
    type: "error",
    name: "SlotAlreadyActive",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SlotAlreadyExists",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SlotAlreadyInactive",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SlotMustBeUnoccupied",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SlotNotActive",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SlotNotExist",
    inputs: [
      {
        name: "slotId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "TaxPercentageOutOfBounds",
    inputs: [
      {
        name: "percentage",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "max",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "TaxUpdateAlreadyPending",
    inputs: [],
  },
  {
    type: "error",
    name: "TaxUpdatePeriodNotPassed",
    inputs: [
      {
        name: "currentTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requiredTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedRelease",
    inputs: [],
  },
  {
    type: "error",
    name: "UnauthorizedSelfAssess",
    inputs: [],
  },
  {
    type: "error",
    name: "UnauthorizedSlotActivation",
    inputs: [],
  },
  {
    type: "error",
    name: "UnauthorizedTaxUpdate",
    inputs: [],
  },
] as const;
