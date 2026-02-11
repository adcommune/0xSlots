export const SlotsHubABI = [
  {
    type: "function",
    name: "hubSettings",
    inputs: [],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "protocolFeeBps", type: "uint256" },
          { name: "protocolFeeRecipient", type: "address" },
          { name: "slotPrice", type: "uint256" },
          { name: "newLandInitialCurrency", type: "address" },
          { name: "newLandInitialAmount", type: "uint256" },
          { name: "newLandInitialPrice", type: "uint256" },
          { name: "newLandInitialTaxPercentage", type: "uint256" },
          { name: "newLandInitialMaxTaxPercentage", type: "uint256" },
          { name: "newLandInitialMinTaxUpdatePeriod", type: "uint256" },
          { name: "newLandInitialModule", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLand",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "openLand",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "LandOpened",
    inputs: [
      { name: "land", type: "address", indexed: true },
      { name: "account", type: "address", indexed: true },
    ],
  },
] as const;

export const SlotsABI = [
  {
    type: "function",
    name: "getSlot",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        name: "slot",
        components: [
          { name: "currency", type: "address" },
          { name: "occupant", type: "address" },
          { name: "basePrice", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "taxPercentage", type: "uint256" },
          { name: "maxTaxPercentage", type: "uint256" },
          { name: "minTaxUpdatePeriod", type: "uint256" },
          {
            name: "pendingTaxUpdate",
            type: "tuple",
            components: [
              { name: "newRate", type: "uint256" },
              { name: "proposedAt", type: "uint256" },
              { name: "status", type: "uint8" },
            ],
          },
          { name: "module", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextSlotId",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateFlowRate",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [{ type: "int96" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "buy",
    inputs: [{ name: "slotId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "selfAssess",
    inputs: [
      { name: "slotId", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowCurrency",
    inputs: [
      { name: "currency", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowModule",
    inputs: [
      { name: "module", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isCurrencyAllowed",
    inputs: [{ name: "currency", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isModuleAllowed",
    inputs: [{ name: "module", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateHubSettings",
    inputs: [
      {
        name: "newSettings",
        type: "tuple",
        components: [
          { name: "protocolFeeBps", type: "uint256" },
          { name: "protocolFeeRecipient", type: "address" },
          { name: "slotPrice", type: "uint256" },
          { name: "newLandInitialCurrency", type: "address" },
          { name: "newLandInitialAmount", type: "uint256" },
          { name: "newLandInitialPrice", type: "uint256" },
          { name: "newLandInitialTaxPercentage", type: "uint256" },
          { name: "newLandInitialMaxTaxPercentage", type: "uint256" },
          { name: "newLandInitialMinTaxUpdatePeriod", type: "uint256" },
          { name: "newLandInitialModule", type: "address" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "expandLand",
    inputs: [
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const MetadataModuleABI = [
  {
    type: "function",
    name: "getMetadata",
    inputs: [
      { name: "land", type: "address" },
      { name: "slotId", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "metadata", type: "string" },
          { name: "owner", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setMetadata",
    inputs: [
      { name: "land", type: "address" },
      { name: "slotId", type: "uint256" },
      { name: "metadata", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
