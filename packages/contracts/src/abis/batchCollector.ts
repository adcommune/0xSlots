export const batchCollectorAbi = [
  {
    type: "function" as const,
    name: "collectAll",
    inputs: [{ name: "slots", type: "address[]" as const }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
] as const;
