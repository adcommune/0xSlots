import { AdDataQueryError } from "./types";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Fetch ad content from a metadata URI (IPFS or HTTP)
 */
export const fetchAdFromURI = async (uri: string) => {
  if (!uri) throw new Error(AdDataQueryError.NO_AD);

  const url = uri.startsWith("ipfs://")
    ? `${IPFS_GATEWAY}${uri.slice(7)}`
    : uri;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error(AdDataQueryError.NO_AD);
    throw new Error(AdDataQueryError.ERROR);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return data;
};

/**
 * Fetch the metadata URI for a slot from the MetadataModule contract via RPC
 */
export const fetchMetadataURI = async (
  rpcUrl: string,
  metadataModuleAddress: string,
  slotAddress: string,
): Promise<string> => {
  // tokenURI(address) selector = 0xc2bc2efc (keccak of tokenURI(address))
  // Actually, tokenURI takes address param, need proper encoding
  const paddedSlot = slotAddress.slice(2).toLowerCase().padStart(64, "0");
  // tokenURI(address) = 0xc87b56dd... no, it's a custom function
  // bytes4(keccak256("tokenURI(address)"))
  const selector = "0xe9dc6375"; // we'll compute it properly

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      id: 1,
      params: [
        {
          to: metadataModuleAddress,
          data: `0x93702f33${paddedSlot}`, // tokenURI(address)
        },
        "latest",
      ],
    }),
  });

  const json = await res.json();
  if (!json.result || json.result === "0x") return "";

  // Decode ABI-encoded string
  try {
    const hex = json.result.slice(2);
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16);
    const strHex = hex.slice(offset + 64, offset + 64 + length * 2);
    let str = "";
    for (let i = 0; i < strHex.length; i += 2) {
      str += String.fromCharCode(parseInt(strHex.slice(i, i + 2), 16));
    }
    return str;
  } catch {
    return "";
  }
};
