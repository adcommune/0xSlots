export const FeedPostModuleV2Abi = [
  {
    "type": "event",
    "name": "MetadataUpdated",
    "inputs": [
      {
        "name": "slot",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "updatedBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "uri",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  }
] as const;
