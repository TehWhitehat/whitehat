# Stage 1C verification

> Historical milestone record: the behavior and environment below describe that stage only. For the current public beta architecture and operating instructions, see [README](../README.md) and [operations](public-beta-deployment.md).


- Approved intake checkpoint: `c527341` (`feat: complete Whitehat target intake v0.1`). Nothing pushed.
- Lint, TypeScript and production build: PASS.
- Actual browser flow: Submit → local investigation → real streamed reconnaissance and ABI mapping. Refresh restored the session target and reran checks.
- Testnet target: `0x5695b873025378767073d1329c8f8d68fb7E53e8` (ArtistSplitterDeployer).
- Actual RPC snapshot: block `118116468`, chain ID `46630`, bytecode `4,390` bytes. EIP-1967 implementation slot empty; no standard proxy detected by this limited check.
- Explorer: verified source, compiler `v0.8.26+commit.8a97fa7a`, 1 ABI entry, 1 function, 0 events.
- Final stage: ANALYZER QUEUED. Recon / first-pass Cartographer finished; agents 03–09 NOT CONNECTED. No findings generated.
- Browser URL: `http://127.0.0.1:3000/investigations/local-<session-id>` (same browser session required).
- Fixed a local Origin/Host mismatch exposed by the live run. No exhaustive device or injected-failure tests were run, per lean build instructions.
- Bounds: two allowlisted networks; read-only RPC methods; snapshot-pinned code/storage; at most one implementation lookup; 10-second upstream timeouts, 75-second run limit, 3 MB response limit. User-supplied URLs are never fetched. No keys, transactions, LLMs, scanners or database.

References: [Robinhood network configuration](https://docs.robinhood.com/chain/connecting/), [EIP-1967 slot](https://eips.ethereum.org/EIPS/eip-1967), [Blockscout address API](https://docs.blockscout.com/api-reference/get-address-info).
