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
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
  { type: "error", name: "SlotHasNoModule", inputs: [] },
] as const;
