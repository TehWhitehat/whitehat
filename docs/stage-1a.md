# Stage 0 / Stage 1A decisions

> Historical milestone record: the behavior and environment below describe that stage only. For the current public beta architecture and operating instructions, see [README](../README.md) and [operations](public-beta-deployment.md).


- Scope: local repository and responsive branded homepage only.
- Repository: standalone local Git repository in `outputs/whitehat`; no remote.
- Monorepo: npm workspaces, with `apps/web` as the only active workspace.
- Framework: Next.js App Router, TypeScript strict mode, Tailwind CSS through its PostCSS plugin, ESLint.
- Local compatibility: Next.js uses worker threads and its TypeScript API checker because the verification environment restricted child-process output pipes. Type checking remains enabled. ESLint is pinned to 9.39.5 because the current Next.js React lint plugin fails with ESLint 10; npm marks ESLint 9 deprecated, so revisit this tooling-only pin when the plugin supports 10.
- Design: near-black, light type, mint details, thin borders, a static original SVG network illustration, local system fonts.
- Behavior: anchor navigation to the network, investigation empty state and submissions-coming section. No data is saved or sent.
- Stats: zero values explicitly labelled as pre-launch placeholders.
- Networking: local web server binds to 127.0.0.1. No chain integrations or deployment.
- Serving mode: the optimized production build is served locally with `npm run start`. The standard `next dev` watcher hits a sandbox `spawn EPERM` restriction; it is retained for ordinary development outside that restriction. No custom server or framework patch was introduced.
- Environment: Node.js 24.14.0, npm 11.9.0, Git 2.53.0.windows.3 were available at setup.
- Next steps require the owner's approval; this milestone intentionally stopped at Stage 1A.

The master specification is saved alongside this file for reference. It describes future scope, not functionality implemented in this milestone.
