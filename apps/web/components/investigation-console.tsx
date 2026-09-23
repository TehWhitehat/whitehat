"use client";

import Link from "next/link";
import { attributionNetwork } from "../lib/attribution-network";
import { RegisterAttribution } from "./register-attribution";
import type { OnchainAttribution } from "../lib/onchain-attribution";
import { useScout } from "./wallet-provider";
import { useEffect, useState } from "react";
import { chains, isChain } from "../lib/investigation";
import type { AgentStatus, InvestigationEvent, LocalInvestigation, Telemetry } from "../lib/investigation";

const agents = ["RECON AGENT", "CARTOGRAPHER", "STATIC ANALYST", "INVARIANT AGENT", "FUZZ AGENT", "ECONOMIC AGENT", "SIMULATION AGENT", "CRITIC", "REPORTER"];
const engine = ["STATIC ANALYSIS", "INVARIANT GENERATION", "FUZZ TESTING", "ECONOMIC ANALYSIS", "SIMULATION", "CRITIC REVIEW", "REPORTER"];
const agentIds = ["RECON", "CARTOGRAPHER", "STATIC", "INVARIANT", "FUZZ", "ECONOMIC", "SIMULATION", "CRITIC", "REPORTER"];

function Status({ value }: { value: string }) {
  return <span className={`console-status ${["RUNNING", "COMPLETE"].includes(value) ? "text-mint" : "text-muted"}`}>{value === "RUNNING" && <span className="mr-2 inline-block h-1.5 w-1.5 bg-mint" />}{value}</span>;
}

