export const slotsAbi = 
[
  {
    "type": "function",
    "name": "BASIS_POINTS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "YEAR",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activateSlot",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "buy",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      },
      {
        "name": "depositAmount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelTaxRateUpdate",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "collect",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "collectRange",
    "inputs": [
      {
        "name": "fromId",
        "type": "uint256"
      },
      {
        "name": "toId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "confirmTaxRateUpdate",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deactivateSlot",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "escrows",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "deposit",
        "type": "uint256"
      },
      {
        "name": "lastSettled",
        "type": "uint256"
      },
      {
        "name": "collectedTax",
        "type": "uint256"
      },
      {
        "name": "pendingTaxUpdate",
        "type": "tuple",
        "components": [
          {
            "name": "newRate",
            "type": "uint256"
          },
          {
            "name": "proposedAt",
            "type": "uint256"
          },
          {
            "name": "status",
            "type": "uint8"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEscrow",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "deposit",
            "type": "uint256"
          },
          {
            "name": "lastSettled",
            "type": "uint256"
          },
          {
            "name": "collectedTax",
            "type": "uint256"
          },
          {
            "name": "pendingTaxUpdate",
            "type": "tuple",
            "components": [
              {
                "name": "newRate",
                "type": "uint256"
              },
              {
                "name": "proposedAt",
                "type": "uint256"
              },
              {
                "name": "status",
                "type": "uint8"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getModule",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getOccupant",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPendingTaxUpdate",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSlot",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "currency",
            "type": "address"
          },
          {
            "name": "occupant",
            "type": "address"
          },
          {
            "name": "basePrice",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "taxPercentage",
            "type": "uint256"
          },
          {
            "name": "maxTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "minTaxUpdatePeriod",
            "type": "uint256"
          },
          {
            "name": "module",
            "type": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hub",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_hub",
        "type": "address"
      },
      {
        "name": "account",
        "type": "address"
      },
      {
        "name": "params",
        "type": "tuple[]",
        "components": [
          {
            "name": "currency",
            "type": "address"
          },
          {
            "name": "basePrice",
            "type": "uint256"
          },
          {
            "name": "taxPercentage",
            "type": "uint256"
          },
          {
            "name": "maxTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "minTaxUpdatePeriod",
            "type": "uint256"
          },
          {
            "name": "module",
            "type": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isInsolvent",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "liquidate",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nextSlotId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "open",
    "inputs": [
      {
        "name": "params",
        "type": "tuple[]",
        "components": [
          {
            "name": "currency",
            "type": "address"
          },
          {
            "name": "basePrice",
            "type": "uint256"
          },
          {
            "name": "taxPercentage",
            "type": "uint256"
          },
          {
            "name": "maxTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "minTaxUpdatePeriod",
            "type": "uint256"
          },
          {
            "name": "module",
            "type": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposeTaxRateUpdate",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      },
      {
        "name": "newPct",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "release",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "secondsUntilLiquidation",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "selfAssess",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      },
      {
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "slots",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "currency",
        "type": "address"
      },
      {
        "name": "occupant",
        "type": "address"
      },
      {
        "name": "basePrice",
        "type": "uint256"
      },
      {
        "name": "price",
        "type": "uint256"
      },
      {
        "name": "active",
        "type": "bool"
      },
      {
        "name": "taxPercentage",
        "type": "uint256"
      },
      {
        "name": "maxTaxPercentage",
        "type": "uint256"
      },
      {
        "name": "minTaxUpdatePeriod",
        "type": "uint256"
      },
      {
        "name": "module",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "taxOwed",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Deposited",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "depositor",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint8",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ModuleCallFailed",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "callbackName",
        "type": "string",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PriceUpdated",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "oldPrice",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "newPrice",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Settled",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "taxOwed",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "depositRemaining",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotActivated",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotCreated",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true
      },
      {
        "name": "params",
        "type": "tuple",
        "indexed": false,
        "components": [
          {
            "name": "currency",
            "type": "address"
          },
          {
            "name": "basePrice",
            "type": "uint256"
          },
          {
            "name": "taxPercentage",
            "type": "uint256"
          },
          {
            "name": "maxTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "minTaxUpdatePeriod",
            "type": "uint256"
          },
          {
            "name": "module",
            "type": "address"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotDeactivated",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotLiquidated",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "liquidator",
        "type": "address",
        "indexed": true
      },
      {
        "name": "occupant",
        "type": "address",
        "indexed": true
      },
      {
        "name": "bounty",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotPurchased",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "newOccupant",
        "type": "address",
        "indexed": true
      },
      {
        "name": "price",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SlotReleased",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TaxCollected",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TaxRateUpdateCancelled",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TaxRateUpdateConfirmed",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "oldPercentage",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "newPercentage",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TaxRateUpdateProposed",
    "inputs": [
      {
        "name": "landOwner",
        "type": "address",
        "indexed": false
      },
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "newPercentage",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "confirmableAt",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Withdrawn",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "occupant",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CannotBuyFromYourself",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CurrencyNotAllowed",
    "inputs": [
      {
        "name": "currency",
        "type": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientDeposit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPrice",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTaxPercentage",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ModuleNotAllowed",
    "inputs": [
      {
        "name": "module",
        "type": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NoTaxUpdatePending",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotInsolvent",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NothingToCollect",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NothingToWithdraw",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyHub",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOccupant",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SlotAlreadyActive",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SlotAlreadyExists",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SlotAlreadyInactive",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SlotMustBeUnoccupied",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SlotNotActive",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SlotNotExist",
    "inputs": [
      {
        "name": "slotId",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "TaxPercentageOutOfBounds",
    "inputs": [
      {
        "name": "percentage",
        "type": "uint256"
      },
      {
        "name": "max",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "TaxUpdateAlreadyPending",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TaxUpdatePeriodNotPassed",
    "inputs": [
      {
        "name": "currentTime",
        "type": "uint256"
      },
      {
        "name": "requiredTime",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedRelease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedSelfAssess",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedSlotActivation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedTaxUpdate",
    "inputs": []
  }
] as const;
