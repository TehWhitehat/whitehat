# Whitehat local Security Engine

Python 3.12 worker with Slither 0.11.5, native solc 0.8.26 and Forge 1.7.1. Each run uses a separate ignored `work/` directory with source, compiler output, tool logs, structured events and results.

- Real targets: verified Solidity 0.8.26 source → native compilation → Slither → source-grounded candidate invariants → offline Forge build. Other compilers / unsupported inputs report limitations or actual failures.
- Fuzz/invariant execution: only the repository-owned **WHITEHAT SECURITY TEST FIXTURE**. No real third-party target is executed. FFI disabled; no RPC endpoints, signing, broadcasts, downloaded test scripts or host build hooks.
- `review.py`: vendor-neutral reasoning boundary with deterministic rules, independent fixture rerun, duplicate-aware Critic, private report and allowlisted public summary. AI MODEL / NOT CONFIGURED; reports stay local and no disclosure occurs.
- `worker.py`: tool orchestration and result parsing. `test_worker.py`: path guards and the real fixture integration test. `fixtures/`: intentionally defective local Solidity plus controlled tests.
- Artifacts are local files, not a database. Findings receive deterministic economic, simulation and Critic review. Only independently reproduced fixture defects can be validated; all results stop at human review. Working-directory isolation is not a VM/container sandbox.

Run verification from the repository root:

```powershell
services/analyzer/.venv/Scripts/python.exe services/analyzer/test_worker.py
```

The integration test passes when Slither identifies `tx-origin` and Foundry detects the planted credit-conservation defect. Foundry's expected fixture failures do not mean the integration test failed.

Local demo: http://127.0.0.1:3000/investigations/local-security-fixture

Set `WHITEHAT_ANALYZER_ROOT` in `apps/web/.env.local` to this directory's absolute path (see root `.env.example`). This keeps the Python installation and temporary tool artifacts outside the website bundle.

Installation is local to this folder: create a Python 3.12 venv, install `requirements.txt`, run `npm.cmd install --prefix services/analyzer/tools`, then `node services/analyzer/tools/install-solc.mjs`. The compiler installer verifies the official SHA-256. This Windows sandbox uses `tools/install-slither.py` with the host Python's pip to install into the venv when standard pip temporary directories are inaccessible. No system configuration is changed.

Local AI: set `WHITEHAT_AI_PROVIDER=ollama`, `WHITEHAT_AI_BASE_URL=http://localhost:11434`, and `WHITEHAT_AI_MODEL=qwen2.5-coder:7b` in `apps/web/.env.local`. No API key is used. `ai_provider.py` keeps bounded evidence packs and separate model call records; model opinions cannot alter deterministic validation. Outages retain all tool results. Test with `services/analyzer/.venv/Scripts/python.exe services/analyzer/test_ai.py`.
