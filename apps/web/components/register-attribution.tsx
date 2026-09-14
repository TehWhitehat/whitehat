"use client";
import { useState } from "react";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import { createPublicClient, http, encodeAbiParameters, keccak256, zeroAddress, type Address } from "viem";
import { testnet, registryAbi } from "../lib/testnet";
import { useScout } from "./wallet-provider";
export function RegisterAttribution({ target, registry, originalScout, onConfirmed }: { target: string; registry: string; originalScout: string; onConfirmed: () => void }) {
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
      const reader = createPublicClient({ chain: testnet, transport: http() });
      if (await reader.getChainId() !== 46630) throw new Error("Testnet unavailable.");
      const id = keccak256(encodeAbiParameters([{type:"uint256"},{type:"address"}], [BigInt(46630), target as Address]));
      const existing = await reader.readContract({ address: registry as Address, abi: registryAbi, functionName: "originatingScout", args: [id] });
      if (existing !== zeroAddress) { setMessage(`TARGET ALREADY REGISTERED / Original Scout: ${existing}`); onConfirmed(); return; }
      const code = await reader.getCode({ address: target as Address });
      if (!code || code === "0x") throw new Error("Target must have contract code on testnet.");
      await switchChainAsync({ chainId: 46630 });
      await reader.simulateContract({ account: address, address: registry as Address, abi: registryAbi, functionName: "register", args: [BigInt(46630), target as Address] });
      setMessage("Approve the testnet registration in your wallet.");
      const tx = await writeContractAsync({ chainId: 46630, account: address, address: registry as Address, abi: registryAbi, functionName: "register", args: [BigInt(46630), target as Address] });
      setHash(tx); setMessage("PENDING CONFIRMATION");
      const receipt = await reader.waitForTransactionReceipt({ hash: tx, confirmations: 1 });
      if (receipt.status !== "success") throw new Error("Registration reverted. Original attribution is unchanged.");
      setMessage(`ONCHAIN ATTRIBUTION / CONFIRMED / BLOCK ${receipt.blockNumber}`); onConfirmed();
    } catch { setMessage("Registration declined, reverted or unavailable. Your database submission is retained. Check the transaction status before retrying."); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 border border-line p-5 text-xs leading-6"><p className="text-mint">ATTRIBUTION / OFFCHAIN</p><p>Optional registration on Robinhood Chain Testnet / 46630. Requires your explicit wallet approval and testnet gas. Eligibility remains subject to review.</p><p className="break-all">TargetRegistry / {registry}</p><button type="button" className="button button-primary mt-4 disabled:opacity-50" disabled={!eligible || busy || !!hash} onClick={register}>{busy ? "WAITING FOR WALLET / CHAIN" : "REGISTER ATTRIBUTION ON TESTNET"}</button>{!eligible && <p>Connect and sign in as the original database Scout to register.</p>}{message && <p role="status">{message}</p>}{hash && <a className="break-all text-mint underline" href={`${testnet.blockExplorers.default.url}/tx/${hash}`} target="_blank" rel="noreferrer">{hash}</a>}</section>;
}

