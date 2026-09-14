# Whitehat

Whitehat: approved pages, local defensive security engine, and Supabase product backbone (Supabase setup required).

Create a Supabase project named `whitehat-dev`. Run `supabase/migrations/001_backbone.sql` once in its SQL Editor. Add the project URL and server secret to `apps/web/.env.local` as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Never use a NEXT_PUBLIC prefix for the secret. The existing analyzer path stays unchanged.

## What is working

- A Next.js + TypeScript + Tailwind CSS homepage.
- Responsive layout, keyboard-accessible navigation and local section links.
- Whitehat positioning, the proposed bounty split, and clearly marked zero-value placeholder statistics.
- A `/submit` page with address-format validation and authenticated persistent Scout submissions.
- Real network, bytecode, EIP-1967 storage and explorer checks, followed by first-pass verified ABI mapping.

The homepage's Submit a Target button opens `/submit`. Valid input opens `/investigations/[id]`. Real submissions require an injected wallet and an offchain sign-in message. Supabase stores targets, Scout submissions, investigations, events, findings and reports. Original Scout attribution cannot be overwritten. Public views omit private evidence. No blockchain transactions, external AI model or public deployment. Local sessions expire after eight hours or a server restart.

## Open the website

While the local server is running, visit **http://127.0.0.1:3000** in your browser. This address refers to your own computer.

The new form is at **http://127.0.0.1:3000/submit**.

## Try the target form

1. Select the chain whose public RPC should be queried read-only.
2. Enter a contract address: `0x` followed by exactly 40 hexadecimal characters (0–9, a–f, A–F). Other text fields are optional.
3. Press **Submit Target**. Invalid addresses show an inline error. Optional website fields must contain an HTTP or HTTPS URL if filled in.
4. Connect your wallet and sign in using the header. Submit to create a stored investigation; duplicate targets retain the original Scout.
5. Refreshing real investigations loads stored progress. Keep the tab open during the initial local run; disconnecting can interrupt analysis, while saved evidence remains. The local fixture continues to rerun on refresh.

For the tested real contract, select Robinhood Chain Testnet and use `0x5695b873025378767073d1329c8f8d68fb7E53e8`. This is a read-only verification example, not a security recommendation. Attribution is offchain, subject to eligibility review, and does not guarantee a reward.

## Start it again later (Windows PowerShell)

1. Open PowerShell.
2. Move into the repository by copying this command:

```powershell
Open a terminal in the Whitehat project root folder.
```

3. Start the checked, optimized local preview:

```powershell
npm.cmd run start
```

4. Open http://127.0.0.1:3000. Keep PowerShell open while you use the site. Press **Ctrl+C** in that PowerShell window to stop it.

If you get a port-in-use message, the site may already be running. Check the URL before starting another copy.

## Install on a fresh computer

Install Node.js 22 or newer and Git. From this folder, run `npm.cmd ci --foreground-scripts`, then `npm.cmd run build`, then `npm.cmd run start`. Configure Supabase as above for persistent submissions. The fixture works without it. `npm.cmd` avoids PowerShell script-policy problems with the `npm` shortcut.

## Check the project

Run these commands from this folder:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

- **lint** checks common code mistakes and accessibility rules.
- **typecheck** checks that TypeScript values fit together correctly.
- **build** checks that Next.js can create an optimized version of the site.
- **start** runs that optimized build locally, after `build` succeeds.

After editing the source, stop the preview with Ctrl+C, run `npm.cmd run build`, then `npm.cmd run start` again to see your changes. The optional `npm.cmd run dev` command normally updates the page automatically as you edit, but the Codex environment's child-process restrictions blocked that mode during verification. The build-and-start workflow above is the tested path in this environment.

## Folder guide

```text
whitehat/
├── apps/web/          The homepage and Submit Target page
├── services/analyzer/ Local defensive security worker
├── contracts/         Future contracts (placeholder only)
├── packages/shared/   Future shared code (placeholder only)
├── docs/              Specification and milestone notes
├── .env.example       Explains that no credentials are needed
├── AGENTS.md          Scope and engineering instructions
├── package.json       Commands for the whole repository
└── package-lock.json  Exact installed dependency versions
```

## Editing the homepage

- `apps/web/app/page.tsx`: homepage words, sections and technical SVG illustration.
- `apps/web/app/globals.css`: colors, spacing, typography and mobile styling.
- `apps/web/app/layout.tsx`: page title, description and shared document structure.
- `apps/web/app/icon.svg`: the small Whitehat icon in the browser tab.
- `apps/web/components/hat-logo.tsx`: the approved shared hat logo.
- `apps/web/components/site-header.tsx`: the shared navigation at the top of both pages.
- `apps/web/app/submit/page.tsx`: the new intake page, reward panel, pipeline, and security notice.
- `apps/web/app/submit/submit.css`: form styling, scoped to the new page.
- `apps/web/components/target-form.tsx`: form validation, temporary session record and console navigation.
- `apps/web/lib/investigation.ts`: shared event types and temporary session data.
- `apps/web/lib/recon.ts`: bounded read-only RPC / explorer requests and ABI mapping.
- `apps/web/app/api/investigations/route.ts`: streams actual operation events to the browser.
- `apps/web/components/investigation-console.tsx`: agent pipeline, activity, telemetry and truthful placeholders.

The monorepo uses npm workspaces, with only the web app registered as a package for now. There is no extra monorepo framework. Fonts are local system fonts, so the page does not need a font service.

This is a local Git repository; nothing has been uploaded. Checkpoints: approved brand `49c336e`; approved target intake `c527341`. These used a command-local Codex author identity without changing your Git settings. Stop after Stage 1C for owner approval.

Setup references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

Database checks: `npm.cmd run test:database --workspace=@whitehat/web` exercises the migration and privacy/attribution rules using an in-memory PostgreSQL test engine. It is not an application storage fallback or a hosted Supabase connectivity check.

## Public beta preparation

New setup: docs/public-beta-deployment.md. Apply Supabase migrations 002 and 003, configure the public HTTPS origin and explicit admin wallet allowlist, and start the persistent worker on a private Linux Docker host. The web app no longer runs submitted investigations inside a browser connection. Do not publish until the deployment checklist passes. No mainnet contracts or automated disclosure are enabled.

