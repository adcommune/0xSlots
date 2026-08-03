export const minimumPricePolicyAbi = [
  {
    type: "function",
    name: "minPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "currency",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "error",
    name: "PriceBelowFloor",
    inputs: [
      {
        name: "floor",
        type: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "WrongCurrency",
    inputs: [],
  },
] as const;
