import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";
import {
  ERC721SlotsAbi,
  ERC721SlotsFactoryAbi,
  FeedPostModuleAbi,
  SlotAbi,
  SlotFactoryAbi,
} from "./abis";

// ──────────────────────────────────────────
// Per-chain factory addresses (mirror packages/subgraph/config/*.json)
// ──────────────────────────────────────────

const BASE_SEPOLIA_SLOT_FACTORY = "0x6D87C1647f228Baf8DE0374FCd7FdEBF6900fdFF" as const;
const BASE_SEPOLIA_SLOT_FACTORY_START_BLOCK = 39341061;

const BASE_SLOT_FACTORY = "0xbf2F890E8F5CCCB3A1D7c5030dBC1843B9E36B0e" as const;
const BASE_SLOT_FACTORY_START_BLOCK = 43581441;

// ERC721SlotsFactory — base-sepolia only for now
const BASE_SEPOLIA_ERC721_FACTORY = "0x77aaDBcDaecFED7Fc542E5A68A0e77154367a9EB" as const;
const BASE_SEPOLIA_ERC721_FACTORY_START_BLOCK = 39679046;

// ──────────────────────────────────────────
// Event signatures used to derive child addresses via factory()
// ──────────────────────────────────────────

const SLOT_DEPLOYED_EVENT = parseAbiItem(
  "event SlotDeployed(address indexed slot, address indexed recipient, address indexed currency, (bool,bool,address) config, (uint256,address,uint256,uint256) initParams)",
);

const MODULE_VERIFIED_EVENT = parseAbiItem(
  "event ModuleVerified(address indexed module, bool verified, string name, string version, uint256 feeBps, string moduleURI)",
);

const COLLECTION_DEPLOYED_EVENT = parseAbiItem(
  "event CollectionDeployed(address indexed collection, address indexed creator, address indexed slotFactory, string name, string symbol, address currency)",
);

// Helper: build per-chain factory() override for slot-factory-spawned contracts
const slotChildAddress = (event: typeof SLOT_DEPLOYED_EVENT | typeof MODULE_VERIFIED_EVENT, parameter: "slot" | "module") => ({
  baseSepolia: {
    address: factory({
      address: BASE_SEPOLIA_SLOT_FACTORY,
      event,
      parameter,
    }),
    startBlock: BASE_SEPOLIA_SLOT_FACTORY_START_BLOCK,
  },
  base: {
    address: factory({
      address: BASE_SLOT_FACTORY,
      event,
      parameter,
    }),
    startBlock: BASE_SLOT_FACTORY_START_BLOCK,
  },
});

// Alchemy is the default RPC provider — base-sepolia.publicnode.com works too
// but Coinbase's https://sepolia.base.org has a broken eth_getLogs.
// Set ALCHEMY_API_KEY in .env.local.
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY ?? "";

export default createConfig({
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    },
    base: {
      id: 8453,
      rpc: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    },
  },
  contracts: {
    SlotFactory: {
      abi: SlotFactoryAbi,
      chain: {
        baseSepolia: {
          address: BASE_SEPOLIA_SLOT_FACTORY,
          startBlock: BASE_SEPOLIA_SLOT_FACTORY_START_BLOCK,
        },
        base: {
          address: BASE_SLOT_FACTORY,
          startBlock: BASE_SLOT_FACTORY_START_BLOCK,
        },
      },
    },
    Slot: {
      abi: SlotAbi,
      chain: slotChildAddress(SLOT_DEPLOYED_EVENT, "slot"),
    },
    // FeedPostModule's ABI carries both V1 (slot, uri) and V2 (slot, updatedBy, uri)
    // MetadataUpdated overloads, so this single data source covers MetadataModule
    // contracts too — no separate MetadataModule entry to avoid duplicate handler firing.
    FeedPostModule: {
      abi: FeedPostModuleAbi,
      chain: slotChildAddress(MODULE_VERIFIED_EVENT, "module"),
    },
    ERC721SlotsFactory: {
      abi: ERC721SlotsFactoryAbi,
      chain: "baseSepolia",
      address: BASE_SEPOLIA_ERC721_FACTORY,
      startBlock: BASE_SEPOLIA_ERC721_FACTORY_START_BLOCK,
    },
    ERC721Slots: {
      abi: ERC721SlotsAbi,
      chain: "baseSepolia",
      address: factory({
        address: BASE_SEPOLIA_ERC721_FACTORY,
        event: COLLECTION_DEPLOYED_EVENT,
        parameter: "collection",
      }),
      startBlock: BASE_SEPOLIA_ERC721_FACTORY_START_BLOCK,
    },
  },
});
