export const batchCollectorAbi = [
  {
    "type": "function",
    "name": "collectAll",
    "inputs": [
      {
        "name": "slots",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;
