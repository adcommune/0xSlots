export const feedModuleAbi = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateMetadata",
    inputs: [
      { name: "slot", type: "address", internalType: "address" },
      { name: "uri", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "postFor",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "slot", type: "address", internalType: "address" },
      { name: "uri", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "trustedRouters",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setTrustedRouter",
    inputs: [
      { name: "router", type: "address", internalType: "address" },
      { name: "trusted", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "MetadataUpdated",
    inputs: [
      { name: "slot", type: "address", indexed: true, internalType: "address" },
      { name: "uri", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RouterUpdated",
    inputs: [
      { name: "router", type: "address", indexed: true, internalType: "address" },
      { name: "trusted", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
  { type: "error", name: "NotOccupant", inputs: [] },
  { type: "error", name: "NotTrustedRouter", inputs: [] },
  { type: "error", name: "NotActualOccupant", inputs: [] },
] as const;