export function InvestigationConsole({ id }: { id: string }) {
  const scout = useScout();
  const [stored, setStored] = useState<{ eligibility: string; originatingScout: string; attribution?: OnchainAttribution; privateAccess: boolean; status: string; stage: string; startedAt: string | null; agentStates: Record<string, AgentStatus>; publicSummary: { validatedCount: number; summary: string } } | null>(null);
  const attributionChainId = stored?.attribution?.chainId;
  const attributionChain = attributionChainId === 4663 || attributionChainId === 46630 ? attributionNetwork(attributionChainId) : null;
  const fixtureMode = id === "local-security-fixture";
  const [record, setRecord] = useState<LocalInvestigation | null>(null);
  const [events, setEvents] = useState<InvestigationEvent[]>([]);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [running, setRunning] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    async function start() {
      await Promise.resolve();
      if (disposed) return;
      setError(""); setEvents([]); setRunning(true); setMissing(false);
      try {
        let saved: LocalInvestigation | null = fixtureMode ? { version: 1, id, createdAt: new Date().toISOString(), target: { chain: "LOCAL EVM / OFFLINE", address: "", protocol: "WHITEHAT SECURITY TEST FIXTURE", website: "", bounty: "", notes: "Intentionally defective repository-owned Solidity. Never deployed. Results do not belong to a third-party target." } } : null;
        if (!fixtureMode) {
          const response = await fetch(`/api/investigations/${id}`, { cache: "no-store", signal: controller.signal });
          const existing = await response.json();
          if (!response.ok) throw new Error(existing.error);
          if (disposed) return;
          saved = existing.record;
          setStored(existing); setRecord(saved); setEvents(existing.events);
          {
            if (["QUEUED", "RUNNING"].includes(existing.status)) refreshTimer = setTimeout(() => setAttempt(current => current + 1), 3000);
            return;
          }
        }
        if (!saved) { setMissing(true); return; }
        setRecord(saved);
        // Only chain and address leave the browser. Scout notes and supplied URLs are not fetched.
        const response = await fetch("/api/investigations", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify(fixtureMode ? { investigationId: id, mode: "fixture" } : { investigationId: id }),
        });
        if (!response.ok || !response.body) { const failure = await response.json().catch(() => ({})); throw new Error(failure.error || "Investigation could not start. Reload to view saved progress."); }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let last: InvestigationEvent | undefined;
        let count = 0;
        function accept(line: string) {
          if (!line.trim()) return;
          const event = JSON.parse(line) as InvestigationEvent & { error?: string };
          if (event.error || event.investigationId !== id || event.sequence !== count + 1 || typeof event.message !== "string" || !event.data || !Number.isFinite(Date.parse(event.timestamp))) throw new Error("The activity connection was interrupted or returned an invalid event. Retry read-only reconnaissance.");
          count++;
          if (count > 250) throw new Error("The activity stream exceeded its local limit.");
          last = event;
          if (!disposed) setEvents((current) => [...current, event]);
        }
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            buffer += decoder.decode(part.value, { stream: true });
            if (buffer.length > 2100000) throw new Error("The activity response exceeded its local limit.");
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            lines.forEach(accept);
          }
          accept(buffer + decoder.decode());
          if (!last || !["HUMAN REVIEW REQUIRED", "REVIEW QUEUED", "FAILED", "BLOCKED"].includes(last.stage)) throw new Error("The connection ended before local analysis finished. Retry the investigation.");
        } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error && cause.message !== "Failed to fetch" ? cause.message : "The investigation connection is unavailable. Reload to check saved progress.");
      } finally { if (!disposed) setRunning(false); }
    }
    void start();
    return () => { disposed = true; clearTimeout(refreshTimer); controller.abort(); };
  }, [id, attempt, fixtureMode, scout.wallet]);

  const data: Telemetry = Object.assign({}, ...events.map((event) => event.data));
  const last = events.at(-1);
  const stage = error ? "FAILED" : (stored?.status === "INTERRUPTED" ? "INTERRUPTED" : last?.stage) ?? stored?.stage ?? "INITIALIZING";
  const status = data.codeFound === false ? "NO CONTRACT BYTECODE FOUND" : stage === "INITIALIZING" ? "INVESTIGATION INITIALIZING" : stage;
  const target = record?.target;
  const network = target && isChain(target.chain) ? chains[target.chain] : null;
  const contract = data.contracts?.[0];
  function agentStatus(index: number): AgentStatus {
    if (!fixtureMode && stored && !stored.privateAccess) return stored.agentStates[agentIds[index]] ?? "QUEUED";
    if (fixtureMode && index < 2) return "NOT CONNECTED";
    const agent = agentIds[index];
    const state = events.filter((event) => event.agent === agent && event.eventType === "agent").at(-1)?.status ?? "QUEUED";
    return error && state === "RUNNING" ? "FAILED" : error && state === "QUEUED" ? "BLOCKED" : state;
  }
  const telemetry: [string, string | number | undefined][] = [
    ["NETWORK", data.chainId === undefined ? undefined : `${data.chainId}${network && data.chainId !== network.id ? " / MISMATCH" : " / CONFIRMED"}`],
    ["CONTRACT", data.codeFound === undefined ? undefined : data.codeFound ? "DETECTED" : "NO BYTECODE"],
    ["SNAPSHOT BLOCK", data.blockNumber],
    ["BYTECODE", data.codeBytes === undefined ? undefined : `${data.codeBytes.toLocaleString()} bytes`],
    ["SOURCE", contract?.source], ["CONTRACT NAME", contract?.name], ["COMPILER", contract?.compiler],
    ["PROXY", data.proxy], ["IMPLEMENTATION", data.implementation],
    ["ABI ENTRIES", contract?.abiEntries], ["FUNCTIONS", contract?.functions], ["EVENTS", contract?.events],
  ];

  if (missing) return <main id="main" className="shell investigation-console py-20"><p className="eyebrow mb-6">PUBLIC BETA</p><h1 className="hero-title">Investigation unavailable.</h1><p className="my-7 max-w-xl leading-7 text-muted">This investigation could not be found. Check the link or submit a target.</p><Link href="/submit" className="button button-primary">CREATE A TARGET <span aria-hidden="true">↗</span></Link></main>;

  return (
    <main id="main" className="shell investigation-console py-12 sm:py-16">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><p className="eyebrow break-all">INVESTIGATION / {id.toUpperCase()}</p><span className="preview-tag">PUBLIC BETA</span></div>
      <h1 className="console-title">{target?.protocol || (record ? "UNKNOWN PROTOCOL" : "Investigation console.")}</h1>
      <div className="mt-6 grid gap-5 border-b border-line pb-8 text-sm sm:grid-cols-2 xl:grid-cols-[1fr_2fr_1fr_1fr]">
        <div><p className="console-label">CHAIN</p><p className="mt-2">{target?.chain ?? "—"}</p></div>
        <div><p className="console-label">CONTRACT ADDRESS</p><p className="mt-2 break-all font-mono text-xs">{fixtureMode ? "LOCAL FIXTURE / NOT DEPLOYED" : target?.address ?? "—"}</p></div>
        <div><p className="console-label">START TIME</p><p className="mt-2 text-xs">{events[0] ? new Date(events[0].timestamp).toLocaleString() : stored?.startedAt ? new Date(stored.startedAt).toLocaleString() : "PENDING"}</p></div>
        <div><p className="console-label">ORIGINATING SCOUT</p><p className="mt-2 break-all text-xs text-muted">{stored?.attribution?.status === "ONCHAIN" ? stored.attribution.scout : stored?.originatingScout ?? "NOT CONNECTED"}</p></div>
      </div>
      <section className="my-8 flex flex-wrap items-center justify-between gap-5 border border-line bg-panel p-6" aria-label="Investigation status">
        <div><p className="console-label mb-3">CURRENT STAGE</p><p role="status" className="text-xl font-medium text-mint sm:text-2xl">{status}</p><p className="mt-3 max-w-2xl text-xs leading-5 text-muted">{error || (data.codeFound === false ? "Deeper checks stopped. Verify the chain and address." : fixtureMode ? "Intentionally vulnerable local fixture. Real Slither and Foundry results; no live target is involved." : "Read-only reconnaissance, local static analysis and source-grounded candidate tests. All findings require review.")}</p></div>
        {!running && record && <button className="button button-secondary" onClick={() => setAttempt((current) => current + 1)}>{fixtureMode ? "RETRY ANALYSIS" : "RELOAD INVESTIGATION"} <span aria-hidden="true">↻</span></button>}
      </section>

      {stored && <p className="mb-3 text-xs text-mint">ELIGIBILITY / {stored.eligibility} — Scope approval controls further analysis.</p>}
      {stored && <p className="mb-6 text-xs leading-6 text-muted">{stored.attribution?.status === "ONCHAIN" ? `ONCHAIN ATTRIBUTION / ${attributionChain?.name.toUpperCase() ?? "UNKNOWN NETWORK"}` : "OFFCHAIN ATTRIBUTION"}. Eligibility remains subject to review.{!stored.privateAccess && " Public metadata only. Unresolved evidence is restricted to authorized human reviewers."}</p>}
      {stored?.attribution?.status === "OFFCHAIN" && stored.attribution.registry && attributionChain && record && isChain(record.target.chain) && chains[record.target.chain].id === attributionChain.id && <RegisterAttribution key={`${attributionChain.id}:${stored.attribution.registry}:${record.target.address}`} chainId={attributionChain.id} target={record.target.address} registry={stored.attribution.registry} originalScout={stored.originatingScout} onConfirmed={() => setAttempt(current => current + 1)} />}
      {stored?.attribution && stored.attribution.status !== "OFFCHAIN" && <section className="mb-6 border border-line p-5 text-xs leading-6"><p className="text-mint">REGISTRY STATUS / {stored.attribution.status}</p><p>CHAIN / {attributionChain?.name ?? "Unsupported network"} / {stored.attribution.chainId}</p>{stored.attribution.registry && <p className="break-all">REGISTRY / {stored.attribution.registry}</p>}{stored.attribution.transactionHash && attributionChain && <p className="break-all">REGISTRATION TRANSACTION / <a className="text-mint underline" href={`${attributionChain.blockExplorers.default.url}/tx/${stored.attribution.transactionHash}`} target="_blank" rel="noreferrer">{stored.attribution.transactionHash}</a></p>}{stored.attribution.blockNumber && <p>BLOCK / {stored.attribution.blockNumber} / {stored.attribution.confirmationStatus}</p>}{stored.attribution.status === "ONCHAIN" && <p>TARGET ALREADY REGISTERED / Original Scout: {stored.attribution.scout}</p>}{stored.attribution.note && <p className="text-muted">{stored.attribution.note}</p>}{stored.attribution.status === "ONCHAIN" && stored.attribution.scout?.toLowerCase() !== stored.originatingScout.toLowerCase() && <p className="text-muted">Onchain Scout differs from the stored offchain Scout ({stored.originatingScout}). Human review required.</p>}</section>}
      <div className="console-grid">
        <aside className="console-panel" aria-labelledby="agents-title"><h2 id="agents-title" className="console-panel-title">AGENT PIPELINE</h2><ol className="divide-y divide-line">{agents.map((name, index) => <li key={name} className={`px-5 py-5 ${agentStatus(index) === "RUNNING" ? "border-l-2 border-mint bg-mint/5" : ""}`}><p className="mb-3 font-mono text-[10px] tracking-wide"><span className="mr-2 text-mint">0{index + 1}</span> / {name}</p><Status value={agentStatus(index)} /></li>)}</ol></aside>
        <div className="min-w-0 space-y-6">
          <section className="console-panel" aria-labelledby="activity-title"><div className="flex items-center justify-between border-b border-line px-5 py-5"><h2 id="activity-title" className="console-label">AGENT ACTIVITY</h2><span className="font-mono text-[9px] text-muted">{running ? "READ-ONLY STREAM" : "LATEST RUN"}</span></div>
            <div className="activity-stream" role="log" aria-live="polite" aria-relevant="additions" aria-label="Timestamped agent activity" tabIndex={0}>
              {events.length === 0 && running && <p className="p-5 text-sm text-muted">Loading investigation evidence…</p>}
              {events.map((event) => <div key={event.sequence} className="border-b border-line px-5 py-4"><div className="mb-2 flex flex-wrap items-center gap-3 font-mono text-[9px]"><time dateTime={event.timestamp} className="text-muted">{new Date(event.timestamp).toLocaleTimeString()}</time><span className="text-mint">{event.agent}</span><span className="ml-auto text-muted">{event.status}</span></div><p className="break-words text-xs leading-6">{event.message}</p></div>)}
              {error && <p role="alert" className="p-5 text-sm leading-6 text-mint">{error}</p>}
            </div>
          </section>
          <section className="console-panel p-5" aria-labelledby="engine-title"><h2 id="engine-title" className="console-label mb-5">SECURITY ENGINE</h2><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{engine.map((name, index) => <div key={name} className="flex flex-wrap justify-between gap-2 border-b border-line pb-3"><dt className="font-mono text-[9px]">{name}</dt><dd><Status value={agentStatus(index + 2)} /></dd></div>)}</dl><p className="mt-5 font-mono text-[9px] leading-5 text-muted">EVIDENCE PROCESSING / AI MODEL / {data.aiModel ?? "NOT CONFIGURED"} {data.aiProvider} {data.aiModelName}</p></section>
          <section className="console-panel empty-state p-6" aria-labelledby="findings-title"><h2 id="findings-title" className="console-label mb-4">FINDINGS</h2>
            {fixtureMode && <p className="mb-5 text-xs text-mint">WHITEHAT SECURITY TEST FIXTURE — results below are local test evidence only.</p>}
            {stored && !stored.privateAccess && <p className="mb-5 text-xs leading-6 text-muted">{stored.publicSummary.summary}<br />Validated findings: {stored.publicSummary.validatedCount}</p>}
            {!data.findings?.length && (!stored || stored.privateAccess) && <p className="text-sm text-muted">{data.findings ? "No detector findings returned. This does not establish that the contract is safe." : "No findings returned yet. See agent statuses for analysis availability."}</p>}
            <div className="space-y-4">{data.findings?.map((finding) => <article key={finding.id} className="border border-line bg-panel p-4"><div className="mb-3 flex flex-wrap justify-between gap-3"><h3 className="break-words text-sm font-medium">{finding.title}</h3><span className="preview-tag">{finding.status}</span></div><p className="mb-3 font-mono text-[9px] leading-5 text-muted">{finding.tool} / {finding.severity} / {finding.confidence}</p><p className="mb-3 break-words text-xs text-mint">{finding.component}</p><p className="whitespace-pre-wrap break-words text-xs leading-6">{finding.description}</p>{finding.reviewRequired && <p className="mt-3 text-xs text-mint">HUMAN REVIEW REQUIRED</p>}</article>)}</div>
          </section>
          {data.aiResults && <section className="console-panel p-5"><h2 className="console-label mb-5">AI EVIDENCE REVIEW / CANDIDATE ONLY</h2>{Object.entries(data.aiResults).map(([agent, result]) => <article key={agent} className="mb-6 border-b border-line pb-5 text-xs leading-6"><h3 className="text-mint">{agent} / {result.status}</h3><p>{result.summary}</p>{result.items.map((item, index) => <div key={index} className="mt-4"><p>{item.title} / CANDIDATE</p><p>{item.component}</p><p>{item.conclusion}</p><p className="text-muted">Evidence: {item.evidenceRefs.join(", ")}<br />Assumptions: {item.assumptions.join(" ")}<br />Model opinion: {item.outcome}</p></div>)}</article>)}</section>}
          {!!data.hypotheses?.length && <section className="console-panel p-5"><h2 className="console-label mb-5">ECONOMIC / CANDIDATE HYPOTHESES</h2>{data.hypotheses.map((item) => <article key={item.id} className="mb-5 border-b border-line pb-4 text-xs leading-6"><h3 className="text-sm text-mint">{item.title}</h3><p>{item.component}</p><p>{item.impact}</p><p className="text-muted">Confidence: {item.confidence}<br />Evidence: {item.evidenceRefs.join(", ")}<br />Assumptions: {item.assumptions.join(" ")}</p></article>)}</section>}
          {!!data.simulations?.length && <section className="console-panel p-5"><h2 className="console-label mb-5">LOCAL SIMULATION EVIDENCE</h2>{data.simulations.map((item) => <article key={item.candidateId} className="mb-5 break-words text-xs leading-6"><h3 className="text-mint">{item.candidateId} / {item.status}</h3><p>Test: {item.test ?? "Not executed"}<br />Expected: {item.expected}<br />Observed: {item.observed}<br />Evidence: {item.evidenceRef ?? "Unavailable"}</p></article>)}</section>}
          {!!data.reviews?.length && <section className="console-panel p-5"><h2 className="console-label mb-5">CRITIC REVIEW</h2>{data.reviews.map((item) => <article key={item.candidateId} className="mb-5 text-xs leading-6"><h3 className="text-mint">{item.candidateId} / {item.outcome}</h3><p>{item.reason}</p>{item.duplicateOf && <p>Duplicate of: {item.duplicateOf}</p>}</article>)}</section>}
          {data.reports && <section className="console-panel p-5"><h2 className="console-label mb-5">REPORTS / HUMAN REVIEW REQUIRED</h2><p className="mb-4 text-xs text-muted">AI MODEL / {data.aiModel ?? "NOT CONFIGURED"}. Deterministic evidence remains authoritative. Local only; nothing published or disclosed.</p>{(["private", "public"] as const).map((kind) => <details key={kind} className="mb-4 border border-line p-4"><summary className="cursor-pointer console-label">{kind === "private" ? "PRIVATE REPORT" : "PUBLIC SUMMARY / REDACTED"}</summary><pre className="mt-4 whitespace-pre-wrap break-words text-xs leading-6">{JSON.stringify(data.reports![kind], null, 2)}</pre></details>)}</section>}
          {!!data.candidates?.length && <section className="console-panel p-5"><h2 className="console-label mb-5">CANDIDATE INVARIANTS / NOT FINDINGS</h2><div className="space-y-5">{data.candidates.map((candidate) => <div key={candidate.id}><h3 className="text-sm">{candidate.title}</h3><p className="mt-2 break-words font-mono text-xs text-mint">{candidate.predicate}</p><p className="mt-2 text-xs leading-5 text-muted">{candidate.basis}</p><p className="mt-2 text-[10px] text-muted">{candidate.executable ? "LOCAL FIXTURE TEST" : "CANDIDATE / HARNESS NOT GENERATED"}</p></div>)}</div></section>}
        </div>
        <aside className="min-w-0 space-y-6" aria-label="Investigation evidence">
          <section className="console-panel"><h2 className="console-panel-title">LIVE TELEMETRY</h2><dl className="divide-y divide-line px-5">{telemetry.map(([label, value]) => <div key={label} className="py-4"><dt className="console-label text-muted">{label}</dt><dd className="mt-2 break-words font-mono text-xs [overflow-wrap:anywhere]">{value ?? "—"}</dd></div>)}</dl></section>
          {!!data.executions?.length && <section className="console-panel p-5"><h2 className="console-label mb-4">TOOL EXECUTIONS</h2>{data.executions.map((execution, index) => <p key={index} className="mb-3 font-mono text-[10px] leading-5">{execution.tool}<br /><span className="text-muted">EXIT {execution.exitCode} / {execution.durationMs} ms</span></p>)}{data.fuzz && <p className="border-t border-line pt-4 text-xs leading-6">Tests: {data.fuzz.tests}<br />Passed: {data.fuzz.passed} / Failed: {data.fuzz.failed}<br />Fuzz runs: {data.fuzz.fuzzRuns}<br />Invariant handler calls: {data.fuzz.invariantHandlerCalls}</p>}</section>}
          {data.implementation && <section className="console-panel p-5"><h2 className="console-label mb-4">IMPLEMENTATION MAP</h2><p className="mb-4 text-xs leading-5 text-muted">{data.implementationEvidence}</p>{data.contracts?.slice(1).map((item) => <div key={item.address} className="text-xs leading-6"><p className="break-all font-mono">{item.address}</p><p>{item.name ?? "Name unavailable"}</p><p className="text-muted">SOURCE / {item.source}</p><p>ABI {item.abiEntries ?? "—"} · FUNCTIONS {item.functions ?? "—"} · EVENTS {item.events ?? "—"}</p></div>)}</section>}
          {network && target && <a href={`${network.explorer}/address/${target.address}`} target="_blank" rel="noreferrer" className="button button-secondary w-full">VIEW PUBLIC EXPLORER <span aria-hidden="true">↗</span></a>}
        </aside>
      </div>
      {target && <details className="mt-8 border border-line p-5"><summary className="cursor-pointer font-mono text-[10px] tracking-wider">SCOUT INPUT</summary><dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">{[["PROTOCOL WEBSITE", target.website], ["BOUNTY / SECURITY PROGRAM", target.bounty], ["SCOUT NOTES", target.notes], ["SUBMITTED", record?.createdAt]].map(([label, value]) => <div key={label}><dt className="console-label text-muted">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{value || "Not provided"}</dd></div>)}</dl></details>}
      <p className="mt-8 max-w-4xl text-xs leading-6 text-muted">{fixtureMode ? "Temporary local fixture. Refreshing repeats the analysis." : "Persistent investigation. Refreshing loads saved evidence; it does not restart completed analysis."} Explorer metadata may lag the RPC snapshot. Analysis runs in isolated workspaces and saved results require human review. Unsupported checks are marked limited. Scout attribution remains subject to eligibility review; nothing is disclosed automatically.</p>
      <p className="mt-3 text-xs leading-6 text-muted">Whitehat is designed for defensive research, isolated simulation, and responsible disclosure. Submission of a target does not authorize attacks against live systems.</p>
    </main>
  );
}





