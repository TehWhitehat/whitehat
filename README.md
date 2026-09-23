# WHITEHAT

WHITEHAT is a public-beta platform for defensive DeFi security research. Scouts submit targets, operators review scope, and a separate analysis worker collects evidence for human review.

[Public beta](https://whitehat.run) · [Product docs](https://whitehat.run/docs) · [Operations guide](docs/public-beta-deployment.md) · [Security engine](services/analyzer/README.md) · [Testnet contracts](contracts/README.md)

## Architecture

```text
User → Vercel web app → Supabase → investigation queue
                                      ↓
                             WHITEHAT analysis worker
                                      ↓
                             Security tools / AI provider
                                      ↓
                             Results persisted to Supabase
                                      ↓
                             Public investigation UI
```

The Next.js frontend and server routes run on Vercel. Supabase stores wallet sessions, targets, Scout attribution, queued jobs, events, findings and reports. The WHITEHAT worker is an external process that claims jobs and saves results. It makes outbound requests and exposes no public inbound API.

The current beta uses a self-hosted worker with Ollama and `qwen2.5-coder:7b`; it is not fully cloud-hosted. The worker runtime can move independently of the frontend, provided its tools, private configuration and database access are available. Ollama currently must share the worker's loopback network. A Windows launcher is available; the included Linux Docker configuration requires validation on the intended host.

Processing depends on an operator keeping the worker runtime available. Closing a browser tab does not stop a queued investigation. Interrupted jobs may require an operator to requeue them.

## Product flow

1. Connect an EVM wallet and sign an offchain sign-in message. Sign-in requests no transaction or token approval.
2. Submit a chain and contract address through `/submit`. Supabase saves the target and investigation; duplicate submissions preserve the original Scout.
3. New targets queue read-only Recon. An approved operator reviews scope and explicitly queues deeper permitted analysis.
4. The worker runs supported tools and AI-assisted review, then persists progress and results.
5. Explore and investigation pages show public progress. Unresolved findings, reproduction details and reports are restricted to approved admins, including when the viewer is the originating Scout.

The nine-stage pipeline is Recon, Cartographer, Static Analyst, Invariant Agent, Fuzz Agent, Economic Agent, Simulation Agent, Critic and Reporter. Stages report limitations when tools, source, model responses or authorized test harnesses are unavailable; a stage name does not guarantee full coverage.

## Safety and beta limits

- Public reconnaissance is read-only. Deeper analysis requires reviewed scope and operator approval.
- Fuzz/invariant execution and simulation are restricted to the repository-owned fixture. Unsupported third-party execution remains limited.
- Deterministic evidence remains authoritative. AI conclusions are candidates, not proof of exploitability. Results require human review.
- The investigation pipeline performs no autonomous exploitation, automatic disclosure or real bounty payment.
- The Scout model allocates 50% of an eligible successful bounty to the originating Scout and 50% to WHITEHAT buybacks, subject to review and the applicable security program. A submission does not guarantee a reward.
- Existing token, attribution and mock economic demonstrations are **Robinhood Chain Testnet / 46630 only**. Mock activity is not real recovered bounty revenue.
- The worker does not require a wallet private key. Supabase privileged credentials remain server-side and must never use a `NEXT_PUBLIC_` prefix.

## Local Development

Install Node.js 22 or newer and Git. Configure `apps/web/.env.local` with server-only Supabase settings and the appropriate origin/admin configuration. For a fresh database, apply migrations 001, 002 and 003 in order; do not replay migrations already applied. See the [operations guide](docs/public-beta-deployment.md). `.env.example` contains generic values, not credentials.

From the repository root:

```powershell
npm.cmd ci --foreground-scripts
npm.cmd run build
npm.cmd run start
```

Open http://127.0.0.1:3000. These commands serve a development copy of the web app; the public beta remains on Vercel. On other shells, use `npm` instead of `npm.cmd`. `npm.cmd run dev` enables the development watcher where supported. If child-process restrictions prevent it, use build-and-start instead. Rebuild after edits when using `start`.

Local-only development may omit `WHITEHAT_PUBLIC_ORIGIN` to allow loopback HTTP. A deployed web app must use its exact HTTPS origin.

### Run the analysis worker

The worker can run on a developer machine or another operator-controlled host. The current Windows runtime uses Python 3.12, Slither, solc 0.8.26, Foundry and Ollama. See [analyzer setup](services/analyzer/README.md) and [worker configuration](docs/public-beta-deployment.md#self-hosted-worker).

For an already configured Windows runtime, open PowerShell in the repository root:

```powershell
.\start-whitehat-worker.ps1
```

The launcher reads the ignored `services/runner/.env`, compiles the runner and starts it. Keep the worker and Ollama running for the test session. Stop with **Ctrl+C**, preferably after the active job finishes. Check the queue before starting: existing queued jobs can be claimed immediately. Do not overwrite a working environment file.

Current self-hosted AI settings:

```dotenv
WHITEHAT_AI_PROVIDER=ollama
WHITEHAT_AI_BASE_URL=http://localhost:11434
WHITEHAT_AI_MODEL=qwen2.5-coder:7b
```

No AI API key is required. `localhost` describes the private connection between worker and Ollama, not the public website. Do not expose Ollama to the internet. Model failures are reported as limitations while deterministic evidence is retained.

## Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

These check code quality, TypeScript and the production web build. `npm.cmd run test:database --workspace=@whitehat/web` checks database rules in an in-memory test engine, not hosted connectivity. Analyzer tests are documented [separately](services/analyzer/README.md).

## Repository guide

| Path | Purpose |
| --- | --- |
| `apps/web/` | Public UI, wallet authentication, server routes and private admin review |
| `services/runner/` | Queue consumer, job leases and heartbeat |
| `services/analyzer/` | Security tools, AI provider, bounded reports and controlled fixtures |
| `start-whitehat-worker.ps1` | Windows worker launcher |
| `supabase/migrations/` | Database schema, access restrictions and job functions |
| `contracts/` | Testnet contracts, tests and deployment script |
| `docs/deployments/` | Public testnet addresses and demonstration receipts |
| `packages/shared/` | Reserved shared-package directory |
| `docs/` | Operations, product blueprint and historical milestone records |
| `.env.example` | Generic web/development environment examples |
| `AGENTS.md` | Engineering scope and safety boundaries |

The web app is the registered npm workspace; the analyzer and runner have separate runtime responsibilities. The [master specification](docs/master-specification.md) describes product direction, not a promise that every proposed capability is implemented. Stage 1A–1C notes and the original verification record are historical snapshots, not current operating instructions.

