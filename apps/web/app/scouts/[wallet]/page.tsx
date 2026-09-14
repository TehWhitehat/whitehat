import { SiteHeader } from "../../../components/site-header";
import { InvestigationList } from "../../../components/investigation-list";
import { listInvestigations } from "../../../lib/persistent-investigations";
import { addressPattern } from "../../../lib/investigation";
import { database, databaseError } from "../../../lib/database";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function ScoutPage({ params }: { params: Promise<{ wallet: string }> }) {
  const wallet = (await params).wallet.toLowerCase(); if (!addressPattern.test(wallet)) notFound();
  let rows: Awaited<ReturnType<typeof listInvestigations>> = []; let error = ""; let counts = { submissions: 0, investigations: 0, validated: 0 };
  try { const result = await database().rpc("scout_counts", { p_wallet: wallet }); if (result.error) throw result.error; counts = result.data; rows = await listInvestigations(wallet); } catch { error = databaseError(); }
  return <><SiteHeader /><main id="main" className="shell py-16"><p className="eyebrow mb-5">SCOUT</p><h1 className="break-all font-mono text-xl sm:text-3xl">{wallet}</h1><p className="my-6 text-xs text-muted">SCOUT HISTORY / SEE EACH INVESTIGATION FOR TESTNET ATTRIBUTION</p>{error ? <p role="status" className="border border-line p-6 text-sm leading-7 text-muted">{error}</p> : <><div className="my-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">{[["TARGETS SUBMITTED", counts.submissions], ["INVESTIGATIONS", counts.investigations], ["VALIDATED FINDINGS", counts.validated], ["PRODUCTION BOUNTIES", "NOT REPORTED"], ["PRODUCTION REWARDS", "NOT REPORTED"]].map(([label, value]) => <div key={label} className="border border-line bg-panel p-6"><p className="text-3xl text-mint">{value}</p><p className="mt-4 font-mono text-[10px]">{label}</p></div>)}</div><p className="mb-6 text-xs leading-6 text-muted">Counts cover this Scout&apos;s stored submissions, including duplicates. Findings are not reward eligibility. Production payments are not publicly reported. Testnet mock distributions are shown separately on /buybacks. Latest 100 investigations shown.</p><InvestigationList rows={rows} /></>}</main></>;
}

