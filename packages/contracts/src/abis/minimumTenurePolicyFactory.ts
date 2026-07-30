export const minimumTenurePolicyFactoryAbi = [
  {
    "type": "function",
    "name": "getOrDeploy",
    "inputs": [
      {
        "name": "tenureSeconds",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "policy",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isDeployed",
    "inputs": [
      {
        "name": "tenureSeconds",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "predict",
    "inputs": [
      {
        "name": "tenureSeconds",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TenurePolicyDeployed",
    "inputs": [
      {
        "name": "policy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tenureSeconds",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidTenure",
    "inputs": []
  }
] as const;
