"use client";

import { useState } from "react";
import deployment from "../../../docs/deployments/robinhood-mainnet.json";

export function ProductionToken() {
  const [status, setStatus] = useState("");
  const token = deployment.productionToken;
  return <div className="mt-5 text-sm leading-7">
    <p className="text-mint">$WHITEHAT / ROBINHOOD CHAIN MAINNET</p>
    <div className="my-3 flex flex-wrap items-center gap-3">
      <code className="break-all text-xs">{token.address}</code>
      <button type="button" className="border border-line px-3 py-1 text-mint" aria-label={`Copy address ${token.address}`} onClick={async () => {
        try { await navigator.clipboard.writeText(token.address); setStatus("Copied"); }
        catch { setStatus("Select the address to copy"); }
      }}>Copy</button>
      <span role="status" className="text-xs text-muted">{status}</span>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-mint">
      <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">View on mainnet explorer ↗</a>
      <a href={token.ponsUrl} target="_blank" rel="noopener noreferrer" className="underline">View / trade on Pons ↗</a>
    </div>
  </div>;
}
