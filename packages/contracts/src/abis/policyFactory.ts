export const policyFactoryAbi = [
  {
    type: "function",
    name: "policyKind",
    stateMutability: "pure",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [
      {
        name: "policy",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;
