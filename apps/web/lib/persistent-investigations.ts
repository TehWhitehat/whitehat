import "server-only";
import { database } from "./database";
import { chains } from "./investigation";
import type { InvestigationEvent } from "./investigation";

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type TargetRow = { eligibility: string; id: string; chain_id: number; contract_address: string; protocol_name: string; protocol_url: string; bounty_url: string; originating_user_id: string; users: { wallet_address: string } };
export type InvestigationRow = { id: string; target_id: string; status: string; current_stage: string; started_at: string | null; created_at: string; targets: TargetRow; validatedCount?: number };
export const internalFixtureProtocol = "WHITEHAT OFFLINE SECURITY FIXTURE / TESTNET ANCHOR";
const selection = "id,target_id,status,current_stage,started_at,created_at,targets!inner(id,eligibility,chain_id,contract_address,protocol_name,protocol_url,bounty_url,originating_user_id,users!inner(wallet_address))";
export async function loadInvestigation(id: string) {
  if (!uuidPattern.test(id)) return null;
  const { data, error } = await database().from("investigations").select(selection).eq("id", id).maybeSingle();
  if (error) throw new Error("Investigation load failed");
  return data as unknown as InvestigationRow | null;
}
export async function listInvestigations(wallet?: string) {
  const db = database();
  let targetIds: string[] | undefined;
  if (wallet) {
    const { data: user, error } = await db.from("users").select("id").eq("wallet_address", wallet).maybeSingle();
    if (error) throw error; if (!user) return [];
    const { data, error: submitError } = await db.from("submissions").select("target_id").eq("user_id", user.id);
    if (submitError) throw submitError; targetIds = data.map(item => item.target_id); if (!targetIds.length) return [];
  }
  let query = db.from("investigations").select(selection).neq("targets.protocol_name", internalFixtureProtocol).order("created_at", { ascending: false }).limit(100);
  if (targetIds) query = query.in("target_id", targetIds);
  const { data, error } = await query; if (error) throw error;
  const rows = data as unknown as InvestigationRow[];
  if (!rows.length) return rows;
  const { data: findings, error: findingError } = await db.from("findings").select("investigation_id").in("investigation_id", rows.map(row => row.id)).eq("human_status", "VALIDATED");
  if (findingError) throw findingError;
  return rows.map(row => ({ ...row, validatedCount: findings.filter(f => f.investigation_id === row.id).length }));
}
export function chainName(id: number) { return Object.entries(chains).find(([, value]) => value.id === id)?.[0] ?? "Unknown chain"; }
export function recordFrom(row: InvestigationRow) {
  return { version: 1, id: row.id, createdAt: row.created_at, target: { chain: chainName(row.targets.chain_id), address: row.targets.contract_address, protocol: row.targets.protocol_name, website: row.targets.protocol_url, bounty: row.targets.bounty_url, notes: "" } };
}
export async function storedEvents(id: string) {
  const { data, error } = await database().from("investigation_events").select("sequence,timestamp,agent,stage,status,message,data,event_type").eq("investigation_id", id).order("sequence", { ascending: false }).limit(250);
  if (error) throw error;
  return data.reverse().map(({ event_type, ...row }) => ({ ...row, eventType: event_type, investigationId: id })) as InvestigationEvent[];
}
export async function saveEvent(id: string, event: InvestigationEvent) {
  const { error } = await database().rpc("save_investigation_event", { p_id: id, p_event: event }); if (error) throw new Error("Investigation event could not be saved.");
}



