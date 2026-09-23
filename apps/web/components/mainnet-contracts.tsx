import deployment from "../../../docs/deployments/robinhood-mainnet.json";

import { ProductionToken } from "./production-token";

export function MainnetContracts() {
  return <div className="mt-6 border border-line p-5 text-sm leading-7">
    <p className="eyebrow mb-4">MAINNET / ROBINHOOD CHAIN / 4663</p>
    <dl className="grid gap-4 md:grid-cols-2">{Object.entries(deployment.contracts).map(([name, contract]) => <div key={name}>
      <dt className="text-mint">{name} — MAINNET</dt>
      <dd><a className="break-all font-mono text-xs underline" href={`https://robinhoodchain.blockscout.com/address/${contract.address}`} target="_blank" rel="noopener noreferrer">{contract.address}</a></dd>
    </div>)}</dl>
    <ProductionToken /><p className="mt-5 text-muted">Buyback route: Pending activation</p>
    <p className="mt-2 text-xs text-muted">Deployment code and permissions checked onchain. The official token is live on Pons and permanently bound to BuybackVault. Production buyback routing remains pending activation. Source-verification status is available on the explorer.</p>
  </div>;
}
