# Local contract review

Slither uses the existing installation and native solc 0.8.26. Full, unsuppressed results: `work/slither/slither.json` (generated).

- `unused-return` on the router was resolved by comparing its reported output with the actual WHITEHAT balance delta; minimum output is enforced independently.
- Two `reentrancy-balance` alerts flag the intended before/after swap balance checks. Both vault fund-moving functions are nonReentrant; executor and distributor have their own guards. Tests exercise callbacks with the necessary roles and verify the guard's exact error, plus transaction rollback on insufficient or fabricated output. Balance changes outside the exact accepted input/output deltas revert.
- OpenZeppelin Math `incorrect-exp` is intentional XOR in the modular-inverse seed, not mistaken exponentiation. Its division/multiplication findings are intentional modular/integer algorithms in the pinned dependency. No dependency code was changed.
- Timestamp checks enforce router deadlines and OpenZeppelin's delayed two-step administrator transfer. They are not a price oracle or source of randomness.
- Remaining assembly, pragma/compiler-range, unused library helper, long literal and event-indexing notices are in pinned OpenZeppelin code. All production files compile with the same pinned compiler.

Trust boundaries: administrators control roles/router allowlisting; operators choose bounty IDs, eligibility and swap minimums. Only standard, exact-transfer ERC-20 bounty assets are supported; fee/rebasing assets can revert. Mock routers are test-only. No production router, automatic trading, burn, withdrawal or operating fee is configured. Target attribution is first valid transaction inclusion, so it can differ from offchain submission order and is not a guarantee of eligibility.

## Pre-Pons one-time binding review

The vault constructor now requires only the admin. `setWhitehatToken` is default-admin-only, rejects zero/non-contract addresses, emits an event and rejects every later call after successful binding. `executeSwap` rejects an uninitialised token before approvals or external router calls. Deposits and the distributor's exact-transfer 50/50 accounting do not require the token. The executor starts with no permitted routers; the mainnet script grants its vault role only and creates no mock/token/router.

The existing Slither check was rerun: 59 results including dependencies. The production-specific swap balance/reentrancy and deadline findings remain as reviewed above; no new binding-specific detector finding was reported. Tests cover authorisation, event emission, repeated binding, administrator transfer, pre-binding swap rejection, router gating, pre-binding distribution and mainnet-script network/role boundaries. This is an internal check, not an independent security audit.
