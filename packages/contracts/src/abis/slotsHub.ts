export const slotsHubAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "land",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "account",
        "type": "address"
      }
    ],
    "name": "LandOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          {
            "name": "protocolFeeBps",
            "type": "uint256"
          },
          {
            "name": "protocolFeeRecipient",
            "type": "address"
          },
          {
            "name": "slotPrice",
            "type": "uint256"
          },
          {
            "name": "newLandInitialCurrency",
            "type": "address"
          },
          {
            "name": "newLandInitialAmount",
            "type": "uint256"
          },
          {
            "name": "newLandInitialPrice",
            "type": "uint256"
          },
          {
            "name": "newLandInitialTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "newLandInitialMaxTaxPercentage",
            "type": "uint256"
          },
          {
            "name": "newLandInitialMinTaxUpdatePeriod",
            "type": "uint256"
          },
          {
            "name": "newLandInitialModule",
            "type": "address"
          }
        ],
        "indexed": false,
        "name": "newHubSettings",
        "type": "tuple"
      }
    ],
    "name": "HubSettingsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "module",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "allowed",
        "type": "bool"
      },
      {
        "indexed": false,
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "name": "version",
        "type": "string"
      }
    ],
    "name": "ModuleAllowedStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "currency",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "allowed",
        "type": "bool"
      }
    ],
    "name": "CurrencyAllowedStatusUpdated",
    "type": "event"
  }
] as const;
