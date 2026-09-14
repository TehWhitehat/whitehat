import { addressPattern, chains, isChain, localIdPattern, persistentIdPattern } from "./investigation.ts";
import type { Chain, ContractMap, InvestigationEvent, Telemetry } from "./investigation.ts";

export const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const hexBytes = /^0x(?:[a-fA-F0-9]{2})*$/;
const quantity = /^0x[0-9a-fA-F]+$/;
type JsonObject = Record<string, unknown>;
type Fetcher = typeof fetch;
type RequestInput = { investigationId: string; chain: Chain; address: string };
type AbiEntry = { type: string };
type Metadata = { map: ContractMap; abi?: AbiEntry[]; implementations: string[] };

function object(value: unknown): value is JsonObject { return !!value && typeof value === "object" && !Array.isArray(value); }
function shortText(value: unknown) { return typeof value === "string" ? value.slice(0, 180) : undefined; }
export function validReconInput(value: unknown): value is RequestInput {
  return object(value) && typeof value.investigationId === "string" && (localIdPattern.test(value.investigationId) || persistentIdPattern.test(value.investigationId)) && isChain(value.chain) && typeof value.address === "string" && addressPattern.test(value.address);
}

// Both upstream replies and incoming requests are bounded; never retain source code.
export async function limitedJson(stream: ReadableStream<Uint8Array> | null, limit: number): Promise<unknown> {
  if (!stream) throw new Error("Empty response.");
  const reader = stream.getReader();
  let text = "";
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > limit) throw new Error("Response exceeded the safe size limit.");
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function mapAbi(metadata: Metadata): ContractMap {
  if (!metadata.abi) return metadata.map;
  return { ...metadata.map, abiEntries: metadata.abi.length, functions: metadata.abi.filter((entry) => entry.type === "function").length, events: metadata.abi.filter((entry) => entry.type === "event").length };
}

