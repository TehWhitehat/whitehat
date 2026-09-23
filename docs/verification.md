# Stage 1A verification

> Historical milestone record: the behavior and environment below describe that stage only. For the current public beta architecture and operating instructions, see [README](../README.md) and [operations](public-beta-deployment.md).


Verified on 12 September 2026.

| Check | Result |
| --- | --- |
| Dependency install and lifecycle scripts | Passed using foreground scripts |
| npm dependency audit at installation | Zero known vulnerabilities reported |
| `npm.cmd run lint` | Passed, zero warnings |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run build` | Passed, homepage statically generated |
| `npm.cmd run start` | Running on http://127.0.0.1:3000 |
| Desktop browser at 1440 × 1000 | Visually checked |
| Mobile browser at 390 × 844 | Visually checked; no horizontal overflow |
| Narrow mobile width of 320px | No horizontal overflow |
| Submit CTA | Reaches the submissions-coming section |
| Explore CTA | Reaches the investigations empty state |
| Internal anchor targets | All present |
| Browser warnings/errors | None observed |

Known environment limitation: `next dev` cannot launch its child process under the Codex sandbox (`spawn EPERM`). The optimized local server works. README instructions use that verified path. Next.js build uses worker threads and its API-based TypeScript checker; checks are not skipped.

Tooling compatibility: ESLint 9 is deprecated upstream but is pinned here for compatibility with the current Next.js React lint rules. ESLint 10 failed in those rules, so the compatible version is retained rather than disabling checks. This is a development-tool limitation, not homepage functionality.

Only the Stage 1A homepage is implemented. No later-stage systems were built or activated.
