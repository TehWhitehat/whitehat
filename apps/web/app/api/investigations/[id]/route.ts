import { loadInvestigation, recordFrom, storedEvents } from "../../../../lib/persistent-investigations";
import { database, databaseError } from "../../../../lib/database";
import { adminWallet, rateLimit, requestBucket } from "../../../../lib/scout-auth";
import { onchainAttribution } from "../../../../lib/onchain-attribution";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await rateLimit(`read:${requestBucket(_request)}`,120,60); } catch { return Response.json({error:"Read limit or database setup required."},{status:429}); }
  try {
    const row = await loadInvestigation((await params).id);
    if (!row) return Response.json({ error: "Investigation not found." }, { status: 404 });
    const privateAccess = !!await adminWallet();
    const attribution = await onchainAttribution(row.targets.chain_id, row.targets.contract_address);
    const db = database();
    const { data: states, error: statesError } = await db.from("investigation_events").select("agent,status").eq("investigation_id", row.id).eq("event_type", "agent").order("sequence", { ascending: false }).limit(250);
    if (statesError) throw statesError;
    const { count, error: countError } = await db.from("findings").select("id", { count: "exact", head: true }).eq("investigation_id", row.id).eq("human_status", "VALIDATED");
    if (countError) throw countError;
    const agentStates = Object.fromEntries(states.reverse().map(s => [s.agent, s.status]));
    // Never return raw events, findings, notes or private reports to unauthenticated visitors.
    return Response.json({ record: recordFrom(row), eligibility: row.targets.eligibility, status: row.status, stage: row.current_stage, startedAt: row.started_at, originatingScout: row.targets.users.wallet_address, attribution, privateAccess, agentStates, publicSummary: { validatedCount: count ?? 0, summary: "Automated evidence requires human review. No bounty or live exploitability established. Private reproduction details are withheld." }, events: privateAccess ? await storedEvents(row.id) : [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: databaseError() }, { status: 503 }); }
}




