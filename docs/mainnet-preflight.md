# Pre-Pons mainnet readiness — 2026-09-23





Status: DEPLOYED BY THE OPERATOR on Robinhood Chain mainnet / 4663. All four creation receipts and the executor role-grant receipt were independently verified successful on 2026-09-23. Verified addresses and transactions are in deployments/robinhood-mainnet.json. The earlier readiness figures below are historical dry-run estimates, not deployment receipts.





## Confirmed recipients and network





- Deployer and initial administrator, explicitly confirmed by the operator: `0x7959BF797f6ddb1184341cCE3E9537Df4af63bb7`.


- Live RPC chain ID: 4663 (Robinhood Chain mainnet).


- Observed native balance: 0.025544170678851986 ETH.


- Mainnet-fork deployment simulation succeeded with the confirmed addresses, without a signer or broadcast flag.


- Estimated total gas: 5,961,383. Forge estimated 0.000595375248937383 ETH at 0.099872001 gwei. This is a time-sensitive estimate, not a guaranteed final fee; recheck balance/fees immediately before any approved broadcast.


- Generated dry-run files are gitignored. No private key was printed or added to tracked files. The mainnet script does not read the testnet key.





## Deployment sequence





1. TargetRegistry (no admin or constructor arguments).


2. BuybackVault (confirmed admin, token intentionally unset).


3. BuybackExecutor (confirmed admin, new vault).


4. BountyDistributor (confirmed admin, new registry and vault).


5. Grant the new executor the vault EXECUTOR_ROLE using the confirmed admin.





These are four deployments plus one role transaction. No helper is needed. No WHITEHAT token, mock asset or router is deployed; no funds are deposited, no router is enabled and no buyback occurs. Script assertions check admin, cross-references, executor permission and unset token. The script rejects non-4663 chains. If recipients differ in a future deployment, both signatures are needed.





## Minimal protocol change





The vault permits one default-admin-only token binding. Zero and non-contract addresses are rejected; a successful binding emits WhitehatTokenInitialised and cannot ever be changed through the contract. Token-dependent swaps revert while unset. Administrator transfer does not reset binding. Executor router permission is independently required. Deposits and 50/50 distribution remain functional before binding; odd smallest units go to the buyback side as before.





After Pons, verify the official token's chain, bytecode, metadata and identity before the irreversible binding. A contract-code check alone does not establish token legitimacy. A compatible production IBuybackRouter adapter and separate approval are still required before buybacks. No production adapter exists yet.





## Validation





- All 43 Foundry tests passed; zero failed or skipped.


- Three fuzz tests each ran 256 cases (768 total), including pre-binding conservation and wrong-chain script rejection.


- Slither rerun: 59 results including dependencies; existing reviewed balance/deadline/dependency notices, no new binding-specific finding. See contracts/SECURITY-REVIEW.md.


- Network attribution tests cover isolated registry configuration/RPC selection, missing config, incorrect chain, missing code, bounded logs and 14 wallet registration scenarios across mainnet/testnet.


- Lint, TypeScript and production build: PASS. Wallet authentication regression checks: PASS. No live transaction signing was used in frontend tests.





## Application configuration





Wallet support includes mainnet 4663 and explicitly labelled testnet 46630. Registry reads, target IDs, registration transactions and explorer links follow the investigation network. Server configuration uses WHITEHAT_MAINNET_REGISTRY_ADDRESS and WHITEHAT_MAINNET_REGISTRY_DEPLOYMENT_BLOCK separately from testnet variables. Until mainnet is actually deployed and verified, leave these empty; attribution stays offchain. No production token CA is set and no site deployment has occurred in this preparation step.





## Existing attribution boundary





The unchanged TargetRegistry records the first successful onchain registration sender, not the first database submission. The interface restricts its registration button to the stored Scout, but this is not a contract-level reservation: others can call the public registry. Conflicting onchain/offchain attribution requires human review; do not promise that database order is enforced onchain. Administrator transfers do not automatically transfer other operator roles.





## After explicit deployment approval





Recheck chain, wallet balance, fees and source state. Supply the approved signer explicitly. Stop on any failed transaction rather than blindly redeploying. Record actual transaction hashes/addresses, verify deployed code/admin/roles/cross-references/unset token and disabled routes, and attempt Blockscout source verification. Only then update production registry configuration and public docs with verified addresses. Keep production token CA pending Pons and buyback route pending activation.





Existing chain-46630 records remain under docs/deployments/robinhood-testnet.json and testnet-economics.json. Those deployed contracts retain their original bytecode and test-only labels.




## Post-deployment verification



Verified all four creation inputs against compiled bytecode and expected constructor arguments, and all four deployed runtime bytecodes against local artifacts (immutable references checked through getters). Confirmed chain 4663, approved default admin/owner, one-day admin transfer delay, pause/operator roles, immutable references and executor permission. TargetRegistry intentionally has no owner/admin. The vault token is zero and its token-dependent swap rejects with TokenNotInitialised; the executor rejects an unconfigured router with InvalidRouter in read-only eth_call simulations. No RouterAllowed event existed through verified block 70604126. No token, mock or router was deployed.



Execution gas: 4,579,226. Execution fee: 0.00023317084361 ETH. Blockscout source verification was attempted but is not yet complete; local Foundry verification returned access denied, the explorer API challenged automated access, and the browser file-upload control did not complete. Do not label explorer source verification successful. Source-only standard JSON inputs are prepared under the ignored contracts/work directory.



The website changes and local production registry settings have been prepared. Lint, TypeScript, production build and attribution tests passed. Live Vercel publication/configuration still requires authenticated access; do not claim the deployed website has changed until it is checked.

