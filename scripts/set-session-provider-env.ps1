param(
  [ValidateSet("openai", "github-models", "both")]
  [string]$Provider = "both"
)

function Set-TokenEnv {
  param(
    [string]$Prompt,
    [string]$EnvName
  )

  $value = Read-Host -Prompt $Prompt
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skipped $EnvName" -ForegroundColor Yellow
    return
  }
  Set-Item -Path "Env:$EnvName" -Value $value
  Write-Host "Set $EnvName for this PowerShell session." -ForegroundColor Green
}

if ($Provider -in @("openai", "both")) {
  Set-TokenEnv -Prompt "Enter OPENAI_API_KEY" -EnvName "OPENAI_API_KEY"
}

if ($Provider -in @("github-models", "both")) {
  Set-TokenEnv -Prompt "Enter GITHUB_TOKEN" -EnvName "GITHUB_TOKEN"
}

Write-Host ""
Write-Host "Current hosted provider envs in this session:" -ForegroundColor Cyan
Get-ChildItem Env:OPENAI_API_KEY,Env:GITHUB_TOKEN -ErrorAction SilentlyContinue |
  Select-Object Name,@{Name='Length';Expression={ if ($_.Value) { $_.Value.Length } else { 0 } }} |
  Format-Table -AutoSize
