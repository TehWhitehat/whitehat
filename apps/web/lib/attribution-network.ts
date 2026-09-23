import { defineChain, type Address } from "viem";
import { testnet, registryAbi } from "./testnet";

export const mainnet = defineChain({
  id: 4663, name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Robinhood Explorer", url: "https://robinhoodchain.blockscout.com" } },
});

export function attributionNetwork(chainId: number) {
  if (chainId === mainnet.id) return mainnet;
  if (chainId === testnet.id) return testnet;
  throw new Error("Unsupported attribution network.");
}

export function registrationRequest(chainId: number, registry: Address, target: Address, account: Address) {
  attributionNetwork(chainId);
  return { chainId, account, address: registry, abi: registryAbi, functionName: "register" as const, args: [BigInt(chainId), target] as const };
}
