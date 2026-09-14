# Public beta deployment

## Apply the database migration first

In the existing Supabase project's SQL Editor, run `supabase/migrations/002_public_beta.sql` once, then `supabase/migrations/003_testnet_demo.sql`. Keep existing tables and 001 migration. The new tables have RLS enabled and no browser-role access. The migration does not replay old queued investigations; an approved operator explicitly queues those.

## Web: Vercel

Import this repository into your Vercel account; select the Next.js framework and root directory `apps/web`. Allow the build to include files outside that root (the testnet evidence JSON lives in `docs/deployments`). Use the existing lockfile. Set the web environment names below. Set `WHITEHAT_PUBLIC_ORIGIN` to the exact HTTPS origin of the intended deployment, without a trailing slash, and redeploy after assigning the domain. Do not use wildcard origins. Sign-in is disabled on other preview domains.

`WHITEHAT_ADMIN_WALLETS` must contain the operator-approved wallet addresses, comma separated. No admin is assigned automatically. Connect that wallet and sign in to visit `/admin`.

| Web variable | Purpose |
| --- | --- |
| SUPABASE_URL | Existing hosted database endpoint |
| SUPABASE_SECRET_KEY | Server-only Supabase key; never NEXT_PUBLIC |
| WHITEHAT_PUBLIC_ORIGIN | Exact public HTTPS site origin |
| WHITEHAT_ADMIN_WALLETS | Explicit admin wallet allowlist |
| WHITEHAT_TESTNET_TOKEN_ADDRESS | Existing deployed testnet token |
| WHITEHAT_TESTNET_REGISTRY_ADDRESS | Existing deployed testnet registry |
| WHITEHAT_TESTNET_REGISTRY_DEPLOYMENT_BLOCK | Registry log lookup lower bound |
| WHITEHAT_TESTNET_VAULT_ADDRESS | Existing testnet vault |
| WHITEHAT_TESTNET_EXECUTOR_ADDRESS | Existing testnet executor |
| WHITEHAT_TESTNET_DISTRIBUTOR_ADDRESS | Existing testnet distributor |

Public contract addresses are recorded in `docs/deployments/robinhood-testnet.json`. Deployment private keys are not web or worker configuration. Do not upload `contracts/.env` or any local `.env.local` file to the repository.

RPC endpoints remain pinned to the existing Robinhood public read-only providers in `apps/web/lib/investigation.ts`. Wallet transactions are pinned to chain 46630 in `testnet.ts`. There is no mainnet signing or deployment path in the public web app.

## Persistent worker: one private Linux host

Use one Linux x86-64 Docker host with about 4 CPU cores, 16 GB RAM and 40 GB free disk. CPU Ollama works but may hit the existing per-call timeout; a compatible GPU improves model latency. Model unavailability is reported honestly and does not fabricate analysis. No need for Kubernetes or extra public services.

From the repository root on that host:

```sh
cp services/runner/.env.example services/runner/.env
# Set SUPABASE_URL and SUPABASE_SECRET_KEY locally in that file.
docker compose -f services/runner/compose.yaml up -d --build
docker compose -f services/runner/compose.yaml exec ollama ollama pull qwen2.5-coder:7b
```

The worker polls Supabase; it needs no inbound HTTP port. Ollama is internal to the Docker network and must not be exposed publicly. Keep only host administration ports permitted by your firewall. The worker runs non-root, with dropped capabilities, read-only root filesystem, bounded CPU/memory/processes and temporary job storage. Compiler subprocesses do not inherit the database key. The host contains private evidence and must be operator controlled.

Worker variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WHITEHAT_AI_PROVIDER`, `WHITEHAT_AI_MODEL`, `WHITEHAT_AI_BASE_URL`, `WHITEHAT_ANALYZER_ROOT`, `WHITEHAT_ANALYZER_WORK_DIR`, `WHITEHAT_PYTHON`, `WHITEHAT_SOLC`, `WHITEHAT_FORGE`. Docker supplies the tool paths and local Ollama defaults. Change these paths only for an explicitly managed non-Docker installation.

Docker configuration is prepared; image build and host execution must be verified on the Linux host. Docker is unavailable in this Windows session. Do not call the hosted security engine ready until its heartbeat is ONLINE and an approved scoped investigation has completed there.

## Controls and launch check

New targets are PENDING_REVIEW and queue Recon only. Scope approval does not silently begin deeper work: an operator saves restrictions, allowed/excluded addresses and explicit offline-analysis consent, then clicks QUEUE WITH APPROVED SCOPE. Scope changes cancel existing jobs and invalidate their event leases. Expired jobs are marked INTERRUPTED; only an operator can rerun. Findings and reports stay admin-only, including from the originating Scout. No automated output sets human_status or approves disclosure.

Unresolved disclosures are private drafts. Human-reviewed transitions are recorded; no email, external messaging or onchain payments occur. Bounty amounts use whole base units and conserve the 50/50 allocation with an odd unit going to buyback. The completed mock loop is separately labelled TESTNET DEVELOPMENT DATA; no genuine finding/disclosure is fabricated for that demonstration.

After deployment: sign in as a normal Scout, submit a testnet target, close the browser, and confirm Recon finishes from `/admin`. Verify an unapproved wallet receives 403 on `/api/admin` and cannot read a private finding. Review scope; queue offline analysis; privately review a finding and prepare a draft. Check Explore, profile and testnet token/buybacks. Do not claim the beta is live until these host checks pass.