/** Deterministic read-only workers. No LLM, transactions, calls to submitted URLs, or crawling. */
export async function runRecon(input: RequestInput, emit: (event: InvestigationEvent) => void, options: { fetcher?: Fetcher; signal?: AbortSignal; timeoutMs?: number } = {}) {
  if (!validReconInput(input)) throw new Error("Invalid investigation request.");
  const fetcher = options.fetcher ?? fetch;
  const network = chains[input.chain];
  const signal = AbortSignal.any([options.signal ?? new AbortController().signal, AbortSignal.timeout(75000)]);
  let sequence = 0;
  let stage: InvestigationEvent["stage"] = "INITIALIZING";
  const send = (agent: InvestigationEvent["agent"], eventType: InvestigationEvent["eventType"], status: InvestigationEvent["status"], message: string, data: Partial<Telemetry> = {}) => {
    if (!signal.aborted) emit({ investigationId: input.investigationId, sequence: ++sequence, timestamp: new Date().toISOString(), agent, stage, eventType, status, message, data });
  };
  async function getJson(url: string, init?: RequestInit) {
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(options.timeoutMs ?? 10000)]);
    const response = await fetcher(url, { ...init, signal: requestSignal, redirect: "error", cache: "no-store" });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Upstream HTTP ${response.status}`); }
    return limitedJson(response.body, 3_000_000);
  }
  async function rpc(method: "eth_chainId" | "eth_blockNumber" | "eth_getCode" | "eth_getStorageAt", params: string[]) {
    const result = await getJson(network.rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (!object(result) || result.jsonrpc !== "2.0" || result.id !== 1 || "error" in result || typeof result.result !== "string") throw new Error("Invalid RPC reply.");
    return result.result;
  }
  async function metadata(address: string): Promise<Metadata> {
    let verified: boolean | undefined;
    let name: string | undefined;
    let implementations: string[] = [];
    try {
      const info = await getJson(`${network.explorer}/api/v2/addresses/${address}`);
      if (!object(info) || typeof info.hash !== "string" || info.hash.toLowerCase() !== address.toLowerCase() || typeof info.is_verified !== "boolean") throw new Error("Invalid explorer address metadata.");
      verified = info.is_verified;
      name = shortText(info.name);
      if (Array.isArray(info.implementations)) implementations = info.implementations.flatMap((entry) => object(entry) && typeof entry.address_hash === "string" && addressPattern.test(entry.address_hash) ? [entry.address_hash] : []).slice(0, 2);
    } catch { send("RECON", "operation", "LIMITED", "Explorer address metadata is unavailable; source verification may be unknown."); }
    try {
      const info = await getJson(`${network.explorer}/api/v2/smart-contracts/${address}`);
      if (!object(info) || !("abi" in info) || (info.abi !== null && !Array.isArray(info.abi))) throw new Error("Invalid explorer contract metadata.");
      // Never turn a failed lookup into an 'unverified' claim.
      const isVerified = verified ?? (typeof info.is_fully_verified === "boolean" ? info.is_fully_verified || info.is_partially_verified === true : undefined);
      const source: ContractMap["source"] = isVerified === true ? "VERIFIED" : isVerified === false ? "UNVERIFIED" : "UNAVAILABLE";
      let abi: AbiEntry[] | undefined;
      if (isVerified === true && Array.isArray(info.abi)) {
        const types = ["function", "event", "constructor", "error", "fallback", "receive"];
        if (!info.abi.every((entry) => object(entry) && typeof entry.type === "string" && types.includes(entry.type))) throw new Error("Malformed ABI.");
        abi = info.abi.map((entry) => ({ type: (entry as JsonObject).type as string }));
      }
      return { map: { address, source, name: shortText(info.name) ?? name, compiler: shortText(info.compiler_version) }, abi, implementations };
    } catch {
      send("RECON", "operation", "LIMITED", "Explorer source / ABI lookup is unavailable. Recon will continue with the data retrieved.");
      return { map: { address, source: verified === false ? "UNVERIFIED" : verified === true ? "VERIFIED" : "UNAVAILABLE", name }, implementations };
    }
  }

  send("SYSTEM", "state", "RUNNING", "Temporary local investigation initialized. Read-only checks are starting.");
  stage = "RECON";
  send("RECON", "agent", "RUNNING", `Connecting to ${input.chain} via public RPC…`);
  let block: string;
  let code: string;
  try {
    const actual = await rpc("eth_chainId", []);
    if (!quantity.test(actual) || !Number.isSafeInteger(Number(BigInt(actual)))) throw new Error("Malformed chain ID.");
    const chainId = Number(BigInt(actual));
    if (chainId !== network.id) {
      stage = "FAILED";
      send("RECON", "agent", "FAILED", `Incorrect network: RPC returned chain ID ${chainId}; expected ${network.id}. Checks stopped.`, { chainId });
      send("CARTOGRAPHER", "agent", "BLOCKED", "Mapping blocked because the network could not be confirmed.");
      return;
    }
    send("RECON", "operation", "COMPLETE", `Chain ID confirmed: ${chainId}`, { chainId });
    send("RECON", "operation", "RUNNING", "Reading the current block for a consistent RPC snapshot…");
    block = await rpc("eth_blockNumber", []);
    if (!quantity.test(block)) throw new Error("Malformed block number.");
    send("RECON", "operation", "COMPLETE", `RPC snapshot: block ${BigInt(block)}`, { blockNumber: BigInt(block).toString() });
    send("RECON", "operation", "RUNNING", "Querying contract bytecode…");
    code = await rpc("eth_getCode", [input.address, block]);
    if (!hexBytes.test(code)) throw new Error("Malformed bytecode.");
    const bytes = (code.length - 2) / 2;
    if (!bytes) {
      stage = "BLOCKED";
      send("RECON", "agent", "BLOCKED", "NO CONTRACT BYTECODE FOUND. No deployed code exists at this address in the selected block.", { codeFound: false, codeBytes: 0 });
      send("CARTOGRAPHER", "agent", "BLOCKED", "Mapping stopped: the address has no contract bytecode.");
      return;
    }
    send("RECON", "operation", "COMPLETE", `Contract detected — ${bytes.toLocaleString("en-US")} bytes`, { codeFound: true, codeBytes: bytes });
  } catch {
    stage = "FAILED";
    send("RECON", "agent", "FAILED", "RPC unavailable, timed out, or returned an invalid response. Network / bytecode checks could not finish. Try again later.");
    send("CARTOGRAPHER", "agent", "BLOCKED", "Mapping blocked because contract reconnaissance could not finish.");
    return;
  }

  let implementation: string | undefined;
  let proxyLimited = false;
  send("RECON", "operation", "RUNNING", "Checking the EIP-1967 implementation storage slot…");
  try {
    const slot = await rpc("eth_getStorageAt", [input.address, implementationSlot, block]);
    if (!/^0x[0-9a-fA-F]{64}$/.test(slot)) throw new Error("Malformed storage word.");
    if (/^0x0{64}$/i.test(slot)) {
      send("RECON", "operation", "COMPLETE", "NO STANDARD PROXY DETECTED. No standard proxy pattern detected during initial reconnaissance. Only the EIP-1967 implementation slot was checked.", { proxy: "NO STANDARD PROXY DETECTED" });
    } else {
      if (!/^0x0{24}[0-9a-fA-F]{40}$/.test(slot)) throw new Error("Invalid implementation slot.");
      const candidate = `0x${slot.slice(-40)}`;
      if (candidate.toLowerCase() === input.address.toLowerCase()) throw new Error("Self-referencing slot.");
      send("RECON", "operation", "RUNNING", `Implementation slot populated. Checking bytecode at ${candidate}…`);
      const implementationCode = await rpc("eth_getCode", [candidate, block]);
      if (!hexBytes.test(implementationCode) || implementationCode === "0x") throw new Error("No implementation bytecode.");
      implementation = candidate;
      send("RECON", "operation", "COMPLETE", `PROXY DETECTED — EIP-1967 slot resolves to a deployed implementation: ${implementation}`, { proxy: "PROXY DETECTED", implementation, implementationEvidence: "EIP-1967 slot + implementation bytecode" });
    }
  } catch {
    proxyLimited = true;
    send("RECON", "operation", "LIMITED", "Proxy lookup unsuccessful. The storage response or implementation could not be verified; proxy status remains unknown.", { proxy: "LOOKUP UNAVAILABLE" });
  }

  send("RECON", "operation", "RUNNING", "Retrieving public explorer metadata and verified ABI…");
  const targetMetadata = await metadata(input.address);
  send("RECON", "operation", "COMPLETE", `Explorer lookup finished. Source: ${targetMetadata.map.source.toLowerCase()}; verified ABI: ${targetMetadata.abi ? "available" : "unavailable"}.`, { contracts: [targetMetadata.map] });
  if (!implementation && targetMetadata.implementations.length === 1) {
    const candidate = targetMetadata.implementations[0];
    send("RECON", "operation", "RUNNING", "Explorer reports an implementation. Verifying its bytecode…");
    try {
      if (candidate.toLowerCase() === input.address.toLowerCase()) throw new Error("Self reference.");
      const implementationCode = await rpc("eth_getCode", [candidate, block]);
      if (!hexBytes.test(implementationCode) || implementationCode === "0x") throw new Error("Missing implementation code.");
      implementation = candidate;
      send("RECON", "operation", "COMPLETE", `Explorer-reported proxy implementation has bytecode: ${candidate}. Relationship is explorer-reported.`, { proxy: "EXPLORER-REPORTED PROXY", implementation, implementationEvidence: "Explorer-reported relationship + implementation bytecode" });
    } catch { proxyLimited = true; send("RECON", "operation", "LIMITED", "Explorer implementation could not be verified. No relationship is confirmed."); }
  } else if (targetMetadata.implementations.length > 1 || (implementation && targetMetadata.implementations.some((item) => item.toLowerCase() !== implementation?.toLowerCase()))) {
    proxyLimited = true;
    send("RECON", "operation", "LIMITED", "Explorer implementation data is ambiguous or differs from the RPC snapshot. Mapping is bounded to the implementation verified from storage.");
  }
  const metadataRecords = [targetMetadata];
  if (implementation) {
    send("RECON", "operation", "RUNNING", "Retrieving metadata for the one resolved implementation; no recursive crawling…");
    metadataRecords.push(await metadata(implementation));
    send("RECON", "operation", "COMPLETE", "Implementation metadata lookup finished.", { contracts: metadataRecords.map((record) => record.map) });
  }
  send("RECON", "agent", "COMPLETE", "Read-only reconnaissance finished. Any unavailable data is marked above.");
  stage = "MAPPING";
  send("CARTOGRAPHER", "agent", "RUNNING", "Building a first-pass map from retrieved verified ABIs…");
  const mapped = metadataRecords.map(mapAbi);
  const limited = proxyLimited || metadataRecords.some((record) => !record.abi);
  for (const record of mapped) {
    send("CARTOGRAPHER", "operation", record.abiEntries === undefined ? "LIMITED" : "COMPLETE", record.abiEntries === undefined ? `${record.address}: VERIFIED SOURCE / ABI UNAVAILABLE. Deeper mapping is limited.` : `${record.address}: ${record.abiEntries} ABI entries, ${record.functions} public/external ABI functions, ${record.events} events.`, { contracts: mapped });
  }
  send("CARTOGRAPHER", "agent", limited ? "LIMITED" : "COMPLETE", limited ? "Available mapping finished with limited data. This is not a complete protocol map." : "First-pass ABI map finished. This is not a complete protocol map.", { contracts: mapped });
  stage = "ANALYZER QUEUED";
  send("SYSTEM", "state", "QUEUED", "Reconnaissance is ready for the local security engine. Investigation remains open.");
}
