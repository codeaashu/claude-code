param(
  [string]$Model = "qwen2.5-coder:7b",
  [int]$BackendPort = 8008,
  [int]$WebPort = 3000,
  [switch]$PullModel,
  [switch]$Inline,
  [switch]$SkipOllamaHealthCheck
)

$ErrorActionPreference = "Stop"

function Test-CommandAvailable {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  return $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$webDir = Join-Path $repoRoot "web"
$backendPythonPath = Join-Path $repoRoot "backend"
$backendUrl = "http://127.0.0.1:$BackendPort"
$ollamaUrl = "http://127.0.0.1:11434/api/tags"

if (-not (Test-CommandAvailable python)) {
  throw "python is not available on PATH. Install Python or fix PATH before running AG-Claw."
}

if (-not (Test-CommandAvailable npm)) {
  throw "npm is not available on PATH. Install Node.js or fix PATH before running AG-Claw."
}

if (-not (Test-CommandAvailable ollama)) {
  throw "ollama is not available on PATH. Install Ollama first, then rerun this script."
}

if (-not $SkipOllamaHealthCheck) {
  $ollamaReady = $false
  try {
    $probe = Invoke-WebRequest -Uri $ollamaUrl -UseBasicParsing -TimeoutSec 2
    $ollamaReady = $probe.StatusCode -eq 200
  } catch {
    $ollamaReady = $false
  }

  if (-not $ollamaReady) {
    Write-Host "Starting Ollama service..." -ForegroundColor Cyan
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Normal | Out-Null
    if (-not (Wait-HttpReady -Url $ollamaUrl -TimeoutSeconds 20)) {
      throw "Ollama did not become healthy on 127.0.0.1:11434."
    }
  }
}

if ($PullModel) {
  Write-Host "Pulling Ollama model $Model..." -ForegroundColor Cyan
  & ollama pull $Model
  if ($LASTEXITCODE -ne 0) {
    throw "ollama pull failed for model $Model"
  }
}

$backendCommand = "`$env:PYTHONPATH='$backendPythonPath'; python -m agclaw_backend.server --host 127.0.0.1 --port $BackendPort"

$webCommand = "Set-Location '$webDir'; `$env:AGCLAW_BACKEND_URL='$backendUrl'; npm run dev -- --port $WebPort"

if ($Inline) {
  Write-Host "Start backend in a separate terminal with:" -ForegroundColor Yellow
  Write-Host $backendCommand
  Write-Host ""
  Write-Host "Start web in a separate terminal with:" -ForegroundColor Yellow
  Write-Host $webCommand
  Write-Host ""
  Write-Host "Open http://localhost:$WebPort" -ForegroundColor Green
  exit 0
}

Write-Host "Starting AG-Claw backend on port $BackendPort..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "Set-Location '$repoRoot'; $backendCommand") -WorkingDirectory $repoRoot | Out-Null

if (-not (Wait-HttpReady -Url "$backendUrl/health" -TimeoutSeconds 20)) {
  throw "Backend did not become healthy on $backendUrl"
}

Write-Host "Starting AG-Claw web shell on port $WebPort..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @('-NoExit', '-Command', $webCommand) -WorkingDirectory $webDir | Out-Null

Write-Host ""
Write-Host "AG-Claw local stack started." -ForegroundColor Green
Write-Host "Web UI: http://localhost:$WebPort"
Write-Host "Backend: $backendUrl"
Write-Host "Provider: ollama"
Write-Host "Model: $Model"
Write-Host ""
Write-Host "In the UI: Settings -> enable Local mode -> provider ollama -> model $Model -> Check -> chat"
