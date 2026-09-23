import deployment from "../../../docs/deployments/robinhood-mainnet.json";

export function MainnetContracts() {
  return <div className="mt-6 border border-line p-5 text-sm leading-7">
    <p className="eyebrow mb-4">MAINNET / ROBINHOOD CHAIN / 4663</p>
    <dl className="grid gap-4 md:grid-cols-2">{Object.entries(deployment.contracts).map(([name, contract]) => <div key={name}>
      <dt className="text-mint">{name} — MAINNET</dt>
      <dd><a className="break-all font-mono text-xs underline" href={`https://robinhoodchain.blockscout.com/address/${contract.address}`} target="_blank" rel="noreferrer">{contract.address}</a></dd>
    </div>)}</dl>
    <p className="mt-5 text-muted">$WHITEHAT Production CA — Pending Pons launch<br />Buyback route — Pending activation</p>
    <p className="mt-2 text-xs text-muted">Deployment code and permissions checked onchain. The Vault token is intentionally uninitialised; token-dependent buybacks are disabled. Source-verification status is available on the explorer.</p>
  </div>;
}
