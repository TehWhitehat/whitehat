import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as viem from "viem";

function load(path, modules, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, process: { env }, require: name => {
    if (name in modules) return modules[name];
    throw new Error("Unexpected import: " + name);
  } });
  return exports;
}
const testnet = load("apps/web/lib/testnet.ts", { viem });
const networks = load("apps/web/lib/attribution-network.ts", { viem, "./testnet": testnet });
const registry = "0x0000000000000000000000000000000000000011";
const testRegistry = "0x0000000000000000000000000000000000000022";
const target = "0x0000000000000000000000000000000000000033";
const scout = "0x0000000000000000000000000000000000000044";
const env = { WHITEHAT_MAINNET_REGISTRY_ADDRESS: registry, WHITEHAT_TESTNET_REGISTRY_ADDRESS: testRegistry };
let calls = [], reportedChain, registered = scout, code = "0x1234", failLogs = false;
const reader = {
  async getChainId() { return reportedChain; },
  async getCode() { return code; },
  async getBlockNumber() { return 8000n; },
  async readContract(request) { calls.push(request); return registered; },
  async getLogs(request) { calls.push(request); if (failLogs) throw Error(); return [{ args: { scout }, transactionHash: "0xabc", blockNumber: 7000n }]; },
};
const server = load("apps/web/lib/onchain-attribution.ts", {
  "server-only": {}, "./attribution-network": networks,
  viem: { ...viem, createPublicClient(options) { calls.push(options); return reader; } },
}, env);
for (const chain of [4663, 46630]) {
  reportedChain = chain; calls = [];
  const result = await server.onchainAttribution(chain, target);
  assert.equal(result.status, "ONCHAIN");
  assert.equal(result.chainId, chain);
  assert.equal(result.registry, chain === 4663 ? registry : testRegistry);
  assert.equal(calls[0].chain.id, chain);
  assert.equal(calls[1].address, result.registry);
  assert.equal(calls[1].args[0], viem.keccak256(viem.encodeAbiParameters([{ type: "uint256" }, { type: "address" }], [BigInt(chain), target])));
  assert.equal(calls[2].fromBlock, 3001n);
}
reportedChain = 46630;
assert.equal((await server.onchainAttribution(4663, target)).status, "UNAVAILABLE");
reportedChain = 4663; code = "0x";
assert.equal((await server.onchainAttribution(4663, target)).status, "UNAVAILABLE");
code = "0x1234"; failLogs = true;
assert.equal((await server.onchainAttribution(4663, target)).status, "ONCHAIN");
failLogs = false; registered = viem.zeroAddress;
assert.equal((await server.onchainAttribution(4663, target)).status, "OFFCHAIN");
delete env.WHITEHAT_MAINNET_REGISTRY_ADDRESS; calls = [];
assert.equal((await server.onchainAttribution(4663, target)).registry, undefined);
assert.equal(calls.length, 0); // Never fall back to configured testnet registry.
assert.equal((await server.onchainAttribution(1, target)).status, "UNAVAILABLE");
env.WHITEHAT_MAINNET_REGISTRY_ADDRESS = "0x24de10e8da3d101d7eb7bcd54fab47e91c1dfb3f";
assert.equal((await server.onchainAttribution(4663, target)).status, "UNAVAILABLE");
assert.throws(() => networks.registrationRequest(1, registry, target, scout));

// Invoke the real component's click handler with a mocked wallet and RPC.
// No transaction or signature leaves this test process.
for (const chain of [4663, 46630]) {
  for (const scenario of ["success", "wrong-chain", "duplicate", "no-code", "declined", "reverted", "wrong-scout"]) {
    let switched = false, submitted = false, confirmed = false, simulated, messages = [];
    const jsx = (type, props) => ({ type, props });
    const rpc = {
      ...reader,
      getChainId: async () => scenario === "wrong-chain" ? 1 : chain,
      readContract: async () => scenario === "duplicate" ? scout : viem.zeroAddress,
      getCode: async () => scenario === "no-code" ? "0x" : "0x1234",
      simulateContract: async request => { simulated = request; },
      waitForTransactionReceipt: async () => ({ status: scenario === "reverted" ? "reverted" : "success", blockNumber: 2n }),
    };
    const component = load("apps/web/components/register-attribution.tsx", {
      react: { useState: initial => [initial, value => messages.push(value)] },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      wagmi: {
        useConnection: () => ({ address: scout }),
        useSwitchChain: () => ({ switchChainAsync: async request => { assert.equal(request.chainId, chain); switched = true; if (scenario === "declined") throw Error(); } }),
        useWriteContract: () => ({ writeContractAsync: async request => {
          assert.equal(switched, true); assert.equal(request, simulated);
          assert.equal(request.chainId, chain); assert.equal(request.args[0], BigInt(chain));
          assert.equal(request.address, registry); assert.equal(request.args[1], target);
          submitted = true; return "0xabc";
        } }),
      },
      viem: { ...viem, createPublicClient: options => { assert.equal(options.chain.id, chain); return rpc; } },
      "../lib/attribution-network": networks, "../lib/testnet": testnet,
      "./wallet-provider": { useScout: () => ({ wallet: scout }) },
    });
    const tree = component.RegisterAttribution({ chainId: chain, registry, target, originalScout: scenario === "wrong-scout" ? target : scout, onConfirmed: () => { confirmed = true; } });
    const button = tree.props.children.find(item => item?.type === "button");
    if (scenario === "wrong-scout") assert.equal(button.props.disabled, true);
    await button.props.onClick();
    assert.equal(submitted, ["success", "reverted"].includes(scenario));
    assert.equal(confirmed, ["success", "duplicate"].includes(scenario));
    if (scenario === "reverted") assert.ok(messages.some(value => typeof value === "string" && value.includes("reverted or unavailable")));
  }
}
console.log("PASS: mainnet/testnet registry isolation, RPC chain/code checks, bounded logs, missing configuration, and 14 wallet registration scenarios.");
