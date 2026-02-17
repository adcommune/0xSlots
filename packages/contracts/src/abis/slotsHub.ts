export const slotsHubAbi = 
[
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "DEFAULT_ADMIN_ROLE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowCurrency",
    "inputs": [
      {
        "name": "currency",
        "type": "address"
      },
      {
        "name": "allowed",
        "type": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allowModule",
    "inputs": [
      {
        "name": "module",
        "type": "address"
      },
      {
        "name": "allowed",
        "type": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "expandLand",
    "inputs": [
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
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getRoleAdmin",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "grantRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "hasRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
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
    "name": "hubSettings",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
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
            "name": "landCreationFee",
            "type": "uint256"
          },
          {
            "name": "slotExpansionFee",
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
          },
          {
            "name": "moduleCallGasLimit",
            "type": "uint256"
          },
          {
            "name": "liquidationBountyBps",
            "type": "uint256"
          },
          {
            "name": "minDepositSeconds",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_slotsImpl",
        "type": "address"
      },
      {
        "name": "settings",
        "type": "tuple",
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
            "name": "landCreationFee",
            "type": "uint256"
          },
          {
            "name": "slotExpansionFee",
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
          },
          {
            "name": "moduleCallGasLimit",
            "type": "uint256"
          },
          {
            "name": "liquidationBountyBps",
            "type": "uint256"
          },
          {
            "name": "minDepositSeconds",
            "type": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isCurrencyAllowed",
    "inputs": [
      {
        "name": "currency",
        "type": "address"
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
    "name": "isModuleAllowed",
    "inputs": [
      {
        "name": "module",
        "type": "address"
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
    "name": "lands",
    "inputs": [
      {
        "name": "",
        "type": "address"
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
    "name": "openLand",
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "land",
        "type": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32"
      },
      {
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "slotsImplementation",
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
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4"
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
    "name": "updateHubSettings",
    "inputs": [
      {
        "name": "newSettings",
        "type": "tuple",
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
            "name": "landCreationFee",
            "type": "uint256"
          },
          {
            "name": "slotExpansionFee",
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
          },
          {
            "name": "moduleCallGasLimit",
            "type": "uint256"
          },
          {
            "name": "liquidationBountyBps",
            "type": "uint256"
          },
          {
            "name": "minDepositSeconds",
            "type": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "newImplementation",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "newImplementation",
        "type": "address"
      },
      {
        "name": "data",
        "type": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "withdrawETH",
    "inputs": [
      {
        "name": "to",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AdminChanged",
    "inputs": [
      {
        "name": "previousAdmin",
        "type": "address",
        "indexed": false
      },
      {
        "name": "newAdmin",
        "type": "address",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BeaconUpgraded",
    "inputs": [
      {
        "name": "beacon",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CurrencyAllowedStatusUpdated",
    "inputs": [
      {
        "name": "currency",
        "type": "address",
        "indexed": true
      },
      {
        "name": "allowed",
        "type": "bool",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "HubSettingsUpdated",
    "inputs": [
      {
        "name": "newHubSettings",
        "type": "tuple",
        "indexed": false,
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
            "name": "landCreationFee",
            "type": "uint256"
          },
          {
            "name": "slotExpansionFee",
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
          },
          {
            "name": "moduleCallGasLimit",
            "type": "uint256"
          },
          {
            "name": "liquidationBountyBps",
            "type": "uint256"
          },
          {
            "name": "minDepositSeconds",
            "type": "uint256"
          }
        ]
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
    "name": "LandExpanded",
    "inputs": [
      {
        "name": "land",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newSlotCount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LandOpened",
    "inputs": [
      {
        "name": "land",
        "type": "address",
        "indexed": true
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ModuleAllowedStatusUpdated",
    "inputs": [
      {
        "name": "module",
        "type": "address",
        "indexed": true
      },
      {
        "name": "allowed",
        "type": "bool",
        "indexed": false
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false
      },
      {
        "name": "version",
        "type": "string",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleAdminChanged",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "previousAdminRole",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "newAdminRole",
        "type": "bytes32",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleGranted",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true
      },
      {
        "name": "sender",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleRevoked",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true
      },
      {
        "name": "sender",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "implementation",
        "type": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InsufficientPayment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidFeeRecipient",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LandAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedLandExpansion",
    "inputs": []
  }
] as const;
