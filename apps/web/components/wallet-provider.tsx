"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { WagmiProvider, createConfig, http, useConnection, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { testnet } from "../lib/testnet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";

const chain = testnet;
const config = createConfig({ chains: [chain], connectors: [injected()], transports: { [chain.id]: http() }, ssr: true });
const ScoutContext = createContext<{ wallet: string | null; refresh: () => Promise<void> }>({ wallet: null, refresh: async () => {} });
export const useScout = () => useContext(ScoutContext);
async function auth(body: object) {
  const response = await fetch("/api/scout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
}
function ScoutSession({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const { address } = useConnection();
  async function refresh() { const response = await fetch("/api/scout", { cache: "no-store" }); const data = await response.json(); setWallet(data.wallet ?? null); }
  useEffect(() => { let active = true; void fetch("/api/scout", { cache: "no-store" }).then(r => r.json()).then(data => { if (active) setWallet(data.wallet ?? null); }).catch(() => {}); return () => { active = false; }; }, [address]);
  return <ScoutContext.Provider value={{ wallet: address?.toLowerCase() === wallet ? wallet : null, refresh }}>{children}</ScoutContext.Provider>;
}
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <WagmiProvider config={config}><QueryClientProvider client={client}><ScoutSession>{children}</ScoutSession></QueryClientProvider></WagmiProvider>;
}
export function WalletControl() {
  const { address, isConnected } = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const scout = useScout();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true); setError("");
    try { if (!connectors[0]) throw new Error("Open Whitehat in a browser with an injected EVM wallet."); await connectAsync({ connector: connectors[0] }); }
    catch { setError("Wallet unavailable or connection declined. Use a browser with an EVM wallet extension."); } finally { setBusy(false); }
  }
  async function signIn() {
    if (!address) return;
    setBusy(true); setError("");
    try { const { message } = await auth({ action: "challenge", wallet: address }); const signature = await signMessageAsync({ message }); await auth({ action: "verify", signature }); await scout.refresh(); }
    catch { setError("Sign-in declined or expired. Retry the offchain message signature."); } finally { setBusy(false); }
  }
  async function disconnect() { setBusy(true); try { await auth({ action: "logout" }); await disconnectAsync(); await scout.refresh(); } catch { setError("Could not disconnect. Retry."); } finally { setBusy(false); } }
  return <div className="flex max-w-xs flex-wrap items-center gap-3 text-xs">
    {!isConnected ? <button className="preview-tag cursor-pointer text-mint" disabled={busy} onClick={connect}>CONNECT WALLET</button> : <>
      <Link className="font-mono text-mint" href={`/scouts/${address?.toLowerCase()}`}>{address?.slice(0, 6)}…{address?.slice(-4)}</Link>
      {!scout.wallet && <button disabled={busy} className="preview-tag cursor-pointer" onClick={signIn} title="Offchain message only. No transaction.">SIGN IN TO WHITEHAT</button>}
      <button className="text-muted underline" disabled={busy} onClick={disconnect}>Disconnect</button>
    </>}
    {busy && <span role="status">Waiting for wallet…</span>}{error && <p role="alert" className="w-full text-xs leading-5 text-muted">{error}</p>}
  </div>;
}

