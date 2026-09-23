import "server-only";
import { createPublicClient, encodeAbiParameters, http, keccak256, parseAbi, parseAbiItem, type Address } from "viem";

import { attributionNetwork } from "./attribution-network";
const testnetRegistry = "0x24de10e8da3d101d7eb7bcd54fab47e91c1dfb3f";
const validAddress = /^0x[0-9a-fA-F]{40}$/;
const client = (chainId: number) => createPublicClient({ chain: attributionNetwork(chainId), transport: http(undefined, { timeout: 5000, retryCount: 0 }) });
export type OnchainAttribution = { status: "OFFCHAIN" | "ONCHAIN" | "UNAVAILABLE"; scout?: string; registry?: string; transactionHash?: string | null; blockNumber?: string; confirmationStatus?: string; chainId: number; note?: string };

export async function onchainAttribution(chainId: number, target: string): Promise<OnchainAttribution> {
  if (chainId !== 4663 && chainId !== 46630) return { status: "UNAVAILABLE", chainId, note: "Unsupported attribution network." };
  const configured = chainId === 4663 ? process.env.WHITEHAT_MAINNET_REGISTRY_ADDRESS : process.env.WHITEHAT_TESTNET_REGISTRY_ADDRESS;
  if (chainId === 4663 && configured?.toLowerCase() === testnetRegistry) return { status: "UNAVAILABLE", chainId, note: "Testnet registry cannot be used for production attribution." };
  if (!configured) return { status: "OFFCHAIN", chainId };
  if (!validAddress.test(configured) || !validAddress.test(target)) return { status: "UNAVAILABLE", chainId, note: "Registry configuration is invalid." };
  try {
    const reader = client(chainId);
    if (await reader.getChainId() !== chainId) throw new Error("Wrong chain");
    const code = await reader.getCode({ address: configured as Address });
    if (!code || code === "0x") throw new Error("Registry is not deployed");
    const blockNumber = await reader.getBlockNumber();
    const id = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }], [BigInt(chainId), target as Address]));
    const scout = await reader.readContract({ address: configured as Address, abi: parseAbi(["function originatingScout(bytes32 id) view returns(address)"]), functionName: "originatingScout", args: [id], blockNumber });
    if (scout === "0x0000000000000000000000000000000000000000") return { status: "OFFCHAIN", registry: configured, chainId };
    let transactionHash: string | null = null; let registrationBlock: string | undefined;
    try {
      // Bound the log query; older registrations still resolve through contract state.
      const floor = blockNumber > BigInt(4999) ? blockNumber - BigInt(4999) : BigInt(0);
      const configuredBlock = chainId === 4663 ? process.env.WHITEHAT_MAINNET_REGISTRY_DEPLOYMENT_BLOCK : process.env.WHITEHAT_TESTNET_REGISTRY_DEPLOYMENT_BLOCK;
      const start = configuredBlock && /^\d+$/.test(configuredBlock) ? BigInt(configuredBlock) : floor;
      const logs = await reader.getLogs({ address: configured as Address, event: parseAbiItem("event TargetRegistered(bytes32 indexed targetId, uint256 indexed chainId, address indexed target, address scout, uint256 registeredAt)"), args: { targetId: id }, fromBlock: start > floor ? start : floor, toBlock: blockNumber });
      const match = logs.find(log => log.args.scout?.toLowerCase() === scout.toLowerCase()); transactionHash = match?.transactionHash ?? null; registrationBlock = match?.blockNumber?.toString();
    } catch { /* State attribution remains verified even if the bounded log lookup fails. */ }
    return { status: "ONCHAIN", chainId, scout, registry: configured, transactionHash, blockNumber: registrationBlock, confirmationStatus: "CONFIRMED", note: transactionHash ? undefined : "Registration verified in contract state; transaction unavailable in the recent log window." };
  } catch { return { status: "UNAVAILABLE", chainId, note: "Registry lookup unavailable. Offchain attribution is retained." }; }
}

export async function verifiedTokenAddress(): Promise<string | null> {
  const address = process.env.WHITEHAT_TESTNET_TOKEN_ADDRESS;
  if (!address || !validAddress.test(address)) return null;
  try {
    const reader = client(46630);
    if (await reader.getChainId() !== 46630) return null;
    const supply = await reader.readContract({ address: address as Address, abi: parseAbi(["function totalSupply() view returns(uint256)"]), functionName: "totalSupply" });
    return supply === BigInt("1000000000000000000000000000") ? address : null;
  } catch { return null; }
}


