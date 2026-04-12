export const feedRouterAbi = [
  {
    type: "function",
    name: "buyAndPost",
    inputs: [
      { name: "slot", type: "address", internalType: "address" },
      { name: "depositAmount", type: "uint256", internalType: "uint256" },
      { name: "selfAssessedPrice", type: "uint256", internalType: "uint256" },
      { name: "uri", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "emitEvent",
    inputs: [
      { name: "slot", type: "address", internalType: "address" },
      { name: "eventType", type: "uint8", internalType: "uint8" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setTrustedEmitter",
    inputs: [
      { name: "emitter", type: "address", internalType: "address" },
      { name: "trusted", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "trustedEmitters",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "FeedEvent",
    inputs: [
      { name: "slot", type: "address", indexed: true, internalType: "address" },
      { name: "eventType", type: "uint8", indexed: true, internalType: "uint8" },
      { name: "data", type: "bytes", indexed: false, internalType: "bytes" },
    ],
    anonymous: false,
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
  { type: "error", name: "SlotHasNoModule", inputs: [] },
  { type: "error", name: "NotTrustedEmitter", inputs: [] },
] as const;
