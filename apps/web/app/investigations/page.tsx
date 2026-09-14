import { SiteHeader } from "../../components/site-header";
import { InvestigationList } from "../../components/investigation-list";
import { listInvestigations } from "../../lib/persistent-investigations";
import { databaseError } from "../../lib/database";
export const dynamic = "force-dynamic";
export default async function ExplorePage() {
  let rows: Awaited<ReturnType<typeof listInvestigations>> = []; let error = "";
  try { rows = await listInvestigations(); } catch { error = databaseError(); }
  return <><SiteHeader /><main id="main" className="shell py-16"><p className="eyebrow mb-5">SCOUT NETWORK / STORED INVESTIGATIONS</p><h1 className="console-title text-4xl">Explore investigations.</h1><p className="mb-10 mt-6 max-w-2xl text-sm leading-7 text-muted">Latest 100 investigations. Public metadata only; private findings and reproduction details remain restricted.</p>{error ? <p role="status" className="border border-line bg-panel p-6 text-sm leading-7 text-muted">{error}</p> : <InvestigationList rows={rows} />}</main></>;
}
