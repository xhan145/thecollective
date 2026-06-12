$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Section {
  param([string] $Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Note {
  param([string] $Message)
  Write-Host $Message -ForegroundColor DarkGray
}

function Stop-Setup {
  param([string] $Message)
  throw $Message
}

function Find-RepoRoot {
  $starts = New-Object System.Collections.Generic.List[string]

  if ($PSScriptRoot) {
    $scriptRootParent = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
    $starts.Add($scriptRootParent.Path)
  }

  $starts.Add((Get-Location).Path)

  foreach ($start in ($starts | Select-Object -Unique)) {
    $current = Get-Item -LiteralPath $start
    while ($null -ne $current) {
      $packagePath = Join-Path $current.FullName "package.json"
      $migrationPath = Join-Path $current.FullName "supabase\migrations"
      if ((Test-Path -LiteralPath $packagePath) -and (Test-Path -LiteralPath $migrationPath)) {
        return $current.FullName
      }
      $current = $current.Parent
    }
  }

  Stop-Setup "I could not find the Collective repo root. Run this from the repo, or use npm run setup:beta."
}

function Get-RequiredCommand {
  param(
    [string] $Name,
    [string[]] $FallbackNames = @()
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  foreach ($fallback in $FallbackNames) {
    $command = Get-Command $fallback -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }
  }

  Stop-Setup "$Name was not found on your PATH. Install Node.js LTS, then run npm run setup:beta again."
}

function ConvertFrom-SecureInput {
  param([System.Security.SecureString] $SecureValue)

  if ($null -eq $SecureValue -or $SecureValue.Length -eq 0) {
    return ""
  }

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

function Read-RequiredValue {
  param([string] $Prompt)

  do {
    $value = (Read-Host $Prompt).Trim()
    if ([string]::IsNullOrWhiteSpace($value)) {
      Write-Host "This value is required for the local beta link." -ForegroundColor Yellow
    }
  } until (-not [string]::IsNullOrWhiteSpace($value))

  return $value
}

function Read-RequiredSecret {
  param([string] $Prompt)

  do {
    $secureValue = Read-Host $Prompt -AsSecureString
    $value = (ConvertFrom-SecureInput $secureValue).Trim()
    if ([string]::IsNullOrWhiteSpace($value)) {
      Write-Host "This value is required for the local beta link." -ForegroundColor Yellow
    }
  } until (-not [string]::IsNullOrWhiteSpace($value))

  return $value
}

function Read-OptionalSecret {
  param([string] $Prompt)

  $secureValue = Read-Host $Prompt -AsSecureString
  return (ConvertFrom-SecureInput $secureValue).Trim()
}

function Normalize-SupabaseUrl {
  param([string] $RawUrl)

  $url = $RawUrl.Trim().TrimEnd("/")
  if ($url -notmatch "^https://[a-z0-9-]+\.supabase\.co$") {
    Stop-Setup "That Supabase URL does not look right. Use the form https://<project-ref>.supabase.co."
  }

  return $url.ToLowerInvariant()
}

function Confirm-EnvWrite {
  param([string] $EnvPath)

  if (-not (Test-Path -LiteralPath $EnvPath)) {
    return
  }

  Write-Host ""
  Write-Host ".env.local already exists." -ForegroundColor Yellow
  Write-Host "To protect your current settings, this script will back it up before replacing it."

  do {
    $choice = (Read-Host "Type B to back up and replace it, or C to cancel").Trim().ToUpperInvariant()
  } until ($choice -in @("B", "C"))

  if ($choice -eq "C") {
    Write-Host "Setup stopped. Nothing was changed."
    exit 0
  }

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupPath = Join-Path (Split-Path -Parent $EnvPath) ".env.local.backup.$timestamp"
  Copy-Item -LiteralPath $EnvPath -Destination $backupPath -Force
  Write-Host "Saved backup: $backupPath" -ForegroundColor Green
}

function Write-EnvFile {
  param(
    [string] $EnvPath,
    [string] $SupabaseUrl,
    [string] $AnonKey,
    [string] $ServiceRoleKey,
    [string] $OpenAiKey
  )

  $lines = @(
    "NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=$AnonKey",
    "SUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey",
    "OPENAI_API_KEY=$OpenAiKey",
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
    "NEXT_PUBLIC_CLOSED_BETA_MODE=false",
    "NEXT_PUBLIC_ENABLE_DEV_TOOLS=true"
  )

  $content = ($lines -join [Environment]::NewLine) + [Environment]::NewLine
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($EnvPath, $content, $utf8NoBom)
}

function Copy-MigrationsToClipboard {
  param(
    [string] $RepoRoot,
    [string[]] $MigrationFiles
  )

  $sections = foreach ($relativePath in $MigrationFiles) {
    $fullPath = Join-Path $RepoRoot $relativePath
    @(
      "",
      "-- ============================================================",
      "-- Collective migration: $relativePath",
      "-- ============================================================",
      (Get-Content -LiteralPath $fullPath -Raw)
    ) -join [Environment]::NewLine
  }

  $combinedSql = ($sections -join ([Environment]::NewLine + [Environment]::NewLine)).Trim() + [Environment]::NewLine
  Set-Clipboard -Value $combinedSql
}

function Open-SetupUrl {
  param([string] $Url)

  try {
    Start-Process $Url
  } catch {
    Write-Host "I could not open the browser automatically. Open this URL instead:" -ForegroundColor Yellow
    Write-Host $Url
  }
}

function Invoke-CheckedNpm {
  param(
    [string] $NpmPath,
    [string] $Label,
    [string[]] $Arguments
  )

  Write-Section $Label
  & $NpmPath @Arguments
  if ($LASTEXITCODE -ne 0) {
    Stop-Setup "$Label failed. Fix the message above, then rerun npm run setup:beta. The script is safe to rerun."
  }
}

try {
  Write-Host "Collective closed beta setup" -ForegroundColor Cyan
  Write-Host "This links your local app to Supabase without printing server secrets."

  $repoRoot = Find-RepoRoot
  Set-Location -LiteralPath $repoRoot
  Write-Note "Working from repo root: $repoRoot"

  Write-Section "Checking local tools"
  $nodePath = Get-RequiredCommand -Name "node"
  $npmPath = Get-RequiredCommand -Name "npm.cmd" -FallbackNames @("npm")
  $nodeVersion = (& $nodePath --version)
  $npmVersion = (& $npmPath --version)
  Write-Host "Node: $nodeVersion" -ForegroundColor Green
  Write-Host "npm:  $npmVersion" -ForegroundColor Green

  Write-Section "Checking migrations"
  $migrationFiles = @(
    "supabase\migrations\001_initial_schema.sql",
    "supabase\migrations\002_rls_policies.sql",
    "supabase\migrations\003_seed_directions_and_practices.sql",
    "supabase\migrations\004_storage_buckets.sql"
  )

  foreach ($migration in $migrationFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $migration))) {
      Stop-Setup "Missing migration: $migration. Restore it before linking the beta."
    }
    Write-Host "Found $migration" -ForegroundColor Green
  }

  $envPath = Join-Path $repoRoot ".env.local"
  Confirm-EnvWrite -EnvPath $envPath

  Write-Section "Supabase keys"
  Write-Host "Find these in Supabase: Project Settings -> API."
  $supabaseUrl = Normalize-SupabaseUrl (Read-RequiredValue "Supabase Project URL")
  $anonKey = Read-RequiredValue "Supabase anon key"
  $serviceRoleKey = Read-RequiredSecret "Supabase service_role key (hidden)"
  $openAiKey = Read-OptionalSecret "OpenAI API key (optional, hidden; press Enter to skip)"

  Write-EnvFile `
    -EnvPath $envPath `
    -SupabaseUrl $supabaseUrl `
    -AnonKey $anonKey `
    -ServiceRoleKey $serviceRoleKey `
    -OpenAiKey $openAiKey

  Write-Host ".env.local is ready. Secret values were not printed." -ForegroundColor Green

  Write-Section "Copying database setup SQL"
  Copy-MigrationsToClipboard -RepoRoot $repoRoot -MigrationFiles $migrationFiles
  Write-Host "The four migrations are on your clipboard in the correct order." -ForegroundColor Green

  $projectRef = ([Uri] $supabaseUrl).Host.Split(".")[0]
  $sqlEditorUrl = "https://supabase.com/dashboard/project/$projectRef/sql/new"
  $authConfigUrl = "https://supabase.com/dashboard/project/$projectRef/auth/url-configuration"

  Write-Host "Opening the Supabase SQL editor."
  Open-SetupUrl $sqlEditorUrl
  Write-Host ""
  Write-Host "Paste the SQL from your clipboard into the editor and run it once."
  Write-Host "It creates the beta schema, RLS policies, seed practices, and private storage buckets."
  Read-Host "When Supabase says the SQL ran successfully, press Enter here"

  Write-Section "Auth URLs"
  Open-SetupUrl $authConfigUrl
  Write-Host "Save these exact values in Supabase Authentication -> URL Configuration:"
  Write-Host "Site URL:     http://localhost:3000" -ForegroundColor Green
  Write-Host "Redirect URL: http://localhost:3000/auth/callback" -ForegroundColor Green
  Read-Host "When those auth URLs are saved, press Enter here"

  Invoke-CheckedNpm -NpmPath $npmPath -Label "Installing app dependencies" -Arguments @("install")
  Invoke-CheckedNpm -NpmPath $npmPath -Label "Building Collective" -Arguments @("run", "build")

  Write-Section "Ready to test"
  Write-Host "Build passed." -ForegroundColor Green
  Write-Host "Open this after the dev server starts:"
  Write-Host "http://localhost:3000/dev/supabase-check" -ForegroundColor Green
  Write-Host ""
  Write-Host "Starting the local dev server. Keep this window open while testing."
  Write-Host "Press Ctrl+C when you are done."
  & $npmPath run dev
  if ($LASTEXITCODE -ne 0) {
    Stop-Setup "The dev server stopped unexpectedly. You can rerun npm run setup:beta when ready."
  }
} catch {
  Write-Host ""
  Write-Host "Setup stopped." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "You can rerun safely with: npm run setup:beta"
  exit 1
}
