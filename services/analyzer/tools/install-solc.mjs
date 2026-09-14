import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("./solc/", import.meta.url);
const base = "https://binaries.soliditylang.org/windows-amd64/";
const indexResponse = await fetch(base + "list.json");
if (!indexResponse.ok) throw new Error("Cannot retrieve the official Solidity compiler index.");
const index = await indexResponse.json();
const entry = index.builds.find((build) => build.path === index.releases["0.8.26"]);
if (!entry?.sha256 || !/^solc-windows-amd64-v[\w.+-]+\.exe$/.test(entry.path)) throw new Error("Compiler release metadata is invalid.");
const response = await fetch(base + entry.path);
if (!response.ok) throw new Error("Compiler download failed.");
const bytes = Buffer.from(await response.arrayBuffer());
const hash = createHash("sha256").update(bytes).digest("hex");
if (hash !== entry.sha256.replace(/^0x/, "")) throw new Error("Compiler checksum mismatch.");
await mkdir(root, { recursive: true });
await writeFile(new URL("solc-0.8.26.exe", root), bytes);
console.log(`Installed official solc 0.8.26; SHA-256 ${hash}`);
