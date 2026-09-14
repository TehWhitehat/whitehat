export const chains = {
  "Robinhood Chain": { id: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com" },
  "Robinhood Chain Testnet": { id: 46630, rpc: "https://rpc.testnet.chain.robinhood.com", explorer: "https://explorer.testnet.chain.robinhood.com" },
} as const;

export type Chain = keyof typeof chains;
export type Target = { chain: string; address: string; protocol: string; website: string; bounty: string; notes: string };
export type LocalInvestigation = { version: 1; id: string; createdAt: string; target: Target };
export type Stage = "INITIALIZING" | "RECON" | "MAPPING" | "ANALYZER QUEUED" | "STATIC ANALYSIS" | "INVARIANT GENERATION" | "FUZZ TESTING" | "ECONOMIC ANALYSIS" | "SIMULATION" | "CRITIC REVIEW" | "REPORTING" | "HUMAN REVIEW REQUIRED" | "REVIEW QUEUED" | "BLOCKED" | "FAILED";
export type AgentStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "LIMITED" | "BLOCKED" | "FAILED" | "NOT CONNECTED";
export type ContractMap = { address: string; source: "VERIFIED" | "UNVERIFIED" | "UNAVAILABLE"; name?: string; compiler?: string; abiEntries?: number; functions?: number; events?: number };
export type Finding = { id: string; title: string; tool: string; agent: string; severity: string; confidence: string; component: string; description: string; status: "CANDIDATE" | "TESTING" | "CRITIC REVIEW" | "REJECTED" | "NEEDS EVIDENCE" | "SUPPORTED" | "VALIDATED"; reviewRequired?: boolean; fixture: boolean };
export type CandidateInvariant = { id: string; title: string; predicate: string; basis: string; component: string; status: "CANDIDATE"; executable: boolean };
export type ToolExecution = { tool: string; exitCode: number; durationMs: number };
export type Hypothesis = { id: string; title: string; status: string; evidenceRefs: string[]; component: string; impact: string; confidence: string; assumptions: string[] };
export type Simulation = { candidateId: string; test: string | null; expected: string; observed: string; reproducible: boolean | null; status: string; evidenceRef: string | null };
export type Review = { candidateId: string; outcome: string; reason: string; duplicateOf: string | null; reproduction: string };
export type Telemetry = {
  hypotheses?: Hypothesis[];
  simulations?: Simulation[];
  reviews?: Review[];
  reports?: { private: Record<string, unknown>; public: Record<string, unknown> };
  aiModel?: string;
  aiProvider?: string | null;
  aiModelName?: string | null;
  aiResults?: Record<string, { status: string; summary: string; items: { title: string; component: string; conclusion: string; evidenceRefs: string[]; assumptions: string[]; outcome: string; status: string }[] }>;
  aiCalls?: { provider: string; model: string; agent: string; timestamp: string; status: string }[];
  chainId?: number;
  blockNumber?: string;
  codeBytes?: number;
  codeFound?: boolean;
  proxy?: string;
  implementation?: string;
  implementationEvidence?: string;
  contracts?: ContractMap[];
  findings?: Finding[];
  candidates?: CandidateInvariant[];
  executions?: ToolExecution[];
  fuzz?: { tests: number; passed: number; failed: number; fuzzRuns: number; invariantRuns: number; invariantCalls: number; invariantHandlerCalls: number };
  fixture?: boolean;
};
export type InvestigationEvent = {
  investigationId: string;
  sequence: number;
  timestamp: string;
  agent: "SYSTEM" | "RECON" | "CARTOGRAPHER" | "STATIC" | "INVARIANT" | "FUZZ" | "ECONOMIC" | "SIMULATION" | "CRITIC" | "REPORTER";
  stage: Stage;
  eventType: "operation" | "agent" | "state";
  status: AgentStatus;
  message: string;
  data: Partial<Telemetry>;
};

export const addressPattern = /^0x[0-9a-fA-F]{40}$/;
export const persistentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const localIdPattern = /^local-[a-f0-9-]{36}$/;
export function isChain(value: unknown): value is Chain {
  return typeof value === "string" && Object.hasOwn(chains, value);
}
export function storageKey(id: string) { return `whitehat:investigation:${id}`; }

export function readLocalInvestigation(id: string): LocalInvestigation | null {
  if (!localIdPattern.test(id)) return null;
  const raw = sessionStorage.getItem(storageKey(id));
  if (!raw || raw.length > 15000) return null;
  const value = JSON.parse(raw) as LocalInvestigation;
  if (value?.version !== 1 || value.id !== id || !value.target || !Number.isFinite(Date.parse(value.createdAt))) return null;
  if (!isChain(value.target.chain) || !addressPattern.test(value.target.address)) return null;
  if (!["address", "protocol", "website", "bounty", "notes"].every((key) => typeof value.target[key as keyof Target] === "string" && value.target[key as keyof Target].length <= 5000)) return null;
  return value;
}
