# Deploy budget-agent-parse Edge Function to Supabase
# Run from project root: .\scripts\deploy-budget-agent.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "pfcpqljhokmrhzmlkqvt"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Invoke-Supabase {
  param([Parameter(Mandatory = $true)][string[]]$CommandArgs)

  # Must pass each arg separately — avoid "projects list" as one token on Windows PowerShell
  & supabase @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "supabase $($CommandArgs -join ' ') failed (exit $LASTEXITCODE)"
  }
}

function Repair-EnvLocalBom {
  $path = Join-Path $Root ".env.local"
  if (-not (Test-Path $path)) { return }
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "Removing UTF-8 BOM from .env.local..." -ForegroundColor Yellow
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
  }
}

Write-Host "Checking Supabase CLI..." -ForegroundColor Cyan
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  npm install -g supabase@latest
}

Repair-EnvLocalBom

$loggedIn = $true
try {
  Invoke-Supabase -CommandArgs @("projects", "list")
} catch {
  $loggedIn = $false
}

if (-not $loggedIn) {
  Write-Host "Logging in..." -ForegroundColor Cyan
  Write-Host "If browser login fails (uv_spawn), use: supabase login --token sbp_YOUR_TOKEN" -ForegroundColor Yellow
  Invoke-Supabase -CommandArgs @("login")
  Invoke-Supabase -CommandArgs @("projects", "list")
}

Write-Host ""
Write-Host "Confirm project '$ProjectRef' (intellibudget) appears above." -ForegroundColor Yellow
Write-Host "Project ref = ID in your URL: https://$ProjectRef.supabase.co" -ForegroundColor Gray
Write-Host ""

if (-not $env:GEMINI_API_KEY) {
  $env:GEMINI_API_KEY = Read-Host "Paste Gemini API key (AIza... from Google AI Studio)"
}
if ([string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)) {
  throw "GEMINI_API_KEY is required"
}

Write-Host "Setting GEMINI_API_KEY secret..." -ForegroundColor Cyan
Invoke-Supabase -CommandArgs @(
  "secrets", "set",
  "--project-ref", $ProjectRef,
  "GEMINI_API_KEY=$($env:GEMINI_API_KEY)"
)

Write-Host "Deploying budget-agent-parse..." -ForegroundColor Cyan
Invoke-Supabase -CommandArgs @(
  "functions", "deploy", "budget-agent-parse",
  "--project-ref", $ProjectRef,
  "--use-api"
)

Write-Host "Done. Supabase Dashboard -> Edge Functions -> budget-agent-parse" -ForegroundColor Green
