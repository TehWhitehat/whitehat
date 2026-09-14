import Link from "next/link";
import { chainName, type InvestigationRow } from "../lib/persistent-investigations";
export function InvestigationList({ rows }: { rows: InvestigationRow[] }) {
  if (!rows.length) return <p className="border border-line bg-panel p-8 text-muted">No stored investigations yet.</p>;
  return <div className="grid gap-5 md:grid-cols-2">{rows.map(row => <Link key={row.id} href={`/investigations/${row.id}`} className="border border-line bg-panel p-6 hover:border-mint/40"><p className="eyebrow mb-4">{chainName(row.targets.chain_id)}</p><h2 className="text-xl">{row.targets.protocol_name || "Unnamed protocol"}</h2><p className="mt-3 break-all font-mono text-xs text-muted">{row.targets.contract_address}</p><p className="mt-5 text-sm text-mint">{row.current_stage} / {row.status}</p><p className="mt-4 text-xs leading-6 text-muted">Originating Scout: {row.targets.users.wallet_address.slice(0, 6)}…{row.targets.users.wallet_address.slice(-4)}<br />Started: {row.started_at ? new Date(row.started_at).toISOString() : "Pending"}<br />Validated findings: {row.validatedCount ?? 0}</p></Link>)}</div>;
}
