import { spawn } from "node:child_process";
import { open, mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chains } from "./investigation";
import type { Chain, InvestigationEvent, Telemetry } from "./investigation";
import { limitedJson } from "./recon";

type WorkerEvent = Pick<InvestigationEvent, "agent" | "status" | "message" | "eventType" | "data">;
let busy = false;

export async function runSecurityEngine(input: { chain?: Chain; address?: string; fixture?: boolean; context?: Partial<Telemetry> }, emit: (event: WorkerEvent) => void, signal: AbortSignal) {
  const send = (agent: WorkerEvent["agent"], status: WorkerEvent["status"], message: string, data: Partial<Telemetry> = {}) => emit({ agent, status, message, data, eventType: "agent" });
  if (busy) {
    for (const agent of ["STATIC", "INVARIANT", "FUZZ", "ECONOMIC", "SIMULATION", "CRITIC", "REPORTER"] as const) send(agent, "LIMITED", "The local worker is busy. Retry after the current analysis finishes.");
    return;
  }
  busy = true;
  let temporaryJob: string | undefined;
  try {
    const configuredRoot = process.env.WHITEHAT_ANALYZER_ROOT;
    if (!configuredRoot) throw new Error("Set WHITEHAT_ANALYZER_ROOT in apps/web/.env.local to the local services/analyzer directory.");
    const root = path.resolve(configuredRoot);
    await mkdir((process.env.WHITEHAT_ANALYZER_WORK_DIR ?? path.join(root, "work")), { recursive: true });
    const job = await mkdtemp(path.join(process.env.WHITEHAT_ANALYZER_WORK_DIR ?? path.join(root, "work"), "run-"));
    temporaryJob = job;
    let request: object;
    if (input.fixture) {
      request = { mode: "fixture", metadata: { kind: "WHITEHAT SECURITY TEST FIXTURE", investigationId: "local-security-fixture" } };
      send("STATIC", "RUNNING", "WHITEHAT SECURITY TEST FIXTURE — repository-owned source; offline EVM tests only.", { fixture: true });
    } else {
      send("STATIC", "RUNNING", "Retrieving the submitted contract's verified Solidity source for local static analysis.", { fixture: false });
      const response = await fetch(`${chains[input.chain!] .explorer}/api/v2/smart-contracts/${input.address}`, { redirect: "error", cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
      if (!response.ok) throw new Error(`Verified source lookup failed (HTTP ${response.status}).`);
      const info = await limitedJson(response.body, 3_000_000) as Record<string, unknown>;
      if (!info || typeof info !== "object" || !(info.is_fully_verified === true || info.is_partially_verified === true) || typeof info.source_code !== "string" || typeof info.file_path !== "string") throw new Error("Verified Solidity source is unavailable or in an unsupported explorer format.");
      const compiler = typeof info.compiler_version === "string" ? info.compiler_version.match(/v?(\d+\.\d+\.\d+)/)?.[1] : undefined;
      const sources: Record<string, { content: string }> = { [info.file_path]: { content: info.source_code } };
      if (Array.isArray(info.additional_sources)) for (const source of info.additional_sources) {
        if (!source || typeof source.file_path !== "string" || typeof source.source_code !== "string") throw new Error("Explorer source bundle is malformed.");
        if (Object.hasOwn(sources, source.file_path) && sources[source.file_path].content !== source.source_code) throw new Error("Explorer source bundle contains conflicting paths.");
        Object.defineProperty(sources, source.file_path, { value: { content: source.source_code }, enumerable: true });
      }
      const settings = info.compiler_settings && typeof info.compiler_settings === "object" ? info.compiler_settings : {
        optimizer: { enabled: info.optimization_enabled === true, runs: typeof info.optimization_runs === "number" ? info.optimization_runs : 200 },
      };
      request = { mode: "verified-source", sources, compiler, settings, context: input.context, metadata: { chain: input.chain, address: input.address, compiler } };
    }
    await writeFile(path.join(job, "request.json"), JSON.stringify(request));
    const output = await open(path.join(job, "worker.log"), "w");
    let processError = "";
    let exitCode: number | null | undefined;
    // File-backed output avoids unsupported child-process pipes in this Windows environment.
    const child = spawn(/* turbopackIgnore: true */ process.env.WHITEHAT_PYTHON ?? path.join(root, ".venv/Scripts/python.exe"), [path.join(root, "worker.py"), "--job", job], { cwd: root, windowsHide: true, env: { NODE_ENV: process.env.NODE_ENV, ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|Path|SystemRoot|WINDIR|TEMP|TMP|HOME|LANG|VIRTUAL_ENV|WHITEHAT_AI_PROVIDER|WHITEHAT_AI_BASE_URL|WHITEHAT_AI_MODEL|WHITEHAT_ANALYZER_WORK_DIR|WHITEHAT_SOLC|WHITEHAT_FORGE)$/.test(key))) }, stdio: ["ignore", output.fd, output.fd] });
    child.on("error", () => { processError = "Python analyzer could not start. Check the local analyzer installation."; exitCode = -1; });
    child.on("exit", (code) => { exitCode = code; });
    await output.close();
    let offset = 0;
    let failed = false;
    const started = Date.now();
    try {
      while (true) {
        if (signal.aborted || Date.now() - started > 240000) throw new Error("Local security analysis was cancelled or exceeded its time limit.");
        let text = "";
        try { text = await readFile(path.join(job, "events.ndjson"), "utf8"); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        if (text.length > 2_000_000) throw new Error("Worker event output exceeded its safe size limit.");
        const end = text.lastIndexOf("\n") + 1;
        for (const line of text.slice(offset, end).split("\n").filter(Boolean)) {
          const event = JSON.parse(line) as WorkerEvent;
          if (!["STATIC", "INVARIANT", "FUZZ", "ECONOMIC", "SIMULATION", "CRITIC", "REPORTER"].includes(event.agent) || typeof event.message !== "string" || !event.data) throw new Error("Worker returned an invalid event.");
          if (event.eventType === "agent" && event.status === "FAILED") failed = true;
          emit(event);
        }
        offset = end;
        if (exitCode !== undefined) {
          if (processError || exitCode !== 0) throw new Error(processError || "Local analyzer stopped unexpectedly. Tool logs are retained in its local workspace.");
          break;
        }
        await delay(150);
      }
      send("SYSTEM", failed ? "FAILED" : "QUEUED", failed ? "One or more local security stages could not finish. Review the genuine tool errors above." : "Local evidence review finished. HUMAN REVIEW REQUIRED; nothing disclosed.");
    } finally {
      if (exitCode === undefined) {
        await writeFile(path.join(job, "cancel"), "cancel");
        for (let index = 0; index < 50 && exitCode === undefined; index++) await delay(100);
        if (exitCode === undefined) child.kill();
      }
    }
  } catch (error) {
    if (!signal.aborted) {
      send("STATIC", "FAILED", error instanceof Error ? error.message : "Local security analysis could not start.");
      send("INVARIANT", "LIMITED", "Candidate generation could not finish for this run.");
      send("FUZZ", "LIMITED", "No supported local tests could finish for this run.");
      for (const agent of ["ECONOMIC", "SIMULATION", "CRITIC", "REPORTER"] as const) send(agent, "LIMITED", "Required local analysis evidence is unavailable; stage could not finish.");
    }
  } finally { if (temporaryJob && path.basename(temporaryJob).startsWith("run-")) await rm(temporaryJob, { recursive: true, force: true }).catch(() => {}); busy = false; }
}




