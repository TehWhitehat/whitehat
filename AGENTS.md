# Whitehat engineering instructions

## Current authorized scope

Public beta preparation is now authorized. Persistent sessions, scope-gated background jobs, approved-admin private review, disclosure drafts and bounty records are implemented. Unresolved evidence is admin-only, including for Scouts. Apply migrations 002 and 003 before running the updated app. See docs/public-beta-deployment.md. No mainnet deployment, automatic disclosure or real payment execution is authorized. Existing chain 46630 deployments and mock demonstration remain unchanged.


Product backbone is now authorized: Supabase/PostgreSQL, injected wagmi/viem wallets, offchain message authentication, persistent submissions/events/reports, first-Scout attribution, Explore and Scout profiles. Private evidence is authenticated; public data is explicitly allowlisted. No transaction signing, tokens, bounty contracts, external AI or public deployment. Tests: relevant database/integration, lint, typecheck, build.

Agents 03–09 are authorized: Slither, invariants, Foundry, deterministic economic hypotheses, offline fixture simulation, evidence critique and private/redacted reports. Approved UI and Recon/Cartographer stay intact. Local Ollama qwen2.5-coder:7b is authorized as an additive evidence analyst. Model output remains candidate-only; do not execute generated tests or commands. No paid key required. Stop at HUMAN REVIEW REQUIRED; no publication or disclosure. Lean build mode: necessary analyzer tests, lint, typecheck, build only.

## Boundaries

- Keep Next.js, TypeScript and Tailwind CSS. Use simple, supported dependencies.
- Explain major architecture changes before making them.
- Do not add wallet connections, blockchain interactions, AI agents, contract implementations, token contracts, databases, bounty processing or public deployment without a new approved milestone.
- Never request seed phrases or private keys. Read-only public RPC/explorer access and offchain sign-in messages are authorized. No transaction signing, state-changing chain calls or exploitation.
- Keep placeholder statistics visibly identified; never invent live activity or financial outcomes.
- The homepage Submit CTA opens `/submit`. Real input creates a persistent investigation for a verified Scout; fixture remains local. Real target sources may be compiled and statically analyzed in isolated local folders. Execute only repository-owned fixture tests; unsupported real-target fuzz generation is LIMITED. Only reproduced fixture defects can become VALIDATED; all findings stop at human review. Attribution is offchain and subject to eligibility review; no invented progress.
- Preserve the master specification's 50% Scout / 50% buyback allocation from bounty amounts actually received, with operations funded separately.
- Keep unresolved security research private in future stages; sensitive actions require human authorization.

## Structure and validation

Use npm workspaces. The only implemented package is `apps/web`; the other directories remain documented placeholders. Run root `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run build` after meaningful changes. Check the homepage at desktop and mobile sizes. Maintain the beginner README.

