import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { MainnetContracts } from "../../components/mainnet-contracts";
import deployment from "../../../../docs/deployments/robinhood-mainnet.json";

export default function BuybacksPage() {
  return <><SiteHeader /><main id="main" className="shell py-16">
    <p className="eyebrow mb-5">ROBINHOOD CHAIN MAINNET / 4663</p>
    <h1 className="text-5xl font-semibold tracking-tight">Buybacks.</h1>
    <p className="mt-6 max-w-3xl text-sm leading-7 text-muted">WHITEHAT’s production buyback infrastructure is deployed. The official token is permanently linked to BuybackVault. Buyback route: Pending activation.</p>
    <div className="my-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[["INFRASTRUCTURE", "Deployed on mainnet"], ["TOKEN BINDING", "Confirmed onchain"], ["SCOUT ALLOCATION", "50%"], ["BUYBACK ALLOCATION", "50%"]].map(([label, value]) => <div key={label} className="border border-line bg-panel p-6"><p className="eyebrow mb-4">{label}</p><p className="text-xl text-mint">{value}</p></div>)}
    </div>
    <section className="border border-line p-6 text-sm leading-7">
      <h2 className="eyebrow mb-4">Buyback route: Pending activation</h2>
      <p>Eligible bounties actually received are split equally: 50% to the originating Scout and 50% to the buyback allocation. Operations are funded separately.</p>
      <p className="mt-4 text-muted">No production buyback router is enabled. Token trading on Pons is separate from protocol buyback execution. Production buybacks require a verified compatible route and explicit activation; token launch and Vault binding do not execute a buyback.</p>
    </section>
    <section className="mt-8">
      <h2 className="eyebrow mb-4">PRODUCTION CONTRACTS</h2>
      <MainnetContracts />
    </section>
    <section className="mt-8 border border-line p-6 text-sm leading-7">
      <h2 className="eyebrow mb-4">VERIFIED TOKEN BINDING</h2>
      <p>The one-time token binding was confirmed in mainnet block {deployment.tokenBinding.blockNumber}. The Vault’s token address cannot be replaced.</p>
      <a className="mt-4 inline-block break-all font-mono text-xs text-mint underline" href={`https://robinhoodchain.blockscout.com/tx/${deployment.tokenBinding.transactionHash}`} target="_blank" rel="noopener noreferrer">{deployment.tokenBinding.transactionHash} ↗</a>
      <p className="mt-3 text-muted">This transaction links the official token to the Vault. It is not a purchase or a bounty payment.</p>
    </section>
    <Link href="/token" className="mt-8 inline-block text-mint underline">WHITEHAT PRODUCTION TOKEN</Link>
  </main></>;
}
