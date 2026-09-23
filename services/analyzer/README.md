# WHITEHAT security engine

Analysis engine for the self-hosted WHITEHAT worker runtime, separate from the public web application. Python 3.12 worker with Slither 0.11.5, native solc 0.8.26 and Forge 1.7.1. Each run uses a separate private working directory (configured with `WHITEHAT_ANALYZER_WORK_DIR`, or the ignored `work/` default) with source, compiler output, tool logs, structured events and results.

- Real targets: verified Solidity 0.8.26 source → native compilation → Slither → source-grounded candidate invariants → offline Forge build. Other compilers / unsupported inputs report limitations or actual failures.
- Fuzz/invariant execution: only the repository-owned **WHITEHAT SECURITY TEST FIXTURE**. No real third-party target is executed. FFI disabled; no RPC endpoints, signing, broadcasts, downloaded test scripts or host build hooks.
- `review.py`: vendor-neutral reasoning boundary with deterministic rules, independent fixture rerun, duplicate-aware Critic, private report and allowlisted public summary. Ollama supplies optional evidence-grounded review; unavailable model work is reported as limited. Reports remain private and no automatic disclosure occurs.
- `worker.py`: tool orchestration and result parsing. `test_worker.py`: path guards and the real fixture integration test. `fixtures/`: intentionally defective local Solidity plus controlled tests.
- Raw artifacts remain private worker files. The queue runner persists structured events, findings and reports in Supabase. Findings receive deterministic economic, simulation and Critic review. Only independently reproduced fixture defects can be validated; all results stop at human review. Working-directory isolation is not a VM/container sandbox.

## Local Development

Run verification from the repository root using the configured analyzer tool paths and virtual environment:

```powershell
services/analyzer/.venv/Scripts/python.exe services/analyzer/test_worker.py
```

The integration test passes when Slither identifies `tx-origin` and Foundry detects the planted credit-conservation defect. Foundry's expected fixture failures do not mean the integration test failed.

Developer-only fixture (not a public production route): http://127.0.0.1:3000/investigations/local-security-fixture

For queued jobs, set `WHITEHAT_ANALYZER_ROOT` in the ignored `services/runner/.env` to this directory's absolute path. For the developer-only web fixture, use `apps/web/.env.local` instead (see root `.env.example`). This keeps the Python installation and temporary tool artifacts outside the website bundle.

Developer tool installation uses this folder: create a Python 3.12 venv, install `requirements.txt`, run `npm.cmd install --prefix services/analyzer/tools`, then `node services/analyzer/tools/install-solc.mjs`. The compiler installer verifies the official SHA-256. For Windows environments with restricted temporary-directory access, use `tools/install-slither.py` with the host Python's pip to install into the venv when standard pip temporary directories are inaccessible. No system configuration is changed.

## Self-hosted AI provider

Ollama is the current provider. Set `WHITEHAT_AI_PROVIDER=ollama`, `WHITEHAT_AI_BASE_URL=http://localhost:11434`, and `WHITEHAT_AI_MODEL=qwen2.5-coder:7b` in `services/runner/.env` for queued jobs, or `apps/web/.env.local` for the developer-only fixture. No API key is used. The provider accepts only loopback HTTP, so Ollama must run alongside the worker or share its network namespace. This does not restrict public access to the Vercel website. Never expose Ollama to the internet. `ai_provider.py` keeps bounded evidence packs and separate model call records; model opinions cannot alter deterministic validation. Outages retain all tool results. Test with `services/analyzer/.venv/Scripts/python.exe services/analyzer/test_ai.py`.
