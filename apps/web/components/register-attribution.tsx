"use client";
import { useState } from "react";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import { createPublicClient, http, encodeAbiParameters, keccak256, zeroAddress, type Address } from "viem";
import { attributionNetwork, registrationRequest } from "../lib/attribution-network";
import { registryAbi } from "../lib/testnet";
import { useScout } from "./wallet-provider";
export function RegisterAttribution({ chainId, target, registry, originalScout, onConfirmed }: { chainId: number; target: string; registry: string; originalScout: string; onConfirmed: () => void }) {
  const network = attributionNetwork(chainId);
  const isTestnet = chainId === 46630;
  const { address } = useConnection();
  const scout = useScout();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState<string>();
  const eligible = !!scout.wallet && address?.toLowerCase() === originalScout.toLowerCase();
  async function register() {
    if (!eligible || busy) return;
    setBusy(true); setMessage("");
    try {
      const reader = createPublicClient({ chain: network, transport: http() });
      if (await reader.getChainId() !== chainId) throw new Error("Selected network unavailable.");
      const id = keccak256(encodeAbiParameters([{type:"uint256"},{type:"address"}], [BigInt(chainId), target as Address]));
      const existing = await reader.readContract({ address: registry as Address, abi: registryAbi, functionName: "originatingScout", args: [id] });
      if (existing !== zeroAddress) { setMessage(`TARGET ALREADY REGISTERED / Original Scout: ${existing}`); onConfirmed(); return; }
      const code = await reader.getCode({ address: target as Address });
      if (!code || code === "0x") throw new Error("Target must have contract code on the selected network.");
      await switchChainAsync({ chainId });
      const request = registrationRequest(chainId, registry as Address, target as Address, address!);
      await reader.simulateContract(request);
      setMessage(`Approve the ${isTestnet ? "testnet" : "mainnet"} registration in your wallet.`);
      const tx = await writeContractAsync(request);
      setHash(tx); setMessage("PENDING CONFIRMATION");
      const receipt = await reader.waitForTransactionReceipt({ hash: tx, confirmations: 1 });
      if (receipt.status !== "success") throw new Error("Registration reverted. Original attribution is unchanged.");
      setMessage(`ONCHAIN ATTRIBUTION / CONFIRMED / BLOCK ${receipt.blockNumber}`); onConfirmed();
    } catch { setMessage("Registration declined, reverted or unavailable. Your database submission is retained. Check the transaction status before retrying."); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 border border-line p-5 text-xs leading-6"><p className="text-mint">ATTRIBUTION / OFFCHAIN</p><p>Optional registration on {network.name} / {chainId}. Requires your explicit wallet approval and {isTestnet ? "testnet gas" : "mainnet ETH for gas"}. Eligibility remains subject to review.</p><p className="break-all">TargetRegistry / {registry}</p><button type="button" className="button button-primary mt-4 disabled:opacity-50" disabled={!eligible || busy || !!hash} onClick={register}>{busy ? "WAITING FOR WALLET / CHAIN" : isTestnet ? "REGISTER ATTRIBUTION ON TESTNET" : "REGISTER ATTRIBUTION ON MAINNET"}</button>{!eligible && <p>Connect and sign in as the original database Scout to register.</p>}{message && <p role="status">{message}</p>}{hash && <a className="break-all text-mint underline" href={`${network.blockExplorers.default.url}/tx/${hash}`} target="_blank" rel="noreferrer">{hash}</a>}</section>;
}

