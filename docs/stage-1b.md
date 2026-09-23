# Stage 1B — Submit Target experience

> Historical milestone record: the behavior and environment below describe that stage only. For the current public beta architecture and operating instructions, see [README](../README.md) and [operations](public-beta-deployment.md).


## Approved starting point

Whitehat Brand/UI v0.1 was saved before new edits in commit `49c336e`:

`feat: complete Whitehat homepage and brand v0.1`

The homepage and reusable hat icon are tracked. No remote publication or push was performed. The commit used the command-local identity `Codex <codex@local.invalid>` because no author identity was configured. User Git settings were not changed.

## Implementation

- New `/submit` page uses the approved colors, fonts, logo, spacing conventions, and thin borders.
- Header extracted into a shared component; homepage layout, styling and copy preserved. Its Submit CTA now routes to `/submit`.
- Chain selector and five text fields. Only contract address is required.
- Basic address-format check: lowercase `0x` prefix followed by exactly 40 hexadecimal characters, allowing mixed-case hex. Surrounding whitespace is trimmed. No checksum, contract-existence, chain, or eligibility lookup.
- Optional URL fields accept HTTP and HTTPS URLs. They are displayed as text in the preview and never fetched.
- React component state holds the draft only while the page is mounted. No storage APIs, database, server action, or network submission.
- Valid input shows TARGET READY, DRAFT TARGET, all entered details, the required persistence notice, and Edit Target. Editing retains values; refreshing clears them.
- Labels, required/invalid states, associated error messages, focus management and keyboard operation are included.
- Attribution panel stacks below the form on mobile/tablet and sits alongside it on desktop. Pipeline and security policy are visual explanations only.
- No new dependencies or later-stage features.

## Verification

All checks below passed on 12 September 2026:

| Check | Result |
| --- | --- |
| Homepage Submit CTA | Opens `/submit` |
| Header logo | Returns to `/` |
| Invalid address inputs | Empty, short, 39-digit, 41-digit, non-hex and missing-prefix inputs rejected |
| Valid mixed-case hex address | Produces local preview |
| Optional fields blank | Accepted; shown as Not provided |
| All fields filled | Selected chain and entered details rendered correctly |
| Invalid optional URL | Inline error shown |
| Draft editing | Values retained; address field receives focus |
| Refresh after success | Draft cleared |
| Keyboard | Enter submits; Tab advances to next field; errors and preview receive focus |
| Desktop 1440px | Side-by-side form and attribution panel |
| Tablet 768px | Stacked layout; no horizontal overflow |
| Mobile 390px and 320px | Stacked layout; no horizontal overflow |
| Browser warnings/errors | None observed |
| `npm.cmd run lint` | Passed with no warnings |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run build` | Passed; `/submit` generated successfully |

Local preview: http://127.0.0.1:3000/submit, served using the existing build-and-start workflow. The development-watcher sandbox limitation documented in Stage 1A remains unchanged.

This milestone ended at owner review. This milestone does not register targets or establish Scout attribution.
