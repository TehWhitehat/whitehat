$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath 'services/runner/.env')) { throw 'Configure services/runner/.env locally before starting.' }
node node_modules/typescript/bin/tsc -p services/runner/tsconfig.windows.json
if ($LASTEXITCODE -ne 0) { throw 'Worker compilation failed.' }
Write-Output 'Whitehat outbound-only worker started. Keep this window and PC running. Ctrl+C stops it.'
node --env-file=services/runner/.env services/runner/.runtime/services/runner/main.js
