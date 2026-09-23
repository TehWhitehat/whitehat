# Whitehat contracts



Local tests cover the fixed-supply token, first-Scout registry, 50/50 bounty distribution, buyback vault and guarded executor. The five core contracts are deployed on chain 46630. Public addresses and receipts are recorded in `../docs/deployments/robinhood-testnet.json`. Do not replay the deployment script.



From this directory, run the existing Foundry binary:



```powershell

../services/analyzer/tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe test --offline

```



`script/DeployTestnet.s.sol` refuses any chain except Robinhood Chain Testnet (46630). It deploys the five contracts and grants the executor access to the vault. All routers remain disabled. The deployment wallet initially holds administration and operator roles; administrator transfer uses a delayed two-step process.



The recorded deployment is complete. Any separately authorized future deployment requires a dedicated testnet wallet. Keep `WHITEHAT_TESTNET_PRIVATE_KEY` in the locally ignored `contracts/.env`; never paste or commit it. `WHITEHAT_TESTNET_TOKEN_RECIPIENT` is optional and defaults to that wallet. Do not broadcast until deployment is explicitly approved.



For reference only, the deployment command is shown below. Do not rerun it for the existing deployment; a new deployment requires explicit approval:



```powershell

../services/analyzer/tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe script script/DeployTestnet.s.sol:DeployTestnet --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast

```



The verified token/registry addresses and registry deployment block are recorded in the deployment manifest and used by the web configuration. Keep these values consistent with the verified testnet deployment. First-Scout submission attribution remains persisted offchain; the testnet registration flow is separate.



Slither results are generated under `work/`; reviewed findings are documented in `SECURITY-REVIEW.md`. Generated files, dependencies and local secrets are ignored by Git.



## Completed TEST ONLY economic demonstration



Public receipts and balance checks are in ../docs/deployments/testnet-economics.json. MockUSDC TEST ONLY and TestOnlyRouter are restricted to chain 46630. The dedicated test wallet was both bounty payer and Scout: it paid 100 mock units and received 50 back; the vault received 50 and exchanged them for 50 testnet WHITEHAT at a fixed mock ratio. The mock router was disabled afterward. Duplicate registration, duplicate bounty, unauthorized execution and excessive minimum output were rejected in read-only RPC simulations. No core contract was redeployed.





## Pre-Pons mainnet preparation (4663)



`script/DeployWhitehatMainnet.s.sol` is separate from the testnet script. It rejects any chain other than 4663 and deploys TargetRegistry, BuybackVault, BuybackExecutor and BountyDistributor, then grants the executor its vault role. It does not deploy a token, mock or router. No helper deployment is required.



The vault starts with no WHITEHAT token. The default administrator may call `setWhitehatToken` exactly once with a nonzero contract address. The binding emits `WhitehatTokenInitialised`; it cannot be replaced, including after an administrator transfer. Swaps revert until binding, and the executor also requires an explicitly approved router. Binding alone does not enable a route. The code check is not token identity verification: verify the official Pons token before binding it permanently.



Set the public `WHITEHAT_MAINNET_DEPLOYER` and `WHITEHAT_MAINNET_ADMIN` addresses in the ignored `contracts/.env`. Signers are supplied separately when explicitly approved; the script never reads `WHITEHAT_TESTNET_PRIVATE_KEY`. Different deployer/admin addresses require both signers for the deployment and role-grant transactions.



Read-only simulation from this directory (no broadcast flag):



```powershell

../services/analyzer/tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe script script/DeployWhitehatMainnet.s.sol:DeployWhitehatMainnet --rpc-url https://rpc.mainnet.chain.robinhood.com --offline

```



Only after deployment and verification, set server-only `WHITEHAT_MAINNET_REGISTRY_ADDRESS` and `WHITEHAT_MAINNET_REGISTRY_DEPLOYMENT_BLOCK` in the web environment. Mainnet and testnet attribution use separate RPCs, registry settings, wallet chain IDs and explorer links. Missing production configuration retains offchain attribution; it never falls back to testnet. Production token and router remain pending Pons.



The existing chain-46630 deployment has its original bytecode. Updating this source does not upgrade those contracts. New testnet deployments bind their test token explicitly in the testnet script. Do not rerun that script for the existing deployment.



See `../docs/mainnet-preflight.md` for the preparation result and remaining approval gate. The operator completed mainnet deployment on 2026-09-23. Verified receipts, addresses and permissions are recorded in `../docs/deployments/robinhood-mainnet.json`. Do not replay the deployment. Explorer source verification remains pending.

