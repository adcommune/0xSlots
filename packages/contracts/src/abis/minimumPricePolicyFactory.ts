export const minimumPricePolicyFactoryAbi = [
  {
    type: "function",
    name: "getOrDeploy",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "currency",
        type: "address",
      },
      {
        name: "minPrice",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "policy",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "predict",
    stateMutability: "view",
    inputs: [
      {
        name: "currency",
        type: "address",
      },
      {
        name: "minPrice",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "isDeployed",
    stateMutability: "view",
    inputs: [
      {
        name: "currency",
        type: "address",
      },
      {
        name: "minPrice",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "event",
    name: "PricePolicyDeployed",
    anonymous: false,
    inputs: [
      {
        name: "policy",
        type: "address",
        indexed: true,
      },
      {
        name: "currency",
        type: "address",
        indexed: true,
      },
      {
        name: "minPrice",
        type: "uint256",
        indexed: true,
      },
    ],
  },
  {
    type: "error",
    name: "InvalidFloor",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidCurrency",
    inputs: [],
  },
] as const;
