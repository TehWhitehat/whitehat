import { database, databaseError } from "./database";
import { loadInvestigation, chainName, saveEvent, uuidPattern } from "./persistent-investigations";
import { scoutWallet, sameOrigin } from "./scout-auth";
import { limitedJson, runRecon, validReconInput } from "./recon";
import { runSecurityEngine } from "./security-engine";
import type { InvestigationEvent, Telemetry } from "./investigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Open the local Whitehat application." }, { status: 403 });
  let input: unknown;
  try { input = await limitedJson(request.body, 2000); } catch { return Response.json({ error: "Invalid investigation request." }, { status: 400 }); }
  const fixture = !!input && typeof input === "object" && "mode" in input && input.mode === "fixture" && "investigationId" in input && input.investigationId === "local-security-fixture";
  let persistentId: string | null = null;
  if (!fixture) {
    try {
      const id = input && typeof input === "object" && "investigationId" in input ? input.investigationId : null;
      if (typeof id !== "string" || !uuidPattern.test(id)) return Response.json({ error: "Submit a persistent target first." }, { status: 400 });
      const row = await loadInvestigation(id);
      if (!row) return Response.json({ error: "Investigation not found." }, { status: 404 });
      if (await scoutWallet() !== row.targets.users.wallet_address) return Response.json({ error: "Sign in as the originating Scout to start this investigation." }, { status: 403 });
      const { data, error } = await database().from("investigations").update({ status: "RUNNING", started_at: new Date().toISOString() }).eq("id", id).eq("status", "QUEUED").select("id").maybeSingle();
      if (error) throw error;
      if (!data) return Response.json({ error: "Investigation already started. Reload to view saved progress." }, { status: 409 });
      persistentId = id;
      input = { investigationId: id, chain: chainName(row.targets.chain_id), address: row.targets.contract_address };
    } catch { return Response.json({ error: databaseError() }, { status: 503 }); }
  }
  const abort = new AbortController();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let persistence = Promise.resolve();
      let persistenceFailed = false;
      let finished = false;
      let finalStage = "INITIALIZING";
      try {
        const signal = AbortSignal.any([request.signal, abort.signal]);
        let sequence = 0;
        const telemetry: Telemetry = {};
        let stage: InvestigationEvent["stage"] = "INITIALIZING";
        const push = (event: InvestigationEvent) => {
          sequence = event.sequence; stage = event.stage;
          Object.assign(telemetry, event.data);
          finalStage = event.stage;
          if (persistentId) {
            persistence = persistence.then(async () => {
              if (persistenceFailed) return;
              await saveEvent(persistentId!, event);
              if (!signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            }).catch(() => { persistenceFailed = true; abort.abort(); });
          } else controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };
        if (!fixture && validReconInput(input)) {
          await runRecon(input, push, { signal });
          if (!telemetry.codeFound || signal.aborted) { finished = !signal.aborted; return; }
        }
        const investigationId = fixture ? "local-security-fixture" : validReconInput(input) ? input.investigationId : "";
        await runSecurityEngine(fixture ? { fixture: true } : validReconInput(input) ? { chain: input.chain, address: input.address, context: { chainId: telemetry.chainId, codeBytes: telemetry.codeBytes, proxy: telemetry.proxy, implementation: telemetry.implementation, contracts: telemetry.contracts } } : {}, (event) => {
          if (signal.aborted) return;
          if (event.agent === "STATIC") stage = "STATIC ANALYSIS";
          if (event.agent === "INVARIANT") stage = "INVARIANT GENERATION";
          if (event.agent === "FUZZ") stage = "FUZZ TESTING";
          if (event.agent === "ECONOMIC") stage = "ECONOMIC ANALYSIS";
          if (event.agent === "SIMULATION") stage = "SIMULATION";
          if (event.agent === "CRITIC") stage = "CRITIC REVIEW";
          if (event.agent === "REPORTER") stage = "REPORTING";
          if (event.agent === "SYSTEM") stage = event.status === "FAILED" ? "FAILED" : telemetry.reports ? "HUMAN REVIEW REQUIRED" : "REVIEW QUEUED";
          push({ ...event, investigationId, sequence: sequence + 1, timestamp: new Date().toISOString(), stage });
        }, signal);
        if (!["HUMAN REVIEW REQUIRED", "REVIEW QUEUED", "FAILED"].includes(stage) && !signal.aborted) {
          push({ investigationId, sequence: sequence + 1, timestamp: new Date().toISOString(), agent: "SYSTEM", stage: "REVIEW QUEUED", eventType: "state", status: "LIMITED", message: "Available security work ended with limitations. Review the stage messages; no finding is validated.", data: {} });
        }
        finished = true;
      } catch {
        if (!abort.signal.aborted && !request.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify({ error: "The read-only connection was interrupted. Retry reconnaissance." }) + "\n"));
      } finally {
        await persistence;
        if (persistentId) {
          const stopped = persistenceFailed || !finished || request.signal.aborted;
          const { error } = await database().from("investigations").update({ status: stopped ? "INTERRUPTED" : finalStage === "FAILED" ? "FAILED" : "COMPLETE", current_stage: stopped ? "FAILED" : finalStage, completed_at: new Date().toISOString() }).eq("id", persistentId);
          if ((error || persistenceFailed) && !request.signal.aborted) { try { controller.enqueue(encoder.encode(JSON.stringify({ error: "Saving stopped. Reload to see the last stored event." }) + "\n")); } catch {} }
        }
        try { controller.close(); } catch { /* Reader already disconnected. */ }
      }
    },
    cancel() { abort.abort(); },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
}

