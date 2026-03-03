import { createPublicClient, createWalletClient, http, parseAbi, parseUnits, erc20Abi } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x5f62cf048ae44389e64e5614c205bd4e2ac3e4b499e01715bb87646b5164fc6a");
const client = createPublicClient({ chain: baseSepolia, transport: http("https://sepolia.base.org") });
const wallet = createWalletClient({ chain: baseSepolia, transport: http("https://sepolia.base.org"), account });

const USDC = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
const slots = [
  "0xc58911e5e2e194dd4e26df9840380c75f724d62f",
  "0x9fcd93f2c3c59f929128043b98a349d1805e1a68",
];

const slotAbi = parseAbi(["function buy(uint256 depositAmount, uint256 selfAssessedPrice)"]);
const deposit = parseUnits("2", 6);   // 2 USDC
const price = parseUnits("1", 6);     // 1 USDC

// Check balance
const bal = await client.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [account.address] });
console.log("K USDC balance:", Number(bal) / 1e6);

for (const slot of slots) {
  console.log(`\nBuying ${slot.slice(0,10)}...`);
  
  // Approve
  const approveTx = await wallet.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "approve",
    args: [slot, deposit],
  });
  console.log("  Approve tx:", approveTx);
  await client.waitForTransactionReceipt({ hash: approveTx });

  // Buy (vacant = no price to pay, just deposit + self-assess)
  const buyTx = await wallet.writeContract({
    address: slot,
    abi: slotAbi,
    functionName: "buy",
    args: [deposit, price],
  });
  console.log("  Buy tx:", buyTx);
  await client.waitForTransactionReceipt({ hash: buyTx });
  console.log("  Done!");
}
