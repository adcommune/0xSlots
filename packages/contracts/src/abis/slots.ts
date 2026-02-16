export const slotsAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      },
      {
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
            "name": "price",
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
        ],
        "indexed": false,
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "SlotCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "newOccupant",
        "type": "address"
      }
    ],
    "name": "SlotPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "name": "SlotReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "oldPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "PriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "newPercentage",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "confirmableAt",
        "type": "uint256"
      }
    ],
    "name": "TaxRateUpdateProposed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "oldPercentage",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "newPercentage",
        "type": "uint256"
      }
    ],
    "name": "TaxRateUpdateConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "name": "TaxRateUpdateCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "name": "SlotDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "landOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      }
    ],
    "name": "SlotActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "oldRate",
        "type": "int96"
      },
      {
        "indexed": false,
        "name": "newRate",
        "type": "int96"
      },
      {
        "indexed": false,
        "name": "operation",
        "type": "string"
      }
    ],
    "name": "FlowOperation",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "slotId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "callbackName",
        "type": "string"
      }
    ],
    "name": "ModuleCallFailed",
    "type": "event"
  }
] as const;
