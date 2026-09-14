# Whitehat testnet contracts

Local tests cover the fixed-supply token, first-Scout registry, 50/50 bounty distribution, buyback vault and guarded executor. The five core contracts are deployed on chain 46630. Public addresses and receipts are recorded in `../docs/deployments/robinhood-testnet.json`. Do not replay the deployment script.

From this directory, run the existing Foundry binary:

```powershell
../services/analyzer/tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe test --offline
```

`script/DeployTestnet.s.sol` refuses any chain except Robinhood Chain Testnet (46630). It deploys the five contracts and grants the executor access to the vault. All routers remain disabled. The deployment wallet initially holds administration and operator roles; administrator transfer uses a delayed two-step process.

Deployment is pending a dedicated testnet wallet. Keep `WHITEHAT_TESTNET_PRIVATE_KEY` in the locally ignored `contracts/.env`; never paste or commit it. `WHITEHAT_TESTNET_TOKEN_RECIPIENT` is optional and defaults to that wallet. Do not broadcast until deployment is explicitly approved.

After approval, the prepared command is:

```powershell
../services/analyzer/tools/node_modules/@foundry-rs/forge-win32-amd64/bin/forge.exe script script/DeployTestnet.s.sol:DeployTestnet --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast
```

Only after deployment verification, set the token/registry public addresses and registry deployment block in the web app's local environment. Until then `/token` shows no contract address and investigations retain offchain attribution.

Slither results are generated under `work/`; reviewed findings are documented in `SECURITY-REVIEW.md`. Generated files, dependencies and local secrets are ignored by Git.

## Completed TEST ONLY economic demonstration

Public receipts and balance checks are in ../docs/deployments/testnet-economics.json. MockUSDC TEST ONLY and TestOnlyRouter are restricted to chain 46630. The dedicated test wallet was both bounty payer and Scout: it paid 100 mock units and received 50 back; the vault received 50 and exchanged them for 50 testnet WHITEHAT at a fixed mock ratio. The mock router was disabled afterward. Duplicate registration, duplicate bounty, unauthorized execution and excessive minimum output were rejected in read-only RPC simulations. No core contract was redeployed.

