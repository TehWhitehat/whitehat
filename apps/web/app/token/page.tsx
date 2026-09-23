import { MainnetContracts } from "../../components/mainnet-contracts";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const dynamic = "force-dynamic";
export default function TokenPage() {
  return <><SiteHeader /><main id="main" className="shell py-16"><p className="eyebrow mb-5">WHITEHAT / ONCHAIN FOUNDATION</p><h1 className="text-5xl font-semibold tracking-tight">WHITEHAT</h1><p className="mt-4 font-mono text-xl text-mint">$WHITEHAT</p><MainnetContracts /><div className="my-10 grid gap-5 sm:grid-cols-3">{[["NETWORK", "Robinhood Chain Mainnet / 4663"], ["SUPPLY", "1,000,000,000 WHITEHAT"], ["DECIMALS", "18"]].map(([label, value]) => <div key={label} className="border border-line bg-panel p-6"><p className="eyebrow mb-4">{label}</p><p className="text-lg">{value}</p></div>)}</div><p className="text-sm leading-7 text-muted">Whitehat (WHITEHAT) is live on Pons. The production contract address and token details above have been verified on Robinhood Chain mainnet.</p><section className="mt-10 border border-line bg-panel p-8"><h2 className="eyebrow mb-6">BOUNTY ALLOCATION</h2><div className="grid gap-6 sm:grid-cols-2"><p className="text-3xl">50% <span className="text-base text-mint">SCOUT</span></p><p className="text-3xl">50% <span className="text-base text-mint">$WHITEHAT BUYBACK</span></p></div><p className="mt-6 text-sm leading-7 text-muted">ERC-20 bounty assets only. Odd smallest units go to the buyback allocation. No operating fee. Purchased tokens stay in BuybackVault; no automatic burns or trading. No production router is configured.</p></section><Link className="mt-8 inline-block text-mint underline" href="/buybacks">VIEW BUYBACK STATUS</Link></main></>;
}



