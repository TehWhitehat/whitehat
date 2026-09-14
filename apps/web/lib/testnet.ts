import { defineChain, parseAbi } from "viem";
export const testnet = defineChain({ id: 46630, name: "Robinhood Chain Testnet", nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } }, blockExplorers: { default: { name: "Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com" } }, testnet: true });
export const registryAbi = parseAbi(["function register(uint256 chainId,address target) returns(bytes32)", "function originatingScout(bytes32 id) view returns(address)"]);
